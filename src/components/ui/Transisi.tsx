"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Menahan elemen mengambang tetap terpasang selama animasi keluarnya, supaya
 * panel tidak menghilang mendadak. Dipakai bersama kelas `.panel-masuk` dan
 * `.panel-keluar` dari globals.css.
 *
 * Tanpa ini, panel yang ditutup akan hilang seketika karena React melepasnya
 * dari DOM pada render berikutnya.
 */
export function useTampilDenganKeluar(buka: boolean, durasiKeluar = 160) {
  const [tampil, setTampil] = useState(buka);
  const [sedangKeluar, setSedangKeluar] = useState(false);
  const sebelumnya = useRef(buka);

  useEffect(() => {
    const tadinyaTerbuka = sebelumnya.current;
    sebelumnya.current = buka;

    if (buka) {
      setTampil(true);
      setSedangKeluar(false);
      return;
    }

    if (!tadinyaTerbuka) return;

    setSedangKeluar(true);
    const pewaktu = setTimeout(() => {
      setTampil(false);
      setSedangKeluar(false);
    }, durasiKeluar);

    return () => clearTimeout(pewaktu);
  }, [buka, durasiKeluar]);

  return {
    tampil,
    kelas: sedangKeluar ? "panel-keluar" : "panel-masuk",
  };
}
