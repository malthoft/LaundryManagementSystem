import type { KlienSupabase } from "@/lib/supabase/server";
import type { Peran, Profil } from "@/types/db";

export const KOLOM_PROFIL =
  "id, username, full_name, role, legacy_id, is_active, created_at";

/** Semua akun, Admin dulu, lalu urut nama. */
export async function ambilSemuaProfil(
  supabase: KlienSupabase
): Promise<Profil[]> {
  const { data } = await supabase
    .from("profiles")
    .select(KOLOM_PROFIL)
    .order("role", { ascending: true })
    .order("full_name", { ascending: true })
    .returns<Profil[]>();

  return data ?? [];
}

/** Semua akun yang masih aktif. Dipakai untuk pilihan karyawan pada shift. */
export async function ambilProfilAktif(
  supabase: KlienSupabase
): Promise<Profil[]> {
  const { data } = await supabase
    .from("profiles")
    .select(KOLOM_PROFIL)
    .eq("is_active", true)
    .order("full_name", { ascending: true })
    .returns<Profil[]>();

  return data ?? [];
}

export async function ambilProfilById(
  supabase: KlienSupabase,
  id: string
): Promise<Profil | null> {
  const { data } = await supabase
    .from("profiles")
    .select(KOLOM_PROFIL)
    .eq("id", id)
    .maybeSingle()
    .returns<Profil | null>();

  return data ?? null;
}

export async function ambilProfilByUsername(
  supabase: KlienSupabase,
  username: string
): Promise<Profil | null> {
  const { data } = await supabase
    .from("profiles")
    .select(KOLOM_PROFIL)
    .eq("username", username.trim().toLowerCase())
    .maybeSingle()
    .returns<Profil | null>();

  return data ?? null;
}

/** Ubah nama dan peran. Hanya berhasil kalau pemanggilnya Admin (RLS). */
export async function simpanProfil(
  supabase: KlienSupabase,
  id: string,
  perubahan: { full_name?: string; role?: Peran; is_active?: boolean }
): Promise<void> {
  const { error } = await supabase.from("profiles").update(perubahan).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Ubah nama sendiri lewat fungsi database, supaya peran tidak bisa dinaikkan. */
export async function ubahNamaSaya(
  supabase: KlienSupabase,
  nama: string
): Promise<void> {
  const { error } = await supabase.rpc("ubah_profil_saya", {
    p_full_name: nama,
  });
  if (error) throw new Error(error.message);
}

/** Berapa banyak Admin aktif. Dipakai untuk mencegah Admin terakhir dinonaktifkan. */
export async function hitungAdminAktif(
  supabase: KlienSupabase
): Promise<number> {
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "Admin")
    .eq("is_active", true);

  return count ?? 0;
}
