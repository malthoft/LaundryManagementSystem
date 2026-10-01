"use client";

import Link from "next/link";
import { IonIcon } from "@/components/ui/IonIcon";

/**
 * Alur kerja harian, dibaca dari kiri ke kanan sesuai urutan kerja kasir:
 * terima cucian, cuci/keringkan, selesai, pelunasan.
 */
const TAHAP = [
  { kunci: "diterima", label: "Cucian Masuk", ikon: "shirt-outline", warna: "text-primary bg-primary/10" },
  { kunci: "dicuci", label: "Sedang Dicuci", ikon: "hardware-chip-outline", warna: "text-busy bg-busy/10" },
  { kunci: "selesai", label: "Cucian Selesai", ikon: "checkmark-circle", warna: "text-ok bg-ok/10" },
  { kunci: "lunas", label: "Transaksi Kas", ikon: "wallet-outline", warna: "text-ink bg-paper" },
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
        className="text-mikro font-bold uppercase tracking-wider text-ink-muted"
      >
        Ringkasan Alur Operasional Hari Ini
      </h2>
      <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {TAHAP.map((tahap) => (
          <li
            key={tahap.kunci}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-xs"
          >
            <span
              aria-hidden="true"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tahap.warna}`}
            >
              <IonIcon name={tahap.ikon} size={20} />
            </span>
            <span className="min-w-0">
              <span className="angka block text-sedang font-extrabold text-ink leading-tight">
                {jumlah[tahap.kunci]}
              </span>
              <span className="block text-mikro font-medium text-ink-muted truncate">
                {tahap.label}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Kartu aksi utama dashboard: "Buat Order Baru" dibuat menonjol dengan
 * tombol cepat menuju timer cucian, mesin kosong, dan buku kas.
 */
export function QuickAksi({ admin }: { admin: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/orders?aksi=baru"
        prefetch={true}
        className="joyops-aksi group flex flex-col items-start gap-3 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary-soft to-surface p-5 shadow-xs hover:border-primary hover:shadow-md transition-all sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-sm group-hover:scale-105 transition-transform"
          >
            <IonIcon name="shirt-outline" size={26} />
          </span>
          <div className="min-w-0">
            <span className="block text-sedang font-extrabold text-ink group-hover:text-primary transition-colors">
              Penerimaan Cucian Baru (Kasir)
            </span>
            <span className="block text-kecil text-ink-muted">
              Pilih mesin cuci &amp; pengering tersedia, hitung tarif, dan periksa kwitansi.
            </span>
          </div>
        </div>

        <span className="joyops-aksi inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 text-kecil font-bold text-primary-fg shadow-sm hover:bg-primary-600">
          <IonIcon name="add-outline" size={18} />
          <span>Buat Order Kasir</span>
        </span>
      </Link>

      <div className="flex flex-wrap gap-2">
        <TautanCepat href="/orders#papan-timer" ikon="time-outline">
          Timer Cucian Berjalan
        </TautanCepat>
        <TautanCepat href="/machines" ikon="hardware-chip-outline">
          Ketersediaan Unit Mesin
        </TautanCepat>
        {admin ? (
          <TautanCepat href="/finance" ikon="wallet-outline">
            Buku Kas &amp; Keuangan
          </TautanCepat>
        ) : (
          <TautanCepat href="/my-shift" ikon="calendar-outline">
            Jadwal Shift Saya
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
      prefetch={true}
      className="joyops-aksi flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 text-kecil font-semibold text-ink hover:border-primary/60 hover:bg-paper hover:text-primary transition-colors shadow-xs"
    >
      <span className="text-ink-muted group-hover:text-primary">
        <IonIcon name={ikon} size={16} />
      </span>
      <span>{children}</span>
    </Link>
  );
}
