"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Kolom } from "@/components/ui/Kolom";
import { Tombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { masukDeveloperAction } from "@/controllers/developer.controller";

/**
 * Gerbang masuk halaman developer.
 *
 * Email dan sandi, bukan lagi kunci mentah. Sandi diperiksa di server
 * terhadap hash scrypt yang tersimpan, lalu ditukar dengan cookie sesi
 * bertanda tangan yang berlaku 8 jam.
 */
export function FormKunci({ emailAwal }: { emailAwal?: string }) {
  const [hasil, kirim, jalan] = useActionState(masukDeveloperAction, null);
  const galat = hasil && !hasil.ok ? (hasil.field ?? {}) : {};

  return (
    <form action={kirim} className="grid gap-4">
      {hasil && !hasil.ok ? (
        <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
      ) : null}

      <Kolom
        label="Email developer"
        name="email"
        type="email"
        autoFocus
        required
        autoComplete="username"
        placeholder="nama@contoh.com"
        defaultValue={emailAwal}
        galat={galat?.email}
      />

      <Kolom
        label="Sandi developer"
        name="sandi"
        type="password"
        required
        autoComplete="current-password"
        galat={galat?.sandi}
        petunjuk="Nilai DEVELOPER_PASSWORD pada berkas lingkungan server."
      />

      <Tombol
        type="submit"
        varian="utama"
        lebarPenuh
        ikon="login"
        disabled={jalan}
      >
        {jalan ? "Memeriksa…" : "Masuk"}
      </Tombol>

      <Link
        href="/developer/lupa-sandi"
        className="text-center text-kecil font-medium text-primary hover:underline"
      >
        Lupa sandi developer?
      </Link>
    </form>
  );
}
