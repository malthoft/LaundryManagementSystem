"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Catatan, Kolom, Pilihan } from "@/components/ui/Kolom";
import { Tombol, type VarianTombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { simpanTransaksiAction } from "@/controllers/finance.controller";
import { hariIni } from "@/lib/date";
import type { Transaksi } from "@/types/db";

export function FormTransaksi({
  transaksi,
  label,
  ikon = "add",
  varian = "utama",
  ukuran = "sedang",
}: {
  transaksi?: Transaksi;
  label: string;
  ikon?: string;
  varian?: VarianTombol;
  ukuran?: "sedang" | "kecil";
}) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(simpanTransaksiAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;
  /* Bergantung pada objek `hasil`, bukan boolean turunannya: setiap kiriman
     menghasilkan objek baru, jadi dialog tetap menutup walau keluarganya sama. */
  useEffect(() => {
    if (hasil?.ok) setBuka(false);
  }, [hasil]);

  const mengubah = Boolean(transaksi);

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
        judul={mengubah ? "Ubah catatan kas" : "Catat transaksi"}
        keterangan="Pemasukan dari order sudah otomatis tercatat. Catat manual hanya untuk pengeluaran atau koreksi."
      >
        <form action={kirim} className="flex flex-col gap-4">
          {hasil && !hasil.ok && !galat ? (
            <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
          ) : null}

          {transaksi ? <input type="hidden" name="id" value={transaksi.id} /> : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Kolom
              label="Tanggal"
              name="tanggal"
              type="date"
              required
              defaultValue={transaksi?.transaction_date ?? hariIni()}
              galat={galat?.tanggal}
            />
            <Pilihan
              label="Jenis"
              name="tipe"
              required
              defaultValue={transaksi?.transaction_type ?? "Pengeluaran"}
              galat={galat?.tipe}
              opsi={[
                { nilai: "Pemasukan", label: "Pemasukan" },
                { nilai: "Pengeluaran", label: "Pengeluaran" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Kolom
              label="Jumlah"
              name="jumlah"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              required
              defaultValue={transaksi ? String(transaksi.amount) : ""}
              placeholder="50000"
              galat={galat?.jumlah}
              petunjuk="Rupiah, tanpa titik."
            />
            <Pilihan
              label="Metode"
              name="metode"
              required
              defaultValue={transaksi?.payment_method ?? "Cash"}
              galat={galat?.metode}
              opsi={[
                { nilai: "Cash", label: "Tunai" },
                { nilai: "QRIS", label: "QRIS" },
                { nilai: "Transfer", label: "Transfer" },
              ]}
            />
          </div>

          <Catatan
            label="Keterangan"
            name="deskripsi"
            required
            rows={2}
            defaultValue={transaksi?.description ?? ""}
            placeholder="Contoh: beli deterjen 5 kg"
            galat={galat?.deskripsi}
          />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
              Batal
            </Tombol>
            <Tombol type="submit" keadaan={sedangKirim ? "memuat" : "normal"}>
              {sedangKirim ? "Menyimpan" : mengubah ? "Simpan perubahan" : "Catat transaksi"}
            </Tombol>
          </div>
        </form>
      </Modal>

      {/* Pesan sukses tetap terlihat setelah dialog menutup. */}
      {hasil?.ok ? <Toast kunci={hasil} pesan={"Transaksi tersimpan"} /> : null}
    </>
  );
}
