import type { Metadata } from "next";
import { FilterPeriode } from "@/components/finance/FilterPeriode";
import { FormTransaksi } from "@/components/finance/FormTransaksi";
import { AngkaPokok } from "@/components/ui/AngkaPokok";
import { Kartu, JudulHalaman, KepalaKartu } from "@/components/ui/Kartu";
import { Konfirmasi } from "@/components/ui/Konfirmasi";
import { Lencana } from "@/components/ui/Lencana";
import { KeadaanKosong, PesanHasil } from "@/components/ui/Keadaan";
import { BarisTabel, KepalaTabel, SelTabel, Tabel } from "@/components/ui/Tabel";
import { hapusTransaksiAction } from "@/controllers/finance.controller";
import { wajibMasuk } from "@/lib/auth";
import { hariIni, hitungPeriode, keNilaiMinggu } from "@/lib/date";
import { rupiah, tanggal, tanggalJam } from "@/lib/format";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilTransaksi, ringkasKas } from "@/models/transaction.model";
import type { JenisPeriode } from "@/types/domain";

export const metadata: Metadata = { title: "Keuangan" };

const JENIS_SAH: JenisPeriode[] = ["hari", "minggu", "bulan", "tahun", "bebas"];

export default async function HalamanKeuangan({
  searchParams,
}: {
  searchParams: Promise<{
    jenis?: string;
    bulan?: string;
    tahun?: string;
    minggu?: string;
    mulai?: string;
    selesai?: string;
  }>;
}) {
  const profil = await wajibMasuk();

  if (profil.role !== "Admin") {
    return (
      <div className="flex flex-col gap-5">
        <JudulHalaman judul="Keuangan" />
        <Kartu>
          <PesanHasil jenis="info">
            Buku kas hanya bisa dibuka Admin. Hubungi Admin bila Anda butuh laporan.
          </PesanHasil>
        </Kartu>
      </div>
    );
  }

  const kueri = await searchParams;
  const jenis: JenisPeriode = JENIS_SAH.includes(kueri.jenis as JenisPeriode)
    ? (kueri.jenis as JenisPeriode)
    : "bulan";

  const periode = hitungPeriode(jenis, {
    bulan: kueri.bulan,
    tahun: kueri.tahun,
    minggu: kueri.minggu,
    mulai: kueri.mulai,
    selesai: kueri.selesai,
  });

  const supabase = await buatKlienServer();
  const [ringkasan, transaksi] = await Promise.all([
    ringkasKas(supabase, periode),
    ambilTransaksi(supabase, periode),
  ]);

  const tautanEkspor = `/finance/ekspor?jenis=${jenis}${
    kueri.bulan ? `&bulan=${kueri.bulan}` : ""
  }${kueri.tahun ? `&tahun=${kueri.tahun}` : ""}${kueri.minggu ? `&minggu=${kueri.minggu}` : ""}${
    kueri.mulai ? `&mulai=${kueri.mulai}` : ""
  }${kueri.selesai ? `&selesai=${kueri.selesai}` : ""}`;

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul="Keuangan"
        keterangan="Pemasukan dari order tercatat otomatis. Catat pengeluaran secara manual supaya netto benar."
      />

      <Kartu>
        <KepalaKartu
          judul="Periode laporan"
          ikon="filter_alt"
          aksi={
            <a
              href={tautanEkspor}
              className="joyops-aksi inline-flex min-h-11 items-center gap-2 rounded-sm border border-line bg-surface px-4 text-kecil font-bold text-ink hover:bg-paper"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[1.15em]">
                picture_as_pdf
              </span>
              Ekspor PDF
            </a>
          }
        />
        <div className="p-4 sm:p-5">
          <FilterPeriode
            periode={periode}
            nilaiMinggu={kueri.minggu ?? keNilaiMinggu(hariIni())}
            nilaiBulan={(kueri.bulan ?? hariIni()).slice(0, 7)}
            nilaiTahun={kueri.tahun ?? hariIni().slice(0, 4)}
          />
        </div>
      </Kartu>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AngkaPokok
          label="Pemasukan"
          nilai={rupiah(ringkasan.pemasukan)}
          ikon="trending_up"
          nada="text-ok"
        />
        <AngkaPokok
          label="Pengeluaran"
          nilai={rupiah(ringkasan.pengeluaran)}
          ikon="trending_down"
          nada="text-danger"
        />
        <AngkaPokok
          label="Netto"
          nilai={rupiah(ringkasan.netto)}
          ikon="account_balance_wallet"
          nada={ringkasan.netto < 0 ? "text-danger" : "text-primary"}
          keterangan={`${ringkasan.jumlahTransaksi} transaksi pada periode ini`}
        />
      </div>

      <Kartu>
        <KepalaKartu
          judul="Catatan kas"
          ikon="receipt_long"
          keterangan={`${transaksi.length} catatan`}
          aksi={<FormTransaksi label="Catat transaksi" />}
        />

        {transaksi.length === 0 ? (
          <KeadaanKosong
            ikon="receipt_long"
            judul="Belum ada catatan pada periode ini"
            keterangan="Pemasukan muncul otomatis saat order dibuat. Pengeluaran dicatat manual."
            aksi={<FormTransaksi label="Catat transaksi" />}
          />
        ) : (
          <Tabel minWidth="48rem">
            <KepalaTabel
              kolom={[
                { label: "Tanggal" },
                { label: "Jenis" },
                { label: "Keterangan" },
                { label: "Metode" },
                { label: "Jumlah", num: true },
                { label: "Aksi" },
              ]}
            />
            <tbody>
              {transaksi.map((baris) => (
                <BarisTabel key={baris.id}>
                  <SelTabel className="angka">{tanggal(baris.transaction_date)}</SelTabel>
                  <SelTabel>
                    <Lencana
                      nada={
                        baris.transaction_type === "Pemasukan"
                          ? { soft: "bg-ok-soft", kuat: "text-ok", ikon: "trending_up" }
                          : { soft: "bg-danger-soft", kuat: "text-danger", ikon: "trending_down" }
                      }
                      ikon
                    >
                      {baris.transaction_type}
                    </Lencana>
                  </SelTabel>
                  <SelTabel>
                    <span className="block max-w-md">{baris.description ?? "-"}</span>
                    {baris.order_id ? (
                      <span className="mt-0.5 block text-mini text-ink-muted">
                        Otomatis dari order #{baris.order_id}
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-mini text-ink-muted">
                        Dicatat manual
                      </span>
                    )}
                  </SelTabel>
                  <SelTabel>{baris.payment_method}</SelTabel>
                  <SelTabel num className="font-semibold">
                    {rupiah(baris.amount)}
                  </SelTabel>
                  <SelTabel>
                    {baris.order_id ? (
                      <span className="text-kecil text-ink-muted">
                        Terkunci oleh order
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <FormTransaksi
                          transaksi={baris}
                          label="Ubah"
                          ikon="edit"
                          varian="halus"
                          ukuran="kecil"
                        />
                        <Konfirmasi
                          label="Hapus"
                          ikon="delete"
                          varian="halus"
                          judul="Hapus catatan kas ini?"
                          pesan="Catatan dihapus dari buku kas dan tidak bisa dikembalikan."
                          labelYa="Hapus catatan"
                          aksi={hapusTransaksiAction}
                          muatan={{ id: baris.id }}
                        />
                      </div>
                    )}
                  </SelTabel>
                </BarisTabel>
              ))}
            </tbody>
          </Tabel>
        )}

        <div className="border-t border-line px-4 py-3">
          <p className="angka text-kecil text-ink-muted">
            Dibuat {tanggalJam(new Date().toISOString())}. Pemasukan dari order tidak bisa diubah
            atau dihapus di sini, batalkan ordernya bila memang salah.
          </p>
        </div>
      </Kartu>
    </div>
  );
}
