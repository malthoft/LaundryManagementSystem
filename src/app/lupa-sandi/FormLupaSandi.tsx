"use client";

import { useActionState } from "react";
import { Kolom } from "@/components/ui/Kolom";
import { Tombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { lupaSandiAction } from "@/controllers/akun.controller";

/** Permintaan tautan pengaturan ulang sandi, keputusannya di tangan developer. */
export function FormLupaSandi() {
  const [hasil, kirim, jalan] = useActionState(lupaSandiAction, null);
  const galat = hasil && !hasil.ok ? (hasil.field ?? {}) : {};

  if (hasil?.ok) {
    return (
      <PesanHasil jenis="info">
        Permintaan reset sandi sudah dikirim ke developer. Setelah disetujui,
        Anda akan menerima tautan penggantian sandi yang berlaku 30 menit.
      </PesanHasil>
    );
  }

  return (
    <form action={kirim} className="grid gap-3">
      {hasil && !hasil.ok ? (
        <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
      ) : null}

      <Kolom
        label="Username"
        name="username"
        required
        autoFocus
        autoComplete="username"
        maxLength={30}
        placeholder="rinakusuma"
        galat={galat?.username}
        petunjuk="Username akun Admin yang sandinya ingin diganti."
      />

      <Tombol type="submit" varian="utama" disabled={jalan}>
        {jalan ? "Mengirim…" : "Kirim permintaan"}
      </Tombol>
    </form>
  );
}
