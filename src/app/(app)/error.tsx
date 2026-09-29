"use client";

import { useEffect } from "react";
import { Kartu, IsiKartu } from "@/components/ui/Kartu";
import { KeadaanGagal } from "@/components/ui/Keadaan";
import { Tombol } from "@/components/ui/Tombol";

/**
 * Batas kesalahan halaman. Kalau satu halaman gagal dimuat, pemakainya tetap
 * mendapat penjelasan dan satu jalan keluar, bukan layar kosong.
 */
export default function GagalHalaman({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[JoyOps] halaman gagal:", error);
  }, [error]);

  return (
    <Kartu>
      <IsiKartu className="flex flex-col items-center gap-4">
        <KeadaanGagal pesan="Halaman ini gagal dimuat. Data tidak diubah. Coba muat ulang, bila tetap gagal hubungi Admin." />
        <Tombol type="button" ikon="refresh" onClick={reset}>
          Coba lagi
        </Tombol>
      </IsiKartu>
    </Kartu>
  );
}
