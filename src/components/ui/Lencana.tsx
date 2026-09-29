import type { NadaStatus } from "@/lib/constants";

/**
 * Penanda status. Warnanya selalu datang dari peta nada di `constants.ts`,
 * supaya arti warna konsisten di seluruh aplikasi.
 */
export function Lencana({
  nada,
  children,
  ikon,
}: {
  nada: NadaStatus;
  children: React.ReactNode;
  ikon?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-mini font-semibold leading-none ${nada.soft} ${nada.kuat}`}
    >
      {ikon ? (
        <span aria-hidden="true" className="material-symbols-outlined text-[1.1em]">
          {nada.ikon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

/** Label netral untuk metadata: satuan, jumlah, tipe. */
export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-line px-2 py-1 text-mini font-medium leading-none text-ink-muted">
      {children}
    </span>
  );
}
