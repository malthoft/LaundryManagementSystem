"use client";

import { useEffect, useState } from "react";
import { Tombol } from "@/components/ui/Tombol";

const KUNCI = "joyops.tautan.reset";

/**
 * Menampilkan tautan atur ulang terakhir yang diterbitkan.
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
    <section className="mt-6 rounded-md border border-primary bg-primary-soft p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            aria-hidden="true"
            className="material-symbols-outlined mt-0.5 text-[1.4rem] text-primary"
          >
            link
          </span>
          <div className="min-w-0">
            <p className="font-display text-kecil font-bold text-ink">
              Tautan atur ulang sandi sedang aktif
            </p>
            <p className="mt-0.5 text-kecil text-ink-muted">
              Berlaku 30 menit dan hanya bisa dipakai satu kali.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={tutup}
          className="joyops-aksi inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2.5 py-2 text-kecil font-medium text-ink-muted hover:bg-surface hover:text-ink sm:min-h-9"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[1.15em]"
          >
            close
          </span>
          <span>Tutup</span>
        </button>
      </div>

      <p className="mt-3 break-all rounded-sm border border-line bg-surface px-3 py-2.5 font-numeric text-kecil text-ink">
        {tautan}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Tombol
          type="button"
          varian="utama"
          ukuran="kecil"
          ikon={tersalin ? "check" : "content_copy"}
          onClick={salin}
        >
          {tersalin ? "Tersalin" : "Salin tautan"}
        </Tombol>
        <a
          href={tautan}
          target="_blank"
          rel="noreferrer"
          className="joyops-aksi inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-2 text-kecil font-semibold text-ink hover:bg-paper sm:min-h-9"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[1.15em]"
          >
            open_in_new
          </span>
          <span>Buka halaman</span>
        </a>
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
