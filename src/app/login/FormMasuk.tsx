"use client";

import { useActionState } from "react";
import { masuk } from "@/controllers/auth.controller";
import { Kolom } from "@/components/ui/Kolom";
import { Tombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";

export function FormMasuk() {
  const [hasil, aksi, sedangKirim] = useActionState(masuk, null);
  const galatField = hasil && !hasil.ok ? hasil.field : undefined;

  return (
    <form action={aksi} className="flex flex-col gap-4">
      {hasil && !hasil.ok && !galatField ? (
        <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
      ) : null}

      <Kolom
        label="Username"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        autoFocus
        galat={galatField?.username}
        petunjuk="Huruf kecil, angka, titik, garis bawah, atau strip."
      />

      <Kolom
        label="Sandi"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        galat={galatField?.password}
      />

      <Tombol
        type="submit"
        lebarPenuh
        ikon="login"
        keadaan={sedangKirim ? "memuat" : "normal"}
      >
        {sedangKirim ? "Memeriksa" : "Masuk"}
      </Tombol>
    </form>
  );
}
