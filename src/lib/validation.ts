import { z } from "zod";
import {
  BATAS_BULAN,
  BATAS_DURASI,
  BATAS_HARGA,
  BATAS_JUMLAH,
  BATAS_KAPASITAS_KG,
  BATAS_KAPASITAS_PCS,
  BATAS_MINGGU,
  BATAS_QTY,
  BATAS_TAHUN,
} from "@/lib/batas";

/**
 * Skema bersama. Dipakai controller untuk validasi, dan nama field-nya sama
 * dengan `name` pada input form, supaya pesan error bisa ditempel per field.
 */

const teksWajib = (label: string, min: number, maks: number) =>
  z
    .string({ required_error: `${label} wajib diisi` })
    .transform((nilai) => nilai.trim())
    .refine((nilai) => nilai.length >= min, {
      message: `${label} minimal ${min} karakter`,
    })
    .refine((nilai) => nilai.length <= maks, {
      message: `${label} maksimal ${maks} karakter`,
    });

/**
 * Harga satu layanan atau add-on. Rentangnya diambil dari kebiasaan laundry,
 * bukan dari batas teknis kolom. Lihat `RASIONAL_BATAS` di `@/lib/batas`.
 */
const harga = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} harus berupa angka` })
    .min(BATAS_HARGA.min, `${label} minimal Rp 1.000`)
    .max(BATAS_HARGA.maks, `${label} maksimal Rp 500.000`);

/**
 * Nominal satu transaksi kas. Rentangnya lebih lebar daripada harga satu
 * layanan, karena bisa berupa pengeluaran besar seperti servis mesin.
 */
const nominalKas = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} harus berupa angka` })
    .min(BATAS_JUMLAH.min, `${label} minimal Rp 500`)
    .max(BATAS_JUMLAH.maks, `${label} maksimal Rp 10.000.000`);

const tanggalIso = (label: string) =>
  z
    .string({ required_error: `${label} wajib diisi` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} tidak valid`);

export const polaUsername = /^[a-z0-9._-]{3,30}$/;

// --- Login dan akun --------------------------------------------------------

export const skemaLogin = z.object({
  username: z
    .string({ required_error: "Username wajib diisi" })
    .transform((nilai) => nilai.trim().toLowerCase())
    .refine((nilai) => polaUsername.test(nilai), {
      message: "Username hanya huruf kecil, angka, titik, garis bawah, atau strip (3 sampai 30)",
    }),
  password: z
    .string({ required_error: "Sandi wajib diisi" })
    .min(1, "Sandi wajib diisi"),
});

export const skemaKaryawanBaru = z.object({
  username: z
    .string({ required_error: "Username wajib diisi" })
    .transform((nilai) => nilai.trim().toLowerCase())
    .refine((nilai) => polaUsername.test(nilai), {
      message: "Username hanya huruf kecil, angka, titik, garis bawah, atau strip (3 sampai 30)",
    }),
  nama: teksWajib("Nama", 2, 100),
  peran: z.enum(["Admin", "Karyawan"], {
    errorMap: () => ({ message: "Peran tidak dikenal" }),
  }),
  sandi: z
    .string({ required_error: "Sandi awal wajib diisi" })
    .min(6, "Sandi minimal 6 karakter")
    .max(72, "Sandi maksimal 72 karakter"),
});

export const skemaUbahKaryawan = z.object({
  id: z.string().uuid("Karyawan tidak valid"),
  nama: teksWajib("Nama", 2, 100),
  peran: z.enum(["Admin", "Karyawan"]),
  aktif: z.coerce.boolean(),
});

export const skemaResetSandi = z.object({
  id: z.string().uuid("Karyawan tidak valid"),
  sandi: z
    .string({ required_error: "Sandi baru wajib diisi" })
    .min(6, "Sandi minimal 6 karakter")
    .max(72, "Sandi maksimal 72 karakter"),
});

export const skemaGantiSandiSendiri = z
  .object({
    sandiBaru: z
      .string({ required_error: "Sandi baru wajib diisi" })
      .min(6, "Sandi minimal 6 karakter")
      .max(72, "Sandi maksimal 72 karakter"),
    ulangi: z.string({ required_error: "Ulangi sandi wajib diisi" }),
  })
  .refine((nilai) => nilai.sandiBaru === nilai.ulangi, {
    path: ["ulangi"],
    message: "Ulangan sandi tidak sama",
  });

export const skemaProfilSaya = z.object({
  nama: teksWajib("Nama", 2, 100),
});

// --- Order -----------------------------------------------------------------

export const skemaOrderBaru = z.object({
  washerId: z.coerce.number().int().positive("Pilih mesin cuci"),
  dryerId: z.coerce.number().int().positive("Pilih mesin pengering"),
  serviceId: z.coerce.number().int().positive("Pilih layanan"),
  namaPelanggan: teksWajib("Nama pelanggan", 1, 100),
  qty: z.coerce
    .number({ invalid_type_error: "Qty harus berupa angka" })
    .positive("Qty harus lebih dari 0")
    .max(BATAS_QTY.maks, "Qty melebihi kapasitas mesin"),
  addonIds: z.array(z.coerce.number().int().positive()).default([]),
  metodeBayar: z.enum(["Cash", "QRIS"], {
    errorMap: () => ({ message: "Metode pembayaran tidak dikenal" }),
  }),
  catatan: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

export const skemaIdOrder = z.object({
  id: z.coerce.number().int().positive("Order tidak valid"),
});

export const skemaBatalOrder = z.object({
  id: z.coerce.number().int().positive("Order tidak valid"),
  alasan: z.string().max(300, "Alasan maksimal 300 karakter").optional(),
});

// --- Mesin -----------------------------------------------------------------

export const skemaMesin = z.object({
  id: z.coerce.number().int().positive().optional(),
  kode: z
    .string({ required_error: "Kode mesin wajib diisi" })
    .transform((nilai) => nilai.trim().toUpperCase())
    .refine((nilai) => /^[A-Z]{2}-\d{2,3}$/.test(nilai), {
      message: "Kode harus format WM-01 atau DM-01",
    }),
  tipe: teksWajib("Tipe mesin", 3, 50),
  status: z.enum(["Tersedia", "Digunakan", "Maintenance"], {
    errorMap: () => ({ message: "Status tidak dikenal" }),
  }),
  kapasitasKg: z.coerce
    .number({ invalid_type_error: "Kapasitas harus berupa angka" })
    .min(BATAS_KAPASITAS_KG.min, "Kapasitas minimal 5 kg")
    .max(BATAS_KAPASITAS_KG.maks, "Kapasitas maksimal 30 kg"),
  kapasitasPcs: z.coerce
    .number({ invalid_type_error: "Kapasitas harus berupa angka" })
    .int("Kapasitas pcs harus bilangan bulat")
    .min(BATAS_KAPASITAS_PCS.min, "Kapasitas minimal 5 pcs")
    .max(BATAS_KAPASITAS_PCS.maks, "Kapasitas maksimal 50 pcs"),
});

export const skemaIdMesin = z.object({
  id: z.coerce.number().int().positive("Mesin tidak valid"),
});

// --- Layanan dan add-on ----------------------------------------------------

export const skemaLayanan = z.object({
  id: z.coerce.number().int().positive().optional(),
  nama: teksWajib("Nama layanan", 2, 100),
  harga: harga("Harga"),
  satuan: z.enum(["kg", "pcs"], {
    errorMap: () => ({ message: "Satuan harus kg atau pcs" }),
  }),
  durasi: z.coerce
    .number()
    .int("Durasi harus bilangan bulat")
    .min(BATAS_DURASI.min, "Durasi minimal 15 menit")
    .max(BATAS_DURASI.maks, "Durasi maksimal 4.320 menit (3 hari)"),
  ikon: z.string().max(24, "Ikon maksimal 24 karakter").default("local_laundry_service"),
  aktif: z.coerce.boolean().default(true),
});

export const skemaAddon = z.object({
  id: z.coerce.number().int().positive().optional(),
  nama: teksWajib("Nama add-on", 2, 100),
  harga: harga("Harga"),
  ikon: z.string().max(24, "Ikon maksimal 24 karakter").default("add_circle"),
  aktif: z.coerce.boolean().default(true),
});

export const skemaIdUmum = z.object({
  id: z.coerce.number().int().positive("Data tidak valid"),
});

// --- Keuangan --------------------------------------------------------------

export const skemaTransaksi = z.object({
  id: z.coerce.number().int().positive().optional(),
  tanggal: tanggalIso("Tanggal"),
  tipe: z.enum(["Pemasukan", "Pengeluaran"], {
    errorMap: () => ({ message: "Tipe transaksi tidak dikenal" }),
  }),
  jumlah: nominalKas("Jumlah"),
  metode: z.enum(["Cash", "QRIS", "Transfer"], {
    errorMap: () => ({ message: "Metode tidak dikenal" }),
  }),
  deskripsi: teksWajib("Deskripsi", 2, 200),
});

// --- Shift -----------------------------------------------------------------

export const skemaShift = z.object({
  id: z.coerce.number().int().positive().optional(),
  karyawanId: z.string().uuid("Pilih karyawan"),
  tanggal: tanggalIso("Tanggal"),
  tipe: z.enum(["Shift 1", "Shift 2"], {
    errorMap: () => ({ message: "Tipe shift tidak dikenal" }),
  }),
  stasiun: teksWajib("Stasiun", 2, 100),
});

export const skemaTemplateShift = z.object({
  id: z.coerce.number().int().positive().optional(),
  karyawanId: z.string().uuid("Pilih karyawan"),
  hari: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]),
  tipe: z.enum(["Shift 1", "Shift 2"]),
  stasiun: teksWajib("Stasiun", 2, 100),
});

export const skemaTukarShift = z.object({
  shiftId: z.coerce.number().int().positive("Pilih shift Anda"),
  targetShiftId: z.coerce.number().int().positive("Pilih shift rekan"),
});

export const skemaJawabTukar = z.object({
  id: z.coerce.number().int().positive("Pengajuan tidak valid"),
  setuju: z.coerce.boolean(),
});

// --- Absensi ---------------------------------------------------------------

export const skemaAbsenMasuk = z.object({
  shiftId: z.coerce.number().int().positive().optional(),
});

export const skemaApproveAbsen = z.object({
  id: z.coerce.number().int().positive("Absensi tidak valid"),
  status: z.enum(["Pending", "Approved", "Rejected"]),
  catatan: z.string().max(300).optional(),
});

// --- Notifikasi ------------------------------------------------------------

export const skemaTandaiNotif = z.object({
  id: z.coerce.number().int().positive().optional(),
});

// --- Filter Periode --------------------------------------------------------

/** Tahun laporan. Data laundry mulai 2024, rencana sampai 2035. */
export const skemaTahun = z.coerce
  .number({ invalid_type_error: "Tahun harus berupa angka" })
  .int("Tahun harus bilangan bulat")
  .min(BATAS_TAHUN.min, "Tahun harus antara 2024 sampai 2035")
  .max(BATAS_TAHUN.maks, "Tahun harus antara 2024 sampai 2035");

/** Pekan dalam satu tahun. */
export const skemaMinggu = z.coerce
  .number({ invalid_type_error: "Minggu harus berupa angka" })
  .int("Minggu harus bilangan bulat")
  .min(BATAS_MINGGU.min, "Minggu harus antara 1 sampai 53")
  .max(BATAS_MINGGU.maks, "Minggu harus antara 1 sampai 53");

/** Bulan dalam satu tahun. */
export const skemaBulan = z.coerce
  .number({ invalid_type_error: "Bulan harus berupa angka" })
  .int("Bulan harus bilangan bulat")
  .min(BATAS_BULAN.min, "Bulan harus antara 1 sampai 12")
  .max(BATAS_BULAN.maks, "Bulan harus antara 1 sampai 12");

// --- Pendaftaran dan lupa sandi --------------------------------------------

const sandiBaru = z
  .string({ required_error: "Sandi wajib diisi" })
  .min(6, "Sandi minimal 6 karakter")
  .max(72, "Sandi maksimal 72 karakter");

/** Pendaftaran Admin yang akan diperiksa developer. */
export const skemaDaftar = z
  .object({
    username: z
      .string({ required_error: "Username wajib diisi" })
      .transform((nilai) => nilai.trim().toLowerCase())
      .refine((nilai) => polaUsername.test(nilai), {
        message:
          "Username hanya huruf kecil, angka, titik, garis bawah, atau strip (3 sampai 30)",
      }),
    nama: teksWajib("Nama", 2, 100),
    sandi: sandiBaru,
    ulangi: z.string({ required_error: "Ulangi sandi wajib diisi" }),
  })
  .refine((nilai) => nilai.sandi === nilai.ulangi, {
    path: ["ulangi"],
    message: "Ulangan sandi tidak sama",
  });

/** Pengajuan lupa sandi, cukup dengan nama pengguna. */
export const skemaLupaSandi = z.object({
  username: z
    .string({ required_error: "Username wajib diisi" })
    .transform((nilai) => nilai.trim().toLowerCase())
    .refine((nilai) => polaUsername.test(nilai), {
      message:
        "Username hanya huruf kecil, angka, titik, garis bawah, atau strip (3 sampai 30)",
    }),
});

/** Pengisian sandi baru lewat tautan sekali pakai dari developer. */
export const skemaAturSandi = z
  .object({
    // Panjangnya longgar sengaja: token diterbitkan sebagai 64 karakter heksa
    // (256 bit). Dulunya skemanya menuntut tepat 48, sehingga setiap tautan
    // selalu ditolak sebelum sempat diperiksa ke basis data.
    token: z
      .string({ required_error: "Tautan tidak valid" })
      .regex(/^[a-f0-9]{32,128}$/, "Tautan tidak valid"),
    sandiBaru: sandiBaru,
    ulangi: z.string({ required_error: "Ulangi sandi wajib diisi" }),
  })
  .refine((nilai) => nilai.sandiBaru === nilai.ulangi, {
    path: ["ulangi"],
    message: "Ulangan sandi tidak sama",
  });

/** Kunci rahasia halaman developer. */
export const skemaKunciDeveloper = z.object({
  kunci: z
    .string({ required_error: "Kunci salah" })
    .min(1, "Kunci salah")
    .max(200, "Kunci salah"),
});

// --- Pembantu --------------------------------------------------------------

/** Ubah ZodError menjadi peta pesan per nama field. */
export function pesanPerField(error: z.ZodError): Record<string, string> {
  const peta: Record<string, string> = {};
  for (const masalah of error.issues) {
    const kunci = String(masalah.path[0] ?? "umum");
    if (!peta[kunci]) peta[kunci] = masalah.message;
  }
  return peta;
}

/** Ambil angka dari FormData, kembalikan undefined bila kosong. */
export function angkaForm(
  data: FormData,
  nama: string
): number | undefined {
  const nilai = data.get(nama);
  if (nilai === null || nilai === "") return undefined;
  return Number(nilai);
}

/** Ambil boolean dari checkbox. */
export function centangForm(data: FormData, nama: string): boolean {
  const nilai = data.get(nama);
  return nilai === "on" || nilai === "true" || nilai === "1";
}
