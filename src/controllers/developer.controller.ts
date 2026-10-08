"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AksiForm } from "@/lib/aksi";
import { teks, catatKegagalan } from "@/lib/aksi";
import type { Hasil } from "@/types/domain";
import { skemaKunciDeveloper } from "@/lib/validation";
import { pesanPerField } from "@/lib/validation";
import {
  NAMA_COOKIE_KUNCI,
  MASA_BERLAKU_COOKIE_JAM,
  PESAN_KUNCI_SALAH,
  PESAN_TANPA_KUNCI,
  kunciDeveloper,
  kunciSama,
} from "@/lib/developer";
import { buatKlienAdmin, apakahAdminTersedia } from "@/lib/supabase/admin";
import {
  ambilSemuaPermintaan,
  hitungPermintaan,
  putuskanPermintaan,
  hapusPermintaan,
  hapusSemuaRiwayat,
  type PermintaanAkun,
  type StatusPermintaan,
} from "@/models/permintaan.model";

const gagal = <T>(error: string): Hasil<T> => ({ ok: false, error });
const sukses = <T>(data: T): Hasil<T> => ({ ok: true, data });

/**
 * Masuk ke halaman developer memakai kunci rahasia.
 *
 * Kuncinya dibandingkan di server dengan perbandingan tahan waktu, lalu
 * disimpan sebagai cookie hanya-HTTP selama 8 jam. Kunci aslinya tidak pernah
 * dikirim balik ke peramban.
 */
export const masukDeveloperAction: AksiForm<null> = async (_sebelum, data) => {
  if (!kunciDeveloper()) return gagal(PESAN_TANPA_KUNCI);

  const hasil = skemaKunciDeveloper.safeParse({
    kunci: teks(data, "kunci"),
  });
  if (!hasil.success) {
    return { ok: false, error: PESAN_KUNCI_SALAH, field: pesanPerField(hasil.error) };
  }

  if (!kunciSama(hasil.data.kunci)) return gagal(PESAN_KUNCI_SALAH);

  const toko = await cookies();
  toko.set(NAMA_COOKIE_KUNCI, hasil.data.kunci, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/developer",
    maxAge: MASA_BERLAKU_COOKIE_JAM * 60 * 60,
  });

  revalidatePath("/developer");
  return sukses(null);
};

/**
 * Keluar dari halaman developer dengan menghapus kuncinya.
 *
 * Dipakai langsung pada `action` sebuah form, jadi tandatangannya satu argumen
 * `FormData`, bukan `AksiForm`.
 */
export const keluarDeveloperAction = async (): Promise<never> => {
  const toko = await cookies();
  toko.delete(NAMA_COOKIE_KUNCI);
  redirect("/developer");
};

/** Catatan developer bersifat sukarela, tetapi tetap dibatasi panjangnya. */

/**
 * Setujui atau tolak sebuah permintaan akun.
 *
 * Kuncinya diperiksa ulang di sini, bukan hanya di halaman. Mempercayai
 * tampilan saja berarti aksi ini bisa dipanggil langsung tanpa lewat form.
 */
export const putuskanPermintaanAction: AksiForm<{
  tautanReset: string | null;
}> = async (_sebelum, data) => {
  const toko = await cookies();
  if (!kunciSama(toko.get(NAMA_COOKIE_KUNCI)?.value ?? "")) {
    return gagal(PESAN_KUNCI_SALAH);
  }
  if (!apakahAdminTersedia()) {
    return gagal(
      "SUPABASE_SERVICE_ROLE_KEY belum diisi, sehingga permintaan belum bisa diputuskan."
    );
  }

  const id = Number(teks(data, "id"));
  const setuju = teks(data, "setuju") === "1";
  const catatan = teks(data, "catatan").trim();

  if (!Number.isInteger(id) || id <= 0) return gagal("Permintaan tidak valid");
  if (catatan.length > 300) return gagal("Catatan maksimal 300 karakter");

  const klien = buatKlienAdmin();

  try {
    const tautanReset = await putuskanPermintaan(
      klien,
      id,
      setuju,
      catatan.length > 0 ? catatan : null
    );
    // Sengaja TANPA revalidatePath: menyegarkan daftar akan memindahkan baris
    // ke riwayat dan meng-unmount panel tautan sebelum sempat tampil.
    return sukses({ tautanReset });
  } catch (kesalahan) {
    catatKegagalan("putuskanPermintaanAction", kesalahan);
    const pesan = kesalahan instanceof Error ? kesalahan.message : "";
    if (pesan.includes("sudah diputuskan")) return gagal("Permintaan sudah diputuskan");
    return gagal(
      "Belum bisa memutus permintaan: " +
        (kesalahan instanceof Error ? kesalahan.message : "galat tidak diketahui")
    );
  }
};

export interface IsiHalamanDeveloper {
  daftar: PermintaanAkun[];
  ringkasan: Record<StatusPermintaan, number>;
}

/**
 * Isi halaman developer, hanya untuk pemegang kunci yang benar.
 * Dipanggil dari halamannya, bukan dari peramban.
 */
export async function muatHalamanDeveloper(): Promise<IsiHalamanDeveloper | null> {
  const toko = await cookies();
  if (!kunciSama(toko.get(NAMA_COOKIE_KUNCI)?.value ?? "")) return null;

  if (!apakahAdminTersedia()) return null;
  const klien = buatKlienAdmin();

  const [daftar, ringkasan] = await Promise.all([
    ambilSemuaPermintaan(klien),
    hitungPermintaan(klien),
  ]);

  return { daftar, ringkasan };
}

/**
 * Hapus satu baris riwayat, atau seluruh riwayat bila id bernilai "semua".
 * Kunci diperiksa ulang di sini, sama seperti aksi putusan.
 */
export const hapusPermintaanAction: AksiForm<null> = async (_sebelum, data) => {
  const toko = await cookies();
  if (!kunciSama(toko.get(NAMA_COOKIE_KUNCI)?.value ?? "")) {
    return gagal(PESAN_KUNCI_SALAH);
  }
  if (!apakahAdminTersedia()) {
    return gagal("SUPABASE_SERVICE_ROLE_KEY belum diisi.");
  }

  const tujuan = teks(data, "id");
  const klien = buatKlienAdmin();

  try {
    if (tujuan === "semua") {
      await hapusSemuaRiwayat(klien);
    } else {
      const id = Number(tujuan);
      if (!Number.isInteger(id) || id <= 0) return gagal("Riwayat tidak valid");
      await hapusPermintaan(klien, id);
    }
    revalidatePath("/developer");
    return sukses(null);
  } catch (kesalahan) {
    catatKegagalan("hapusPermintaanAction", kesalahan);
    return gagal(
      "Belum bisa memutus permintaan: " +
        (kesalahan instanceof Error ? kesalahan.message : "galat tidak diketahui")
    );
  }
};
