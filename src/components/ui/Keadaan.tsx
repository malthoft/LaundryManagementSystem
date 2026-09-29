import type { ReactNode } from "react";

/**
 * Tiga keadaan data, dipakai di setiap tabel dan daftar.
 * Kosong mengajak bertindak, gagal menjelaskan dan memberi jalan keluar,
 * memuat memakai rangka seukuran isinya supaya tata letak tidak melompat.
 */

export function KeadaanKosong({
  ikon = "inbox",
  judul,
  keterangan,
  aksi,
}: {
  ikon?: string;
  judul: string;
  keterangan: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span aria-hidden="true" className="material-symbols-outlined text-ikon-besar text-ink-muted">
        {ikon}
      </span>
      <div className="max-w-md">
        <p className="font-display text-sedang font-bold text-ink">{judul}</p>
        <p className="mt-1 text-kecil text-ink-muted">{keterangan}</p>
      </div>
      {aksi ? <div className="mt-1">{aksi}</div> : null}
    </div>
  );
}

export function KeadaanGagal({
  pesan,
  aksi,
}: {
  pesan: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span aria-hidden="true" className="material-symbols-outlined text-ikon-besar text-danger">
        error
      </span>
      <div className="max-w-md">
        <p className="font-display text-sedang font-bold text-ink">Data gagal dimuat</p>
        <p className="mt-1 text-kecil text-ink-muted">{pesan}</p>
      </div>
      {aksi ? <div className="mt-1">{aksi}</div> : null}
    </div>
  );
}

/** Rangka memuat. `baris` menentukan tinggi perkiraan supaya tidak melompat. */
export function RangkaMuat({ baris = 4, kolom = 4 }: { baris?: number; kolom?: number }) {
  return (
    <div aria-hidden="true" className="w-full">
      <div className="border-b border-line px-4 py-3">
        <div className="skeleton h-3 w-1/4 rounded-sm bg-line" />
      </div>
      {Array.from({ length: baris }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-b-0">
          {Array.from({ length: kolom }).map((__, j) => (
            <div
              key={j}
              className="skeleton h-3.5 rounded-sm bg-line"
              style={{ width: j === 0 ? "28%" : `${Math.max(12, 20 - j * 2)}%` }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Memuat data</span>
    </div>
  );
}

/** Pemberitahuan hasil aksi. Tenang, tidak meriah, tidak menutupi konten. */
export function PesanHasil({
  jenis,
  children,
}: {
  jenis: "sukses" | "gagal" | "info";
  children: ReactNode;
}) {
  const nada = {
    sukses: "bg-ok-soft text-ok",
    gagal: "bg-danger-soft text-danger",
    info: "bg-primary-soft text-primary",
  }[jenis];

  const ikon = { sukses: "check_circle", gagal: "error", info: "info" }[jenis];

  return (
    <p
      role={jenis === "gagal" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-sm px-3 py-2.5 text-kecil font-medium ${nada}`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[1.15em]">
        {ikon}
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}
