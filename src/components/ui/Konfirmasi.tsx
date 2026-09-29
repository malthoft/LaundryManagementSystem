"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Tombol, type VarianTombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import type { AksiForm } from "@/lib/aksi";

/**
 * Konfirmasi untuk aksi yang tidak bisa dibatalkan. Dialog memakai <dialog>
 * bawaan peramban, jadi Escape dan perangkap fokus sudah benar.
 */
export function Konfirmasi<T>({
  label,
  ikon,
  varian = "sekunder",
  judul,
  pesan,
  labelYa,
  aksi,
  muatan,
  pesanSukses = "Aksi berhasil dijalankan",
}: {
  label: string;
  ikon?: string;
  varian?: VarianTombol;
  judul: string;
  pesan: string;
  labelYa: string;
  aksi: AksiForm<T>;
  muatan: Record<string, string | number>;
  pesanSukses?: string;
}) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(aksi, null);

  /* Aksi berhasil: dialog ditutup supaya pemakai melihat hasilnya di halaman.
     Bergantung pada objek `hasil`, bukan boolean turunannya: setiap kiriman
     menghasilkan objek baru, jadi dialog tetap menutup walau keluarganya sama. */
  useEffect(() => {
    if (hasil?.ok) setBuka(false);
  }, [hasil]);

  return (
    <>
      <Tombol
        type="button"
        varian={varian}
        ukuran="kecil"
        ikon={ikon}
        onClick={() => setBuka(true)}
      >
        {label}
      </Tombol>

      <Modal buka={buka} tutup={() => setBuka(false)} judul={judul} lebar="kecil">
        <p className="text-kecil text-ink-muted">{pesan}</p>

        {hasil && !hasil.ok ? (
          <div className="mt-4">
            <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
          </div>
        ) : null}

        <form action={kirim} className="mt-5 flex flex-wrap justify-end gap-2">
          {Object.entries(muatan).map(([nama, nilai]) => (
            <input key={nama} type="hidden" name={nama} value={nilai} />
          ))}
          <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
            Batal
          </Tombol>
          <Tombol
            type="submit"
            varian="bahaya"
            keadaan={sedangKirim ? "memuat" : "normal"}
          >
            {labelYa}
          </Tombol>
        </form>
      </Modal>

      {/* Pesan sukses tetap terlihat setelah dialog menutup. */}
      {hasil?.ok ? <Toast kunci={hasil} pesan={pesanSukses} /> : null}
    </>
  );
}
