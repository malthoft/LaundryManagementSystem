"use client";

import { useEffect, useState } from "react";
import { PesanHasil } from "@/components/ui/Keadaan";

const KUNCI = "joyops.tautan.reset";

/**
 * Menampilkan tautan reset terakhir yang diterbitkan.
 *
 * Sengaja dipasang di tingkat halaman, bukan di dalam baris permintaan.
 * Setelah disetujui, barisnya langsung pindah ke riwayat dan komponen barisnya
 * ikut ter-unmount — panel yang menempel di situ akan lenyap sebelum sempat
 * terbaca. Panel ini tetap terpasang, jadi tautannya aman ditampilkan.
 */
export function TautanResetAktif() {
  const [tautan, setTautan] = useState<string | null>(null);
  const [tersalin, setTersalin] = useState(false);

  useEffect(() => {
    try {
      setTautan(sessionStorage.getItem(KUNCI));
    } catch {
      /* penyimpanan sesi bisa saja tidak tersedia */
    }
  }, []);

  if (!tautan) return null;

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(tautan);
      setTersalin(true);
    } catch {
      setTersalin(false);
    }
  };

  const tutup = () => {
    try {
      sessionStorage.removeItem(KUNCI);
    } catch {
      /* diabaikan */
    }
    setTautan(null);
  };

  return (
    <section className="mt-6 rounded-md border border-aksen/40 bg-aksen/8 px-4 py-4">
      <PesanHasil jenis="sukses">
        Tautan reset sudah diterbitkan. Salin lalu berikan ke pemilik akun —
        berlaku 30 menit, sekali pakai.
      </PesanHasil>
      <p className="mt-3 font-mono text-kecil uppercase tracking-wider text-muted">
        Tautan pengaturan ulang sandi
      </p>
      <p className="mt-2 break-all font-mono text-badan text-aksen">{tautan}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={salin}
          className="rounded-md bg-aksen px-3 py-2 font-mono text-kecil font-bold text-bg hover:opacity-90"
        >
          {tersalin ? "Tersalin" : "Salin tautan"}
        </button>
        <a
          href={tautan}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-kecil text-muted underline hover:text-ink"
        >
          Buka halaman atur sandi
        </a>
        <button
          type="button"
          onClick={tutup}
          className="font-mono text-kecil text-muted underline hover:text-ink"
        >
          Tutup
        </button>
      </div>
    </section>
  );
}

export function simpanTautanReset(tautan: string): void {
  try {
    sessionStorage.setItem(KUNCI, tautan);
  } catch {
    /* diabaikan */
  }
}
