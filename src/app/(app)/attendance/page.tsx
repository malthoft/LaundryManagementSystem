import type { Metadata } from "next";
import { FormAksi } from "@/components/ui/FormAksi";
import { Kartu, IsiKartu, JudulHalaman, KepalaKartu } from "@/components/ui/Kartu";
import { Lencana } from "@/components/ui/Lencana";
import { KeadaanKosong } from "@/components/ui/Keadaan";
import { BarisTabel, KepalaTabel, SelTabel, Tabel } from "@/components/ui/Tabel";
import { TautanTombol } from "@/components/ui/Tombol";
import { absenKeluarAction, absenMasukAction, putuskanAbsensiAction } from "@/controllers/attendance.controller";
import { wajibMasuk } from "@/lib/auth";
import { LABEL_STATUS_ABSEN, NADA_ABSEN } from "@/lib/constants";
import { awalBulan, akhirBulan, hariIni } from "@/lib/date";
import { durasi, jam, selisihMenit, tanggal } from "@/lib/format";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilAbsensiHariIni, ambilAbsensiOrang, ambilSemuaAbsensi } from "@/models/attendance.model";
import type { AbsensiLengkap } from "@/types/domain";

export const metadata: Metadata = { title: "Absensi" };

export default async function HalamanAbsensi({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const profil = await wajibMasuk();
  const admin = profil.role === "Admin";
  const { bulan } = await searchParams;

  const acuan = bulan && /^\d{4}-\d{2}$/.test(bulan) ? `${bulan}-01` : hariIni();
  const mulai = awalBulan(acuan);
  const selesai = akhirBulan(acuan);

  const supabase = await buatKlienServer();
  const daftar: AbsensiLengkap[] = admin
    ? await ambilSemuaAbsensi(supabase, mulai, selesai)
    : (await ambilAbsensiOrang(supabase, profil.id, 60)).map((baris) => ({
        ...baris,
        karyawan: null,
        shift: null,
      }));

  const absensiHariIni = admin
    ? null
    : await ambilAbsensiHariIni(supabase, profil.id, hariIni());

  const menunggu = daftar.filter((baris) => baris.status === "Pending").length;

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul="Absensi"
        keterangan={
          admin
            ? "Setujui atau tolak catatan absensi karyawan. Yang masih menunggu ditandai kuning."
            : "Catatan kehadiran Anda. Ajukan absen masuk saat mulai bekerja dan absen keluar saat selesai."
        }
      />

      {!admin ? (
        <Kartu>
          <KepalaKartu
            judul="Absensi hari ini"
            ikon="badge"
            keterangan={tanggal(hariIni())}
          />
          <IsiKartu className="flex flex-wrap items-end gap-4">
            <div className="min-w-0 flex-1">
              <p className="angka text-kecil text-ink">
                Masuk: {absensiHariIni?.clock_in ? jam(absensiHariIni.clock_in) : "belum"}
              </p>
              <p className="angka text-kecil text-ink">
                Keluar: {absensiHariIni?.clock_out ? jam(absensiHariIni.clock_out) : "belum"}
              </p>
              {absensiHariIni ? (
                <div className="mt-2">
                  <Lencana nada={NADA_ABSEN[absensiHariIni.status]} ikon>
                    {LABEL_STATUS_ABSEN[absensiHariIni.status]}
                  </Lencana>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!absensiHariIni?.clock_in ? (
                <FormAksi
                  aksi={absenMasukAction}
                  muatan={{}}
                  label="Absen masuk"
                  ikon="login"
                  varian="utama"
                  ukuran="sedang"
                />
              ) : null}
              {absensiHariIni?.clock_in && !absensiHariIni?.clock_out ? (
                <FormAksi
                  aksi={absenKeluarAction}
                  muatan={{}}
                  label="Absen keluar"
                  ikon="logout"
                  varian="sekunder"
                  ukuran="sedang"
                />
              ) : null}
              {absensiHariIni?.clock_out ? (
                <span className="text-kecil text-ink-muted">
                  Absensi hari ini sudah lengkap.
                </span>
              ) : null}
            </div>
          </IsiKartu>
        </Kartu>
      ) : null}

      <Kartu>
        <KepalaKartu
          judul={admin ? "Catatan absensi" : "Riwayat absensi saya"}
          ikon="badge"
          keterangan={
            admin
              ? `${daftar.length} catatan, ${menunggu} menunggu`
              : `${daftar.length} catatan terakhir`
          }
          aksi={
            admin ? (
              <form method="get" className="flex flex-wrap items-end gap-2">
                <label htmlFor="bulan" className="text-kecil font-semibold text-ink">
                  Bulan
                </label>
                <input
                  id="bulan"
                  name="bulan"
                  type="month"
                  defaultValue={acuan.slice(0, 7)}
                  className="rounded-sm border border-line bg-surface px-3 py-2 text-kecil text-ink min-h-11"
                />
                <button
                  type="submit"
                  className="joyops-aksi inline-flex min-h-11 items-center rounded-sm border border-line bg-surface px-3 text-kecil font-bold text-ink hover:bg-paper"
                >
                  Tampilkan
                </button>
              </form>
            ) : (
              <TautanTombol href="/my-shift" ikon="event_note">
                Shift saya
              </TautanTombol>
            )
          }
        />

        {daftar.length === 0 ? (
          <KeadaanKosong
            ikon="badge"
            judul="Belum ada catatan absensi"
            keterangan={
              admin
                ? "Belum ada karyawan yang absen pada periode ini."
                : "Lakukan absen masuk untuk membuat catatan pertama."
            }
          />
        ) : (
          <Tabel minWidth="48rem">
            <KepalaTabel
              kolom={[
                ...(admin ? [{ label: "Karyawan" }] : []),
                { label: "Tanggal" },
                { label: "Masuk" },
                { label: "Keluar" },
                { label: "Durasi" },
                { label: "Status" },
                ...(admin ? [{ label: "Keputusan" }] : []),
              ]}
            />
            <tbody>
              {daftar.map((baris) => (
                <BarisTabel key={baris.id}>
                  {admin ? (
                    <SelTabel className="font-semibold">
                      {baris.karyawan?.full_name ?? "-"}
                    </SelTabel>
                  ) : null}
                  <SelTabel className="angka">{tanggal(baris.work_date)}</SelTabel>
                  <SelTabel className="angka">{baris.clock_in ? jam(baris.clock_in) : "-"}</SelTabel>
                  <SelTabel className="angka">
                    {baris.clock_out ? jam(baris.clock_out) : "-"}
                  </SelTabel>
                  <SelTabel className="angka">
                    {baris.clock_in && baris.clock_out
                      ? durasi(selisihMenit(baris.clock_in, baris.clock_out))
                      : "-"}
                  </SelTabel>
                  <SelTabel>
                    <Lencana nada={NADA_ABSEN[baris.status]} ikon>
                      {LABEL_STATUS_ABSEN[baris.status]}
                    </Lencana>
                  </SelTabel>
                  {admin ? (
                    <SelTabel>
                      {baris.status === "Pending" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <FormAksi
                            aksi={putuskanAbsensiAction}
                            muatan={{ id: baris.id, status: "Approved" }}
                            label="Setujui"
                            ikon="check"
                            varian="utama"
                          />
                          <FormAksi
                            aksi={putuskanAbsensiAction}
                            muatan={{ id: baris.id, status: "Rejected" }}
                            label="Tolak"
                            ikon="block"
                            varian="sekunder"
                          />
                        </div>
                      ) : (
                        <span className="text-kecil text-ink-muted">
                          {baris.status === "Approved" ? "Sudah disetujui" : "Sudah ditolak"}
                        </span>
                      )}
                    </SelTabel>
                  ) : null}
                </BarisTabel>
              ))}
            </tbody>
          </Tabel>
        )}
      </Kartu>
    </div>
  );
}
