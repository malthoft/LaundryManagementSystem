import type { NextRequest } from "next/server";
import { segarkanSesi } from "@/lib/supabase/middleware";

export async function middleware(permintaan: NextRequest) {
  return segarkanSesi(permintaan);
}

export const config = {
  matcher: [
    /*
     * Semua rute kecuali berkas statis dan gambar Next.js, supaya middleware
     * tidak jalan untuk aset.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
