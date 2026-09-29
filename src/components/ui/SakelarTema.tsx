"use client";

import { useEffect, useState } from "react";

const KUNCI = "joyops-tema";

/**
 * Sakelar tema terang/gelap. Pilihan disimpan di localStorage dan dipasang
 * ulang oleh skrip kecil di layout sebelum halaman dirender, jadi tidak
 * berkedip. Kedua mode harus tetap benar, lihat R-34 di antislop.
 */
export function SakelarTema() {
  const [gelap, setGelap] = useState(false);

  useEffect(() => {
    setGelap(document.documentElement.classList.contains("dark"));
  }, []);

  function alihkan() {
    const berikutnya = !gelap;
    setGelap(berikutnya);
    document.documentElement.classList.toggle("dark", berikutnya);
    try {
      localStorage.setItem(KUNCI, berikutnya ? "gelap" : "terang");
    } catch {
      /* Mode privat memblokir localStorage. Tema tetap berlaku untuk sesi ini. */
    }
  }

  return (
    <button
      type="button"
      onClick={alihkan}
      aria-pressed={gelap}
      className="joyops-aksi flex h-11 w-11 items-center justify-center rounded-sm text-ink-muted hover:bg-paper hover:text-ink"
    >
      <span aria-hidden="true" className="material-symbols-outlined">
        {gelap ? "light_mode" : "dark_mode"}
      </span>
      <span className="sr-only">
        {gelap ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      </span>
    </button>
  );
}
