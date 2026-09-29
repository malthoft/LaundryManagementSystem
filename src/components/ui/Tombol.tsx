import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

export type VarianTombol = "utama" | "sekunder" | "halus" | "bahaya";
export type KeadaanTombol = "normal" | "memuat" | "sukses" | "gagal";

const DASAR =
  "joyops-aksi inline-flex items-center justify-center gap-2 font-display font-bold rounded-sm border border-transparent select-none disabled:cursor-not-allowed disabled:opacity-55";

const VARIAN: Record<VarianTombol, string> = {
  utama: "bg-primary text-primary-fg hover:bg-primary-600",
  sekunder: "bg-surface text-ink border-line hover:bg-paper",
  halus: "bg-transparent text-ink-muted hover:bg-paper hover:text-ink",
  bahaya: "bg-danger text-danger-fg hover:opacity-90",
};

const UKURAN = {
  /* min-h-11 = 44px, target sentuh minimum di mobile. */
  sedang: "text-kecil px-4 py-2.5 min-h-11",
  kecil: "text-kecil px-3 py-2 min-h-11 sm:min-h-9",
} as const;

const IKON_KEADAAN: Record<KeadaanTombol, string | null> = {
  normal: null,
  memuat: "progress_activity",
  sukses: "check",
  gagal: "error",
};

const KELAS_KEADAAN: Record<KeadaanTombol, string> = {
  normal: "",
  memuat: "",
  sukses: "bg-ok text-primary-fg hover:bg-ok",
  gagal: "bg-danger text-danger-fg hover:bg-danger",
};

export interface TombolProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: VarianTombol;
  ukuran?: keyof typeof UKURAN;
  keadaan?: KeadaanTombol;
  ikon?: string;
  lebarPenuh?: boolean;
}

export function Tombol({
  varian = "utama",
  ukuran = "sedang",
  keadaan = "normal",
  ikon,
  lebarPenuh = false,
  className = "",
  disabled,
  children,
  ...sisa
}: TombolProps) {
  const namaIkon = IKON_KEADAAN[keadaan] ?? ikon;
  const sedangMemuat = keadaan === "memuat";

  return (
    <button
      {...sisa}
      disabled={disabled || sedangMemuat}
      aria-busy={sedangMemuat || undefined}
      className={[
        DASAR,
        VARIAN[varian],
        KELAS_KEADAAN[keadaan],
        UKURAN[ukuran],
        lebarPenuh ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {namaIkon ? (
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[1.15em] ${
            sedangMemuat ? "motion-safe:animate-spin" : ""
          }`}
        >
          {namaIkon}
        </span>
      ) : null}
      {children}
    </button>
  );
}

/**
 * Tautan yang tampil seperti tombol. Memakai `next/link` supaya perpindahan
 * halaman terjadi di sisi klien, bukan muat ulang penuh.
 */
export function TautanTombol({
  href,
  varian = "sekunder",
  ukuran = "sedang",
  ikon,
  className = "",
  children,
}: {
  href: string;
  varian?: VarianTombol;
  ukuran?: keyof typeof UKURAN;
  ikon?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[DASAR, VARIAN[varian], UKURAN[ukuran], className]
        .filter(Boolean)
        .join(" ")}
    >
      {ikon ? (
        <span aria-hidden="true" className="material-symbols-outlined text-[1.15em]">
          {ikon}
        </span>
      ) : null}
      {children}
    </Link>
  );
}
