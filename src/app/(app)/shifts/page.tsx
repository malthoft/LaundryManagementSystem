import type { Metadata } from "next";
import { DaftarTukar } from "@/components/shifts/DaftarTukar";
import { FormBentukJadwal, FormShift, FormTemplate } from "@/components/shifts/FormShift";
import { Kartu, IsiKartu, JudulHalaman, KepalaKartu } from "@/components/ui/Kartu";
import { Konfirmasi } from "@/components/ui/Konfirmasi";
import { Lencana } from "@/components/ui/Lencana";
import { KeadaanKosong, PesanHasil } from "@/components/ui/Keadaan";
import { BarisTabel, KepalaTabel, SelTabel, Tabel } from "@/components/ui/Tabel";
import { hapusShiftAction, hapusTemplateAction } from "@/controllers/shift.controller";
import { wajibMasuk } from "@/lib/auth";
import {
  JAM_SHIFT,
  LABEL_HARI,
  LABEL_STATUS_SHIFT,
  NADA_SHIFT,
  URUTAN_HARI,
} from "@/lib/constants";
import { akhirMinggu, awalMinggu, hariIni } from "@/lib/date";
import { jam, tanggal } from "@/lib/format";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilProfilAktif } from "@/models/profile.model";
import { ambilPengajuanTukar, ambilShiftRentang, ambilTemplateShift } from "@/models/shift.model";

export const metadata: Metadata = { title: "Jadwal Shift" };

export default async function HalamanShift() {
  const profil = await wajibMasuk();

  if (profil.role !== "Admin") {
    return (
      <div className="flex flex-col gap-5">
        <JudulHalaman judul="Jadwal Shift" />
        <Kartu>
          <IsiKartu>
            <PesanHasil jenis="info">
              Halaman ini untuk Admin. Jadwal pribadi Anda ada di menu Shift Saya.
            </PesanHasil>
          </IsiKartu>
        </Kartu>
      </div>
    );
  }

  const awal = awalMinggu(hariIni());
  const akhir = akhirMinggu(hariIni());

  const supabase = await buatKlienServer();
  const [jadwal, pola, pengajuan, karyawan] = await Promise.all([
    ambilShiftRentang(supabase, awal, akhir),
    ambilTemplateShift(supabase),
    ambilPengajuanTukar(supabase),
    ambilProfilAktif(supabase),
  ]);

  const menungguAdmin = pengajuan.filter((item) => item.status === "Accepted by Employee");

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul="Jadwal Shift"
        keterangan={`Minggu ${tanggal(awal)} sampai ${tanggal(akhir)}`}
      />

      <Kartu>
        <KepalaKartu
          judul="Jadwal minggu ini"
          ikon="event_note"
          keterangan={`${jadwal.length} shift`}
          aksi={
            <div className="flex flex-wrap items-center gap-2">
              <FormBentukJadwal />
              <FormShift karyawan={karyawan} />
            </div>
          }
        />
        {jadwal.length === 0 ? (
          <KeadaanKosong
            ikon="event_note"
            judul="Belum ada shift minggu ini"
            keterangan="Tambahkan pola shift berulang, lalu bentuk jadwal sekali klik. Atau tambah shift satu per satu."
            aksi={<FormShift karyawan={karyawan} />}
          />
        ) : (
          <div className="flex flex-col">
            {URUTAN_HARI.filter((hari) =>
              jadwal.some((shift) => shift.work_day === hari)
            ).map((hari) => {
              const daftarHari = jadwal.filter((shift) => shift.work_day === hari);
              const contoh = daftarHari[0];

              return (
                <section key={hari} className="border-b border-line last:border-b-0">
                  <header className="flex flex-wrap items-baseline justify-between gap-2 bg-paper px-4 py-2.5 sm:px-5">
                    <h3 className="font-display text-sedang font-bold text-ink">
                      {LABEL_HARI[hari]}
                    </h3>
                    <p className="angka text-kecil text-ink-muted">
                      {tanggal(contoh.work_date)}
                    </p>
                  </header>
                  <Tabel minWidth="40rem">
                    <KepalaTabel
                      kolom={[
                        { label: "Karyawan" },
                        { label: "Jam" },
                        { label: "Stasiun" },
                        { label: "Status" },
                        { label: "Aksi" },
                      ]}
                    />
                    <tbody>
                      {daftarHari.map((shift) => (
                        <BarisTabel key={shift.id}>
                          <SelTabel className="font-semibold">
                            {shift.pemilik?.full_name ?? "-"}
                          </SelTabel>
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
                          <SelTabel>
                            <Konfirmasi
                              label="Hapus"
                              ikon="delete"
                              varian="halus"
                              judul={`Hapus shift ${shift.pemilik?.full_name ?? "ini"}?`}
                              pesan="Shift dihapus dari jadwal. Absensi dan pengajuan tukar yang menempel ikut terhapus."
                              labelYa="Hapus shift"
                              aksi={hapusShiftAction}
                              muatan={{ id: shift.id }}
                            />
                          </SelTabel>
                        </BarisTabel>
                      ))}
                    </tbody>
                  </Tabel>
                </section>
              );
            })}
          </div>
        )}
      </Kartu>

      <Kartu>
        <KepalaKartu
          judul="Pengajuan tukar shift"
          ikon="swap_horiz"
          keterangan={
            menungguAdmin.length > 0
              ? `${menungguAdmin.length} menunggu keputusan Anda`
              : `${pengajuan.length} pengajuan`
          }
        />
        <DaftarTukar daftar={pengajuan} peran={profil.role} profilId={profil.id} />
      </Kartu>

      <Kartu>
        <KepalaKartu
          judul="Pola shift berulang"
          ikon="event_repeat"
          keterangan={`${pola.length} pola`}
          aksi={<FormTemplate karyawan={karyawan} />}
        />
        {pola.length === 0 ? (
          <KeadaanKosong
            ikon="event_repeat"
            judul="Belum ada pola shift"
            keterangan="Pola menentukan jadwal yang berulang tiap minggu, misalnya Selasa Shift 1 di Kasir."
            aksi={<FormTemplate karyawan={karyawan} />}
          />
        ) : (
          <Tabel minWidth="40rem">
            <KepalaTabel
              kolom={[
                { label: "Karyawan" },
                { label: "Hari" },
                { label: "Shift" },
                { label: "Jam" },
                { label: "Stasiun" },
                { label: "Aksi" },
              ]}
            />
            <tbody>
              {pola.map((item) => (
                <BarisTabel key={item.id}>
                  <SelTabel className="font-semibold">
                    {karyawan.find((orang) => orang.id === item.profile_id)?.full_name ??
                      "Karyawan tidak aktif"}
                  </SelTabel>
                  <SelTabel>{LABEL_HARI[item.day_of_week]}</SelTabel>
                  <SelTabel>{item.shift_type}</SelTabel>
                  <SelTabel className="angka">
                    {JAM_SHIFT[item.shift_type].mulai} sampai {JAM_SHIFT[item.shift_type].selesai}
                  </SelTabel>
                  <SelTabel>{item.station}</SelTabel>
                  <SelTabel>
                    <Konfirmasi
                      label="Hapus"
                      ikon="delete"
                      varian="halus"
                      judul="Hapus pola shift ini?"
                      pesan="Pola dihapus. Jadwal yang sudah terbentuk sebelumnya tidak ikut terhapus."
                      labelYa="Hapus pola"
                      aksi={hapusTemplateAction}
                      muatan={{ id: item.id }}
                    />
                  </SelTabel>
                </BarisTabel>
              ))}
            </tbody>
          </Tabel>
        )}
        <div className="border-t border-line px-4 py-3">
          <p className="text-kecil text-ink-muted">
            Setelah pola berubah, tekan Bentuk jadwal untuk mengisi minggu yang dipilih. Hari
            yang sudah punya shift akan dilewati, jadi tidak ada jadwal ganda.
          </p>
        </div>
      </Kartu>

      <Kartu>
        <KepalaKartu judul="Ringkasan" ikon="insights" />
        <IsiKartu className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="angka text-2xl font-extrabold text-ink">{jadwal.length}</p>
            <p className="text-kecil text-ink-muted">Shift minggu ini</p>
          </div>
          <div>
            <p className="angka text-2xl font-extrabold text-ink">{pola.length}</p>
            <p className="text-kecil text-ink-muted">Pola berulang</p>
          </div>
          <div>
            <p className="angka text-2xl font-extrabold text-busy">{menungguAdmin.length}</p>
            <p className="text-kecil text-ink-muted">Menunggu keputusan</p>
          </div>
          <div>
            <p className="angka text-2xl font-extrabold text-ink">{karyawan.length}</p>
            <p className="text-kecil text-ink-muted">Karyawan aktif</p>
          </div>
        </IsiKartu>
      </Kartu>
    </div>
  );
}
