import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Menyegarkan cookie sesi pada setiap permintaan, lalu menjaga rute.
 *
 * Aturan:
 * - Belum masuk dan membuka rute aplikasi, diarahkan ke /login.
 * - Sudah masuk dan membuka /login, diarahkan ke /dashboard.
 */
export async function segarkanSesi(permintaan: NextRequest) {
  let balasan = NextResponse.next({ request: permintaan });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Tanpa env, biarkan lewat supaya pesan kesalahannya jelas dari halaman,
  // bukan dari layar putih middleware.
  if (!url || !anon) return balasan;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return permintaan.cookies.getAll();
      },
      setAll(daftar) {
        for (const { name, value } of daftar) {
          permintaan.cookies.set(name, value);
        }
        balasan = NextResponse.next({ request: permintaan });
        for (const { name, value, options } of daftar) {
          balasan.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() harus dipanggil: inilah yang memicu penyegaran token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const jalur = permintaan.nextUrl.pathname;
  const halamanLogin = jalur === "/login";

  if (!user && !halamanLogin) {
    const tujuan = permintaan.nextUrl.clone();
    tujuan.pathname = "/login";
    tujuan.search = "";
    return NextResponse.redirect(tujuan);
  }

  if (user && halamanLogin) {
    const tujuan = permintaan.nextUrl.clone();
    tujuan.pathname = "/dashboard";
    tujuan.search = "";
    return NextResponse.redirect(tujuan);
  }

  return balasan;
}
