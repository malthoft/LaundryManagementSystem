"use client";

import { useActionState } from "react";
import { Kolom } from "@/components/ui/Kolom";
import { Tombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { masukDeveloperAction } from "@/controllers/developer.controller";

/** Gerbang kunci rahasia, satu-satunya jalan masuk ke halaman developer. */
export function FormKunci() {
  const [hasil, kirim, jalan] = useActionState(masukDeveloperAction, null);
  const galat = hasil && !hasil.ok ? (hasil.field ?? {}) : {};

  return (
    <form action={kirim} className="grid gap-3">
      {hasil && !hasil.ok ? (
        <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
      ) : null}

      <Kolom
        label="Kunci developer"
        name="kunci"
        type="password"
        autoFocus
        required
        autoComplete="off"
        galat={galat?.kunci}
        petunjuk="Nilai KUNCI_DEVELOPER pada berkas lingkungan server."
      />

      <Tombol type="submit" varian="utama" disabled={jalan}>
        {jalan ? "Memeriksa…" : "Masuk"}
      </Tombol>
    </form>
  );
}
