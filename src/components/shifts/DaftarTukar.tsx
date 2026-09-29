import { FormAksi } from "@/components/ui/FormAksi";
import { Konfirmasi } from "@/components/ui/Konfirmasi";
import { Lencana } from "@/components/ui/Lencana";
import { KeadaanKosong } from "@/components/ui/Keadaan";
import {
  batalkanTukarAction,
  jawabTukarAction,
  putuskanTukarAction,
} from "@/controllers/shift.controller";
import { LABEL_STATUS_TUKAR, NADA_TUKAR } from "@/lib/constants";
import { jam, tanggal } from "@/lib/format";
import type { Peran } from "@/types/db";
import type { PengajuanTukarLengkap } from "@/types/domain";

function rentang(waktu: string): string {
  return jam(`2000-01-01T${waktu}`);
}

/**
 * Daftar pengajuan tukar shift. Tombol yang muncul bergantung pada siapa yang
 * melihat dan pada tahap pengajuan, supaya tidak ada tombol yang tidak berguna.
 */
export function DaftarTukar({
  daftar,
  peran,
  profilId,
  kosong = "Belum ada pengajuan tukar shift.",
}: {
  daftar: PengajuanTukarLengkap[];
  peran: Peran;
  profilId: string;
  kosong?: string;
}) {
  if (daftar.length === 0) {
    return <KeadaanKosong ikon="swap_horiz" judul="Tidak ada pengajuan" keterangan={kosong} />;
  }

  return (
    <ul className="flex flex-col divide-y divide-line">
      {daftar.map((item) => {
        const sayaRekan = item.target_employee_id === profilId;
        const sayaPengaju = item.requester_id === profilId;
        const adminBolehPutuskan = peran === "Admin" && item.status === "Accepted by Employee";

        return (
          <li key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-kecil font-bold text-ink">
                  {item.pemohon?.full_name ?? "Karyawan"} menukar dengan{" "}
                  {item.calon_pengganti?.full_name ?? "rekan"}
                </p>
                <p className="mt-1 text-kecil text-ink-muted">
                  Lepas:{" "}
                  {item.shift_pemohon
                    ? `${tanggal(item.shift_pemohon.work_date)} · ${rentang(
                        item.shift_pemohon.start_time
                      )} sampai ${rentang(item.shift_pemohon.end_time)} · ${
                        item.shift_pemohon.station
                      }`
                    : "-"}
                </p>
                <p className="text-kecil text-ink-muted">
                  Ambil:{" "}
                  {item.shift_target
                    ? `${tanggal(item.shift_target.work_date)} · ${rentang(
                        item.shift_target.start_time
                      )} sampai ${rentang(item.shift_target.end_time)} · ${
                        item.shift_target.station
                      }`
                    : "-"}
                </p>
              </div>
              <Lencana nada={NADA_TUKAR[item.status]} ikon>
                {LABEL_STATUS_TUKAR[item.status]}
              </Lencana>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {item.status === "Pending" && sayaRekan ? (
                <>
                  <FormAksi
                    aksi={jawabTukarAction}
                    muatan={{ id: item.id, setuju: "true" }}
                    label="Terima"
                    ikon="check"
                    varian="utama"
                  />
                  <FormAksi
                    aksi={jawabTukarAction}
                    muatan={{ id: item.id, setuju: "false" }}
                    label="Tolak"
                    ikon="close"
                    varian="sekunder"
                  />
                </>
              ) : null}

              {item.status === "Pending" && sayaPengaju ? (
                <Konfirmasi
                  label="Batalkan pengajuan"
                  ikon="undo"
                  varian="halus"
                  judul="Batalkan pengajuan tukar ini?"
                  pesan="Pengajuan dihapus dan rekan kerja tidak perlu menjawab lagi."
                  labelYa="Batalkan pengajuan"
                  aksi={batalkanTukarAction}
                  muatan={{ id: item.id }}
                />
              ) : null}

              {adminBolehPutuskan ? (
                <>
                  <FormAksi
                    aksi={putuskanTukarAction}
                    muatan={{ id: item.id, setuju: "true" }}
                    label="Setujui"
                    ikon="approval"
                    varian="utama"
                  />
                  <FormAksi
                    aksi={putuskanTukarAction}
                    muatan={{ id: item.id, setuju: "false" }}
                    label="Tolak"
                    ikon="block"
                    varian="sekunder"
                  />
                </>
              ) : null}

              {item.status === "Pending" && !sayaRekan && !sayaPengaju && peran === "Karyawan" ? (
                <span className="text-kecil text-ink-muted">
                  Menunggu jawaban {item.calon_pengganti?.full_name ?? "rekan kerja"}.
                </span>
              ) : null}

              {item.status === "Accepted by Employee" && peran === "Karyawan" ? (
                <span className="text-kecil text-ink-muted">
                  Sudah diterima rekan kerja, menunggu persetujuan Admin.
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
