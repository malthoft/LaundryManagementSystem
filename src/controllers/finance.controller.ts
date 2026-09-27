"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { profilSaya } from "@/lib/auth";
import { catatKegagalan, teks, type AksiForm } from "@/lib/aksi";
import { pesanPerField, skemaIdUmum, skemaTransaksi } from "@/lib/validation";
import { berhasil, gagal } from "@/types/domain";
import {
  buatTransaksi,
  hapusTransaksi,
  ubahTransaksi,
} from "@/models/transaction.model";
import { kirimNotifikasi } from "@/models/notification.model";

/** Keuangan tertutup untuk Karyawan, di sini dan di RLS (BR-13). */
async function pastikanAdmin(): Promise<
  { id: string } | { tolakan: string }
> {
  const profil = await profilSaya();
  if (!profil) return { tolakan: "Sesi berakhir. Silakan masuk lagi." };
  if (profil.role !== "Admin") {
    return { tolakan: "Hanya Admin yang boleh mengubah catatan keuangan." };
  }
  return { id: profil.id };
}

/**
 * Catat atau perbarui transaksi manual.
 *
 * Pemasukan dari order tidak dibuat di sini: itu lahir otomatis bersama
 * ordernya, dan menambahkannya manual hanya akan menggandakan catatan.
 */
export const simpanTransaksiAction: AksiForm<null> = async (
  _sebelumnya,
  data
) => {
  const izin = await pastikanAdmin();
  if ("tolakan" in izin) return gagal(izin.tolakan);

  const cek = skemaTransaksi.safeParse({
    id: teks(data, "id") || undefined,
    tanggal: teks(data, "tanggal"),
    tipe: teks(data, "tipe"),
    jumlah: teks(data, "jumlah"),
    metode: teks(data, "metode"),
    deskripsi: teks(data, "deskripsi"),
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian transaksi.", pesanPerField(cek.error));
  }

  const { id, tanggal, tipe, jumlah, metode, deskripsi } = cek.data;
  const supabase = await buatKlienServer();

  const isian = {
    transaction_date: tanggal,
    transaction_type: tipe,
    amount: jumlah,
    payment_method: metode,
    description: deskripsi,
  };

  try {
    if (id) {
      await ubahTransaksi(supabase, id, isian);
    } else {
      await buatTransaksi(supabase, { ...isian, created_by: izin.id });
    }
  } catch (kesalahan) {
    catatKegagalan("simpanTransaksiAction", kesalahan);
    return gagal("Transaksi gagal disimpan.");
  }

  await kirimNotifikasi(supabase, {
    judul: id ? "Transaksi Diperbarui" : "Transaksi Baru",
    pesan: `${tipe} sebesar Rp ${jumlah.toLocaleString("id-ID")} tercatat: ${deskripsi}`,
    tipe: tipe === "Pemasukan" ? "success" : "warning",
    untukPeran: "Admin",
    tipeTerkait: "transaction",
    idTerkait: id ?? null,
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return berhasil(null);
};

export const hapusTransaksiAction: AksiForm<null> = async (_sebelumnya, data) => {
  const izin = await pastikanAdmin();
  if ("tolakan" in izin) return gagal(izin.tolakan);

  const cek = skemaIdUmum.safeParse({ id: teks(data, "id") });
  if (!cek.success) {
    return gagal("Transaksi tidak valid.", pesanPerField(cek.error));
  }

  const supabase = await buatKlienServer();

  try {
    await hapusTransaksi(supabase, cek.data.id);
  } catch (kesalahan) {
    catatKegagalan("hapusTransaksiAction", kesalahan);
    return gagal("Transaksi gagal dihapus.");
  }

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return berhasil(null);
};
