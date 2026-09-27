import { z } from "zod";

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

const uang = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} harus berupa angka` })
    .min(0, `${label} tidak boleh negatif`)
    .max(999_999_999, `${label} terlalu besar`);

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
    .max(999, "Qty terlalu besar"),
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
});

export const skemaIdMesin = z.object({
  id: z.coerce.number().int().positive("Mesin tidak valid"),
});

// --- Layanan dan add-on ----------------------------------------------------

export const skemaLayanan = z.object({
  id: z.coerce.number().int().positive().optional(),
  nama: teksWajib("Nama layanan", 2, 100),
  harga: uang("Harga"),
  satuan: z.enum(["kg", "pcs"], {
    errorMap: () => ({ message: "Satuan harus kg atau pcs" }),
  }),
  durasi: z.coerce
    .number()
    .int("Durasi harus bilangan bulat")
    .min(1, "Durasi minimal 1 menit")
    .max(1440, "Durasi maksimal 1440 menit"),
  ikon: z.string().max(50).default("local_laundry_service"),
  aktif: z.coerce.boolean().default(true),
});

export const skemaAddon = z.object({
  id: z.coerce.number().int().positive().optional(),
  nama: teksWajib("Nama add-on", 2, 100),
  harga: uang("Harga"),
  ikon: z.string().max(50).default("add_circle"),
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
  jumlah: uang("Jumlah").refine((nilai) => nilai > 0, "Jumlah harus lebih dari 0"),
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
