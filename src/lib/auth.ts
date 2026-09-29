import { cache } from "react";
import { redirect } from "next/navigation";
import { buatKlienServer, sambunganSiap } from "@/lib/supabase/server";
import type { Profil } from "@/types/db";

const KOLOM_PROFIL =
  "id, username, full_name, role, legacy_id, is_active, created_at";

/**
 * Pengguna Supabase Auth yang sedang login. Di-cache per permintaan supaya
 * tidak memanggil jaringan berkali-kali dalam satu render.
 */
export const penggunaSaya = cache(async () => {
  /* Tanpa variabel lingkungan, tidak ada sesi yang bisa dibaca. Mengembalikan
     null lebih baik daripada melempar, supaya halaman tidak menumpuk galat
     dan pengguna diarahkan ke halaman masuk. */
  if (!sambunganSiap()) return null;

  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Baris `profiles` milik pengguna yang sedang login. */
export const profilSaya = cache(async (): Promise<Profil | null> => {
  const pengguna = await penggunaSaya();
  if (!pengguna) return null;

  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("profiles")
    .select(KOLOM_PROFIL)
    .eq("id", pengguna.id)
    .maybeSingle()
    .returns<Profil | null>();

  return data ?? null;
});

/** Wajib sudah login. Kalau tidak, dilempar ke halaman login. */
export async function wajibMasuk(): Promise<Profil> {
  const profil = await profilSaya();
  if (!profil) redirect("/login");
  if (!profil.is_active) redirect("/login?pesan=nonaktif");
  return profil;
}

/** Wajib login sebagai Admin. Karyawan diarahkan ke dashboard dengan pesan. */
export async function wajibAdmin(): Promise<Profil> {
  const profil = await wajibMasuk();
  if (profil.role !== "Admin") redirect("/dashboard?pesan=terbatas");
  return profil;
}

/** Benar kalau pengguna yang login adalah Admin. */
export async function adminkah(): Promise<boolean> {
  const profil = await profilSaya();
  return profil?.role === "Admin";
}

/**
 * Login memakai username, sedangkan Supabase Auth butuh email. Pemetaannya
 * dilakukan di server saja, jadi domainnya tidak pernah sampai ke klien.
 */
export function domainEmail(): string {
  return process.env.AUTH_EMAIL_DOMAIN?.trim() || "joyops.local";
}

export function emailDariUsername(username: string): string {
  return `${username.trim().toLowerCase()}@${domainEmail()}`;
}
