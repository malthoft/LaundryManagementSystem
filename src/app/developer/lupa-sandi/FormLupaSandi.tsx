"use client";

import { useActionState } from "react";
import { Kolom } from "@/components/ui/Kolom";
import { Tombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { lupaSandiDeveloperAction } from "@/controllers/developer.controller";

/**
 * Permintaan tautan atur ulang sandi developer.
 *
 * Bila surel sudah diatur, tautannya hanya dikirim ke kotak masuk. Bila belum
 * (dan aplikasi tidak berjalan di produksi), tautannya ditampilkan di layar
 * supaya pengembangan tidak terhenti.
 */
export function FormLupaSandiDeveloper({ emailAwal }: { emailAwal?: string }) {
  const [hasil, kirim, jalan] = useActionState(lupaSandiDeveloperAction, null);
  const galat = hasil && !hasil.ok ? (hasil.field ?? {}) : {};

  if (hasil?.ok) {
    return (
      <div className="grid gap-3">
        <PesanHasil jenis="sukses">{hasil.data?.pesan}</PesanHasil>
        {hasil.data?.tautan ? (
          <p className="break-all rounded-sm border border-line bg-paper px-3 py-2.5 font-numeric text-kecil text-ink">
            {hasil.data.tautan}
          </p>
        ) : null}
      </div>
    );
  }

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

      <Tombol
        type="submit"
        varian="utama"
        lebarPenuh
        ikon="mail"
        disabled={jalan}
      >
        {jalan ? "Mengirim…" : "Kirim tautan atur ulang"}
      </Tombol>
    </form>
  );
}
