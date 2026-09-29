"use client";

import { useEffect } from "react";
import { KeadaanGagal, PesanHasil } from "@/components/ui/Keadaan";
import { Kartu, IsiKartu } from "@/components/ui/Kartu";
import { Tombol } from "@/components/ui/Tombol";

/**
 * Batas kesalahan tingkat akar. Menangkap kegagalan yang terjadi di luar
 * segmen halaman, misalnya saat layout tidak bisa membaca sesi karena
 * database tidak terjangkau. Tanpa ini, yang tampil adalah layar bawaan
 * Next.js yang tidak menjelaskan apa pun.
 */
export default function GagalAkar({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[JoyOps] kegagalan akar:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10">
      <Kartu>
        <IsiKartu className="flex flex-col gap-4">
          <KeadaanGagal pesan="Aplikasi gagal dimuat. Tidak ada data yang berubah. Periksa sambungan database dan variabel lingkungan, lalu coba lagi." />

          <PesanHasil jenis="info">
            Bila sering terjadi, buka berkas .env.local dan pastikan tiga nilai Supabase
            terisi benar, lalu jalankan ulang server.
          </PesanHasil>

          <div className="flex flex-wrap gap-2">
            <Tombol type="button" ikon="refresh" onClick={reset}>
              Coba lagi
            </Tombol>
          </div>
        </IsiKartu>
      </Kartu>
    </main>
  );
}
