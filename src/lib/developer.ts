import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/**
 * Pintu masuk halaman developer.
 *
 * Developer sengaja **bukan** peran aplikasi. Peran di JoyOps tetap dua,
 * Admin dan Karyawan. Developer adalah pengelola sistem yang berdiri di luar
 * operasional laundry, jadi haknya tidak diwakili oleh baris di tabel
 * pengguna mana pun.
 *
 * Sejak revisi ini pintunya memakai email dan sandi, bukan lagi satu kunci
 * rahasia yang harus diketik apa adanya. Alasannya sederhana: sandi bisa
 * diganti sendiri lewat surel kalau lupa, sedangkan kunci mentah tidak.
 *
 * Sandi awal diambil dari `DEVELOPER_PASSWORD` (atau `KUNCI_DEVELOPER` lama
 * sebagai cadangan), lalu disimpan sebagai hash scrypt begitu dipakai pertama
 * kali. Setelah itu yang berlaku adalah hash di database, bukan nilai di
 * berkas lingkungan lagi.
 */

/** Cookie sesi developer. Hanya dibaca di sisi server. */
export const NAMA_COOKIE_SESI = "joyops_sesi_dev";

/** Cookie berlaku 8 jam, lalu harus masuk lagi. */
export const MASA_BERLAKU_COOKIE_JAM = 8;

/** Tautan atur ulang sandi berlaku 30 menit dan sekali pakai. */
export const MASA_BERLAKU_TOKEN_MENIT = 30;

/** Email developer bawaan bila `DEVELOPER_EMAIL` tidak diisi. */
export const EMAIL_DEVELOPER_BAWAAN = "malthof@gmail.com";

export const PESAN_MASUK_SALAH = "Email atau sandi tidak cocok";
export const PESAN_SANDI_TIDAK_COCOK = "Sandi tidak cocok";
export const PESAN_SANDI_BELUM_DIATUR =
  "Sandi developer belum diatur. Isi DEVELOPER_PASSWORD di berkas lingkungan server.";
export const PESAN_TANPA_KUNCI_ADMIN =
  "Layanan akun belum aktif. SUPABASE_SERVICE_ROLE_KEY belum diisi, jadi keputusan atas permintaan belum bisa dilakukan.";
export const PESAN_SESI_HABIS = "Sesi developer berakhir. Masuk lagi.";
export const PESAN_TOKEN_HANGUS =
  "Tautan sudah kedaluwarsa atau pernah dipakai. Minta tautan baru.";

/** Email developer yang berlaku. */
export function emailDeveloper(): string {
  return (
    process.env.DEVELOPER_EMAIL?.trim() || EMAIL_DEVELOPER_BAWAAN
  ).toLowerCase();
}

/**
 * Sandi awal developer dari berkas lingkungan.
 *
 * `DEVELOPER_PASSWORD` diutamakan. `KUNCI_DEVELOPER` dari versi sebelumnya
 * tetap diterima sebagai cadangan supaya pemasangan yang sudah jalan tidak
 * langsung terkunci. `null` berarti belum diatur.
 */
export function sandiAwalDeveloper(): string | null {
  const sandi =
    process.env.DEVELOPER_PASSWORD?.trim() ||
    process.env.KUNCI_DEVELOPER?.trim();
  return sandi && sandi.length > 0 ? sandi : null;
}

/** Apakah penyiapan pintu developer sudah lengkap. */
export function akunDeveloperSiap(): boolean {
  return sandiAwalDeveloper() !== null;
}

/**
 * Rahasia penanda tangan sesi dan tautan.
 *
 * `DEVELOPER_SECRET` dipakai bila ada. Kalau tidak, sandi awal yang dipakai —
 * cukup untuk menandatangani, dan tidak pernah dikirim ke peramban.
 */
function rahasiaSesi(): string {
  return process.env.DEVELOPER_SECRET?.trim() || sandiAwalDeveloper() || "";
}

/** Bandingkan dua teks tanpa membocorkan panjang kecocokannya lewat waktu. */
export function teksSama(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

/**
 * Buat penanda sesi bertanda tangan.
 *
 * Isinya waktu kedaluwarsa plus tanda tangan HMAC. Cookie tidak pernah
 * memuat sandi aslinya, jadi bocornya cookie tidak sama dengan bocornya sandi.
 */
export function buatSesiDeveloper(): string {
  const hangus = Date.now() + MASA_BERLAKU_COOKIE_JAM * 60 * 60 * 1000;
  const isi = String(hangus);
  const tanda = createHmac("sha256", rahasiaSesi()).update(isi).digest("hex");
  return `${isi}.${tanda}`;
}

/** Periksa penanda sesi dari cookie: tanda tangan sah dan belum kedaluwarsa. */
export function sesiDeveloperSah(nilai: string | null | undefined): boolean {
  const rahasia = rahasiaSesi();
  if (!rahasia || !nilai) return false;

  const pisah = nilai.indexOf(".");
  if (pisah <= 0) return false;

  const isi = nilai.slice(0, pisah);
  const tanda = nilai.slice(pisah + 1);
  const benar = createHmac("sha256", rahasia).update(isi).digest("hex");

  const a = Buffer.from(tanda, "utf8");
  const b = Buffer.from(benar, "utf8");
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  const hangus = Number(isi);
  return Number.isFinite(hangus) && hangus > Date.now();
}

/** Hash sandi baru beserta salt acaknya. */
export function acakSandi(sandi: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(sandi, salt, 64).toString("hex");
  return { hash, salt };
}

/** Periksa sandi terhadap hash yang tersimpan. */
export function sandiCocok(
  sandi: string,
  hash: string,
  salt: string
): boolean {
  try {
    const coba = scryptSync(sandi, salt, 64);
    const asli = Buffer.from(hash, "hex");
    return coba.length === asli.length && timingSafeEqual(coba, asli);
  } catch {
    return false;
  }
}

/** Token tautan atur ulang: yang dikirim ke surel, dan hash yang disimpan. */
export function buatTokenReset(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}

/** Hash token sebelum disimpan, supaya bocornya isi tabel tidak cukup untuk dipakai. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
