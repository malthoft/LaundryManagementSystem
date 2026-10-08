import { randomBytes } from "node:crypto";
import type { KlienSupabase } from "@/lib/supabase/server";

/**
 * Permintaan akun yang menunggu persetujuan developer: pendaftaran Admin dan
 * permintaan lupa sandi. Keduanya memakai alur yang sama, bedanya hanya
 * keluarannya: pendaftaran mengaktifkan akun, lupa sandi menerbitkan tautan.
 */

export type JenisPermintaan = "Pendaftaran" | "Lupa Sandi";
export type StatusPermintaan = "Menunggu" | "Disetujui" | "Ditolak";

export interface PermintaanAkun {
  id: number;
  jenis: JenisPermintaan;
  username: string;
  full_name: string | null;
  status: StatusPermintaan;
  catatan: string | null;
  token_reset: string | null;
  token_hangus_pada: string | null;
  token_terpakai: boolean;
  dibuat_pada: string;
  diputuskan_pada: string | null;
  diputuskan_oleh: string | null;
}

export interface PermintaanBaru {
  jenis: JenisPermintaan;
  username: string;
  full_name: string | null;
}

export const KOLOM_PERMINTAAN =
  "id, jenis, username, full_name, status, catatan, token_reset, " +
  "token_hangus_pada, token_terpakai, dibuat_pada, diputuskan_pada, diputuskan_oleh";

/**
 * Semua permintaan, yang belum diputuskan tampil lebih dulu.
 * Dipakai halaman developer.
 */
export async function ambilSemuaPermintaan(
  klien: KlienSupabase
): Promise<PermintaanAkun[]> {
  const { data } = await klien
    .from("permintaan_akun")
    .select(KOLOM_PERMINTAAN)
    .order("status", { ascending: true })
    .order("dibuat_pada", { ascending: true })
    .returns<PermintaanAkun[]>();

  return data ?? [];
}

/** Jumlah permintaan per status, untuk ringkasan di judul halaman developer. */
export async function hitungPermintaan(
  klien: KlienSupabase
): Promise<Record<StatusPermintaan, number>> {
  const { data } = await klien
    .from("permintaan_akun")
    .select("status")
    .returns<Pick<PermintaanAkun, "status">[]>();

  const daftar = data ?? [];
  const hitung = (status: StatusPermintaan) =>
    daftar.filter((baris) => baris.status === status).length;

  return {
    Menunggu: hitung("Menunggu"),
    Disetujui: hitung("Disetujui"),
    Ditolak: hitung("Ditolak"),
  };
}

/**
 * Cari permintaan yang belum diputuskan untuk sebuah nama pengguna.
 *
 * Dipakai dua kali: menolak pengajuan ganda, dan menampilkan pesan
 * "masih menunggu" saat pemiliknya mencoba masuk.
 */
export async function cariPermintaanMenunggu(
  klien: KlienSupabase,
  username: string
): Promise<PermintaanAkun | null> {
  const { data } = await klien
    .from("permintaan_akun")
    .select(KOLOM_PERMINTAAN)
    .eq("username", username)
    .eq("status", "Menunggu")
    .maybeSingle()
    .returns<PermintaanAkun | null>();

  return data ?? null;
}

/**
 * Permintaan terakhir untuk sebuah nama pengguna, apa pun statusnya.
 * Dipakai pintu masuk untuk menampilkan pesan penolakan.
 */
export async function cariPermintaanTerakhir(
  klien: KlienSupabase,
  username: string
): Promise<PermintaanAkun | null> {
  const { data } = await klien
    .from("permintaan_akun")
    .select(KOLOM_PERMINTAAN)
    .eq("username", username)
    .order("dibuat_pada", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<PermintaanAkun | null>();

  return data ?? null;
}

/**
 * Catat permintaan baru. Statusnya selalu Menunggu; keamanan baris di basis
 * data juga menolak status lain, jadi tidak bisa dipaksa dari luar.
 *
 * Mengembalikan `false` bila nama pengguna ini sudah punya permintaan yang
 * belum diputuskan, ditangkap dari indeks unik `permintaan_satu_menunggu`.
 */
export async function simpanPermintaan(
  klien: KlienSupabase,
  masukan: PermintaanBaru
): Promise<boolean> {
  const { error } = await klien.from("permintaan_akun").insert({
    jenis: masukan.jenis,
    username: masukan.username,
    full_name: masukan.full_name,
  });

  // Kode 23505: pelanggaran batas unik. Berarti masih ada yang menunggu.
  if (error?.code === "23505") return false;
  if (error) throw new Error(error.message);

  return true;
}

/**
 * Putuskan permintaan lewat fungsi `putuskan_permintaan` di basis data.
 *
 * Fungsi itu sekalian menangani keluarannya: mengaktifkan akun bila
 * pendaftaran disetujui, atau menerbitkan tautan reset bila lupa sandi.
 */
/**
 * Putuskan permintaan akun.
 *
 * Sejak 3.1.1 keputusannya dijalankan langsung lewat klien layanan, bukan lewat
 * fungsi `putuskan_permintaan` di basis data. Alasannya: fungsi lama memakai
 * `gen_random_bytes()` yang butuh ekstensi pgcrypto, sehingga menyetujui
 * "Lupa Sandi" selalu gagal sementara "Pendaftaran" lolos (kembali sebelum
 * baris token). Menjalankannya di aplikasi membuat hasilnya sama di mana pun,
 * termasuk di Vercel, tanpa perlu mengubah basis data.
 *
 * Pembaruan status dipakai sebagai banding-tukar: barisnya hanya berubah bila
 * statusnya masih "Menunggu", jadi keputusan ganda tidak mungkin terjadi.
 */
export async function putuskanPermintaan(
  klien: KlienSupabase,
  id: number,
  setuju: boolean,
  catatan: string | null
): Promise<string | null> {
  const { data: mentah, error: baca } = await klien
    .from("permintaan_akun")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (baca) throw new Error(baca.message);
  const v_req = mentah as PermintaanAkun | null;
  if (!v_req) throw new Error("Permintaan tidak ditemukan");
  if (v_req.status !== "Menunggu") throw new Error("Permintaan sudah diputuskan");

  const { error } = await klien
    .from("permintaan_akun")
    .update({
      status: setuju ? "Disetujui" : "Ditolak",
      catatan: catatan?.trim() ? catatan : null,
      diputuskan_pada: new Date().toISOString(),
      diputuskan_oleh: "developer",
    })
    .eq("id", id)
    .eq("status", "Menunggu");
  if (error) throw new Error(error.message);

  if (!setuju) return null;

  if (v_req.jenis === "Pendaftaran") {
    const { error: galatProfil } = await klien
      .from("profiles")
      .update({ is_active: true })
      .eq("username", v_req.username);
    if (galatProfil) throw new Error(galatProfil.message);
    return null;
  }

  // Lupa Sandi: terbitkan tautan sekali pakai, berlaku 30 menit.
  const token = randomBytes(32).toString("hex");
  const { error: galatToken } = await klien
    .from("permintaan_akun")
    .update({
      token_reset: token,
      token_hangus_pada: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      token_terpakai: false,
    })
    .eq("id", id);
  if (galatToken) throw new Error(galatToken.message);

  return token;
}

/** Cari permintaan lewat token reset tautannya. */
export async function cariPermintaanDenganToken(
  klien: KlienSupabase,
  token: string
): Promise<PermintaanAkun | null> {
  const { data } = await klien
    .from("permintaan_akun")
    .select(KOLOM_PERMINTAAN)
    .eq("token_reset", token)
    .eq("token_terpakai", false)
    .maybeSingle()
    .returns<PermintaanAkun | null>();

  return data ?? null;
}

/** Tandai tautan sudah dipakai supaya tidak bisa dipakai dua kali. */
export async function tandaiTokenTerpakai(
  klien: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await klien
    .from("permintaan_akun")
    .update({ token_terpakai: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/**
 * Status permintaan akun terakhir untuk sebuah nama pengguna.
 *
 * Tabel `permintaan_akun` sengaja tidak bisa dibaca publik, sedangkan pintu
 * masuk berjalan sebagai tamu. Karena itu pembacaannya lewat fungsi
 * `status_permintaan` yang `security definer`, yang hanya mengembalikan status
 * untuk nama pengguna yang memang sudah diketik penanyanya.
 *
 * Hasilnya berupa "Status|Jenis", misalnya "Menunggu|Pendaftaran".
 */
export async function statusPermintaan(
  klien: KlienSupabase,
  username: string
): Promise<string | null> {
  const { data, error } = await klien.rpc("status_permintaan", {
    p_username: username,
  });

  if (error) throw new Error(error.message);
  return typeof data === "string" && data.length > 0 ? data : null;
}

/**
 * Catat permintaan dan bedakan hasilnya.
 *
 * `simpanPermintaan` lama hanya membalas boolean, sehingga "sudah ada permintaan
 * yang menunggu" dan "insert gagal" terlihat sama. Akibatnya pesan yang muncul
 * menyesatkan. Nilai balik:
 * - "baru"       : tercatat, tinggal menunggu keputusan developer
 * - "sudah_ada"  : masih ada permintaan yang belum diputuskan
 * - "gagal"      : ditolak basis data, bukan karena sudah ada
 */
export async function catatPermintaan(
  klien: KlienSupabase,
  baru: PermintaanBaru
): Promise<"baru" | "sudah_ada" | "gagal"> {
  try {
    const { error } = await klien.from("permintaan_akun").insert({
      ...baru,
      status: "Menunggu",
      full_name: baru.full_name?.trim() ? baru.full_name : null,
    });
    if (!error) return "baru";
    // 23505 = pelanggaran kunci unik: masih ada permintaan yang belum diputuskan.
    if (error.code === "23505") return "sudah_ada";
    return "gagal";
  } catch {
    // Galat jaringan atau klien. Diamkan di sini, pelaporannya urusan pemanggil.
    return "gagal";
  }
}

/** Hapus satu baris riwayat permintaan. */
export async function hapusPermintaan(
  klien: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await klien.from("permintaan_akun").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Hapus seluruh riwayat yang sudah diputuskan. Permintaan yang masih menunggu tidak ikut. */
export async function hapusSemuaRiwayat(klien: KlienSupabase): Promise<number> {
  const { data, error } = await klien
    .from("permintaan_akun")
    .delete()
    .neq("status", "Menunggu")
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}
