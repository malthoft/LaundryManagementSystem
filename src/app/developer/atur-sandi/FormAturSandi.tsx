"use client";

import { useActionState } from "react";
import { Kolom } from "@/components/ui/Kolom";
import { Tombol, TautanTombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { aturSandiDeveloperAction } from "@/controllers/developer.controller";

/**
 * Penukaran token dari surel dengan sandi developer yang baru.
 *
 * Tokennya dibawa sebagai isian tersembunyi dari alamat halaman, karena
 * tautan inilah satu-satunya bukti kepemilikan saat halaman dibuka tanpa sesi.
 */
export function FormAturSandiDeveloper({ token }: { token: string }) {
  const [hasil, kirim, jalan] = useActionState(aturSandiDeveloperAction, null);
  const galat = hasil && !hasil.ok ? (hasil.field ?? {}) : {};

  if (hasil?.ok) {
    return (
      <div className="grid gap-3">
        <PesanHasil jenis="sukses">
          Sandi developer sudah diperbarui. Silakan masuk memakai sandi baru.
        </PesanHasil>
        <TautanTombol href="/developer" varian="utama" ikon="login" className="w-full">
          Masuk ke halaman developer
        </TautanTombol>
      </div>
    );
  }

  return (
    <form action={kirim} className="grid gap-4">
      {hasil && !hasil.ok ? (
        <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
      ) : null}

      <input type="hidden" name="token" value={token} />

      {/* Galat token sengaja ditampilkan: isian ini tersembunyi, dan kalau
          galatnya ikut tersembunyi penyebabnya jadi tidak terbaca. */}
      {galat?.token ? (
        <PesanHasil jenis="gagal">
          {galat.token} Minta tautan baru lewat halaman lupa sandi.
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

      <Tombol type="submit" varian="utama" lebarPenuh ikon="save" disabled={jalan}>
        {jalan ? "Menyimpan…" : "Simpan sandi baru"}
      </Tombol>
    </form>
  );
}
