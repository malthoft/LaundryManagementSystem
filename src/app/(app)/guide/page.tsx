import type { Metadata } from "next";
import Link from "next/link";
import { Kartu, IsiKartu, JudulHalaman, KepalaKartu } from "@/components/ui/Kartu";
import { Chip } from "@/components/ui/Lencana";
import { wajibMasuk } from "@/lib/auth";

export const metadata: Metadata = { title: "Panduan" };

interface Langkah {
  judul: string;
  isi: string[];
}

interface Bagian {
  judul: string;
  ikon: string;
  href: string;
  langkah: Langkah[];
}

/**
 * Panduan di dalam aplikasi. Isinya sengaja pendek dan berupa langkah kerja,
 * bukan salinan manual. Manual lengkap ada di docs/Guide_Book_JoyOps.md.
 */
const BAGIAN_ADMIN: Bagian[] = [
  {
    judul: "Order & pembayaran",
    ikon: "point_of_sale",
    href: "/orders",
    langkah: [
      {
        judul: "Membuat order",
        isi: [
          "Pilih satu mesin cuci dan satu mesin pengering yang berstatus Tersedia.",
          "Pilih layanan, isi jumlah sesuai satuan layanan (kg atau pcs).",
          "Centang add-on bila pelanggan memintanya. Add-on dihitung sekali per order.",
          "Total dihitung otomatis. Periksa dulu sebelum menekan Simpan order.",
          "Setelah tersimpan, kedua mesin otomatis berubah menjadi Digunakan.",
        ],
      },
      {
        judul: "Menutup order",
        isi: [
          "Timer pada kartu order menunjukkan sisa waktu proses.",
          "Setelah cucian diangkat, tekan Tandai selesai. Mesin kembali Tersedia.",
          "Order yang waktunya lewat ditutup otomatis saat dashboard dibuka.",
          "Order hanya bisa dibatalkan Admin, dan hanya selama masih Berjalan.",
        ],
      },
    ],
  },
  {
    judul: "Mesin",
    ikon: "local_laundry_service",
    href: "/machines",
    langkah: [
      {
        judul: "Menambah dan mengubah mesin",
        isi: [
          "Kode mesin menentukan jenisnya: WM untuk mesin cuci, DM untuk mesin pengering.",
          "Ubah status ke Perawatan bila mesin rusak, supaya tidak bisa dipilih di form order.",
          "Mesin yang sedang Digunakan tidak bisa dihapus. Tandai selesai ordernya dulu.",
        ],
      },
    ],
  },
  {
    judul: "Jadwal shift",
    ikon: "event_note",
    href: "/shifts",
    langkah: [
      {
        judul: "Menyusun jadwal",
        isi: [
          "Buat pola shift berulang: pilih karyawan, hari, tipe shift, dan stasiun.",
          "Tekan Bentuk jadwal untuk mengisi satu minggu penuh dari pola tersebut.",
          "Hari yang sudah punya shift dilewati, jadi aman ditekan berkali-kali.",
          "Shift satuan bisa ditambah manual tanpa pola.",
        ],
      },
      {
        judul: "Menyetujui tukar shift",
        isi: [
          "Karyawan mengajukan tukar, lalu rekan kerjanya menerima atau menolak.",
          "Setelah rekan menerima, pengajuan masuk ke antrean Anda di halaman ini.",
          "Jadwal baru berlaku hanya setelah Anda menekan Setujui.",
        ],
      },
    ],
  },
  {
    judul: "Keuangan",
    ikon: "leaderboard",
    href: "/finance",
    langkah: [
      {
        judul: "Membaca buku kas",
        isi: [
          "Pemasukan dari order tercatat otomatis dan tidak bisa diubah dari halaman ini.",
          "Catat pengeluaran manual supaya angka netto benar.",
          "Pilih periode, lalu tekan Ekspor PDF untuk mengunduh laporan.",
        ],
      },
    ],
  },
  {
    judul: "Karyawan",
    ikon: "group",
    href: "/employees",
    langkah: [
      {
        judul: "Mengelola akun",
        isi: [
          "Tambahkan karyawan dengan username dan sandi awal.",
          "Bila karyawan lupa sandi, gunakan Reset sandi lalu beritahukan sandi barunya.",
          "Nonaktifkan akun yang sudah tidak bekerja. Riwayatnya tetap tersimpan.",
        ],
      },
    ],
  },
];

const BAGIAN_KARYAWAN: Bagian[] = [
  {
    judul: "Order & pembayaran",
    ikon: "point_of_sale",
    href: "/orders",
    langkah: [
      {
        judul: "Melayani pelanggan",
        isi: [
          "Pilih mesin cuci dan mesin pengering yang berstatus Tersedia.",
          "Pilih layanan, isi jumlah, lalu centang add-on bila diminta.",
          "Periksa total, lalu tekan Simpan order.",
          "Setelah selesai, tekan Tandai selesai supaya mesin bisa dipakai lagi.",
        ],
      },
    ],
  },
  {
    judul: "Shift dan absensi",
    ikon: "event_note",
    href: "/my-shift",
    langkah: [
      {
        judul: "Menjalani shift",
        isi: [
          "Jadwal minggu ini terlihat di menu Shift Saya.",
          "Tekan Absen masuk saat mulai bekerja, dan Absen keluar saat selesai.",
          "Absensi akan disetujui Admin sebelum dihitung resmi.",
        ],
      },
      {
        judul: "Tukar shift",
        isi: [
          "Tukar hanya bisa dalam minggu yang sama.",
          "Pilih shift Anda yang dilepas, lalu shift rekan yang diambil.",
          "Rekan kerja menjawab lebih dulu, lalu Admin menyetujui.",
        ],
      },
    ],
  },
  {
    judul: "Mesin",
    ikon: "local_laundry_service",
    href: "/machines",
    langkah: [
      {
        judul: "Memantau mesin",
        isi: [
          "Mesin berstatus Tersedia yang bisa dipilih saat membuat order.",
          "Laporkan ke Admin bila ada mesin rusak, supaya statusnya diubah ke Perawatan.",
        ],
      },
    ],
  },
];

const MASALAH = [
  {
    masalah: "Tidak bisa masuk",
    solusi:
      "Periksa username dan sandi. Bila lupa, minta Admin mereset sandi dari menu Karyawan.",
  },
  {
    masalah: "Mesin tidak muncul saat membuat order",
    solusi:
      "Mesin sedang Digunakan atau Perawatan. Pastikan order sebelumnya sudah ditandai selesai.",
  },
  {
    masalah: "Tidak bisa mengajukan tukar shift",
    solusi:
      "Tukar hanya berlaku dalam minggu yang sama dan shift yang lewat tidak bisa ditukar.",
  },
  {
    masalah: "Halaman terus memuat atau gagal",
    solusi:
      "Periksa koneksi internet lalu muat ulang. Bila tetap gagal, laporkan ke Admin.",
  },
];

export default async function HalamanPanduan() {
  const profil = await wajibMasuk();
  const bagian = profil.role === "Admin" ? BAGIAN_ADMIN : BAGIAN_KARYAWAN;

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul="Panduan"
        keterangan={`Langkah kerja untuk peran ${profil.role}. Manual lengkap ada di berkas docs/Guide_Book_JoyOps.md.`}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {bagian.map((item) => (
          <Kartu key={item.judul}>
            <KepalaKartu
              judul={item.judul}
              ikon={item.ikon}
              aksi={
                <Link
                  href={item.href}
                  className="joyops-aksi inline-flex min-h-11 items-center gap-1 rounded-sm px-2 text-kecil font-bold text-primary hover:bg-paper"
                >
                  Buka halaman
                  <span aria-hidden="true" className="material-symbols-outlined text-[1.1em]">
                    chevron_right
                  </span>
                </Link>
              }
            />
            <IsiKartu className="flex flex-col gap-4">
              {item.langkah.map((langkah) => (
                <div key={langkah.judul}>
                  <h3 className="text-sedang font-bold text-ink">{langkah.judul}</h3>
                  <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-kecil text-ink-muted">
                    {langkah.isi.map((baris) => (
                      <li key={baris}>{baris}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </IsiKartu>
          </Kartu>
        ))}
      </div>

      <Kartu>
        <KepalaKartu judul="Bila ada masalah" ikon="build" />
        <IsiKartu className="flex flex-col gap-3">
          {MASALAH.map((item) => (
            <div key={item.masalah} className="rounded-sm border border-line px-4 py-3">
              <p className="flex flex-wrap items-center gap-2 text-sedang font-bold text-ink">
                <Chip>Masalah</Chip>
                {item.masalah}
              </p>
              <p className="mt-1 text-kecil text-ink-muted">{item.solusi}</p>
            </div>
          ))}
        </IsiKartu>
      </Kartu>
    </div>
  );
}
