"use client";

import { useActionState } from "react";
import { Kolom } from "@/components/ui/Kolom";
import { Tombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { aturSandiAction } from "@/controllers/akun.controller";

/**
 * Penukaran tautan reset dengan sandi baru.
 *
 * Tokennya dibawa sebagai isian tersembunyi dari alamat halaman, karena tautan
 * inilah satu-satunya bukti kepemilikan saat halaman dibuka tanpa sesi.
 */
export function FormAturSandi({ token }: { token: string }) {
  const [hasil, kirim, jalan] = useActionState(aturSandiAction, null);
  const galat = hasil && !hasil.ok ? (hasil.field ?? {}) : {};

  return (
    <form action={kirim} className="grid gap-3">
      {hasil && !hasil.ok ? (
        <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
      ) : null}

      <input type="hidden" name="token" value={token} />

      {/* Galat token sengaja ditampilkan: isian ini tersembunyi, dan kalau
          galatnya ikut tersembunyi penyebabnya jadi tidak terbaca. */}
      {galat?.token ? (
        <PesanHasil jenis="gagal">
          {galat.token} Minta developer menerbitkan tautan baru.
        </PesanHasil>
      ) : null}

      <Kolom
        label="Sandi baru"
        name="sandiBaru"
        type="password"
        required
        autoFocus
        autoComplete="new-password"
        maxLength={72}
        galat={galat?.sandiBaru}
        petunjuk="6–72 karakter."
      />

      <Kolom
        label="Ulangi sandi baru"
        name="ulangi"
        type="password"
        required
        autoComplete="new-password"
        maxLength={72}
        galat={galat?.ulangi}
      />

      <Tombol type="submit" varian="utama" disabled={jalan}>
        {jalan ? "Menyimpan…" : "Simpan sandi baru"}
      </Tombol>
    </form>
  );
}
