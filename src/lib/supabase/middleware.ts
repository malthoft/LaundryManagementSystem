import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Menyegarkan cookie sesi pada setiap permintaan, lalu menjaga rute.
 *
 * Aturan:
 * - Belum masuk dan membuka rute aplikasi, diarahkan ke /login.
 * - Sudah masuk dan membuka /login, diarahkan ke /dashboard.
 */
export async function segarkanSesi(permintaan: NextRequest) {
  // Halaman yang boleh dibuka tanpa sesi masuk. /developer memakai kunci
  // rahasia sendiri, bukan akun, jadi jangan ikut diperiksa sesi.
  const TERBUKA = ["/login", "/register", "/lupa-sandi", "/atur-sandi", "/developer"];
  if (TERBUKA.some((t) => permintaan.nextUrl.pathname.startsWith(t))) {
    return NextResponse.next();
  }
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
      setAll(daftar: { name: string; value: string; options: CookieOptions }[]) {
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
