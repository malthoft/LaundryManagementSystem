"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Durasi animasi keluar dalam milidetik. Harus sama dengan --dur-keluar di
 * globals.css. Dipakai sebagai penentu kapan toast benar-benar dilepas, bukan
 * lewat animationend, supaya tetap bekerja saat pemakai mematikan animasi.
 */
const DURASI_KELUAR = 160;

/**
 * Pemberitahuan hasil aksi yang melayang di atas halaman.
 *
 * Sengaja tidak memakai context atau penyimpanan global: komponen ini
 * dirender sebagai saudara `Modal`, bukan anaknya. Jadi setelah dialog
 * menutup, pesannya tetap terlihat. Setiap form sudah memegang state
 * hasilnya sendiri, tidak ada state baru yang perlu ditambahkan.
 *
 * `kunci` adalah hasil aksi itu sendiri. Ketika objeknya berganti (kiriman
 * berikutnya), toast tampil ulang dari awal. Kalau yang dipakai boolean
 * turunan, kiriman kedua dengan hasil sama tidak akan memicu apa pun.
 */
export function Toast({
  kunci,
  jenis = "sukses",
  pesan,
  durasi = 4000,
}: {
  kunci: unknown;
  jenis?: "sukses" | "gagal" | "info";
  pesan: string;
  durasi?: number;
}) {
  const [tampil, setTampil] = useState(true);
  const [keluar, setKeluar] = useState(false);
  const kunciSebelumnya = useRef(kunci);

  /* Hasil baru: tampilkan lagi dari awal, batalkan animasi keluar yang jalan. */
  useEffect(() => {
    if (kunciSebelumnya.current === kunci) return;
    kunciSebelumnya.current = kunci;
    setKeluar(false);
    setTampil(true);
  }, [kunci]);

  useEffect(() => {
    if (!tampil || durasi <= 0) return;
    const pewaktu = setTimeout(() => setKeluar(true), durasi);
    return () => clearTimeout(pewaktu);
  }, [tampil, durasi]);

  useEffect(() => {
    if (!keluar) return;
    const pewaktu = setTimeout(() => setTampil(false), DURASI_KELUAR);
    return () => clearTimeout(pewaktu);
  }, [keluar]);

  if (!tampil) return null;

  const nada = {
    sukses: "text-ok",
    gagal: "text-danger",
    info: "text-primary",
  }[jenis];

  const ikon = { sukses: "check_circle", gagal: "error", info: "info" }[jenis];

  return (
    /* Banner atas. Pembungkusnya selebar layar supaya mudah ditata, tapi tidak
       menangkap klik: hanya kartunya sendiri yang bisa ditekan. Top-nya diberi
       jarak sebesar tinggi bilah aplikasi supaya tidak menutupi navigasi. */
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(4.25rem,calc(env(safe-area-inset-top)+4.25rem))] sm:px-6 md:pl-[16.5rem]">
      <div
        role={jenis === "gagal" ? "alert" : "status"}
        aria-live={jenis === "gagal" ? "assertive" : "polite"}
        className={`pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-md border border-line bg-surface/95 px-3.5 py-3 shadow-menu backdrop-blur-sm ${
          keluar ? "toast-keluar" : "toast-masuk"
        }`}
      >
        <span aria-hidden="true" className={`material-symbols-outlined text-[1.15em] ${nada}`}>
          {ikon}
        </span>

        <p className="min-w-0 flex-1 text-kecil font-medium text-ink">{pesan}</p>

        <button
          type="button"
          onClick={() => setKeluar(true)}
          aria-label="Tutup pemberitahuan"
          className="joyops-aksi -mr-1.5 -my-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-ink-muted hover:bg-paper hover:text-ink"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[1.15em]">
            close
          </span>
        </button>
      </div>
    </div>
  );
}
