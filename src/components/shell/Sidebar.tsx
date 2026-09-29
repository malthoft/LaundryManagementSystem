"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navUntuk, KELOMPOK_MENU } from "@/lib/constants";
import type { Peran } from "@/types/db";

/**
 * Navigasi utama. Satu-satunya tempat daftar menu ditulis, supaya tidak
 * terulang di tiap halaman seperti versi lama.
 */
export function Sidebar({
  peran,
  terbuka,
  tutup,
}: {
  peran: Peran;
  terbuka: boolean;
  tutup: () => void;
}) {
  const jalur = usePathname();

  return (
    <>
      {/* Lapisan gelap hanya ada di layar sempit. */}
      <div
        aria-hidden="true"
        onClick={tutup}
        className={`fixed inset-0 z-40 bg-ink/45 transition-opacity duration-200 md:hidden ${
          terbuka ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-sidebar transition-transform duration-200 md:translate-x-0 ${
          terbuka ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <Link href="/dashboard" onClick={tutup} className="min-w-0">
            <span className="block font-display text-xl font-extrabold leading-none tracking-tight text-primary">
              JoyOps
            </span>
            <span className="mt-1 block text-mikro font-medium text-ink-muted">
              {peran === "Admin" ? "Portal Admin" : "Portal Karyawan"}
            </span>
          </Link>
          <button
            type="button"
            onClick={tutup}
            aria-label="Tutup navigasi"
            className="joyops-aksi flex h-11 w-11 items-center justify-center rounded-sm text-ink-muted hover:bg-paper md:hidden"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        {/* Menu dipisah dua kelompok: operasional lapangan, lalu kendali.
            Pemisahan ini supaya staf lapangan tidak perlu menggulir melewati
            menu keuangan dan pengaturan untuk mencapai "Absen". */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
          {KELOMPOK_MENU.map((kelompok) => {
            const isi = navUntuk(peran, kelompok.kunci);
            if (isi.length === 0) return null;

            return (
              <div key={kelompok.kunci} className="flex flex-col gap-0.5">
                <p className="px-3 pb-1 pt-2 text-mikro font-bold uppercase tracking-wide text-ink-muted">
                  {kelompok.judul}
                </p>
                {isi.map((item) => {
                  const aktif =
                    jalur === item.href || jalur.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={tutup}
                      aria-current={aktif ? "page" : undefined}
                      className={`joyops-aksi flex min-h-11 items-center gap-3 rounded-sm px-3 text-kecil ${
                        aktif
                          ? "bg-surface font-bold text-primary"
                          : "font-medium text-ink-muted hover:bg-paper hover:text-ink"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`material-symbols-outlined text-[1.25em] ${
                          aktif ? "ms-aktif" : ""
                        }`}
                      >
                        {item.ikon}
                      </span>
                      <span className="min-w-0 truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
