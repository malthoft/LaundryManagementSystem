import type {
  HariKerja,
  Peran,
  StatusAbsen,
  StatusMesin,
  StatusOrder,
  StatusShift,
  StatusTukar,
  TipeNotifikasi,
  TipeShift,
} from "@/types/db";

/** Satu item menu sidebar. */
export interface ItemNav {
  href: string;
  label: string;
  ikon: string;
  /** Kalau true, item hanya muncul untuk peran yang disebut. */
  hanya?: Peran;
}

/**
 * Menu sidebar. Hanya berisi rute yang benar-benar ada, supaya tidak ada
 * tautan yang menuju halaman kosong.
 */
const SEMUA_MENU: ItemNav[] = [
  { href: "/dashboard", label: "Dashboard", ikon: "dashboard" },
  { href: "/orders", label: "Order & Pembayaran", ikon: "point_of_sale" },
  { href: "/machines", label: "Mesin", ikon: "local_laundry_service" },
  { href: "/shifts", label: "Jadwal Shift", ikon: "event_note", hanya: "Admin" },
  { href: "/my-shift", label: "Shift Saya", ikon: "event_note", hanya: "Karyawan" },
  { href: "/attendance", label: "Absensi", ikon: "badge" },
  { href: "/services", label: "Layanan & Add-on", ikon: "payments" },
  { href: "/finance", label: "Keuangan", ikon: "leaderboard", hanya: "Admin" },
  { href: "/employees", label: "Karyawan", ikon: "group", hanya: "Admin" },
];

export function navUntuk(peran: Peran): ItemNav[] {
  return SEMUA_MENU.filter((item) => !item.hanya || item.hanya === peran);
}

/** Label Bahasa Indonesia untuk nilai enum database. */
export const LABEL_STATUS_MESIN: Record<StatusMesin, string> = {
  Tersedia: "Tersedia",
  Digunakan: "Digunakan",
  Maintenance: "Perawatan",
};

export const LABEL_STATUS_ORDER: Record<StatusOrder, string> = {
  Berjalan: "Berjalan",
  Selesai: "Selesai",
  Dibatalkan: "Dibatalkan",
};

export const LABEL_STATUS_SHIFT: Record<StatusShift, string> = {
  Scheduled: "Terjadwal",
  "Clocked In": "Sudah Absen",
  Completed: "Selesai",
};

export const LABEL_STATUS_ABSEN: Record<StatusAbsen, string> = {
  Pending: "Menunggu",
  Approved: "Disetujui",
  Rejected: "Ditolak",
};

export const LABEL_STATUS_TUKAR: Record<StatusTukar, string> = {
  Pending: "Menunggu rekan kerja",
  "Accepted by Employee": "Menunggu persetujuan Admin",
  "Rejected by Employee": "Ditolak rekan kerja",
  Approved: "Disetujui",
  "Rejected by Admin": "Ditolak Admin",
};

export const LABEL_HARI: Record<HariKerja, string> = {
  Monday: "Senin",
  Tuesday: "Selasa",
  Wednesday: "Rabu",
  Thursday: "Kamis",
  Friday: "Jumat",
  Saturday: "Sabtu",
  Sunday: "Minggu",
};

/** Urutan hari sesuai minggu ISO, Senin lebih dulu. */
export const URUTAN_HARI: HariKerja[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Jam shift tetap. Dipakai untuk mengisi waktu saat membuat shift dari template. */
export const JAM_SHIFT: Record<TipeShift, { mulai: string; selesai: string }> = {
  "Shift 1": { mulai: "07:00", selesai: "13:00" },
  "Shift 2": { mulai: "13:00", selesai: "20:00" },
};

/**
 * Nada warna per status. Memakai token, bukan nilai warna langsung.
 * Pasangan `soft` untuk latar, `kuat` untuk teks.
 */
export interface NadaStatus {
  soft: string;
  kuat: string;
  ikon: string;
}

export const NADA_MESIN: Record<StatusMesin, NadaStatus> = {
  Tersedia: { soft: "bg-ok-soft", kuat: "text-ok", ikon: "check_circle" },
  Digunakan: { soft: "bg-busy-soft", kuat: "text-busy", ikon: "autorenew" },
  Maintenance: { soft: "bg-danger-soft", kuat: "text-danger", ikon: "build" },
};

export const NADA_ORDER: Record<StatusOrder, NadaStatus> = {
  Berjalan: { soft: "bg-busy-soft", kuat: "text-busy", ikon: "autorenew" },
  Selesai: { soft: "bg-ok-soft", kuat: "text-ok", ikon: "check_circle" },
  Dibatalkan: { soft: "bg-danger-soft", kuat: "text-danger", ikon: "cancel" },
};

export const NADA_NOTIF: Record<TipeNotifikasi, NadaStatus> = {
  info: { soft: "bg-primary-soft", kuat: "text-primary", ikon: "info" },
  success: { soft: "bg-ok-soft", kuat: "text-ok", ikon: "check_circle" },
  warning: { soft: "bg-busy-soft", kuat: "text-busy", ikon: "warning" },
  error: { soft: "bg-danger-soft", kuat: "text-danger", ikon: "error" },
};

/** Stasiun kerja yang biasa dipakai. Bebas diketik juga. */
export const STASIUN_UMUM = ["Kasir", "Cuci", "Pengeringan", "Setrika", "Packing"];

/** Halaman panduan: isi yang dibaca dari dalam aplikasi. */
export const BANTUAN_LUPA_SANDI = [
  "Karyawan: minta Admin mereset sandi dari menu Karyawan.",
  "Admin: reset lewat menu Karyawan, atau dari Supabase bila akun Admin terkunci.",
];
