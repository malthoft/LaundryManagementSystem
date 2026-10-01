"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navUntuk, KELOMPOK_MENU } from "@/lib/constants";
import { IonIcon } from "@/components/ui/IonIcon";
import type { Peran } from "@/types/db";

/**
 * Navigasi utama dengan ikon Ionicons, tautan ter-prefetch untuk navigasi cepat,
 * dan tata letak operasional yang intuitif bagi staf dan pemilik toko.
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
        className={`fixed inset-0 z-40 bg-ink/45 backdrop-blur-xs transition-opacity duration-200 md:hidden ${
          terbuka ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-sidebar transition-transform duration-200 md:translate-x-0 ${
          terbuka ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-line/40">
          <Link href="/dashboard" prefetch={true} onClick={tutup} className="min-w-0 group">
            <span className="block font-display text-xl font-extrabold leading-none tracking-tight text-primary group-hover:text-primary-600 transition-colors">
              JoyOps
            </span>
            <span className="mt-1 block text-mikro font-medium text-ink-muted">
              {peran === "Admin" ? "Portal Manajer / Pemilik" : "Portal Kasir / Operator"}
            </span>
          </Link>
          <button
            type="button"
            onClick={tutup}
            aria-label="Tutup navigasi"
            className="joyops-aksi flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted hover:bg-paper md:hidden"
          >
            <IonIcon name="close-outline" size={22} />
          </button>
        </div>

        {/* Menu navigasi berkecepatan tinggi */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-3">
          {KELOMPOK_MENU.map((kelompok) => {
            const isi = navUntuk(peran, kelompok.kunci);
            if (isi.length === 0) return null;

            return (
              <div key={kelompok.kunci} className="flex flex-col gap-0.5">
                <p className="px-3 pb-1 pt-1.5 text-mikro font-bold uppercase tracking-wider text-ink-muted">
                  {kelompok.judul}
                </p>
                {isi.map((item) => {
                  const aktif =
                    jalur === item.href || jalur.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={tutup}
                      aria-current={aktif ? "page" : undefined}
                      className={`joyops-aksi flex min-h-11 items-center gap-3 rounded-lg px-3 text-kecil transition-colors ${
                        aktif
                          ? "bg-surface font-bold text-primary shadow-xs ring-1 ring-line/60"
                          : "font-medium text-ink-muted hover:bg-paper hover:text-ink"
                      }`}
                    >
                      <span className={`shrink-0 transition-colors ${aktif ? "text-primary" : "text-ink-muted"}`}>
                        <IonIcon name={item.ikon} size={18} />
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
