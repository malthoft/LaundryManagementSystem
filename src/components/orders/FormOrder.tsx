"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { buatOrderBaru } from "@/controllers/order.controller";
import { Catatan, Centang, Kolom, Pilihan } from "@/components/ui/Kolom";
import { PesanHasil } from "@/components/ui/Keadaan";
import { IonIcon } from "@/components/ui/IonIcon";
import { durasi, rupiah, tanggal } from "@/lib/format";
import { hariIni } from "@/lib/date";
import type { Addon, Layanan, Mesin } from "@/types/db";

interface InfoPopupSukses {
  kode: string;
  pelanggan: string;
  total: number;
}

/**
 * Form pembuatan order laundry dengan alur verifikasi kwitansi pra-simpan
 * dan notifikasi popup mengambang dari atas saat order berhasil dibuat.
 */
export function FormOrder({
  mesinCuci,
  mesinPengering,
  layanan,
  addon,
  fokusAwal = false,
  padaSukses,
}: {
  mesinCuci: Mesin[];
  mesinPengering: Mesin[];
  layanan: Layanan[];
  addon: Addon[];
  fokusAwal?: boolean;
  padaSukses?: () => void;
}) {
  const [hasil, kirim, sedangKirim] = useActionState(buatOrderBaru, null);
  const galatServer = hasil && !hasil.ok ? hasil.field : undefined;

  // State isian formulir
  const [washerId, setWasherId] = useState("");
  const [dryerId, setDryerId] = useState("");
  const [namaPelanggan, setNamaPelanggan] = useState("Walk-in");
  const [metodeBayar, setMetodeBayar] = useState("Cash");
  const [serviceId, setServiceId] = useState("");
  const [qty, setQty] = useState("1");
  const [addonDipilih, setAddonDipilih] = useState<number[]>([]);
  const [catatan, setCatatan] = useState("");

  // Validasi lokal & modal verifikasi
  const [galatLokal, setGalatLokal] = useState<Record<string, string>>({});
  const [bukaVerifikasi, setBukaVerifikasi] = useState(false);
  const [popupSukses, setPopupSukses] = useState<InfoPopupSukses | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Objek referensi terpilih
  const mesinCuciTerpilih = useMemo(
    () => mesinCuci.find((item) => String(item.id) === washerId) ?? null,
    [mesinCuci, washerId]
  );

  const mesinPengeringTerpilih = useMemo(
    () => mesinPengering.find((item) => String(item.id) === dryerId) ?? null,
    [mesinPengering, dryerId]
  );

  const layananTerpilih = useMemo(
    () => layanan.find((item) => String(item.id) === serviceId) ?? null,
    [layanan, serviceId]
  );

  const addonTerpilih = useMemo(
    () => addon.filter((item) => addonDipilih.includes(item.id)),
    [addon, addonDipilih]
  );

  // Perhitungan total biaya
  const subtotalLayanan = useMemo(() => {
    const jumlah = Number(qty);
    if (!layananTerpilih || !Number.isFinite(jumlah) || jumlah <= 0) return 0;
    return Math.round(layananTerpilih.price * jumlah);
  }, [layananTerpilih, qty]);

  const subtotalAddon = useMemo(() => {
    return addonTerpilih.reduce((acc, item) => acc + item.price, 0);
  }, [addonTerpilih]);

  const total = subtotalLayanan + subtotalAddon;

  // Tangani hasil Server Action ketika sukses
  useEffect(() => {
    if (hasil && hasil.ok && hasil.data) {
      setBukaVerifikasi(false);
      setPopupSukses({
        kode: hasil.data.kode,
        pelanggan: namaPelanggan.trim() || "Walk-in",
        total,
      });

      // Reset form ke awal
      setNamaPelanggan("Walk-in");
      setServiceId("");
      setWasherId("");
      setDryerId("");
      setQty("1");
      setAddonDipilih([]);
      setCatatan("");
      setGalatLokal({});

      if (padaSukses) {
        padaSukses();
      }
    }
  }, [hasil, namaPelanggan, total, padaSukses]);

  // Validasi lokal sebelum membuka kwitansi verifikasi
  function bukaModalVerifikasi(e: React.FormEvent) {
    e.preventDefault();
    const galat: Record<string, string> = {};

    if (!washerId) galat.washerId = "Pilih unit mesin cuci yang tersedia";
    if (!dryerId) galat.dryerId = "Pilih unit mesin pengering yang tersedia";
    if (!namaPelanggan.trim()) galat.namaPelanggan = "Nama pelanggan wajib diisi";
    if (!serviceId) galat.serviceId = "Pilih jenis paket layanan";

    const jumlah = Number(qty);
    if (!Number.isFinite(jumlah) || jumlah <= 0) {
      galat.qty = "Jumlah / berat harus lebih dari 0";
    }

    if (Object.keys(galat).length > 0) {
      setGalatLokal(galat);
      return;
    }

    setGalatLokal({});
    setBukaVerifikasi(true);
  }

  // Gabungkan error lokal dan server
  const galat = { ...galatLokal, ...galatServer };
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
    <>
      {/* Formulir Utama */}
      <form onSubmit={bukaModalVerifikasi} className="flex flex-col gap-4">
        {hasil && !hasil.ok && !galatServer ? (
          <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Pilihan
            label="Mesin Cuci (Washing Machine)"
            name="washerId"
            required
            kosong="-- Pilih Mesin Cuci Tersedia --"
            galat={galat.washerId}
            value={washerId}
            onChange={(e) => {
              setWasherId(e.target.value);
              setGalatLokal((prev) => ({ ...prev, washerId: "" }));
            }}
            opsi={mesinCuci.map((item) => ({
              nilai: item.id,
              label: `${item.machine_code} · ${item.machine_type}`,
            }))}
          />
          <Pilihan
            label="Mesin Pengering (Dryer Machine)"
            name="dryerId"
            required
            kosong="-- Pilih Mesin Pengering Tersedia --"
            galat={galat.dryerId}
            value={dryerId}
            onChange={(e) => {
              setDryerId(e.target.value);
              setGalatLokal((prev) => ({ ...prev, dryerId: "" }));
            }}
            opsi={mesinPengering.map((item) => ({
              nilai: item.id,
              label: `${item.machine_code} · ${item.machine_type}`,
            }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Kolom
            label="Nama Pelanggan"
            name="namaPelanggan"
            required
            autoFocus={fokusAwal}
            galat={galat.namaPelanggan}
            placeholder="Contoh: Budi Santoso atau Walk-in"
            value={namaPelanggan}
            onChange={(e) => {
              setNamaPelanggan(e.target.value);
              setGalatLokal((prev) => ({ ...prev, namaPelanggan: "" }));
            }}
          />
          <Pilihan
            label="Metode Pembayaran"
            name="metodeBayar"
            required
            galat={galat.metodeBayar}
            value={metodeBayar}
            onChange={(e) => setMetodeBayar(e.target.value)}
            opsi={[
              { nilai: "Cash", label: "Tunai (Cash di Kasir)" },
              { nilai: "QRIS", label: "QRIS (Pembayaran Digital)" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Pilihan
            label="Paket Layanan"
            name="serviceId"
            required
            kosong="-- Pilih Paket Layanan --"
            galat={galat.serviceId}
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setGalatLokal((prev) => ({ ...prev, serviceId: "" }));
            }}
            opsi={layanan.map((item) => ({
              nilai: item.id,
              label: `${item.service_name} · ${rupiah(item.price)} per ${item.unit}`,
            }))}
          />
          <Kolom
            label={layananTerpilih ? `Jumlah Cucian (${layananTerpilih.unit})` : "Jumlah Cucian"}
            name="qty"
            type="number"
            inputMode="decimal"
            step={layananTerpilih?.unit === "pcs" ? 1 : 0.1}
            min={layananTerpilih?.unit === "pcs" ? 1 : 0.1}
            required
            galat={galat.qty}
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
              setGalatLokal((prev) => ({ ...prev, qty: "" }));
            }}
          />
        </div>

        <fieldset className="rounded-lg border border-line bg-paper/40 p-4">
          <legend className="px-1.5 text-kecil font-bold text-ink">
            Layanan Tambahan (Add-on)
          </legend>
          {addon.length === 0 ? (
            <p className="text-kecil text-ink-muted">
              Belum ada layanan add-on aktif yang dikonfigurasi.
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
          <p className="mt-1 text-mikro text-ink-muted">
            Centang opsi khusus jika pelanggan meminta pewangi ekstra, pemutih, atau perlakuan khusus.
          </p>
        </fieldset>

        <Catatan
          label="Catatan Khusus Cucian"
          name="catatan"
          galat={galat.catatan}
          placeholder="Contoh: pisahkan pakaian luntur, kemeja putih di-hanger"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />

        {/* Ringkasan Biaya Bawah & Tombol Lanjut ke Verifikasi */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper/90 px-5 py-4">
          <div className="min-w-0">
            <p className="text-kecil font-medium text-ink-muted">Total Estimasi Tagihan</p>
            <p className="angka font-display text-2xl font-extrabold text-primary">
              {rupiah(total)}
            </p>
            {layananTerpilih ? (
              <p className="flex items-center gap-1 text-mikro font-medium text-ink-muted">
                <IonIcon name="time-outline" size={13} />
                <span>Estimasi pengerjaan: {durasi(layananTerpilih.duration_minutes)}</span>
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className="joyops-aksi flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-kecil font-bold text-primary-fg shadow-sm hover:bg-primary-600 transition-colors"
          >
            <IonIcon name="receipt-outline" size={18} />
            <span>Simpan Order</span>
          </button>
        </div>
      </form>

      {/* =========================================================================
          MODAL KWITANSI VERIFIKASI SEBELUM SIMPAN ORDER
          ========================================================================= */}
      {bukaVerifikasi && mounted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs">
          <div className="gerak-muncul relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            {/* Header Modal Verifikasi */}
            <div className="flex items-center justify-between border-b border-line bg-paper/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IonIcon name="receipt-outline" size={20} />
                </span>
                <div>
                  <h3 className="font-display text-kecil font-bold text-ink">
                    Verifikasi Kwitansi Order
                  </h3>
                  <p className="text-mikro text-ink-muted">
                    Periksa kembali data cucian pelanggan sebelum dicatat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBukaVerifikasi(false)}
                className="joyops-aksi flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-paper hover:text-ink"
              >
                <IonIcon name="close-outline" size={20} />
              </button>
            </div>

            {/* Slip Kwitansi Fisik Digital */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-xl border border-line bg-paper/30 p-5 shadow-inner">
                {/* Header Toko */}
                <div className="border-b border-dashed border-line pb-3 text-center">
                  <h4 className="font-display text-sedang font-extrabold tracking-tight text-primary">
                    JOYOPS LAUNDRY MANAGEMENT
                  </h4>
                  <p className="text-mikro uppercase tracking-wider text-ink-muted">
                    Nota Verifikasi Transaksi Kasir
                  </p>
                  <p className="mt-1 text-nano text-ink-muted">
                    {tanggal(hariIni())} · Periksa Ulang Data Cucian
                  </p>
                </div>

                {/* Rincian Pelanggan & Alokasi Mesin */}
                <div className="grid grid-cols-2 gap-3 border-b border-dashed border-line py-3 text-kecil">
                  <div>
                    <span className="block text-mikro font-semibold uppercase text-ink-muted">
                      Nama Pelanggan
                    </span>
                    <span className="font-bold text-ink">{namaPelanggan || "Walk-in"}</span>
                  </div>
                  <div>
                    <span className="block text-mikro font-semibold uppercase text-ink-muted">
                      Pembayaran
                    </span>
                    <span className="font-bold text-ink">
                      {metodeBayar === "Cash" ? "Tunai (Cash)" : "QRIS Digital"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-mikro font-semibold uppercase text-ink-muted">
                      Unit Mesin Cuci
                    </span>
                    <span className="font-semibold text-ink">
                      {mesinCuciTerpilih?.machine_code} ({mesinCuciTerpilih?.machine_type})
                    </span>
                  </div>
                  <div>
                    <span className="block text-mikro font-semibold uppercase text-ink-muted">
                      Unit Pengering
                    </span>
                    <span className="font-semibold text-ink">
                      {mesinPengeringTerpilih?.machine_code} ({mesinPengeringTerpilih?.machine_type})
                    </span>
                  </div>
                </div>

                {/* Rincian Biaya Layanan */}
                <div className="border-b border-dashed border-line py-3">
                  <div className="flex items-center justify-between text-kecil font-semibold text-ink">
                    <span>
                      {layananTerpilih?.service_name} ({qty} {layananTerpilih?.unit})
                    </span>
                    <span>{rupiah(subtotalLayanan)}</span>
                  </div>
                  <p className="text-mikro text-ink-muted">
                    {rupiah(layananTerpilih?.price ?? 0)} / {layananTerpilih?.unit}
                  </p>

                  {addonTerpilih.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      <span className="block text-mikro font-semibold uppercase text-ink-muted">
                        Layanan Tambahan (Add-on):
                      </span>
                      {addonTerpilih.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between text-mikro text-ink"
                        >
                          <span>+ {a.addon_name}</span>
                          <span>{rupiah(a.price)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {catatan ? (
                    <div className="mt-2.5 rounded-md bg-paper p-2 text-mikro text-ink">
                      <span className="font-bold">Catatan: </span>
                      {catatan}
                    </div>
                  ) : null}
                </div>

                {/* Total Akhir & Estimasi Selesai */}
                <div className="pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-sedang font-bold text-ink">
                      TOTAL TAGIHAN
                    </span>
                    <span className="font-display text-xl font-extrabold text-primary">
                      {rupiah(total)}
                    </span>
                  </div>
                  {layananTerpilih ? (
                    <p className="mt-1 flex items-center justify-end gap-1 text-mikro font-medium text-ink-muted">
                      <IonIcon name="time-outline" size={13} />
                      <span>Estimasi selesai: {durasi(layananTerpilih.duration_minutes)}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Tombol Aksi Verifikasi: Periksa Kembali vs Konfirmasi Simpan */}
            <div className="flex items-center justify-end gap-2 border-t border-line bg-paper/60 px-5 py-4">
              <button
                type="button"
                disabled={sedangKirim}
                onClick={() => setBukaVerifikasi(false)}
                className="joyops-aksi flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-surface px-4 text-kecil font-semibold text-ink hover:bg-paper transition-colors"
              >
                <IonIcon name="close-outline" size={16} />
                <span>Periksa Kembali</span>
              </button>

              <form
                action={kirim}
                onSubmit={() => {
                  // Form server action dikirimkan
                }}
              >
                <input type="hidden" name="washerId" value={washerId} />
                <input type="hidden" name="dryerId" value={dryerId} />
                <input type="hidden" name="namaPelanggan" value={namaPelanggan} />
                <input type="hidden" name="metodeBayar" value={metodeBayar} />
                <input type="hidden" name="serviceId" value={serviceId} />
                <input type="hidden" name="qty" value={qty} />
                {addonDipilih.map((id) => (
                  <input key={id} type="hidden" name="addonIds" value={String(id)} />
                ))}
                <input type="hidden" name="catatan" value={catatan} />

                <button
                  type="submit"
                  disabled={sedangKirim}
                  className="joyops-aksi flex min-h-11 items-center gap-2 rounded-lg bg-ok px-5 text-kecil font-bold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
                >
                  <IonIcon name="checkmark-circle" size={18} />
                  <span>{sedangKirim ? "Mencatat Order..." : "Konfirmasi & Buat Order"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          NOTIFIKASI POPUP DARI ATAS (TOP TOAST BANNER)
          ========================================================================= */}
      {popupSukses && mounted && (
        <NotifikasiPopupAtas
          info={popupSukses}
          onTutup={() => setPopupSukses(null)}
        />
      )}
    </>
  );
}

/**
 * Komponen Notifikasi Popup dari Atas yang meluncur lembut dengan informasi
 * detail order yang baru saja dibuat.
 */
function NotifikasiPopupAtas({
  info,
  onTutup,
}: {
  info: InfoPopupSukses;
  onTutup: () => void;
}) {
  const [keluar, setKeluar] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeluar(true);
      setTimeout(onTutup, 200);
    }, 4500);

    return () => clearTimeout(timer);
  }, [onTutup]);

  function tutupSekarang() {
    setKeluar(true);
    setTimeout(onTutup, 200);
  }

  const konten = (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex justify-center px-4 pt-4 sm:pt-6">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3.5 rounded-xl border border-ok/40 bg-surface/98 p-4 shadow-2xl backdrop-blur-md transition-all duration-200 ${
          keluar ? "toast-keluar" : "toast-masuk"
        }`}
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok ring-4 ring-ok/10"
        >
          <IonIcon name="checkmark-circle" size={24} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-kecil font-extrabold text-ink">Order Berhasil Dibuat!</h4>
            <span className="rounded-md bg-ok/15 px-1.5 py-0.2 text-nano font-bold text-ok uppercase">
              {info.kode}
            </span>
          </div>

          <p className="mt-0.5 text-kecil text-ink-muted leading-relaxed">
            Cucian pelanggan <span className="font-bold text-ink">{info.pelanggan}</span> sebesar{" "}
            <span className="font-bold text-primary">{rupiah(info.total)}</span> berhasil
            dicatat. Mesin cuci &amp; pengering telah dialokasikan ke status Digunakan.
          </p>
        </div>

        <button
          type="button"
          onClick={tutupSekarang}
          aria-label="Tutup notifikasi"
          className="joyops-aksi -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-paper hover:text-ink"
        >
          <IonIcon name="close-outline" size={18} />
        </button>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(konten, document.body) : null;
}
