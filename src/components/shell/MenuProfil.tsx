"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { keluar } from "@/controllers/auth.controller";
import { inisial } from "@/lib/format";
import type { Peran } from "@/types/db";

const TAUTAN = [
  { href: "/settings", label: "Pengaturan", ikon: "settings" },
  { href: "/guide", label: "Panduan", ikon: "menu_book" },
];

/** Durasi animasi keluar dalam ms. Harus sama dengan --dur-keluar di globals.css. */
const DURASI_KELUAR = 160;

export function MenuProfil({
  nama,
  peran,
  username,
}: {
  nama: string;
  peran: Peran;
  username: string;
}) {
  const [buka, setBuka] = useState(false);
  /* Menutup dipisah dari buka supaya animasi keluar sempat jalan. Kalau buka
     langsung false, menu hilang seketika dan tidak ada yang teranimasi. */
  const [menutup, setMenutup] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);

  function tutup() {
    setMenutup(true);
  }

  useEffect(() => {
    if (buka) setMenutup(false);
  }, [buka]);

  useEffect(() => {
    if (!menutup) return;
    const pewaktu = setTimeout(() => {
      setBuka(false);
      setMenutup(false);
    }, DURASI_KELUAR);
    return () => clearTimeout(pewaktu);
  }, [menutup]);

  /* Klik di luar dan Escape menutup menu. Escape penting untuk pemakai keyboard. */
  useEffect(() => {
    if (!buka) return;

    function saatKlik(peristiwa: MouseEvent) {
      if (!wadah.current?.contains(peristiwa.target as Node)) tutup();
    }
    function saatTombol(peristiwa: KeyboardEvent) {
      if (peristiwa.key === "Escape") tutup();
    }

    document.addEventListener("mousedown", saatKlik);
    document.addEventListener("keydown", saatTombol);
    return () => {
      document.removeEventListener("mousedown", saatKlik);
      document.removeEventListener("keydown", saatTombol);
    };
  }, [buka]);

  return (
    <div ref={wadah} className="relative">
      <button
        type="button"
        onClick={() => setBuka((nilai) => !nilai)}
        aria-expanded={buka}
        aria-haspopup="menu"
        className={`joyops-aksi flex min-h-11 items-center gap-2.5 rounded-md border py-1 pl-1 pr-1.5 transition-colors ${
          buka
            ? "border-primary bg-paper shadow-menu"
            : "border-line bg-surface hover:border-primary hover:bg-paper"
        }`}
      >
        <span className="hidden text-right sm:block">
          <span className="block max-w-40 truncate text-kecil font-bold text-ink">
            {nama}
          </span>
          <span className="block text-mikro text-ink-muted">{peran}</span>
        </span>
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary font-display text-kecil font-bold text-primary-fg"
        >
          {inisial(nama)}
        </span>
        {/* Caret: penanda bahwa area ini membuka daftar, bukan tombol aksi. */}
        <span
          aria-hidden="true"
          className={`material-symbols-outlined shrink-0 text-[1.1em] text-ink-muted transition-transform ${
            buka ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
        <span className="sr-only">Menu akun {username}</span>
      </button>

      {buka ? (
        <div
          role="menu"
          className={`absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-surface shadow-menu ${
            menutup ? "menu-keluar" : "menu-masuk"
          }`}
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-kecil font-bold text-ink">{nama}</p>
            <p className="truncate text-mikro text-ink-muted">
              @{username} · {peran}
            </p>
          </div>

          <div className="py-1">
            {TAUTAN.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setBuka(false)}
                className="joyops-aksi flex min-h-11 items-center gap-3 px-4 text-kecil text-ink hover:bg-paper"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[1.15em] text-ink-muted">
                  {item.ikon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>

          <form action={keluar} className="border-t border-line py-1">
            <button
              type="submit"
              role="menuitem"
              className="joyops-aksi flex min-h-11 w-full items-center gap-3 px-4 text-kecil font-semibold text-danger hover:bg-danger-soft"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[1.15em]">
                logout
              </span>
              Keluar
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
