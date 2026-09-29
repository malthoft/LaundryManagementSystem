"use client";

import { useActionState, useMemo, useState } from "react";
import { buatOrderBaru } from "@/controllers/order.controller";
import { Catatan, Centang, Kolom, Pilihan } from "@/components/ui/Kolom";
import { PesanHasil } from "@/components/ui/Keadaan";
import { Tombol } from "@/components/ui/Tombol";
import { durasi, rupiah } from "@/lib/format";
import type { Addon, Layanan, Mesin } from "@/types/db";

/**
 * Form order. Total dihitung di klien supaya kasir melihat angkanya sebelum
 * menyimpan, tetapi angka yang tersimpan tetap dihitung ulang di database
 * (fungsi `buat_order`). Klien hanya untuk tampilan.
 */
export function FormOrder({
  mesinCuci,
  mesinPengering,
  layanan,
  addon,
  fokusAwal = false,
}: {
  mesinCuci: Mesin[];
  mesinPengering: Mesin[];
  layanan: Layanan[];
  addon: Addon[];
  /* Dipakai quick link /orders?aksi=baru: kursor siap di kolom nama pelanggan. */
  fokusAwal?: boolean;
}) {
  const [hasil, kirim, sedangKirim] = useActionState(buatOrderBaru, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;

  const [serviceId, setServiceId] = useState("");
  const [qty, setQty] = useState("1");
  const [addonDipilih, setAddonDipilih] = useState<number[]>([]);

  const layananTerpilih = useMemo(
    () => layanan.find((item) => String(item.id) === serviceId) ?? null,
    [layanan, serviceId]
  );

  const total = useMemo(() => {
    const jumlah = Number(qty);
    if (!layananTerpilih || !Number.isFinite(jumlah) || jumlah <= 0) return 0;
    const hargaAddon = addon
      .filter((item) => addonDipilih.includes(item.id))
      .reduce((jumlahHarga, item) => jumlahHarga + item.price, 0);
    /* Pembulatan uang selalu eksplisit. Lihat aturan kode nomor 7. */
    return Math.round(layananTerpilih.price * jumlah) + Math.round(hargaAddon);
  }, [layananTerpilih, qty, addon, addonDipilih]);

  const tidakAdaMesin = mesinCuci.length === 0 || mesinPengering.length === 0;

  if (tidakAdaMesin) {
    return (
      <PesanHasil jenis="info">
        Order tidak bisa dibuat sekarang. Butuh minimal satu mesin cuci dan satu mesin
        pengering berstatus Tersedia. Ubah status mesin dulu di menu Mesin.
      </PesanHasil>
    );
  }

  return (
    <form action={kirim} className="flex flex-col gap-4">
      {hasil && !hasil.ok && !galat ? <PesanHasil jenis="gagal">{hasil.error}</PesanHasil> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Pilihan
          label="Mesin cuci"
          name="washerId"
          required
          kosong="Pilih mesin cuci"
          galat={galat?.washerId}
          opsi={mesinCuci.map((item) => ({
            nilai: item.id,
            label: `${item.machine_code} · ${item.machine_type}`,
          }))}
        />
        <Pilihan
          label="Mesin pengering"
          name="dryerId"
          required
          kosong="Pilih mesin pengering"
          galat={galat?.dryerId}
          opsi={mesinPengering.map((item) => ({
            nilai: item.id,
            label: `${item.machine_code} · ${item.machine_type}`,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Kolom
          label="Nama pelanggan"
          name="namaPelanggan"
          required
          autoFocus={fokusAwal}
          galat={galat?.namaPelanggan}
          placeholder="Nama pelanggan"
          defaultValue="Walk-in"
        />
        <Pilihan
          label="Metode pembayaran"
          name="metodeBayar"
          required
          galat={galat?.metodeBayar}
          opsi={[
            { nilai: "Cash", label: "Tunai" },
            { nilai: "QRIS", label: "QRIS" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Pilihan
          label="Layanan"
          name="serviceId"
          required
          kosong="Pilih layanan"
          galat={galat?.serviceId}
          value={serviceId}
          onChange={(peristiwa) => setServiceId(peristiwa.target.value)}
          opsi={layanan.map((item) => ({
            nilai: item.id,
            label: `${item.service_name} · ${rupiah(item.price)} per ${item.unit}`,
          }))}
        />
        <Kolom
          label={layananTerpilih ? `Jumlah (${layananTerpilih.unit})` : "Jumlah"}
          name="qty"
          type="number"
          inputMode="decimal"
          /* kg boleh pecahan, pcs tidak. step menyesuaikan unit layanan yang
             dipilih supaya tombol spinner tidak menawarkan angka tidak masuk akal. */
          step={layananTerpilih?.unit === "pcs" ? 1 : 0.1}
          min={layananTerpilih?.unit === "pcs" ? 1 : 0.1}
          required
          galat={galat?.qty}
          value={qty}
          onChange={(peristiwa) => setQty(peristiwa.target.value)}
        />
      </div>

      <fieldset className="rounded-md border border-line px-4 py-3">
        <legend className="px-1 text-kecil font-semibold text-ink">
          Layanan tambahan
        </legend>
        {addon.length === 0 ? (
          <p className="text-kecil text-ink-muted">
            Belum ada add-on aktif. Tambahkan dari menu Layanan &amp; Add-on.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {addon.map((item) => (
              <Centang
                key={item.id}
                name="addonIds"
                nilai={String(item.id)}
                label={`${item.addon_name} · ${rupiah(item.price)}`}
                checked={addonDipilih.includes(item.id)}
                onChange={() =>
                  setAddonDipilih((sebelumnya) =>
                    sebelumnya.includes(item.id)
                      ? sebelumnya.filter((id) => id !== item.id)
                      : [...sebelumnya, item.id]
                  )
                }
              />
            ))}
          </div>
        )}
        <p className="mt-1 text-kecil text-ink-muted">
          Centang add-on yang diminta pelanggan. Harga add-on dihitung sekali per order.
        </p>
      </fieldset>

      <Catatan
        label="Catatan"
        name="catatan"
        galat={galat?.catatan}
        placeholder="Contoh: pisahkan pakaian putih"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-paper px-4 py-3">
        <div className="min-w-0">
          <p className="text-kecil font-medium text-ink-muted">Total</p>
          <p className="angka text-2xl font-extrabold text-primary">{rupiah(total)}</p>
          {layananTerpilih ? (
            <p className="text-kecil text-ink-muted">
              Estimasi durasi {durasi(layananTerpilih.duration_minutes)}
            </p>
          ) : null}
        </div>
        <Tombol
          type="submit"
          ikon="save"
          keadaan={sedangKirim ? "memuat" : "normal"}
        >
          {sedangKirim ? "Menyimpan" : "Simpan order"}
        </Tombol>
      </div>
    </form>
  );
}
