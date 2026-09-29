"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Centang, Kolom, Pilihan } from "@/components/ui/Kolom";
import { Tombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import {
  resetSandiAction,
  tambahKaryawanAction,
  ubahKaryawanAction,
} from "@/controllers/employee.controller";
import type { Profil } from "@/types/db";

/** Tambah akun karyawan. Sandi awal diisi Admin, bukan dibuat sistem. */
export function FormKaryawanBaru({ jumlahAdmin }: { jumlahAdmin: number }) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(tambahKaryawanAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;

  useEffect(() => {
    if (hasil?.ok) setBuka(false);
  }, [hasil]);

  return (
    <>
      <Tombol type="button" varian="utama" ikon="person_add" onClick={() => setBuka(true)}>
        Tambah karyawan
      </Tombol>

      <Modal
        buka={buka}
        tutup={() => setBuka(false)}
        judul="Tambah karyawan"
        keterangan="Username dipakai untuk masuk. Sandi awal wajib diganti karyawan lewat menu Pengaturan."
      >
        <form action={kirim} className="flex flex-col gap-4">
          {hasil && !hasil.ok && !galat ? (
            <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Kolom
              label="Nama lengkap"
              name="nama"
              required
              autoFocus
              placeholder="Nama karyawan"
              galat={galat?.nama}
            />
            <Kolom
              label="Username"
              name="username"
              required
              autoCapitalize="none"
              spellCheck={false}
              placeholder="nama.karyawan"
              galat={galat?.username}
              petunjuk="Huruf kecil, angka, titik, garis bawah, atau strip (3 sampai 30)."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Pilihan
              label="Peran"
              name="peran"
              required
              defaultValue="Karyawan"
              galat={galat?.peran}
              opsi={[
                { nilai: "Karyawan", label: "Karyawan" },
                { nilai: "Admin", label: "Admin" },
              ]}
              petunjuk={
                jumlahAdmin <= 1
                  ? "Saat ini hanya ada satu Admin aktif. Menambah Admin kedua membuat Anda tidak terkunci sendiri."
                  : undefined
              }
            />
            <Kolom
              label="Sandi awal"
              name="sandi"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              galat={galat?.sandi}
              petunjuk="Minimal 6 karakter. Beritahukan ke karyawan, minta segera diganti."
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
              Batal
            </Tombol>
            <Tombol type="submit" keadaan={sedangKirim ? "memuat" : "normal"}>
              {sedangKirim ? "Menyimpan" : "Tambah karyawan"}
            </Tombol>
          </div>
        </form>
      </Modal>

      {/* Pesan sukses tetap terlihat setelah dialog menutup. */}
      {hasil?.ok ? <Toast kunci={hasil} pesan={"Karyawan baru tersimpan"} /> : null}
    </>
  );
}

/** Ubah nama, peran, dan status aktif seorang karyawan. */
export function FormUbahKaryawan({ karyawan }: { karyawan: Profil }) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(ubahKaryawanAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;

  useEffect(() => {
    if (hasil?.ok) setBuka(false);
  }, [hasil]);

  return (
    <>
      <Tombol type="button" varian="halus" ukuran="kecil" ikon="edit" onClick={() => setBuka(true)}>
        Ubah
      </Tombol>

      <Modal
        buka={buka}
        tutup={() => setBuka(false)}
        judul={`Ubah ${karyawan.full_name}`}
        keterangan={`Username @${karyawan.username} tidak bisa diubah.`}
        lebar="kecil"
      >
        <form action={kirim} className="flex flex-col gap-4">
          {hasil && !hasil.ok && !galat ? (
            <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
          ) : null}

          <input type="hidden" name="id" value={karyawan.id} />

          <Kolom
            label="Nama lengkap"
            name="nama"
            required
            defaultValue={karyawan.full_name}
            galat={galat?.nama}
          />

          <Pilihan
            label="Peran"
            name="peran"
            required
            defaultValue={karyawan.role}
            galat={galat?.peran}
            opsi={[
              { nilai: "Karyawan", label: "Karyawan" },
              { nilai: "Admin", label: "Admin" },
            ]}
          />

          <Centang
            name="aktif"
            nilai="true"
            label="Akun aktif dan bisa masuk"
            defaultChecked={karyawan.is_active}
          />
          <input type="hidden" name="aktif" value="false" />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
              Batal
            </Tombol>
            <Tombol type="submit" keadaan={sedangKirim ? "memuat" : "normal"}>
              {sedangKirim ? "Menyimpan" : "Simpan perubahan"}
            </Tombol>
          </div>
        </form>
      </Modal>

      {/* Pesan sukses tetap terlihat setelah dialog menutup. */}
      {hasil?.ok ? <Toast kunci={hasil} pesan={"Perubahan karyawan tersimpan"} /> : null}
    </>
  );
}

/** Reset sandi karyawan. Sandi baru ditampilkan sekali supaya bisa diberikan. */
export function FormResetSandi({ karyawan }: { karyawan: Profil }) {
  const [buka, setBuka] = useState(false);
  const [hasil, kirim, sedangKirim] = useActionState(resetSandiAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;

  return (
    <>
      <Tombol
        type="button"
        varian="halus"
        ukuran="kecil"
        ikon="key"
        onClick={() => setBuka(true)}
      >
        Reset sandi
      </Tombol>

      <Modal
        buka={buka}
        tutup={() => setBuka(false)}
        judul={`Reset sandi ${karyawan.full_name}`}
        keterangan="Sandi baru langsung berlaku. Beritahukan ke karyawan dan minta segera diganti."
        lebar="kecil"
      >
        {hasil?.ok ? (
          <div className="flex flex-col gap-4">
            <PesanHasil jenis="sukses">Sandi berhasil direset.</PesanHasil>
            <div className="rounded-sm border border-line bg-paper px-4 py-3">
              <p className="text-kecil text-ink-muted">Sandi baru untuk @{karyawan.username}</p>
              <p className="angka mt-1 text-lg font-extrabold text-ink">{hasil.data.sandi}</p>
            </div>
            <div className="flex justify-end">
              <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
                Tutup
              </Tombol>
            </div>
          </div>
        ) : (
          <form action={kirim} className="flex flex-col gap-4">
            {hasil && !hasil.ok && !galat ? (
              <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
            ) : null}

            <input type="hidden" name="id" value={karyawan.id} />

            <Kolom
              label="Sandi baru"
              name="sandi"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              autoFocus
              galat={galat?.sandi}
              petunjuk="Minimal 6 karakter."
            />

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Tombol type="button" varian="sekunder" onClick={() => setBuka(false)}>
                Batal
              </Tombol>
              <Tombol type="submit" keadaan={sedangKirim ? "memuat" : "normal"}>
                {sedangKirim ? "Menyimpan" : "Reset sandi"}
              </Tombol>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
