"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Kolom, Pilihan } from "@/components/ui/Kolom";
import { Tombol, type VarianTombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { bentukJadwalAction, simpanShiftAction, simpanTemplateAction } from "@/controllers/shift.controller";
import { JAM_SHIFT, LABEL_HARI, URUTAN_HARI } from "@/lib/constants";
import { hariIni } from "@/lib/date";
import type { Profil, TipeShift } from "@/types/db";

/** Tambah satu shift untuk satu orang pada satu tanggal. */
export function FormShift({
  karyawan,
  label = "Tambah shift",
  ikon = "add",
  varian = "utama",
  ukuran = "sedang",
}: {
  karyawan: Profil[];
  label?: string;
  ikon?: string;
  varian?: VarianTombol;
  ukuran?: "sedang" | "kecil";
}) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(simpanShiftAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;
  /* Bergantung pada objek `hasil`, bukan boolean turunannya: setiap kiriman
     menghasilkan objek baru, jadi dialog tetap menutup walau keluarganya sama. */
  useEffect(() => {
    if (hasil?.ok) setBuka(false);
  }, [hasil]);

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
        judul="Tambah shift"
        keterangan="Jam shift mengikuti tipe: Shift 1 pukul 07:00 sampai 13:00, Shift 2 pukul 13:00 sampai 20:00."
      >
        <form action={kirim} className="flex flex-col gap-4">
          {hasil && !hasil.ok && !galat ? (
            <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
          ) : null}

          <Pilihan
            label="Karyawan"
            name="karyawanId"
            required
            kosong="Pilih karyawan"
            galat={galat?.karyawanId}
            opsi={karyawan.map((orang) => ({
              nilai: orang.id,
              label: `${orang.full_name} (@${orang.username})`,
            }))}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Kolom
              label="Tanggal"
              name="tanggal"
              type="date"
              required
              defaultValue={hariIni()}
              galat={galat?.tanggal}
            />
            <Pilihan
              label="Tipe shift"
              name="tipe"
              required
              defaultValue="Shift 1"
              galat={galat?.tipe}
              opsi={(["Shift 1", "Shift 2"] as TipeShift[]).map((tipe) => ({
                nilai: tipe,
                label: `${tipe} · ${JAM_SHIFT[tipe].mulai} sampai ${JAM_SHIFT[tipe].selesai}`,
              }))}
            />
          </div>

          <Kolom
            label="Stasiun"
            name="stasiun"
            required
            defaultValue="Kasir"
            galat={galat?.stasiun}
            petunjuk="Contoh: Kasir, Cuci, Setrika."
          />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
              Batal
            </Tombol>
            <Tombol type="submit" keadaan={sedangKirim ? "memuat" : "normal"}>
              {sedangKirim ? "Menyimpan" : "Tambah shift"}
            </Tombol>
          </div>
        </form>
      </Modal>

      {/* Pesan sukses tetap terlihat setelah dialog menutup. */}
      {hasil?.ok ? <Toast kunci={hasil} pesan={"Jadwal shift tersimpan"} /> : null}
    </>
  );
}

/** Buat jadwal berulang dari template untuk beberapa minggu ke depan. */
export function FormBentukJadwal() {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(bentukJadwalAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;
  /* Bergantung pada objek `hasil`, bukan boolean turunannya: setiap kiriman
     menghasilkan objek baru, jadi dialog tetap menutup walau keluarganya sama. */
  useEffect(() => {
    if (hasil?.ok) setBuka(false);
  }, [hasil]);

  return (
    <>
      <Tombol type="button" varian="sekunder" ikon="event_repeat" onClick={() => setBuka(true)}>
        Bentuk jadwal
      </Tombol>

      <Modal
        buka={buka}
        tutup={() => setBuka(false)}
        judul="Bentuk jadwal dari pola"
        keterangan="Jadwal dibentuk untuk satu minggu penuh mulai Senin dari tanggal yang dipilih. Hari yang sudah punya shift dilewati, jadi aman ditekan berkali-kali."
        lebar="kecil"
      >
        <form action={kirim} className="flex flex-col gap-4">
          {hasil && !hasil.ok && !galat ? (
            <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
          ) : null}

          <Kolom
            label="Minggu yang mau dibentuk"
            name="tanggalAwal"
            type="date"
            required
            defaultValue={hariIni()}
            galat={galat?.tanggalAwal}
            petunjuk="Tanggal mana pun dalam minggu itu. Jadwal selalu mulai hari Senin."
          />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
              Batal
            </Tombol>
            <Tombol type="submit" keadaan={sedangKirim ? "memuat" : "normal"}>
              {sedangKirim ? "Membentuk" : "Bentuk jadwal"}
            </Tombol>
          </div>
        </form>
      </Modal>

      {/* Pesan sukses tetap terlihat setelah dialog menutup. */}
      {hasil?.ok ? <Toast kunci={hasil} pesan={"Jadwal mingguan dibentuk"} /> : null}
    </>
  );
}

/** Tambah template shift berulang mingguan. */
export function FormTemplate({ karyawan }: { karyawan: Profil[] }) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(simpanTemplateAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;
  /* Bergantung pada objek `hasil`, bukan boolean turunannya: setiap kiriman
     menghasilkan objek baru, jadi dialog tetap menutup walau keluarganya sama. */
  useEffect(() => {
    if (hasil?.ok) setBuka(false);
  }, [hasil]);

  return (
    <>
      <Tombol type="button" varian="sekunder" ikon="add" onClick={() => setBuka(true)}>
        Tambah template
      </Tombol>

      <Modal
        buka={buka}
        tutup={() => setBuka(false)}
        judul="Tambah template shift"
        keterangan="Template dipakai untuk membentuk jadwal berulang tiap minggu."
        lebar="kecil"
      >
        <form action={kirim} className="flex flex-col gap-4">
          {hasil && !hasil.ok && !galat ? (
            <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
          ) : null}

          <Pilihan
            label="Karyawan"
            name="karyawanId"
            required
            kosong="Pilih karyawan"
            galat={galat?.karyawanId}
            opsi={karyawan.map((orang) => ({
              nilai: orang.id,
              label: `${orang.full_name} (@${orang.username})`,
            }))}
          />

          <Pilihan
            label="Hari"
            name="hari"
            required
            defaultValue="Monday"
            galat={galat?.hari}
            opsi={URUTAN_HARI.map((hari) => ({ nilai: hari, label: LABEL_HARI[hari] }))}
          />

          <Pilihan
            label="Tipe shift"
            name="tipe"
            required
            defaultValue="Shift 1"
            galat={galat?.tipe}
            opsi={(["Shift 1", "Shift 2"] as TipeShift[]).map((tipe) => ({
              nilai: tipe,
              label: `${tipe} · ${JAM_SHIFT[tipe].mulai} sampai ${JAM_SHIFT[tipe].selesai}`,
            }))}
          />

          <Kolom
            label="Stasiun"
            name="stasiun"
            required
            defaultValue="Kasir"
            galat={galat?.stasiun}
          />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
              Batal
            </Tombol>
            <Tombol type="submit" keadaan={sedangKirim ? "memuat" : "normal"}>
              {sedangKirim ? "Menyimpan" : "Tambah template"}
            </Tombol>
          </div>
        </form>
      </Modal>

      {/* Pesan sukses tetap terlihat setelah dialog menutup. */}
      {hasil?.ok ? <Toast kunci={hasil} pesan={"Template shift tersimpan"} /> : null}
    </>
  );
}
