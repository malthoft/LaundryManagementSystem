"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { keluar } from "@/controllers/auth.controller";
import { inisial } from "@/lib/format";
import { IonIcon } from "@/components/ui/IonIcon";
import type { Peran } from "@/types/db";

const TAUTAN = [
  { href: "/settings", label: "Pengaturan Akun", sub: "Profil & kata sandi", ikon: "settings-outline" },
  { href: "/guide", label: "Panduan Sistem", sub: "Alur kerja & penggunaan", ikon: "book-outline" },
];

const DURASI_KELUAR = 160;

/**
 * Tombol profil sudut kanan atas dengan affordance klik yang jelas,
 * badge peran, avatar inisial, dan ikon dropdown dari Ionicons.
 */
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

  const adalahAdmin = peran === "Admin";

  return (
    <div ref={wadah} className="relative">
      {/* Tombol Profil Interaktif dengan Affordance Klik Nyata */}
      <button
        type="button"
        onClick={() => setBuka((nilai) => !nilai)}
        aria-expanded={buka}
        aria-haspopup="menu"
        title="Menu Profil Pengguna (Klik untuk opsi)"
        className={`group joyops-aksi relative flex min-h-11 items-center gap-2.5 rounded-xl border px-2 py-1.5 transition-all duration-150 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-[0.98] ${
          buka
            ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
            : "border-line bg-surface hover:border-primary/60 hover:bg-paper hover:shadow-xs"
        }`}
      >
        {/* Avatar Inisial Bulat */}
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full font-display text-kecil font-extrabold text-white shadow-xs ring-2 ${
            adalahAdmin ? "bg-primary ring-primary/20" : "bg-ink ring-line"
          }`}
        >
          {inisial(nama)}
        </span>

        {/* Teks Identitas (Nama & Badge Peran) */}
        <div className="hidden text-left sm:block">
          <span className="block max-w-[130px] truncate text-kecil font-bold text-ink leading-tight group-hover:text-primary transition-colors">
            {nama}
          </span>
          <div className="mt-0.5 flex items-center gap-1">
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.2 text-nano font-bold uppercase tracking-wider ${
                adalahAdmin
                  ? "bg-primary/15 text-primary"
                  : "bg-paper text-ink-muted border border-line"
              }`}
            >
              {peran}
            </span>
          </div>
        </div>

        {/* Indikator Caret / Chevron Ionicons yang Berputar */}
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${
            buka
              ? "rotate-180 bg-primary/20 text-primary"
              : "bg-paper text-ink-muted group-hover:bg-primary/10 group-hover:text-primary"
          }`}
        >
          <IonIcon name="chevron-down-outline" size={14} />
        </span>

        <span className="sr-only">Menu akun {username}</span>
      </button>

      {/* Dropdown Menu Pengguna */}
      {buka ? (
        <div
          role="menu"
          className={`absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-menu backdrop-blur-md ${
            menutup ? "menu-keluar" : "menu-masuk"
          }`}
        >
          {/* Header Identitas Akun */}
          <div className="border-b border-line bg-paper/50 p-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sedang font-extrabold text-white shadow-xs ${
                  adalahAdmin ? "bg-primary" : "bg-ink"
                }`}
              >
                {inisial(nama)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-kecil font-bold text-ink">{nama}</p>
                <p className="truncate text-mikro text-ink-muted">@{username}</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-nano font-bold uppercase tracking-wider ${
                    adalahAdmin
                      ? "bg-primary/15 text-primary"
                      : "bg-paper text-ink-muted border border-line"
                  }`}
                >
                  {peran}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Navigasi Pengguna */}
          <div className="p-1.5 divide-y divide-line/40">
            <div className="space-y-0.5 pb-1">
              {TAUTAN.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setBuka(false)}
                  className="joyops-aksi group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-kecil text-ink hover:bg-paper hover:text-primary transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper text-ink-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <IonIcon name={item.ikon} size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink group-hover:text-primary leading-tight">
                      {item.label}
                    </p>
                    <p className="text-mikro text-ink-muted leading-tight">{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Tombol Logout */}
            <form action={keluar} className="pt-1">
              <button
                type="submit"
                role="menuitem"
                className="joyops-aksi group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-kecil font-semibold text-danger hover:bg-danger-soft transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-soft text-danger group-hover:bg-danger group-hover:text-white transition-colors">
                  <IonIcon name="log-out-outline" size={18} />
                </span>
                <div className="min-w-0 text-left">
                  <p className="font-bold leading-tight">Keluar</p>
                  <p className="text-mikro text-danger/80 leading-tight">Akhiri sesi di perangkat ini</p>
                </div>
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
