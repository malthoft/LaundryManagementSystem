import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klien service role. HANYA untuk server, dan hanya untuk hal yang mau tidak
 * mau butuh hak istimewa: membuat akun karyawan dan mereset sandinya.
 *
 * Kunci ini melewati RLS. Kalau bocor ke klien, seluruh database terbuka.
 * Karena itu tidak ada satu pun komponen klien yang mengimpor berkas ini.
 */
export function apakahAdminTersedia(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function buatKlienAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !kunci) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diisi. Tanpa itu, menambah karyawan dan mereset sandi tidak bisa dipakai."
    );
  }

  return createClient(url, kunci, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
