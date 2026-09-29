"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Centang, Kolom, Pilihan } from "@/components/ui/Kolom";
import { Tombol, type VarianTombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { simpanLayananAction } from "@/controllers/service.controller";
import type { Layanan } from "@/types/db";

export function FormLayanan({
  layanan,
  label,
  ikon = "add",
  varian = "utama",
  ukuran = "sedang",
}: {
  layanan?: Layanan;
  label: string;
  ikon?: string;
  varian?: VarianTombol;
  ukuran?: "sedang" | "kecil";
}) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(simpanLayananAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;
  /* Bergantung pada objek `hasil`, bukan boolean turunannya: setiap kiriman
     menghasilkan objek baru, jadi dialog tetap menutup walau keluarganya sama. */
  useEffect(() => {
    if (hasil?.ok) setBuka(false);
  }, [hasil]);

  const mengubah = Boolean(layanan);

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
        judul={mengubah ? `Ubah layanan ${layanan?.service_name}` : "Tambah layanan"}
        keterangan="Durasi dipakai sebagai perkiraan waktu mesin berjalan pada order."
      >
        <form action={kirim} className="flex flex-col gap-4">
          {hasil && !hasil.ok && !galat ? (
            <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
          ) : null}

          {layanan ? <input type="hidden" name="id" value={layanan.id} /> : null}

          <Kolom
            label="Nama layanan"
            name="nama"
            required
            autoFocus
            defaultValue={layanan?.service_name ?? ""}
            placeholder="Cuci kering setrika"
            galat={galat?.nama}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Kolom
              label="Harga"
              name="harga"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required
              defaultValue={layanan ? String(layanan.price) : ""}
              placeholder="8000"
              galat={galat?.harga}
              petunjuk="Rupiah, tanpa titik."
            />
            <Pilihan
              label="Satuan"
              name="satuan"
              required
              defaultValue={layanan?.unit ?? "kg"}
              galat={galat?.satuan}
              opsi={[
                { nilai: "kg", label: "Kilogram" },
                { nilai: "pcs", label: "Per satuan (pcs)" },
              ]}
            />
          </div>

          <Kolom
            label="Durasi pengerjaan"
            name="durasi"
            type="number"
            inputMode="numeric"
            min="1"
            max="1440"
            required
            defaultValue={layanan ? String(layanan.duration_minutes) : "90"}
            galat={galat?.durasi}
            petunjuk="Dalam menit. Minimal 1 menit."
          />

          <Kolom
            label="Nama ikon"
            name="ikon"
            defaultValue={layanan?.icon ?? "local_laundry_service"}
            galat={galat?.ikon}
            petunjuk="Nama ikon Material Symbols, misalnya laundry atau dry_cleaning."
          />

          <Centang
            name="aktif"
            label="Layanan aktif dan bisa dipilih saat membuat order"
            defaultChecked={layanan ? layanan.is_active : true}
          />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
              Batal
            </Tombol>
            <Tombol type="submit" keadaan={sedangKirim ? "memuat" : "normal"}>
              {sedangKirim ? "Menyimpan" : mengubah ? "Simpan perubahan" : "Tambah layanan"}
            </Tombol>
          </div>
        </form>
      </Modal>

      {/* Pesan sukses tetap terlihat setelah dialog menutup. */}
      {hasil?.ok ? <Toast kunci={hasil} pesan={mengubah ? "Perubahan layanan tersimpan" : "Layanan baru tersimpan"} /> : null}
    </>
  );
}
