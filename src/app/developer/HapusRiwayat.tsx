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

  return (
    <form action={kirim}>
      <input type="hidden" name="id" value={String(id)} />
      <button
        type="submit"
        disabled={jalan}
        className={
          semua
            ? "rounded-md border border-dang/40 px-3 py-1.5 font-mono text-kecil text-dang hover:bg-dang/10 disabled:opacity-50"
            : "rounded-md px-2 py-1 font-mono text-kecil text-muted hover:bg-hov hover:text-dang disabled:opacity-50"
        }
      >
        {jalan ? "Menghapus..." : semua ? "Hapus semua riwayat" : "Hapus"}
      </button>
    </form>
  );
}
