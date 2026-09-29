import type { ReactNode } from "react";

/** Permukaan kerja. Garis sebagai batas, bukan bayangan. */
export function Kartu({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`bg-surface border border-line rounded-md ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * Judul + aksi satu kartu. Dipakai berulang supaya ritme antar halaman sama.
 * `aksi` diisi kontrol, bukan teks penjelasan.
 */
export function KepalaKartu({
  judul,
  ikon,
  aksi,
  keterangan,
}: {
  judul: string;
  ikon?: string;
  aksi?: ReactNode;
  keterangan?: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 border-b border-line sm:px-5">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sedang font-bold text-ink">
          {ikon ? (
            <span aria-hidden="true" className="material-symbols-outlined text-[1.25em] text-ink-muted">
              {ikon}
            </span>
          ) : null}
          <span className="min-w-0 break-words">{judul}</span>
        </h2>
        {keterangan ? (
          <p className="mt-1 text-kecil text-ink-muted">{keterangan}</p>
        ) : null}
      </div>
      {aksi ? <div className="flex shrink-0 flex-wrap items-center gap-2">{aksi}</div> : null}
    </header>
  );
}

export function IsiKartu({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}

/** Judul halaman. Kecil dan tenang: angka di bawahnya yang jadi sorotan. */
export function JudulHalaman({
  judul,
  keterangan,
}: {
  judul: string;
  keterangan?: string;
}) {
  return (
    <div className="min-w-0">
      <h1 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
        {judul}
      </h1>
      {keterangan ? (
        <p className="mt-0.5 text-kecil text-ink-muted">{keterangan}</p>
      ) : null}
    </div>
  );
}
