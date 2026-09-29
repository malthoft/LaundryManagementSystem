import type { Metadata } from "next";
import Link from "next/link";
import { AntreanPersetujuan } from "@/components/dashboard/AntreanPersetujuan";
import { AlurKerja, QuickAksi } from "@/components/dashboard/QuickAksi";
import { RingkasanMesin } from "@/components/dashboard/RingkasanMesin";
import { TabelOrder } from "@/components/orders/TabelOrder";
import { AngkaPokok } from "@/components/ui/AngkaPokok";
import { Kartu, IsiKartu, KepalaKartu, JudulHalaman } from "@/components/ui/Kartu";
import { Lencana } from "@/components/ui/Lencana";
import { KeadaanKosong } from "@/components/ui/Keadaan";
import { TautanTombol } from "@/components/ui/Tombol";
import { rapikanOrderKedaluwarsa } from "@/controllers/order.controller";
import { wajibMasuk } from "@/lib/auth";
import { LABEL_STATUS_SHIFT, NADA_MESIN, NADA_SHIFT } from "@/lib/constants";
import { hariIni } from "@/lib/date";
import { jam, rupiah, tanggal } from "@/lib/format";
import { buatKlienServer } from "@/lib/supabase/server";
import { hitungAbsensiMenunggu } from "@/models/attendance.model";
import { ambilRingkasanMesin } from "@/models/machine.model";
import { ambilOrderTanggal, ringkasOrderTanggal } from "@/models/order.model";
import { ambilShiftOrang } from "@/models/shift.model";
import { ambilPengajuanTukar } from "@/models/shift.model";
import { ringkasKas } from "@/models/transaction.model";

export const metadata: Metadata = { title: "Dashboard" };

export default async function HalamanDashboard() {
  const profil = await wajibMasuk();
  const admin = profil.role === "Admin";
  const hari = hariIni();

  const supabase = await buatKlienServer();

  /*
   * Rapikan order kedaluwarsa dijalankan BERSAMAAN dengan query lain, bukan
   * di-await sendirian lebih dulu. Sebelumnya ini menambah satu round-trip
   * seriel di depan semua query, padahal tidak ada hasil render yang
   * bergantung padanya: kalau ada order yang lewat, `orderHariIni` tetap
   * berisi order itu sebagai "Berjalan" sampai render berikutnya.
   * Hasilnya tidak dipakai, tapi tetap ikut di-`await` supaya tidak ada
   * promise yang menggantung. Ditaruh di slot terakhir supaya tidak
   * menggeser variabel lain.
   */
  const [
    ringkasanMesin,
    orderHariIni,
    ringkasOrder,
    kas,
    tukar,
    absenMenunggu,
    ,
  ] = await Promise.all([
    ambilRingkasanMesin(supabase),
    ambilOrderTanggal(supabase, hari),
    ringkasOrderTanggal(supabase, hari),
    admin
      ? ringkasKas(supabase, { mulai: hari, selesai: hari, jenis: "hari" })
      : Promise.resolve(null),
    admin ? ambilPengajuanTukar(supabase, { hanyaMenungguAdmin: true }) : Promise.resolve([]),
    admin ? hitungAbsensiMenunggu(supabase) : Promise.resolve(0),
    rapikanOrderKedaluwarsa(),
  ]);

  const shiftSaya = admin ? [] : await ambilShiftOrang(supabase, profil.id, hari, hari);
  const orderBerjalan = orderHariIni.filter((item) => item.status === "Berjalan");

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul={`Selamat bekerja, ${profil.full_name.split(" ")[0]}`}
        keterangan={tanggal(hari)}
      />

      {/* Aksi utama di dashboard. "Order baru" tidak lagi ada di sidebar.
          Tautan ini ke /orders?aksi=baru, jadi dashboard tidak perlu menarik
          data mesin, layanan, dan add-on hanya untuk menyiapkan modal. */}
      <QuickAksi admin={admin} />

      <AlurKerja
        diterima={orderHariIni.length}
        dicuci={orderBerjalan.length}
        selesai={orderHariIni.filter((o) => o.status === "Selesai").length}
        lunas={kas ? kas.jumlahTransaksi : 0}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {admin && kas ? (
          <>
            <AngkaPokok
              label="Pendapatan hari ini"
              nilai={rupiah(kas.pemasukan)}
              ikon="payments"
              nada="text-primary"
              keterangan={`${kas.jumlahTransaksi} transaksi tercatat`}
            />
            <AngkaPokok
              label="Pengeluaran hari ini"
              nilai={rupiah(kas.pengeluaran)}
              ikon="receipt"
              nada="text-danger"
            />
          </>
        ) : null}

        <AngkaPokok
          label="Order berjalan"
          nilai={String(orderBerjalan.length)}
          ikon="autorenew"
          nada="text-busy"
          keterangan={`${ringkasOrder.jumlah} order dibuat hari ini`}
        />
        <AngkaPokok
          label="Mesin tersedia"
          nilai={`${ringkasanMesin.tersedia} / ${ringkasanMesin.total}`}
          ikon="check_circle"
          nada="text-ok"
          keterangan="Siap dipakai order baru"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RingkasanMesin ringkasan={ringkasanMesin} />
        {admin ? (
          <AntreanPersetujuan tukar={tukar} absenMenunggu={absenMenunggu} />
        ) : (
          <Kartu>
            <KepalaKartu judul="Shift saya hari ini" ikon="event_note" />
            <IsiKartu className="flex flex-col gap-3">
              {shiftSaya.length === 0 ? (
                <p className="text-kecil text-ink-muted">
                  Tidak ada shift untuk Anda hari ini.
                </p>
              ) : (
                shiftSaya.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-line px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="angka text-kecil font-bold text-ink">
                        {jam(`2000-01-01T${shift.start_time}`)} sampai{" "}
                        {jam(`2000-01-01T${shift.end_time}`)}
                      </p>
                      <p className="text-kecil text-ink-muted">{shift.station}</p>
                    </div>
                    <Lencana nada={NADA_SHIFT[shift.status]} ikon>
                      {LABEL_STATUS_SHIFT[shift.status]}
                    </Lencana>
                  </div>
                ))
              )}
              <TautanTombol href="/my-shift" ikon="event_note">
                Buka shift saya
              </TautanTombol>
            </IsiKartu>
          </Kartu>
        )}
      </div>

      <Kartu>
        <KepalaKartu
          judul="Order hari ini"
          ikon="receipt_long"
          keterangan={`${orderHariIni.length} order`}
          aksi={
            <TautanTombol href="/orders" ikon="list">
              Semua order
            </TautanTombol>
          }
        />
        {orderHariIni.length === 0 ? (
          <KeadaanKosong
            ikon="receipt_long"
            judul="Belum ada order hari ini"
            keterangan="Mulai dengan membuat order pertama untuk pelanggan."
            aksi={
              <TautanTombol href="/orders?aksi=baru" varian="utama" ikon="add">
                Buat order
              </TautanTombol>
            }
          />
        ) : (
          <TabelOrder daftar={orderHariIni.slice(0, 8)} bolehBatalkan={admin} tampilkanPembuat />
        )}
        {orderHariIni.length > 8 ? (
          <div className="border-t border-line px-4 py-3">
            <Link
              href="/orders"
              className="joyops-aksi inline-flex min-h-11 items-center text-kecil font-bold text-primary hover:underline"
            >
              Lihat semua order
            </Link>
          </div>
        ) : null}
      </Kartu>

      <p className="flex flex-wrap items-center gap-2 text-kecil text-ink-muted">
        <span>Mesin berstatus</span>
        <Lencana nada={NADA_MESIN.Digunakan}>Digunakan</Lencana>
        <span>atau</span>
        <Lencana nada={NADA_MESIN.Maintenance}>Perawatan</Lencana>
        <span>tidak bisa dipilih saat membuat order.</span>
      </p>
    </div>
  );
}
