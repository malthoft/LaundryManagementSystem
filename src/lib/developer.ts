import { timingSafeEqual } from "node:crypto";

/**
 * Pintu masuk halaman developer.
 *
 * Developer sengaja **bukan** peran aplikasi. Peran di JoyOps tetap dua,
 * Admin dan Karyawan. Developer adalah pengelola sistem yang berdiri di luar
 * operasional laundry, sehingga haknya dibatasi oleh kunci rahasia dari
 * berkas lingkungan, bukan oleh baris di tabel pengguna.
 *
 * Berkat itu tidak ada akun ketiga yang bisa disusupi, dan `/developer` tidak
 * perlu muncul di menu mana pun.
 */

/** Nama cookie yang menyimpan kunci, hanya dibaca di sisi server. */
export const NAMA_COOKIE_KUNCI = "joyops_kunci_dev";

/** Cookie berlaku 8 jam, lalu harus memasukkan kunci lagi. */
export const MASA_BERLAKU_COOKIE_JAM = 8;

export const PESAN_KUNCI_SALAH = "Kunci salah";
export const PESAN_TANPA_KUNCI =
  "Kunci developer belum diisi. Tambahkan KUNCI_DEVELOPER ke berkas lingkungan.";
export const PESAN_TANPA_KUNCI_ADMIN =
  "Layanan akun belum aktif. SUPABASE_SERVICE_ROLE_KEY belum diisi, jadi keputusan atas permintaan belum bisa dilakukan.";

/** Kunci rahasia halaman developer. `null` bila belum diisi. */
export function kunciDeveloper(): string | null {
  const kunci = process.env.KUNCI_DEVELOPER?.trim();
  return kunci && kunci.length > 0 ? kunci : null;
}

/** Apakah penyiapan kunci sudah lengkap. Dipakai tampilan untuk memberi petunjuk. */
export function kunciSiap(): boolean {
  return kunciDeveloper() !== null;
}

/**
 * Bandingkan kunci yang diketik dengan kunci aslinya.
 *
 * Memakai `timingSafeEqual` supaya lama pembandingan tidak membocorkan
 * seberapa dekat tebakan orang dengan kunci yang benar. Perbandingan `===`
 * bisa berhenti di karakter pertama yang beda, dan selisih waktu itu
 * bisa diukur dari luar.
 */
export function kunciSama(diajukan: string | undefined | null): boolean {
  const kunci = kunciDeveloper();
  if (!kunci) return false;

  const a = Buffer.from(diajukan ?? "", "utf8");
  const b = Buffer.from(kunci, "utf8");

  // Panjang berbeda langsung ditolak. `timingSafeEqual` melempar galat bila
  // panjangnya tidak sama, jadi wajib diperiksa lebih dulu.
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/** Periksa kunci yang tersimpan di cookie. */
export function kunciDariCookie(nilai: string | undefined | null): boolean {
  return kunciSama(nilai ?? "");
}
