import type {
  Absensi,
  Mesin,
  Order,
  OrderAddon,
  PengajuanTukar,
  Profil,
  Shift,
  StatusMesin,
} from "./db";

/**
 * Bentuk hasil yang selalu dikembalikan controller. Server action tidak pernah
 * melempar error ke klien.
 */
export type Hasil<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: Record<string, string> };

export function berhasil<T>(data: T): Hasil<T> {
  return { ok: true, data };
}

export function gagal<T = never>(
  error: string,
  field?: Record<string, string>
): Hasil<T> {
  return field ? { ok: false, error, field } : { ok: false, error };
}

// --- Bentuk gabungan yang dipakai tampilan ---

/** Mesin ringkas yang menempel pada order. */
export interface MesinRingkas {
  id: number;
  machine_code: string;
  machine_type: string;
  status: StatusMesin;
}

export interface LayananRingkas {
  id: number;
  service_name: string;
  price: number;
  unit: string;
}

export interface OrangRingkas {
  id: string;
  full_name: string;
  username: string;
}

/** Order dengan semua relasi yang dibutuhkan tabel dan kartu order. */
export interface OrderLengkap extends Order {
  washer: MesinRingkas | null;
  dryer: MesinRingkas | null;
  layanan: LayananRingkas | null;
  pembuat: OrangRingkas | null;
  baris_addon: OrderAddon[];
}

/** Shift dengan nama pemiliknya. */
export interface ShiftLengkap extends Shift {
  pemilik: OrangRingkas | null;
}

/** Absensi dengan nama karyawan dan shift terkait. */
export interface AbsensiLengkap extends Absensi {
  karyawan: OrangRingkas | null;
  shift: Pick<Shift, "id" | "work_date" | "start_time" | "end_time" | "station"> | null;
}

/** Pengajuan tukar dengan detail kedua shift dan kedua orangnya. */
export interface PengajuanTukarLengkap extends PengajuanTukar {
  pemohon: OrangRingkas | null;
  calon_pengganti: OrangRingkas | null;
  shift_pemohon: Pick<Shift, "id" | "work_date" | "start_time" | "end_time" | "station"> | null;
  shift_target: Pick<Shift, "id" | "work_date" | "start_time" | "end_time" | "station"> | null;
}

/** Ringkasan jumlah mesin per status. */
export interface RingkasanMesin {
  tersedia: number;
  digunakan: number;
  maintenance: number;
  total: number;
}

/** Ringkasan uang untuk satu periode. */
export interface RingkasanKas {
  pemasukan: number;
  pengeluaran: number;
  netto: number;
  jumlahTransaksi: number;
}

/** Periode laporan keuangan. */
export type JenisPeriode = "hari" | "minggu" | "bulan" | "tahun" | "bebas";

export interface Periode {
  mulai: string;
  selesai: string;
  jenis: JenisPeriode;
}

/** Daftar mesin yang sudah dipisah untuk form order. */
export interface MesinTersedia {
  cuci: Mesin[];
  pengering: Mesin[];
}
