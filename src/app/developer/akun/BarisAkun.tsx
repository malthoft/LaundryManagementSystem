"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Lencana } from "@/components/ui/Lencana";
import { Tombol } from "@/components/ui/Tombol";
import { NADA_AKTIF } from "@/lib/constants";
import {
  ubahAkunAction,
  ubahStatusAkunAction,
  resetSandiAkunAction,
} from "@/controllers/developer.controller";

type Akun = {
  id: string;
  username: string;
  nama: string;
  peran: string;
  aktif: boolean;
  dibuat: string;
};

const INISIAL: Record<string, string> = {
  Admin: "shield_person",
  Karyawan: "badge",
};

/**
 * Satu baris akun beserta panel ubahnya.
 *
 * Bentuknya daftar yang bisa dibuka satu per satu, bukan modal, supaya
 * developer bisa membandingkan beberapa akun tanpa kehilangan posisi gulir.
 * Setiap panel memakai server action sendiri, jadi pemeriksaan sesi tetap
 * jalan di server walau tombolnya dipanggil langsung.
 */
export function BarisAkun({
  akun,
  adminTerakhir,
  tanggal,
}: {
  akun: Akun;
  adminTerakhir: boolean;
  tanggal: string;
}) {
  const [buka, setBuka] = useState(false);

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden="true"
          className="material-symbols-outlined shrink-0 text-2xl text-primary"
        >
          {INISIAL[akun.peran] ?? "person"}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-ink">{akun.nama}</p>
            <Lencana nada={akun.aktif ? NADA_AKTIF.aktif : NADA_AKTIF.nonaktif}>
              {akun.aktif ? "Aktif" : "Nonaktif"}
            </Lencana>
            <span className="rounded-sm border border-line px-2 py-1 text-mini font-semibold text-ink-muted">
              {akun.peran}
            </span>
          </div>
          <p className="mt-0.5 truncate text-kecil text-ink-muted">
            {akun.username} · terdaftar {tanggal}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Tombol
            ukuran="kecil"
            varian="sekunder"
            ikon={buka ? "expand_less" : "tune"}
            onClick={() => setBuka((n) => !n)}
          >
            {buka ? "Tutup" : "Atur"}
          </Tombol>
        </div>
      </div>

      {buka ? (
        <div className="mt-3 space-y-4 rounded-sm border border-line bg-paper p-4">
          {adminTerakhir ? (
            <p className="flex items-start gap-2 rounded-sm border border-danger bg-danger-soft px-3 py-2 text-kecil text-danger">
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                warning
              </span>
              <span>
                Ini satu-satunya Admin aktif. Menurunkan perannya atau
                menonaktifkannya akan mengunci aplikasi.
              </span>
            </p>
          ) : null}

          <FormUbahAkun akun={akun} />
          <FormResetSandi akun={akun} />
          <FormStatusAkun akun={akun} />
        </div>
      ) : null}
    </li>
  );
}

function FormUbahAkun({ akun }: { akun: Akun }) {
  const [hasil, kirim, sedangKirim] = useActionState(ubahAkunAction, null);

  return (
    <form action={kirim} className="space-y-3">
      <input type="hidden" name="id" value={akun.id} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-kecil font-semibold text-ink">Nama</span>
          <input
            name="nama"
            defaultValue={akun.nama}
            required
            maxLength={100}
            className="mt-1 min-h-11 w-full rounded-sm border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="text-kecil font-semibold text-ink">Peran</span>
          <select
            name="peran"
            defaultValue={akun.peran}
            className="mt-1 min-h-11 w-full rounded-sm border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="Karyawan">Karyawan</option>
            <option value="Admin">Admin</option>
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-kecil text-ink">
        <input
          type="checkbox"
          name="aktif"
          value="true"
          defaultChecked={akun.aktif}
          className="size-4 accent-[var(--primary)]"
        />
        Akun aktif
      </label>

      <div className="flex items-center gap-3">
        <Tombol
          type="submit"
          ukuran="kecil"
          ikon="save"
          keadaan={sedangKirim ? "memuat" : "normal"}
        >
          {sedangKirim ? "Menyimpan..." : "Simpan perubahan"}
        </Tombol>
        {hasil?.ok ? (
          <span role="status" className="text-kecil font-medium text-primary">
            Tersimpan.
          </span>
        ) : null}
        {hasil && !hasil.ok ? (
          <span role="alert" className="text-kecil font-medium text-danger">
            {hasil.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function FormResetSandi({ akun }: { akun: Akun }) {
  const [hasil, kirim, sedangKirim] = useActionState(resetSandiAkunAction, null);
  const [sandi, setSandi] = useState("");

  return (
    <form action={kirim} className="space-y-2">
      <input type="hidden" name="id" value={akun.id} />
      <p className="text-kecil font-semibold text-ink">Reset sandi</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[12rem]">
          <span className="text-kecil text-ink-muted">Sandi baru</span>
          <input
            name="sandi"
            type="text"
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
            required
            minLength={6}
            maxLength={72}
            autoComplete="off"
            placeholder="Minimal 6 karakter"
            className="mt-1 min-h-11 w-full rounded-sm border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <Tombol
          type="submit"
          ukuran="kecil"
          varian="sekunder"
          ikon="password"
          keadaan={sedangKirim ? "memuat" : "normal"}
        >
          {sedangKirim ? "Mereset..." : "Reset sandi"}
        </Tombol>
      </div>
      {hasil?.ok ? (
        <p role="status" className="text-kecil font-medium text-primary">
          Sandi {akun.username} sekarang: <strong>{hasil.data.sandi}</strong>
        </p>
      ) : null}
      {hasil && !hasil.ok ? (
        <p role="alert" className="text-kecil font-medium text-danger">
          {hasil.error}
        </p>
      ) : null}
    </form>
  );
}

function FormStatusAkun({ akun }: { akun: Akun }) {
  const [hasil, kirim, sedangKirim] = useActionState(ubahStatusAkunAction, null);

  return (
    <form action={kirim} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={akun.id} />
      <input type="hidden" name="aktif" value={akun.aktif ? "false" : "true"} />
      <Tombol
        type="submit"
        ukuran="kecil"
        varian={akun.aktif ? "bahaya" : "utama"}
        ikon={akun.aktif ? "person_off" : "person_check"}
        keadaan={sedangKirim ? "memuat" : "normal"}
      >
        {sedangKirim
          ? "Memproses..."
          : akun.aktif
            ? "Nonaktifkan akun"
            : "Aktifkan akun"}
      </Tombol>
      {hasil && !hasil.ok ? (
        <span role="alert" className="text-kecil font-medium text-danger">
          {hasil.error}
        </span>
      ) : null}
    </form>
  );
}
