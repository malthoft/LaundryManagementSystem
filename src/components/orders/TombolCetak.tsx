"use client";

import { Tombol } from "@/components/ui/Tombol";

/**
 * Tombol cetak untuk halaman struk. Dipisah jadi komponen klien kecil supaya
 * halaman struknya tetap komponen server dan tidak perlu state apa pun.
 */
export function TombolCetak() {
  return (
    <Tombol type="button" ikon="print" onClick={() => window.print()}>
      Cetak struk
    </Tombol>
  );
}
