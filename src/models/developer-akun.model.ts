import type { SupabaseClient } from "@supabase/supabase-js";
import { acakSandi, emailDeveloper, sandiAwalDeveloper } from "@/lib/developer";

/**
 * Akses tabel `developer_akun` (lihat supabase/07_akun_developer.sql).
 *
 * Tabelnya hanya boleh disentuh lewat klien service role. Semua fungsi di
 * sini menerima klien itu sebagai argumen, bukan membuatnya sendiri, supaya
 * tidak ada jalur tak sengaja yang memakai klien anon.
 */

export interface AkunDeveloper {
  id: number;
  email: string;
  sandi_hash: string;
  sandi_salt: string;
  token_hash: string | null;
  token_hangus_pada: string | null;
  diperbarui_pada: string;
}

const KOLOM =
  "id, email, sandi_hash, sandi_salt, token_hash, token_hangus_pada, diperbarui_pada";

/**
 * Ambil satu-satunya baris akun developer.
 *
 * `null` juga dikembalikan ketika tabelnya belum dibuat, supaya halaman tetap
 * bisa jalan dengan sandi dari berkas lingkungan.
 */
export async function ambilAkunDeveloper(
  klien: SupabaseClient
): Promise<AkunDeveloper | null> {
  const { data, error } = await klien
    .from("developer_akun")
    .select(KOLOM)
    .eq("id", 1)
    .maybeSingle();

  if (error) return null;
  return (data as AkunDeveloper | null) ?? null;
}

/** Simpan hash sandi baru. Sekaligus mengosongkan token yang masih tersisa. */
export async function simpanSandiDeveloper(
  klien: SupabaseClient,
  email: string,
  sandi: string
): Promise<void> {
  const { hash, salt } = acakSandi(sandi);

  const { error } = await klien.from("developer_akun").upsert({
    id: 1,
    email: email.toLowerCase(),
    sandi_hash: hash,
    sandi_salt: salt,
    token_hash: null,
    token_hangus_pada: null,
    diperbarui_pada: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

/**
 * Pastikan barisnya ada.
 *
 * Dipakai saat masuk pertama kali setelah revisi: sandi dari berkas
 * lingkungan disalin ke database supaya bisa diganti lewat surel mulai saat
 * itu. Kalau barisnya sudah ada, tidak ada yang diubah.
 */
export async function pastikanAkunAwal(
  klien: SupabaseClient
): Promise<AkunDeveloper | null> {
  const ada = await ambilAkunDeveloper(klien);
  if (ada) return ada;

  const sandi = sandiAwalDeveloper();
  if (!sandi) return null;

  await simpanSandiDeveloper(klien, emailDeveloper(), sandi);
  return ambilAkunDeveloper(klien);
}

/** Simpan hash token atur ulang beserta waktu hangusnya. */
export async function simpanTokenReset(
  klien: SupabaseClient,
  tokenHash: string,
  hangus: string
): Promise<void> {
  const { error } = await klien
    .from("developer_akun")
    .update({ token_hash: tokenHash, token_hangus_pada: hangus })
    .eq("id", 1);

  if (error) throw new Error(error.message);
}

/** Cari akun yang tokennya cocok. Pemeriksaan waktu dilakukan pemanggil. */
export async function ambilAkunDenganToken(
  klien: SupabaseClient,
  tokenHash: string
): Promise<AkunDeveloper | null> {
  const { data, error } = await klien
    .from("developer_akun")
    .select(KOLOM)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) return null;
  return (data as AkunDeveloper | null) ?? null;
}
