/**
 * Bentuk baris tabel Supabase. Satu tipe per tabel.
 *
 * Kolom `numeric` di Postgres dikirim PostgREST sebagai angka JSON, jadi
 * diterima sebagai `number`. Kalau suatu saat dikirim sebagai teks, semua
 * pembacaan tetap lewat helper di `src/lib/format.ts` yang menerima keduanya.
 */

// --- Nilai yang dibatasi `check` di database ---

export type Peran = "Admin" | "Karyawan";
export type StatusMesin = "Tersedia" | "Digunakan" | "Maintenance";
export type StatusOrder = "Berjalan" | "Selesai" | "Dibatalkan";
export type MetodeBayar = "Cash" | "QRIS";
export type MetodeKas = "Cash" | "QRIS" | "Transfer";
export type TipeTransaksi = "Pemasukan" | "Pengeluaran";
export type SatuanLayanan = "kg" | "pcs";
export type HariKerja =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
export type TipeShift = "Shift 1" | "Shift 2";
export type StatusShift = "Scheduled" | "Clocked In" | "Completed";
export type StatusTukar =
  | "Pending"
  | "Accepted by Employee"
  | "Rejected by Employee"
  | "Approved"
  | "Rejected by Admin";
export type StatusAbsen = "Pending" | "Approved" | "Rejected";
export type TipeNotifikasi = "info" | "success" | "warning" | "error";

// --- Baris tabel ---

export interface Profil {
  id: string;
  username: string;
  full_name: string;
  role: Peran;
  legacy_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Mesin {
  id: number;
  machine_code: string;
  machine_type: string;
  status: StatusMesin;
  last_used: string | null;
  available_at: string | null;
  created_at: string;
}

export interface Layanan {
  id: number;
  service_name: string;
  price: number;
  unit: SatuanLayanan;
  duration_minutes: number;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface Addon {
  id: number;
  addon_name: string;
  price: number;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  order_code: string;
  washer_machine_id: number;
  dryer_machine_id: number;
  service_id: number;
  customer_name: string;
  qty: number;
  service_price: number;
  addon_total: number;
  grand_total: number;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  status: StatusOrder;
  payment_method: MetodeBayar;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface OrderAddon {
  id: number;
  order_id: number;
  addon_id: number;
  addon_name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface Transaksi {
  id: number;
  transaction_date: string;
  transaction_type: TipeTransaksi;
  amount: number;
  payment_method: MetodeKas;
  description: string | null;
  order_id: number | null;
  created_by: string | null;
  created_at: string;
}

export interface Shift {
  id: number;
  profile_id: string;
  work_day: HariKerja;
  work_date: string;
  start_time: string;
  end_time: string;
  station: string;
  status: StatusShift;
  created_at: string;
}

export interface TemplateShift {
  id: number;
  profile_id: string;
  day_of_week: HariKerja;
  shift_type: TipeShift;
  station: string;
  is_active: boolean;
  created_at: string;
}

export interface PengajuanTukar {
  id: number;
  shift_id: number;
  requester_id: string;
  target_shift_id: number;
  target_employee_id: string;
  status: StatusTukar;
  accepter_id: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface Absensi {
  id: number;
  profile_id: string;
  shift_id: number | null;
  work_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: StatusAbsen;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Notifikasi {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: TipeNotifikasi;
  related_type: string | null;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}
