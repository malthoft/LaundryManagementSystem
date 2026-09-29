import { FormMesin } from "@/components/machines/FormMesin";
import { FormAksi } from "@/components/ui/FormAksi";
import { Konfirmasi } from "@/components/ui/Konfirmasi";
import { Lencana } from "@/components/ui/Lencana";
import { hapusMesinAction, ubahStatusMesinAction } from "@/controllers/machine.controller";
import { LABEL_STATUS_MESIN, NADA_MESIN } from "@/lib/constants";
import { tanggalJam } from "@/lib/format";
import type { Mesin } from "@/types/db";

/**
 * Satu mesin, satu kartu. Tombol yang muncul mengikuti peran: karyawan hanya
 * melihat, Admin bisa mengubah status, mengubah data, dan menghapus.
 */
export function KartuMesin({ mesin, admin }: { mesin: Mesin; admin: boolean }) {
  const nada = NADA_MESIN[mesin.status];
  const bisaHapus = mesin.status !== "Digunakan";

  return (
    <li className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="angka font-display text-sedang font-extrabold text-ink">
            {mesin.machine_code}
          </p>
          <p className="mt-0.5 break-words text-kecil text-ink-muted">
            {mesin.machine_type}
          </p>
        </div>
        <Lencana nada={nada} ikon>
          {LABEL_STATUS_MESIN[mesin.status]}
        </Lencana>
      </div>

      <p className="angka text-mini text-ink-muted">
        Terakhir dipakai: {mesin.last_used ? tanggalJam(mesin.last_used) : "belum pernah"}
      </p>

      {admin ? (
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {mesin.status !== "Tersedia" ? (
            <FormAksi
              aksi={ubahStatusMesinAction}
              muatan={{ id: mesin.id, status: "Tersedia" }}
              label="Tandai tersedia"
              ikon="check_circle"
              varian="sekunder"
            />
          ) : null}

          {mesin.status !== "Maintenance" ? (
            <FormAksi
              aksi={ubahStatusMesinAction}
              muatan={{ id: mesin.id, status: "Maintenance" }}
              label="Perawatan"
              ikon="build"
              varian="halus"
            />
          ) : null}

          <FormMesin
            mesin={mesin}
            label="Ubah"
            ikon="edit"
            varian="halus"
            ukuran="kecil"
          />

          {bisaHapus ? (
            <Konfirmasi
              label="Hapus"
              ikon="delete"
              varian="halus"
              judul={`Hapus mesin ${mesin.machine_code}?`}
              pesan="Mesin hilang dari daftar dan tidak bisa dipakai order baru. Riwayat order lama tetap tersimpan."
              labelYa="Hapus mesin"
              aksi={hapusMesinAction}
              muatan={{ id: mesin.id }}
            />
          ) : null}
        </div>
      ) : null}

      {admin && !bisaHapus ? (
        <p className="text-mini text-ink-muted">
          Mesin yang sedang digunakan tidak bisa dihapus. Tandai selesai ordernya dulu.
        </p>
      ) : null}
    </li>
  );
}
