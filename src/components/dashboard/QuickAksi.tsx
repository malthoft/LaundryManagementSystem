"use client";

import Link from "next/link";

/**
 * Alur kerja harian, dibaca dari atas ke bawah sesuai urutan kerja kasir:
 * terima cucian, cuci, selesai, pelunasan.
 *
 * Setiap tahap hanya menampilkan angka. Angka dihitung di server dan
 * diteruskan apa adanya, jadi komponen ini tidak menarik data sendiri.
 */
const TAHAP = [
  { kunci: "diterima", label: "Diterima", ikon: "shopping_bag", warna: "text-primary" },
  { kunci: "dicuci", label: "Dicuci", ikon: "local_laundry_service", warna: "text-busy" },
  { kunci: "selesai", label: "Selesai", ikon: "check_circle", warna: "text-ok" },
  { kunci: "lunas", label: "Transaksi", ikon: "payments", warna: "text-ink" },
] as const;

export function AlurKerja({
  diterima,
  dicuci,
  selesai,
  lunas,
}: {
  diterima: number;
  dicuci: number;
  selesai: number;
  lunas: number;
}) {
  const jumlah = { diterima, dicuci, selesai, lunas };

  return (
    <section aria-labelledby="judul-alur" className="flex flex-col gap-2.5">
      <h2
        id="judul-alur"
        className="text-kecil font-bold uppercase tracking-wide text-ink-muted"
      >
        Alur hari ini
      </h2>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TAHAP.map((tahap) => (
          <li
            key={tahap.kunci}
            className="flex items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2.5"
          >
            <span
              aria-hidden="true"
              className={`material-symbols-outlined shrink-0 text-[1.25em] ${tahap.warna}`}
            >
              {tahap.ikon}
            </span>
            <span className="min-w-0">
              <span className="angka block text-sedang font-extrabold text-ink">
                {jumlah[tahap.kunci]}
              </span>
              <span className="block text-mikro text-ink-muted">{tahap.label}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Kartu aksi utama dashboard. "Order baru" adalah aksi paling sering, jadi ia
 * dibuat menonjol dan hanya ada di sini, bukan di menu sidebar.
 *
 * Tautan ini menuju /orders?aksi=baru, tempat form order dengan datanya
 * sudah dimuat. Jadi dashboard tidak perlu menarik data mesin, layanan, dan
 * add-on hanya untuk menyiapkan modal yang belum tentu dibuka.
 */
export function QuickAksi({ admin }: { admin: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/orders?aksi=baru"
        className="joyops-aksi flex flex-col items-start gap-3 rounded-lg border border-primary bg-primary-soft px-4 py-4 hover:border-primary-600 hover:bg-primary-soft/70 sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="material-symbols-outlined shrink-0 text-[1.75em] text-primary"
          >
            add_shopping_cart
          </span>
          <span className="min-w-0">
            <span className="block text-sedang font-extrabold text-ink">
              Order baru masuk
            </span>
            <span className="block text-kecil text-ink-muted">
              Catat cucian pelanggan, pilih mesin, hitung total, langsung simpan.
            </span>
          </span>
        </span>
        <span className="joyops-aksi inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-kecil font-bold text-primary-fg hover:bg-primary-600">
          <span aria-hidden="true" className="material-symbols-outlined text-[1.15em]">
            add
          </span>
          Buat order
        </span>
      </Link>

      <div className="flex flex-wrap gap-2">
        <TautanCepat href="/orders#papan-timer" ikon="timer">
          Cucian berjalan
        </TautanCepat>
        <TautanCepat href="/machines" ikon="local_laundry_service">
          Mesin kosong
        </TautanCepat>
        {admin ? (
          <TautanCepat href="/finance" ikon="payments">
            Buku kas
          </TautanCepat>
        ) : (
          <TautanCepat href="/my-shift" ikon="schedule">
            Shift saya
          </TautanCepat>
        )}
      </div>
    </div>
  );
}

function TautanCepat({
  href,
  ikon,
  children,
}: {
  href: string;
  ikon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="joyops-aksi flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-kecil font-medium text-ink hover:border-primary hover:bg-paper"
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[1.15em] text-ink-muted"
      >
        {ikon}
      </span>
      {children}
    </Link>
  );
}
