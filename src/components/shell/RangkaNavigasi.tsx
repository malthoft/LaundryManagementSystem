"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { LoncengNotifikasi } from "@/components/shell/LoncengNotifikasi";
import { MenuProfil } from "@/components/shell/MenuProfil";
import { SakelarTema } from "@/components/ui/SakelarTema";
import type { Notifikasi, Peran } from "@/types/db";

/**
 * Sidebar dan bilah atas. Keadaan menu di layar sempit hidup di sini karena
 * tombol pembukanya ada di bilah atas sedangkan panelnya di sidebar.
 *
 * Catatan penting: komponen ini sengaja TIDAK menerima `children`. Isi halaman
 * dirender oleh layout server sebagai saudara, bukan sebagai anak komponen
 * klien ini. Kalau isi halaman dilewatkan sebagai `children` ke komponen klien,
 * batas Suspense di dalam halaman tidak akan pernah terlihat isinya.
 */
export function RangkaNavigasi({
  nama,
  peran,
  username,
  notifikasi,
  jumlahBelumDibaca,
}: {
  nama: string;
  peran: Peran;
  username: string;
  notifikasi: Notifikasi[];
  jumlahBelumDibaca: number;
}) {
  const [menuBuka, setMenuBuka] = useState(false);

  return (
    <>
      <Sidebar peran={peran} terbuka={menuBuka} tutup={() => setMenuBuka(false)} />

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-paper/90 px-4 py-2 backdrop-blur sm:px-6 md:left-60">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuBuka(true)}
            aria-label="Buka navigasi"
            className="joyops-aksi flex h-11 w-11 items-center justify-center rounded-sm text-ink-muted hover:bg-paper hover:text-ink md:hidden"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              menu
            </span>
          </button>
          <span className="font-display text-sedang font-extrabold tracking-tight text-primary md:hidden">
            JoyOps
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <SakelarTema />
          <LoncengNotifikasi daftar={notifikasi} jumlah={jumlahBelumDibaca} />
          <MenuProfil nama={nama} peran={peran} username={username} />
        </div>
      </header>
    </>
  );
}
