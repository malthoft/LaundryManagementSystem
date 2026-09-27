import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Klien Supabase untuk satu permintaan, memakai cookie sesi pengguna.
 * RLS berlaku: yang bisa dibaca klien ini persis yang boleh dibaca orangnya.
 */
export async function buatKlienServer() {
  const penyimpanan = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env.local"
    );
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return penyimpanan.getAll();
      },
      setAll(daftar) {
        try {
          for (const { name, value, options } of daftar) {
            penyimpanan.set(name, value, options);
          }
        } catch {
          // Dipanggil dari server component, di mana cookie tidak bisa ditulis.
          // Penyegaran sesi ditangani middleware.
        }
      },
    },
  });
}

export type KlienSupabase = Awaited<ReturnType<typeof buatKlienServer>>;
