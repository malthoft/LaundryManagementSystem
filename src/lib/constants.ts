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

/**
 * Menu sidebar. Hanya berisi rute yang benar-benar ada, supaya tidak ada
 * tautan yang menuju halaman kosong.
 *
 * `kelompok` menentukan baris mana yang diisinya. Operasional lapangan di atas,
 * kendali (keuangan, karyawan) di bawah, supaya staf tidak perlu menggulir
 * melewati menu manajerial untuk mencapai absensi.
 */
export interface ItemNav {
  href: string;
  label: string;
  ikon: string;
  /** Kalau diisi, item hanya muncul untuk peran yang disebut. */
  hanya?: Peran;
  kelompok: KunciKelompokMenu;
}

export type KunciKelompokMenu = "lapangan" | "kendali";

const SEMUA_MENU: ItemNav[] = [
  // Kelompok lapangan: dipakai staf setiap shift.
  { href: "/dashboard", label: "Dashboard", ikon: "grid-outline", kelompok: "lapangan" },
  { href: "/orders", label: "Order & Kasir", ikon: "shirt-outline", kelompok: "lapangan" },
  { href: "/machines", label: "Status Mesin", ikon: "hardware-chip-outline", kelompok: "lapangan" },
  { href: "/attendance", label: "Absensi Staf", ikon: "person-circle-outline", kelompok: "lapangan" },
  { href: "/shifts", label: "Jadwal Shift", ikon: "calendar-outline", hanya: "Admin", kelompok: "lapangan" },
  { href: "/my-shift", label: "Shift Saya", ikon: "calendar-outline", hanya: "Karyawan", kelompok: "lapangan" },

  // Kelompok kendali: mengontrol operasional usaha, tarif, dan staf.
  { href: "/services", label: "Katalog Layanan", ikon: "pricetag-outline", kelompok: "kendali" },
  { href: "/finance", label: "Laporan Keuangan", ikon: "wallet-outline", hanya: "Admin", kelompok: "kendali" },
  { href: "/employees", label: "Kelola Karyawan", ikon: "people-outline", hanya: "Admin", kelompok: "kendali" },
];

/** Judul yang tampil di atas tiap kelompok menu. */
export const KELOMPOK_MENU: { kunci: KunciKelompokMenu; judul: string }[] = [
  { kunci: "lapangan", judul: "Operasional" },
  { kunci: "kendali", judul: "Kendali" },
];

/**
 * Menu untuk satu kelompok dan satu peran. Kalau kunci tidak diberi, semua
 * item yang boleh dilihat peran tersebut dikembalikan (dipakai Pengaturan).
 */
export function navUntuk(peran: Peran, kunci?: KunciKelompokMenu): ItemNav[] {
  return SEMUA_MENU.filter(
    (item) =>
      (!item.hanya || item.hanya === peran) && (!kunci || item.kelompok === kunci)
  );
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

export const NADA_SHIFT: Record<StatusShift, NadaStatus> = {
  Scheduled: { soft: "bg-primary-soft", kuat: "text-primary", ikon: "schedule" },
  "Clocked In": { soft: "bg-ok-soft", kuat: "text-ok", ikon: "login" },
  Completed: { soft: "bg-ok-soft", kuat: "text-ok", ikon: "check_circle" },
};

export const NADA_ABSEN: Record<StatusAbsen, NadaStatus> = {
  Pending: { soft: "bg-busy-soft", kuat: "text-busy", ikon: "hourglass_top" },
  Approved: { soft: "bg-ok-soft", kuat: "text-ok", ikon: "check_circle" },
  Rejected: { soft: "bg-danger-soft", kuat: "text-danger", ikon: "cancel" },
};

export const NADA_TUKAR: Record<StatusTukar, NadaStatus> = {
  Pending: { soft: "bg-busy-soft", kuat: "text-busy", ikon: "hourglass_top" },
  "Accepted by Employee": { soft: "bg-primary-soft", kuat: "text-primary", ikon: "approval" },
  "Rejected by Employee": { soft: "bg-danger-soft", kuat: "text-danger", ikon: "cancel" },
  Approved: { soft: "bg-ok-soft", kuat: "text-ok", ikon: "check_circle" },
  "Rejected by Admin": { soft: "bg-danger-soft", kuat: "text-danger", ikon: "cancel" },
};

/** Dipakai untuk kolom aktif/nonaktif pada layanan, add-on, dan akun karyawan. */
export const NADA_AKTIF: Record<"aktif" | "nonaktif", NadaStatus> = {
  aktif: { soft: "bg-ok-soft", kuat: "text-ok", ikon: "check_circle" },
  nonaktif: { soft: "bg-line", kuat: "text-ink-muted", ikon: "block" },
};

export const NADA_NOTIF: Record<TipeNotifikasi, NadaStatus> = {
  info: { soft: "bg-primary-soft", kuat: "text-primary", ikon: "info" },
  success: { soft: "bg-ok-soft", kuat: "text-ok", ikon: "check_circle" },
  warning: { soft: "bg-busy-soft", kuat: "text-busy", ikon: "warning" },
  error: { soft: "bg-danger-soft", kuat: "text-danger", ikon: "error" },
};

/**
 * Warna bilah peramban. Nilainya literal karena metadata Next.js tidak bisa
 * membaca token CSS pada saat itu. Nilainya sama dengan token --color-paper di
 * globals.css untuk mode terang dan gelap, supaya bilah peramban menyatu
 * dengan halaman.
 */
export const WARNA_BILAH_PERAMBAN = {
  terang: "#f5f7f8",
  gelap: "#131a1c",
} as const;

/** Stasiun kerja yang biasa dipakai. Bebas diketik juga. */
export const STASIUN_UMUM = ["Kasir", "Cuci", "Pengeringan", "Setrika", "Packing"];

/** Halaman panduan: isi yang dibaca dari dalam aplikasi. */
export const BANTUAN_LUPA_SANDI = [
  "Karyawan: minta Admin mereset sandi dari menu Karyawan.",
  "Admin: reset lewat menu Karyawan, atau dari Supabase bila akun Admin terkunci.",
];
