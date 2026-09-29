import type { Metadata } from "next";
import { DaftarTukar } from "@/components/shifts/DaftarTukar";
import { FormTukar } from "@/components/shifts/FormTukar";
import { FormAksi } from "@/components/ui/FormAksi";
import { Kartu, IsiKartu, JudulHalaman, KepalaKartu } from "@/components/ui/Kartu";
import { Lencana } from "@/components/ui/Lencana";
import { KeadaanKosong, PesanHasil } from "@/components/ui/Keadaan";
import { BarisTabel, KepalaTabel, SelTabel, Tabel } from "@/components/ui/Tabel";
import { TautanTombol } from "@/components/ui/Tombol";
import { absenKeluarAction, absenMasukAction } from "@/controllers/attendance.controller";
import { shiftRekanMingguIni } from "@/controllers/shift.controller";
import { wajibMasuk } from "@/lib/auth";
import {
  LABEL_HARI,
  LABEL_STATUS_ABSEN,
  LABEL_STATUS_SHIFT,
  NADA_ABSEN,
  NADA_SHIFT,
} from "@/lib/constants";
import { tanggal, tanggalJam, jam, selisihMenit, durasi } from "@/lib/format";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilAbsensiHariIni, ambilAbsensiOrang } from "@/models/attendance.model";
import { ambilPengajuanOrang } from "@/models/shift.model";
import { hariIni } from "@/lib/date";

export const metadata: Metadata = { title: "Shift Saya" };

export default async function HalamanShiftSaya() {
  const profil = await wajibMasuk();

  if (profil.role === "Admin") {
    return (
      <div className="flex flex-col gap-5">
        <JudulHalaman judul="Shift Saya" />
        <Kartu>
          <IsiKartu>
            <PesanHasil jenis="info">
              Halaman ini untuk karyawan. Admin mengelola jadwal semua orang di menu Jadwal
              Shift.
            </PesanHasil>
            <div className="mt-4">
              <TautanTombol href="/shifts" ikon="event_note" varian="utama">
                Buka jadwal shift
              </TautanTombol>
            </div>
          </IsiKartu>
        </Kartu>
      </div>
    );
  }

  const supabase = await buatKlienServer();
  const [minggu, absensiHariIni, riwayat, pengajuan] = await Promise.all([
    shiftRekanMingguIni(profil.id),
    ambilAbsensiHariIni(supabase, profil.id, hariIni()),
    ambilAbsensiOrang(supabase, profil.id, 20),
    ambilPengajuanOrang(supabase, profil.id),
  ]);

  const sudahMasuk = Boolean(absensiHariIni?.clock_in);
  const sudahKeluar = Boolean(absensiHariIni?.clock_out);

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul="Shift Saya"
        keterangan={`Minggu ${tanggal(minggu.awal)} sampai ${tanggal(minggu.akhir)}`}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Kartu className="lg:col-span-2">
          <KepalaKartu
            judul="Jadwal saya minggu ini"
            ikon="event_note"
            keterangan={`${minggu.milikSaya.length} shift`}
          />
          {minggu.milikSaya.length === 0 ? (
            <KeadaanKosong
              ikon="event_note"
              judul="Belum ada shift minggu ini"
              keterangan="Jadwal dibuat Admin. Hubungi Admin bila Anda merasa sudah dijadwalkan."
            />
          ) : (
            <Tabel minWidth="34rem">
              <KepalaTabel
                kolom={[
                  { label: "Hari" },
                  { label: "Tanggal" },
                  { label: "Jam" },
                  { label: "Stasiun" },
                  { label: "Status" },
                ]}
              />
              <tbody>
                {minggu.milikSaya.map((shift) => (
                  <BarisTabel key={shift.id}>
                    <SelTabel className="font-semibold">{LABEL_HARI[shift.work_day]}</SelTabel>
                    <SelTabel className="angka">{tanggal(shift.work_date)}</SelTabel>
                    <SelTabel className="angka">
                      {jam(`2000-01-01T${shift.start_time}`)} sampai{" "}
                      {jam(`2000-01-01T${shift.end_time}`)}
                    </SelTabel>
                    <SelTabel>{shift.station}</SelTabel>
                    <SelTabel>
                      <Lencana nada={NADA_SHIFT[shift.status]} ikon>
                        {LABEL_STATUS_SHIFT[shift.status]}
                      </Lencana>
                    </SelTabel>
                  </BarisTabel>
                ))}
              </tbody>
            </Tabel>
          )}
        </Kartu>

        <Kartu>
          <KepalaKartu judul="Absensi hari ini" ikon="badge" keterangan={tanggal(hariIni())} />
          <IsiKartu className="flex flex-col gap-4">
            {absensiHariIni ? (
              <div className="flex flex-col gap-1">
                <p className="angka text-kecil text-ink">
                  Masuk: {absensiHariIni.clock_in ? jam(absensiHariIni.clock_in) : "-"}
                </p>
                <p className="angka text-kecil text-ink">
                  Keluar: {absensiHariIni.clock_out ? jam(absensiHariIni.clock_out) : "-"}
                </p>
                <div>
                  <Lencana nada={NADA_ABSEN[absensiHariIni.status]} ikon>
                    {LABEL_STATUS_ABSEN[absensiHariIni.status]}
                  </Lencana>
                </div>
              </div>
            ) : (
              <p className="text-kecil text-ink-muted">
                Belum ada catatan absensi hari ini.
              </p>
            )}

            {!sudahMasuk ? (
              <FormAksi
                aksi={absenMasukAction}
                muatan={{}}
                label="Absen masuk"
                ikon="login"
                varian="utama"
                ukuran="sedang"
                judulMenunggu="Menyimpan"
              />
            ) : null}

            {sudahMasuk && !sudahKeluar ? (
              <FormAksi
                aksi={absenKeluarAction}
                muatan={{}}
                label="Absen keluar"
                ikon="logout"
                varian="sekunder"
                ukuran="sedang"
                judulMenunggu="Menyimpan"
              />
            ) : null}

            {sudahKeluar ? (
              <PesanHasil jenis="sukses">
                Absensi hari ini lengkap. Menunggu persetujuan Admin.
              </PesanHasil>
            ) : null}
          </IsiKartu>
        </Kartu>
      </div>

      <Kartu>
        <KepalaKartu
          judul="Ajukan tukar shift"
          ikon="swap_horiz"
          keterangan="Tukar hanya berlaku dalam minggu yang sama, dan butuh persetujuan rekan kerja lalu Admin"
        />
        <IsiKartu>
          <FormTukar milikSaya={minggu.milikSaya} milikRekan={minggu.milikRekan} />
        </IsiKartu>
      </Kartu>

      <Kartu>
        <KepalaKartu
          judul="Pengajuan tukar saya"
          ikon="swap_horiz"
          keterangan={`${pengajuan.length} pengajuan`}
        />
        <DaftarTukar
          daftar={pengajuan}
          peran={profil.role}
          profilId={profil.id}
          kosong="Anda belum pernah mengajukan tukar shift."
        />
      </Kartu>

      <Kartu>
        <KepalaKartu
          judul="Riwayat absensi"
          ikon="history"
          keterangan="20 catatan terakhir"
        />
        {riwayat.length === 0 ? (
          <KeadaanKosong
            ikon="badge"
            judul="Belum ada riwayat absensi"
            keterangan="Catatan muncul setelah Anda melakukan absen masuk."
          />
        ) : (
          <Tabel minWidth="34rem">
            <KepalaTabel
              kolom={[
                { label: "Tanggal" },
                { label: "Masuk" },
                { label: "Keluar" },
                { label: "Durasi" },
                { label: "Status" },
              ]}
            />
            <tbody>
              {riwayat.map((baris) => (
                <BarisTabel key={baris.id}>
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
                </BarisTabel>
              ))}
            </tbody>
          </Tabel>
        )}
        <div className="border-t border-line px-4 py-3">
          <p className="angka text-kecil text-ink-muted">
            Catatan terakhir: {riwayat[0] ? tanggalJam(riwayat[0].created_at) : "-"}
          </p>
        </div>
      </Kartu>
    </div>
  );
}
