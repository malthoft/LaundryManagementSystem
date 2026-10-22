"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AksiForm } from "@/lib/aksi";
import { teks, catatKegagalan } from "@/lib/aksi";
import { berhasil, gagal } from "@/types/domain";
import {
  pesanPerField,
  skemaMasukDeveloper,
  skemaLupaSandiDeveloper,
  skemaAturSandiDeveloper,
  skemaUbahAkunDeveloper,
  skemaResetSandiAkunDeveloper,
  skemaStatusAkunDeveloper,
} from "@/lib/validation";
import {
  NAMA_COOKIE_SESI,
  MASA_BERLAKU_COOKIE_JAM,
  MASA_BERLAKU_TOKEN_MENIT,
  PESAN_MASUK_SALAH,
  PESAN_SANDI_BELUM_DIATUR,
  PESAN_SANDI_TIDAK_COCOK,
  PESAN_SESI_HABIS,
  PESAN_TOKEN_HANGUS,
  akunDeveloperSiap,
  buatSesiDeveloper,
  sesiDeveloperSah,
  sandiCocok,
  teksSama,
  buatTokenReset,
  hashToken,
  emailDeveloper,
  sandiAwalDeveloper,
} from "@/lib/developer";
import { buatKlienAdmin, apakahAdminTersedia } from "@/lib/supabase/admin";
import {
  ambilAkunDeveloper,
  ambilAkunDenganToken,
  pastikanAkunAwal,
  simpanSandiDeveloper,
  simpanTokenReset,
} from "@/models/developer-akun.model";
import { kirimTautanResetDeveloper } from "@/lib/email";
import {
  ambilSemuaPermintaan,
  hitungPermintaan,
  putuskanPermintaan,
  hapusPermintaan,
  hapusSemuaRiwayat,
  type PermintaanAkun,
  type StatusPermintaan,
} from "@/models/permintaan.model";
import {
  ambilProfilById,
  ambilSemuaProfil,
  hitungAdminAktif,
  simpanProfil,
} from "@/models/profile.model";

/** Alamat asal aplikasi, dipakai untuk menyusun tautan atur ulang. */
async function asalAplikasi(): Promise<string> {
  const tetap = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (tetap) return tetap.replace(/\/+$/, "");

  const kepala = await headers();
  const host = kepala.get("x-forwarded-host") ?? kepala.get("host") ?? "localhost:3000";
  const protokol =
    kepala.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protokol}://${host}`;
}

/** Sesi developer masih sah menurut cookie yang dikirim peramban. */
async function sesiSah(): Promise<boolean> {
  const toko = await cookies();
  return sesiDeveloperSah(toko.get(NAMA_COOKIE_SESI)?.value ?? null);
}

/**
 * Masuk ke halaman developer memakai email dan sandi.
 *
 * Sandi diperiksa terhadap hash di tabel `developer_akun`. Bila barisnya belum
 * ada (pemasangan baru), sandi awal dari berkas lingkungan dipakai sekali,
 * lalu langsung disimpan sebagai hash supaya bisa diganti lewat surel.
 */
export const masukDeveloperAction: AksiForm<null> = async (_sebelum, data) => {
  if (!akunDeveloperSiap()) return gagal(PESAN_SANDI_BELUM_DIATUR);

  const cek = skemaMasukDeveloper.safeParse({
    email: teks(data, "email"),
    sandi: teks(data, "sandi"),
  });
  if (!cek.success) {
    return gagal(PESAN_MASUK_SALAH, pesanPerField(cek.error));
  }

  const { email, sandi } = cek.data;
  if (!teksSama(email, emailDeveloper())) {
    return gagal(PESAN_MASUK_SALAH, { email: "Email tidak dikenal" });
  }

  let akun = null;
  if (apakahAdminTersedia()) {
    try {
      akun = await ambilAkunDeveloper(buatKlienAdmin());
    } catch (kesalahan) {
      catatKegagalan("masukDeveloperAction:ambilAkun", kesalahan);
    }
  }

  let sandiSah = false;

  if (akun) {
    sandiSah = sandiCocok(sandi, akun.sandi_hash, akun.sandi_salt);
  } else {
    const awal = sandiAwalDeveloper();
    sandiSah = Boolean(awal) && teksSama(sandi, awal as string);

    if (sandiSah && apakahAdminTersedia()) {
      try {
        await simpanSandiDeveloper(buatKlienAdmin(), emailDeveloper(), sandi);
      } catch (kesalahan) {
        catatKegagalan("masukDeveloperAction:simpanAwal", kesalahan);
      }
    }
  }

  if (!sandiSah) return gagal(PESAN_MASUK_SALAH, { sandi: PESAN_SANDI_TIDAK_COCOK });

  const toko = await cookies();
  toko.set(NAMA_COOKIE_SESI, buatSesiDeveloper(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/developer",
    maxAge: MASA_BERLAKU_COOKIE_JAM * 60 * 60,
  });

  revalidatePath("/developer");
  return berhasil(null);
};

/** Keluar dari halaman developer dengan menghapus sesinya. */
export const keluarDeveloperAction = async (): Promise<never> => {
  const toko = await cookies();
  toko.delete(NAMA_COOKIE_SESI);
  redirect("/developer");
};

/**
 * Kirim tautan atur ulang sandi ke surel developer.
 *
 * Balasannya sengaja umum: tidak membedakan email yang terdaftar dari yang
 * tidak. Bila surel belum diatur dan aplikasi berjalan di luar produksi,
 * tautannya ditampilkan di layar supaya tetap bisa dipakai saat pengembangan.
 */
export const lupaSandiDeveloperAction: AksiForm<{
  pesan: string;
  tautan: string | null;
}> = async (_sebelum, data) => {
  if (!akunDeveloperSiap()) return gagal(PESAN_SANDI_BELUM_DIATUR);

  const cek = skemaLupaSandiDeveloper.safeParse({ email: teks(data, "email") });
  if (!cek.success) {
    return gagal("Periksa kembali email Anda.", pesanPerField(cek.error));
  }

  const email = cek.data.email;
  const balasanUmum =
    "Kalau email itu terdaftar, tautan atur ulang sudah dikirim ke kotak masuknya.";

  if (!teksSama(email, emailDeveloper())) {
    return berhasil({ pesan: balasanUmum, tautan: null });
  }

  if (!apakahAdminTersedia()) {
    return gagal("SUPABASE_SERVICE_ROLE_KEY belum diisi, jadi tautan belum bisa diterbitkan.");
  }

  try {
    const klien = buatKlienAdmin();
    const akun = await pastikanAkunAwal(klien);
    if (!akun) return gagal(PESAN_SANDI_BELUM_DIATUR);

    const { token, hash } = buatTokenReset();
    const hangus = new Date(
      Date.now() + MASA_BERLAKU_TOKEN_MENIT * 60 * 1000
    ).toISOString();
    await simpanTokenReset(klien, hash, hangus);

    const tautan = `${await asalAplikasi()}/developer/atur-sandi?token=${token}`;
    const terkirim = await kirimTautanResetDeveloper(tautan);

    if (!terkirim && process.env.NODE_ENV === "production") {
      return gagal(
        "Surel belum aktif, jadi tautan tidak bisa dikirim. Lengkapi SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, dan EMAIL_DEVELOPER di berkas lingkungan."
      );
    }

    return berhasil({
      pesan: terkirim
        ? `Tautan atur ulang sudah dikirim ke ${email}.`
        : "Surel belum aktif, jadi tautannya ditampilkan di layar ini.",
      tautan: terkirim ? null : tautan,
    });
  } catch (kesalahan) {
    catatKegagalan("lupaSandiDeveloperAction", kesalahan);
    return gagal("Belum bisa membuat tautan atur ulang.");
  }
};

/** Tukar token dari surel dengan sandi developer yang baru. */
export const aturSandiDeveloperAction: AksiForm<null> = async (_sebelum, data) => {
  const cek = skemaAturSandiDeveloper.safeParse({
    token: teks(data, "token"),
    sandiBaru: teks(data, "sandiBaru"),
    ulangi: teks(data, "ulangi"),
  });
  if (!cek.success) {
    return gagal("Periksa kembali isian sandi.", pesanPerField(cek.error));
  }

  if (!apakahAdminTersedia()) {
    return gagal("SUPABASE_SERVICE_ROLE_KEY belum diisi.");
  }

  try {
    const klien = buatKlienAdmin();
    const akun = await ambilAkunDenganToken(klien, hashToken(cek.data.token));

    if (!akun || !akun.token_hangus_pada) return gagal(PESAN_TOKEN_HANGUS);
    if (new Date(akun.token_hangus_pada).getTime() < Date.now()) {
      return gagal(PESAN_TOKEN_HANGUS);
    }

    // Menyimpan sandi sekaligus mengosongkan tokennya, jadi tautannya sekali pakai.
    await simpanSandiDeveloper(klien, akun.email, cek.data.sandiBaru);
    return berhasil(null);
  } catch (kesalahan) {
    catatKegagalan("aturSandiDeveloperAction", kesalahan);
    return gagal("Belum bisa menyimpan sandi baru.");
  }
};

export interface IsiHalamanDeveloper {
  daftar: PermintaanAkun[];
  ringkasan: Record<StatusPermintaan, number>;
}

/**
 * Isi halaman developer, hanya untuk pemegang sesi yang sah.
 * Dipanggil dari halamannya, bukan dari peramban.
 */
export async function muatHalamanDeveloper(): Promise<IsiHalamanDeveloper | null> {
  if (!(await sesiSah())) return null;
  if (!apakahAdminTersedia()) return null;

  const klien = buatKlienAdmin();

  const [daftar, ringkasan] = await Promise.all([
    ambilSemuaPermintaan(klien),
    hitungPermintaan(klien),
  ]);

  return { daftar, ringkasan };
}

/**
 * Setujui atau tolak sebuah permintaan akun.
 *
 * Sesi diperiksa ulang di sini, bukan hanya di halaman. Mempercayai tampilan
 * saja berarti aksi ini bisa dipanggil langsung tanpa lewat form.
 */
export const putuskanPermintaanAction: AksiForm<{
  tautanReset: string | null;
  setuju: boolean;
}> = async (_sebelum, data) => {
  if (!(await sesiSah())) return gagal(PESAN_SESI_HABIS);
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
    // `setuju` ikut dibalikkan supaya tampilan bisa membedakan persetujuan
    // dari penolakan — tanpa itu, penolakan pun akan tampil "disetujui".
    return berhasil({ tautanReset, setuju });
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

/**
 * Hapus satu baris riwayat, atau seluruh riwayat bila id bernilai "semua".
 * Sesi diperiksa ulang di sini, sama seperti aksi putusan.
 */
export const hapusPermintaanAction: AksiForm<null> = async (_sebelum, data) => {
  if (!(await sesiSah())) return gagal(PESAN_SESI_HABIS);
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
    return berhasil(null);
  } catch (kesalahan) {
    catatKegagalan("hapusPermintaanAction", kesalahan);
    return gagal(
      "Belum bisa menghapus riwayat: " +
        (kesalahan instanceof Error ? kesalahan.message : "galat tidak diketahui")
    );
  }
};

/**
 * Mode developer: kelola akun.
 *
 * Developer berdiri di luar hierarki peran aplikasi. Ia bukan peran ketiga,
 * jadi ia boleh mengatur semua akun — termasuk membuat Admin, mengubah peran,
 * dan mereset sandi. Yang tidak boleh dilakukan aplikasi untuk Admin, yaitu
 * mengatur sesama Admin, justru pekerjaan developer.
 *
 * Setiap aksi di bawah memeriksa ulang sesi developer, bukan mengandalkan
 * tampilan. Tanpa itu, aksi ini bisa dipanggil langsung tanpa lewat form.
 */

/**
 * Daftar akun untuk halaman kelola akun developer.
 *
 * Dipisah dari `muatHalamanDeveloper` supaya halaman kelola akun tidak ikut
 * memuat daftar permintaan yang tidak dipakainya.
 */
export async function muatDaftarAkunDeveloper(): Promise<{
  akun: Array<{
    id: string;
    username: string;
    nama: string;
    peran: string;
    aktif: boolean;
    dibuat: string;
  }>;
  jumlahAdmin: number;
}> {
  const klien = buatKlienAdmin();
  const daftar = await ambilSemuaProfil(klien);
  return {
    akun: daftar.map((p) => ({
      id: p.id,
      username: p.username,
      nama: p.full_name,
      peran: p.role,
      aktif: p.is_active,
      dibuat: p.created_at,
    })),
    jumlahAdmin: await hitungAdminAktif(klien),
  };
}

/** Ubah nama, peran, atau status aktif seorang pengguna. */
export const ubahAkunAction: AksiForm<null> = async (_sebelum, data) => {
  if (!(await sesiSah())) return gagal(PESAN_SESI_HABIS);
  if (!apakahAdminTersedia()) {
    return gagal("SUPABASE_SERVICE_ROLE_KEY belum diisi.");
  }

  const cek = skemaUbahAkunDeveloper.safeParse({
    id: teks(data, "id"),
    nama: teks(data, "nama"),
    peran: teks(data, "peran"),
    aktif: teks(data, "aktif") === "true",
  });
  if (!cek.success) {
    return gagal("Periksa kembali isian akun.", pesanPerField(cek.error));
  }

  const { id, nama, peran, aktif } = cek.data;
  const klien = buatKlienAdmin();

  const sasaran = await ambilProfilById(klien, id);
  if (!sasaran) return gagal("Akun tidak ditemukan.");

  // Satu Admin aktif harus selalu tersisa, kalau tidak halaman keuangan dan
  // data karyawan tidak bisa dibuka siapa pun.
  const kehilanganAdmin =
    sasaran.role === "Admin" && (peran !== "Admin" || !aktif);
  if (kehilanganAdmin && (await hitungAdminAktif(klien)) <= 1) {
    return gagal(
      "Ini satu-satunya Admin aktif. Angkat Admin lain dulu sebelum mengubah yang ini."
    );
  }

  try {
    await simpanProfil(klien, id, {
      full_name: nama,
      role: peran,
      is_active: aktif,
    });
    revalidatePath("/developer/akun");
    return berhasil(null);
  } catch (kesalahan) {
    catatKegagalan("ubahAkunAction", kesalahan);
    return gagal("Perubahan akun gagal disimpan.");
  }
};

/** Reset sandi seorang pengguna. Sandi baru dibalikkan supaya bisa disampaikan. */
export const resetSandiAkunAction: AksiForm<{ sandi: string }> = async (
  _sebelum,
  data
) => {
  if (!(await sesiSah())) return gagal(PESAN_SESI_HABIS);
  if (!apakahAdminTersedia()) {
    return gagal("SUPABASE_SERVICE_ROLE_KEY belum diisi.");
  }

  const cek = skemaResetSandiAkunDeveloper.safeParse({
    id: teks(data, "id"),
    sandi: teks(data, "sandi"),
  });
  if (!cek.success) {
    return gagal("Periksa kembali isian sandi.", pesanPerField(cek.error));
  }

  const { id, sandi } = cek.data;
  const klien = buatKlienAdmin();

  const sasaran = await ambilProfilById(klien, id);
  if (!sasaran) return gagal("Akun tidak ditemukan.");

  try {
    const { error } = await klien.auth.admin.updateUserById(id, {
      password: sandi,
    });
    if (error) return gagal(`Sandi gagal direset: ${error.message}`);
    revalidatePath("/developer/akun");
    return berhasil({ sandi });
  } catch (kesalahan) {
    catatKegagalan("resetSandiAkunAction", kesalahan);
    return gagal("Sandi gagal direset.");
  }
};

/** Aktifkan atau nonaktifkan akun tanpa membuka formulir penuh. */
export const ubahStatusAkunAction: AksiForm<null> = async (_sebelum, data) => {
  if (!(await sesiSah())) return gagal(PESAN_SESI_HABIS);
  if (!apakahAdminTersedia()) {
    return gagal("SUPABASE_SERVICE_ROLE_KEY belum diisi.");
  }

  const cek = skemaStatusAkunDeveloper.safeParse({
    id: teks(data, "id"),
    aktif: teks(data, "aktif") === "true",
  });
  if (!cek.success) {
    return gagal("Periksa kembali isian akun.", pesanPerField(cek.error));
  }

  const { id, aktif } = cek.data;
  const klien = buatKlienAdmin();

  const sasaran = await ambilProfilById(klien, id);
  if (!sasaran) return gagal("Akun tidak ditemukan.");

  if (!aktif && sasaran.role === "Admin" && (await hitungAdminAktif(klien)) <= 1) {
    return gagal(
      "Ini satu-satunya Admin aktif. Nonaktifkan akun ini akan mengunci seluruh aplikasi."
    );
  }

  try {
    await simpanProfil(klien, id, { is_active: aktif });
    revalidatePath("/developer/akun");
    return berhasil(null);
  } catch (kesalahan) {
    catatKegagalan("ubahStatusAkunAction", kesalahan);
    return gagal("Status akun gagal diubah.");
  }
};
