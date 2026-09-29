import type { ReactNode } from "react";

/**
 * Angka pokok satu layar. Ini focal point-nya: angka besar dan tegas,
 * label kecil dan tenang. Lihat DESIGN.md.
 */
export function AngkaPokok({
  label,
  nilai,
  ikon,
  nada = "text-ink",
  keterangan,
  aksi,
}: {
  label: string;
  nilai: string;
  ikon?: string;
  nada?: string;
  keterangan?: ReactNode;
  aksi?: ReactNode;
}) {
  return (
    <div className="bg-surface border border-line rounded-md p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-kecil font-medium text-ink-muted">
          {label}
        </p>
        {ikon ? (
          <span aria-hidden="true" className={`material-symbols-outlined text-[1.35em] ${nada}`}>
            {ikon}
          </span>
        ) : null}
      </div>
      <p className={`angka mt-2 text-2xl font-extrabold sm:text-3xl ${nada}`}>{nilai}</p>
      {keterangan ? (
        <div className="mt-1 text-kecil text-ink-muted">{keterangan}</div>
      ) : null}
      {aksi ? <div className="mt-3">{aksi}</div> : null}
    </div>
  );
}

/** Batang proporsi. Dipakai untuk ringkasan mesin: bagian terhadap total. */
export function BatangProporsi({
  nilai,
  total,
  kelasWarna,
  label,
}: {
  nilai: number;
  total: number;
  kelasWarna: string;
  label: string;
}) {
  const persen = total > 0 ? Math.round((nilai / total) * 100) : 0;

  return (
    <div
      role="img"
      aria-label={`${label}: ${nilai} dari ${total} mesin, ${persen} persen`}
      className="h-1.5 w-full overflow-hidden rounded-sm bg-line"
    >
      <div className={`h-full ${kelasWarna}`} style={{ width: `${persen}%` }} />
    </div>
  );
}
