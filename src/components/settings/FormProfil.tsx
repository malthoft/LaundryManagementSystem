"use client";

import { useActionState } from "react";
import { gantiSandiSaya, ubahProfilSaya } from "@/controllers/auth.controller";
import { Kolom } from "@/components/ui/Kolom";
import { Tombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";

/** Ubah nama tampilan sendiri. Peran dan username tidak bisa diubah dari sini. */
export function FormProfil({ nama }: { nama: string }) {
  const [hasil, kirim, sedangKirim] = useActionState(ubahProfilSaya, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;

  return (
    <form action={kirim} className="flex flex-col gap-4">
      {hasil?.ok ? <PesanHasil jenis="sukses">Nama berhasil disimpan.</PesanHasil> : null}
      {hasil && !hasil.ok && !galat ? <PesanHasil jenis="gagal">{hasil.error}</PesanHasil> : null}

      <Kolom
        label="Nama lengkap"
        name="nama"
        required
        defaultValue={nama}
        galat={galat?.nama}
        petunjuk="Nama ini yang tampil pada order, jadwal shift, dan absensi."
      />

      <div className="flex justify-end">
        <Tombol type="submit" ikon="save" keadaan={sedangKirim ? "memuat" : "normal"}>
          {sedangKirim ? "Menyimpan" : "Simpan nama"}
        </Tombol>
      </div>
    </form>
  );
}

/** Ganti sandi sendiri. Sandi lama tidak diminta karena sesi sudah sah. */
export function FormGantiSandi() {
  const [hasil, kirim, sedangKirim] = useActionState(gantiSandiSaya, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;

  return (
    <form action={kirim} className="flex flex-col gap-4">
      {hasil?.ok ? (
        <PesanHasil jenis="sukses">Sandi berhasil diubah. Pakai sandi baru saat masuk berikutnya.</PesanHasil>
      ) : null}
      {hasil && !hasil.ok && !galat ? <PesanHasil jenis="gagal">{hasil.error}</PesanHasil> : null}

      <Kolom
        label="Sandi baru"
        name="sandiBaru"
        type="password"
        autoComplete="new-password"
        required
        minLength={6}
        galat={galat?.sandiBaru}
        petunjuk="Minimal 6 karakter. Jangan pakai sandi yang sama dengan layanan lain."
      />

      <Kolom
        label="Ulangi sandi baru"
        name="ulangi"
        type="password"
        autoComplete="new-password"
        required
        minLength={6}
        galat={galat?.ulangi}
      />

      <div className="flex justify-end">
        <Tombol type="submit" ikon="key" keadaan={sedangKirim ? "memuat" : "normal"}>
          {sedangKirim ? "Menyimpan" : "Ganti sandi"}
        </Tombol>
      </div>
    </form>
  );
}
