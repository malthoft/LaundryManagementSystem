import type { HariKerja } from "@/types/db";
import type { JenisPeriode, Periode } from "@/types/domain";
import { URUTAN_HARI } from "@/lib/constants";

export const ZONA = "Asia/Jakarta";

const PEMFORMAT_YMD = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" di zona Asia/Jakarta. Selalu pakai ini, jangan toISOString(). */
export function tanggalJakarta(waktu: Date | string = new Date()): string {
  const tanggal = typeof waktu === "string" ? new Date(waktu) : waktu;
  if (Number.isNaN(tanggal.getTime())) return "1970-01-01";
  return PEMFORMAT_YMD.format(tanggal);
}

export function hariIni(): string {
  return tanggalJakarta(new Date());
}

// --- Aritmetika tanggal, aman terhadap zona waktu -------------------------

function keUtc(tanggal: string): Date {
  return new Date(`${tanggal}T00:00:00Z`);
}

function keYmd(waktu: Date): string {
  return waktu.toISOString().slice(0, 10);
}

export function tambahHari(tanggal: string, jumlah: number): string {
  const waktu = keUtc(tanggal);
  waktu.setUTCDate(waktu.getUTCDate() + jumlah);
  return keYmd(waktu);
}

/** Nomor hari ISO: Senin 1 sampai Minggu 7. */
export function nomorHariIso(tanggal: string): number {
  const hari = keUtc(tanggal).getUTCDay();
  return hari === 0 ? 7 : hari;
}

export function namaHari(tanggal: string): HariKerja {
  const nomor = nomorHariIso(tanggal);
  return URUTAN_HARI[nomor - 1] ?? "Monday";
}

export function awalMinggu(tanggal: string): string {
  return tambahHari(tanggal, -(nomorHariIso(tanggal) - 1));
}

export function akhirMinggu(tanggal: string): string {
  return tambahHari(awalMinggu(tanggal), 6);
}

export function awalBulan(tanggal: string): string {
  return `${tanggal.slice(0, 7)}-01`;
}

export function akhirBulan(tanggal: string): string {
  const tahun = Number(tanggal.slice(0, 4));
  const bulan = Number(tanggal.slice(5, 7));
  const akhir = new Date(Date.UTC(tahun, bulan, 0));
  return keYmd(akhir);
}

export function awalTahun(tanggal: string): string {
  return `${tanggal.slice(0, 4)}-01-01`;
}

export function akhirTahun(tanggal: string): string {
  return `${tanggal.slice(0, 4)}-12-31`;
}

/** Baca minggu dari nilai input `type="week"` ("2026-W40"). */
export function dariNilaiMinggu(nilai: string, acuan: string): string {
  const cocok = /^(\d{4})-W(\d{2})$/.exec(nilai);
  if (!cocok) return awalMinggu(acuan);

  const tahun = Number(cocok[1]);
  const minggu = Number(cocok[2]);
  // 4 Januari selalu masuk minggu ISO 1.
  const empatJanuari = new Date(Date.UTC(tahun, 0, 4));
  const seninMingguPertama = new Date(empatJanuari);
  seninMingguPertama.setUTCDate(
    empatJanuari.getUTCDate() - (nomorHariIso(keYmd(empatJanuari)) - 1)
  );
  seninMingguPertama.setUTCDate(seninMingguPertama.getUTCDate() + (minggu - 1) * 7);
  return keYmd(seninMingguPertama);
}

/** Nilai untuk input `type="week"` dari sebuah tanggal. */
export function keNilaiMinggu(tanggal: string): string {
  const senin = awalMinggu(tanggal);
  const waktu = keUtc(senin);
  // Kamis di minggu yang sama menentukan nomor minggu ISO.
  waktu.setUTCDate(waktu.getUTCDate() + 3);

  const tahun = waktu.getUTCFullYear();
  const empatJanuari = new Date(Date.UTC(tahun, 0, 4));
  const seninPertama = new Date(empatJanuari);
  seninPertama.setUTCDate(
    empatJanuari.getUTCDate() - (nomorHariIso(keYmd(empatJanuari)) - 1)
  );
  const selisihHari = Math.round(
    (waktu.getTime() - seninPertama.getTime()) / 86400000
  );
  const minggu = Math.floor(selisihHari / 7) + 1;
  return `${tahun}-W${String(minggu).padStart(2, "0")}`;
}

/** Rentang tanggal untuk tiap jenis filter di halaman Keuangan. */
export function hitungPeriode(
  jenis: JenisPeriode,
  opsi: { bulan?: string; tahun?: string; minggu?: string; mulai?: string; selesai?: string } = {}
): Periode {
  const acuan = hariIni();

  switch (jenis) {
    case "minggu": {
      const mulai = dariNilaiMinggu(opsi.minggu ?? keNilaiMinggu(acuan), acuan);
      return { mulai, selesai: tambahHari(mulai, 6), jenis };
    }
    case "bulan": {
      const dasar = `${opsi.bulan ?? acuan.slice(0, 7)}-01`;
      return { mulai: awalBulan(dasar), selesai: akhirBulan(dasar), jenis };
    }
    case "tahun": {
      const dasar = `${opsi.tahun ?? acuan.slice(0, 4)}-01-01`;
      return { mulai: awalTahun(dasar), selesai: akhirTahun(dasar), jenis };
    }
    case "bebas": {
      const mulai = opsi.mulai ?? acuan;
      const selesai = opsi.selesai ?? acuan;
      return mulai <= selesai
        ? { mulai, selesai, jenis }
        : { mulai: selesai, selesai: mulai, jenis };
    }
    case "hari":
    default:
      return { mulai: acuan, selesai: acuan, jenis: "hari" };
  }
}

/** Label singkat periode untuk judul laporan. */
export function labelPeriode(periode: Periode): string {
  if (periode.mulai === periode.selesai) return periode.mulai;
  return `${periode.mulai} sampai ${periode.selesai}`;
}

/**
 * Apakah dua tanggal berada di minggu ISO yang sama. Dipakai BR-09 pada
 * pengajuan tukar shift.
 */
export function mingguSama(a: string, b: string): boolean {
  return awalMinggu(a) === awalMinggu(b);
}

/** Deretan tanggal dari `mulai` sampai `selesai`, inklusif. */
export function deretTanggal(mulai: string, selesai: string, batas = 31): string[] {
  const hasil: string[] = [];
  let sekarang = mulai;
  while (sekarang <= selesai && hasil.length < batas) {
    hasil.push(sekarang);
    sekarang = tambahHari(sekarang, 1);
  }
  return hasil;
}
