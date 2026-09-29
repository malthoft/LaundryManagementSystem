"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Centang, Kolom } from "@/components/ui/Kolom";
import { Tombol, type VarianTombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { simpanAddonAction } from "@/controllers/service.controller";
import type { Addon } from "@/types/db";

export function FormAddon({
  addon,
  label,
  ikon = "add",
  varian = "utama",
  ukuran = "sedang",
}: {
  addon?: Addon;
  label: string;
  ikon?: string;
  varian?: VarianTombol;
  ukuran?: "sedang" | "kecil";
}) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(simpanAddonAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;
  /* Bergantung pada objek `hasil`, bukan boolean turunannya: setiap kiriman
     menghasilkan objek baru, jadi dialog tetap menutup walau keluarganya sama. */
  useEffect(() => {
    if (hasil?.ok) setBuka(false);
  }, [hasil]);

  const mengubah = Boolean(addon);

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
        judul={mengubah ? `Ubah add-on ${addon?.addon_name}` : "Tambah add-on"}
        keterangan="Add-on dihitung sekali per order, bukan dikalikan jumlah cucian."
        lebar="kecil"
      >
        <form action={kirim} className="flex flex-col gap-4">
          {hasil && !hasil.ok && !galat ? (
            <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
          ) : null}

          {addon ? <input type="hidden" name="id" value={addon.id} /> : null}

          <Kolom
            label="Nama add-on"
            name="nama"
            required
            autoFocus
            defaultValue={addon?.addon_name ?? ""}
            placeholder="Pewangi premium"
            galat={galat?.nama}
          />

          <Kolom
            label="Harga"
            name="harga"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            required
            defaultValue={addon ? String(addon.price) : ""}
            placeholder="2000"
            galat={galat?.harga}
            petunjuk="Rupiah, tanpa titik."
          />

          <Kolom
            label="Nama ikon"
            name="ikon"
            defaultValue={addon?.icon ?? "add_circle"}
            galat={galat?.ikon}
            petunjuk="Nama ikon Material Symbols, misalnya spa atau science."
          />

          <Centang
            name="aktif"
            label="Add-on aktif dan bisa dipilih saat membuat order"
            defaultChecked={addon ? addon.is_active : true}
          />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
              Batal
            </Tombol>
            <Tombol type="submit" keadaan={sedangKirim ? "memuat" : "normal"}>
              {sedangKirim ? "Menyimpan" : mengubah ? "Simpan perubahan" : "Tambah add-on"}
            </Tombol>
          </div>
        </form>
      </Modal>

      {/* Pesan sukses tetap terlihat setelah dialog menutup. */}
      {hasil?.ok ? <Toast kunci={hasil} pesan={mengubah ? "Perubahan add-on tersimpan" : "Add-on baru tersimpan"} /> : null}
    </>
  );
}
