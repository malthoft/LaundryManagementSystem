"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Kolom, Pilihan } from "@/components/ui/Kolom";
import { Tombol, type VarianTombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { simpanMesinAction } from "@/controllers/machine.controller";
import type { Mesin } from "@/types/db";

/**
 * Satu komponen untuk menambah dan mengubah mesin. Bedanya hanya data awal,
 * jadi tidak perlu dua form yang isinya sama.
 */
export function FormMesin({
  mesin,
  label,
  ikon = "add",
  varian = "utama",
  ukuran = "sedang",
}: {
  mesin?: Mesin;
  label: string;
  ikon?: string;
  varian?: VarianTombol;
  ukuran?: "sedang" | "kecil";
}) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(simpanMesinAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;
  /* Bergantung pada objek `hasil`, bukan boolean turunannya: setiap kiriman
     menghasilkan objek baru, jadi dialog tetap menutup walau keluarganya sama. */
  useEffect(() => {
    if (hasil?.ok) setBuka(false);
  }, [hasil]);

  const mengubah = Boolean(mesin);

  return (
    <>
      <Tombol
        type="button"
        varian={varian}
        ikon={ikon}
        ukuran={ukuran}
        onClick={() => setBuka(true)}
      >
        {label}
      </Tombol>

      <Modal
        buka={buka}
        tutup={() => setBuka(false)}
        judul={mengubah ? `Ubah mesin ${mesin?.machine_code}` : "Tambah mesin"}
        keterangan="Kode mesin menentukan jenisnya: WM untuk mesin cuci, DM untuk mesin pengering."
      >
        <form action={kirim} className="flex flex-col gap-4">
          {hasil && !hasil.ok && !galat ? (
            <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
          ) : null}

          {mesin ? <input type="hidden" name="id" value={mesin.id} /> : null}

          <Kolom
            label="Kode mesin"
            name="kode"
            required
            autoFocus
            defaultValue={mesin?.machine_code ?? ""}
            placeholder="WM-01"
            galat={galat?.kode}
            petunjuk="Format dua huruf, strip, lalu dua atau tiga angka."
          />

          <Kolom
            label="Tipe mesin"
            name="tipe"
            required
            defaultValue={mesin?.machine_type ?? ""}
            placeholder="Mesin cuci 15 kg"
            galat={galat?.tipe}
          />

          <Pilihan
            label="Status"
            name="status"
            required
            defaultValue={mesin?.status ?? "Tersedia"}
            galat={galat?.status}
            opsi={[
              { nilai: "Tersedia", label: "Tersedia" },
              { nilai: "Digunakan", label: "Digunakan" },
              { nilai: "Maintenance", label: "Perawatan" },
            ]}
          />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
              Batal
            </Tombol>
            <Tombol type="submit" keadaan={sedangKirim ? "memuat" : "normal"}>
              {sedangKirim ? "Menyimpan" : mengubah ? "Simpan perubahan" : "Tambah mesin"}
            </Tombol>
          </div>
        </form>
      </Modal>

      {/* Pesan sukses tetap terlihat setelah dialog menutup. */}
      {hasil?.ok ? <Toast kunci={hasil} pesan={mengubah ? "Perubahan mesin tersimpan" : "Mesin baru tersimpan"} /> : null}
    </>
  );
}
