"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Durasi animasi keluar dalam milidetik. Harus sama dengan --dur-keluar di
 * globals.css. Dipakai sebagai penentu kapan dialog benar-benar ditutup,
 * bukan lewat animationend, supaya tetap bekerja saat pemakai mematikan
 * animasi (prefers-reduced-motion). Kalau animasi dimatikan, animationend
 * tidak pernah menyala dan dialog akan menggantung.
 */
const DURASI_KELUAR = 160;

/**
 * Dialog memakai elemen `<dialog>` bawaan peramban: perangkap fokus dan
 * pengembalian fokus ke pemicu sudah ditangani peramban.
 *
 * Yang ditambahkan di sini:
 * - Selalu di tengah layar, tingginya dibatasi supaya tidak melimpah di layar
 *   pendek dan tidak memaksa halaman ikut menggeser.
 * - Latar digelapkan dan diburamkan.
 * - Muncul dan hilang dengan skala dan kelegapan memakai kurva yang mengendur.
 * - Bisa ditutup dengan Escape maupun klik di luar kotak.
 */
export function Modal({
  buka,
  tutup,
  judul,
  keterangan,
  lebar = "sedang",
  children,
}: {
  buka: boolean;
  tutup: () => void;
  judul: string;
  keterangan?: string;
  lebar?: "kecil" | "sedang" | "besar";
  children: ReactNode;
}) {
  const acuan = useRef<HTMLDialogElement>(null);
  const [fase, setFase] = useState<"diam" | "masuk" | "keluar">("diam");
  /*
   * ID unik per instance. Isi <dialog> selalu ada di DOM walau dialognya
   * tertutup, jadi ID tetap akan kembar kalau satu halaman memuat beberapa
   * modal. ID kembar membuat aria-labelledby menunjuk judul yang salah.
   */
  const idJudul = useId();

  useEffect(() => {
    const elemen = acuan.current;
    if (!elemen) return;

    if (buka) {
      if (!elemen.open) elemen.showModal();
      setFase("masuk");
      return;
    }

    if (elemen.open) setFase("keluar");
  }, [buka]);

  useEffect(() => {
    if (fase !== "keluar") return;

    const pewaktu = setTimeout(() => {
      const elemen = acuan.current;
      if (elemen?.open) elemen.close();
      setFase("diam");
    }, DURASI_KELUAR);

    return () => clearTimeout(pewaktu);
  }, [fase]);

  const lebarKelas = {
    kecil: "max-w-sm",
    sedang: "max-w-xl",
    besar: "max-w-3xl",
  }[lebar];

  return (
    <dialog
      ref={acuan}
      aria-labelledby={idJudul}
      /* Escape: event cancel dicegah dulu supaya animasi keluar sempat jalan.
         Tanpa preventDefault, peramban menutup dialog seketika. */
      onCancel={(peristiwa) => {
        peristiwa.preventDefault();
        tutup();
      }}
      /* Klik di luar kotak: pada dialog modal, klik latar menargetkan elemen
         dialog itu sendiri, bukan isinya. */
      onClick={(peristiwa) => {
        if (peristiwa.target === acuan.current) tutup();
      }}
      className={`m-auto max-h-[85dvh] w-[calc(100vw-2rem)] ${lebarKelas} rounded-lg border border-line bg-surface p-0 text-ink shadow-menu backdrop:bg-ink/45 backdrop:backdrop-blur-[2px] ${
        fase === "masuk" ? "panel-masuk" : fase === "keluar" ? "panel-keluar" : ""
      }`}
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={idJudul} className="text-sedang font-bold text-ink">
              {judul}
            </h2>
            {keterangan ? (
              <p className="mt-1 text-kecil text-ink-muted">{keterangan}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={tutup}
            aria-label="Tutup dialog"
            className="joyops-aksi -mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-ink-muted hover:bg-paper hover:text-ink"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </dialog>
  );
}
