"use client";

import { useActionState } from "react";
import { hapusPermintaanAction } from "@/controllers/developer.controller";

/**
 * Tombol hapus satu baris riwayat, atau seluruh riwayat bila id "semua".
 * Sengaja bukan tombol konfirmasi modal: satu klik menghapus, tapi hanya
 * menyentuh baris yang sudah diputuskan — permintaan yang masih menunggu
 * tidak bisa tersentuh dari sini.
 */
export function HapusRiwayat({
  id,
  semua = false,
}: {
  id: number | "semua";
  semua?: boolean;
}) {
  const [, kirim, jalan] = useActionState(hapusPermintaanAction, null);

  const kelas = semua
    ? "joyops-aksi inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-danger px-3 py-2 text-kecil font-semibold text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-55"
    : "joyops-aksi inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-2 text-kecil font-medium text-ink-muted hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-55";

  return (
    <form action={kirim}>
      <input type="hidden" name="id" value={String(id)} />
      <button type="submit" disabled={jalan} className={kelas}>
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[1.15em]"
        >
          {semua ? "delete_sweep" : "delete"}
        </span>
        <span>
          {jalan ? "Menghapus…" : semua ? "Hapus semua riwayat" : "Hapus"}
        </span>
      </button>
    </form>
  );
}
