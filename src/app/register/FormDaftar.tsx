"use client";

import { useActionState } from "react";
import { Kolom } from "@/components/ui/Kolom";
import { Tombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { daftarAction } from "@/controllers/akun.controller";

/**
 * Pendaftaran akun Admin.
 *
 * Form sengaja tidak meminta peran: pendaftaran di halaman ini memang hanya
 * untuk Admin, dan perannya ditetapkan di server, bukan dari isian form.
 */
export function FormDaftar() {
  const [hasil, kirim, jalan] = useActionState(daftarAction, null);
  const galat = hasil && !hasil.ok ? (hasil.field ?? {}) : {};

  if (hasil?.ok) {
    return (
      <PesanHasil jenis="info">
        Pendaftaran sudah terkirim ke developer. Tunggu persetujuannya sebelum
        Anda bisa masuk. Bila sudah diputuskan, cobalah masuk lagi —
        keterangannya akan muncul di sana.
      </PesanHasil>
    );
  }

  return (
    <form action={kirim} className="grid gap-3">
      {hasil && !hasil.ok ? (
        <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
      ) : null}

      <Kolom
        label="Nama lengkap"
        name="nama"
        required
        autoFocus
        maxLength={100}
        placeholder="Contoh: Rina Kusuma"
        galat={galat?.nama}
        petunjuk="2–100 karakter."
      />

      <Kolom
        label="Username"
        name="username"
        required
        autoComplete="username"
        maxLength={30}
        placeholder="rinakusuma"
        galat={galat?.username}
        petunjuk="Huruf kecil, angka, titik, garis miring atau bawah — 3–30 karakter."
      />

      <Kolom
        label="Sandi"
        name="sandi"
        type="password"
        required
        autoComplete="new-password"
        maxLength={72}
        galat={galat?.sandi}
        petunjuk="6–72 karakter."
      />

      <Kolom
        label="Ulangi sandi"
        name="ulangi"
        type="password"
        required
        autoComplete="new-password"
        maxLength={72}
        galat={galat?.ulangi}
      />

      <Tombol type="submit" varian="utama" disabled={jalan}>
        {jalan ? "Mengirim…" : "Kirim pendaftaran"}
      </Tombol>
    </form>
  );
}
