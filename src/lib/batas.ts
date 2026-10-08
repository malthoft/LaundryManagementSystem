/**
 * Tabel rujukan batas isian manual.
 *
 * Setiap kolom yang diketik tangan harus muncul di sini, lengkap dengan batas
 * bawah dan batas atasnya. Kolom yang sengaja tidak dibatasi tetap dicatat
 * beserta alasannya, supaya tidak ada kolom yang terlewat begitu saja.
 *
 * Tabel ini adalah satu-satunya sumber kebenaran. Skema validasi di
 * `src/lib/validation.ts` dan atribut pada setiap komponen form harus
 * mengikuti tabel ini. Kesesuaiannya diuji di `src/__tests__/batas.test.ts`.
 */

export type JenisIsian =
  | "teks"
  | "angka"
  | "pilihan"
  | "tanggal"
  | "boolean"
  | "rujukan";

export interface BatasIsian {
  /** Nama form tempat kolom ini muncul. */
  form: string;
  /** Nama kolom sebagaimana dipakai pada `name` di form. */
  kolom: string;
  jenis: JenisIsian;
  /** Batas bawah. Untuk teks berarti jumlah karakter, untuk angka nilainya. */
  min?: number;
  /** Batas atas. Untuk teks berarti jumlah karakter, untuk angka nilainya. */
  maks?: number;
  /** Pola yang harus dipenuhi, bila ada. */
  pola?: RegExp;
  /** Pesan penolakan saat menyentuh batas bawah. */
  pesanBawah?: string;
  /** Pesan penolakan saat melewati batas atas. */
  pesanAtas?: string;
  /** Pesan penolakan untuk aturan tambahan, misalnya bilangan bulat. */
  pesanLain?: string;
  /** Aturan tambahan dalam bahasa manusia. */
  aturan?: string;
  /** Diisi bila kolom ini memang sengaja tidak dibatasi. */
  alasanTanpaBatas?: string;
}

/** Pesan seragam untuk nama pengguna yang dipakai di beberapa form. */
const KODE_USERNAME = /^[a-z0-9._-]{3,30}$/;
const PESAN_USERNAME =
  "Username hanya huruf kecil, angka, titik, garis bawah, atau strip (3 sampai 30)";

const KODE_MESIN = /^[A-Z]{2}-[0-9]{2,3}$/;
const PESAN_MESIN = "Kode harus format WM-01 atau DM-01";

/**
 * Batas angka yang dipakai bersama.
 *
 * Angkanya diambil dari kebiasaan nyata sebuah laundry, bukan dari batas
 * teknis kolom. Kolom `numeric(10,2)` memang sanggup menampung sampai
 * Rp 999 juta, tetapi tidak ada laundry yang menetapkan harga segitu.
 * Rasional tiap batas tercatat di `RASIONAL_BATAS`.
 */
export const BATAS_HARGA = { min: 1_000, maks: 500_000 } as const;
export const BATAS_DURASI = { min: 15, maks: 4_320 } as const;
export const BATAS_JUMLAH = { min: 500, maks: 10_000_000 } as const;
export const BATAS_QTY = { min: 1, maks: 50 } as const;
export const BATAS_TAHUN = { min: 2024, maks: 2035 } as const;
export const BATAS_MINGGU = { min: 1, maks: 53 } as const;
export const BATAS_BULAN = { min: 1, maks: 12 } as const;
export const BATAS_SANDI = { min: 6, maks: 72 } as const;
export const BATAS_NAMA = { min: 2, maks: 100 } as const;
export const BATAS_KAPASITAS_KG = { min: 5, maks: 30 } as const;
export const BATAS_KAPASITAS_PCS = { min: 5, maks: 50 } as const;

/**
 * Alasan tiap batas angka, dalam kalimat yang bisa dijelaskan ke pemilik toko.
 * Inilah yang membedakan batas logis dari sekadar batas teknis kolom.
 */
export const RASIONAL_BATAS: Readonly<Record<string, string>> = {
  harga:
    "Termurah Rp 1.000 (pewangi atau plastik pembungkus). Termahal Rp 500.000 (bed cover besar, karpet). Di atas itu sudah bukan harga laundry kiloan atau satuan.",
  durasi:
    "Tercepat 15 menit untuk setrika satuan. Terlama 4.320 menit atau 3 hari untuk reguler kotor. Lebih dari 3 hari bukan layanan, melainkan penitipan barang.",
  jumlah:
    "Kas terkecil Rp 500 (parkir atau bensin kurir). Terbesar Rp 10.000.000 (servis mesin, beli mesin bekas, atau bayar sewa).",
  qty:
    "Satu kilo adalah pesanan minimum yang lazim di laundry. Batas atasnya bukan angka tetap, melainkan kapasitas mesin yang dipilih.",
  capacity_kg:
    "Mesin cuci dan mesin pengering umum berkapasitas 5 sampai 30 kg. Di luar rentang itu bukan mesin laundry.",
  capacity_pcs:
    "Satu muatan satuan biasanya 5 sampai 50 barang, misalnya sepatu, boneka, atau gorden.",
  tahun:
    "Data laundry mulai 2024. Sampai 2035 sudah sepuluh tahun ke depan, cukup untuk rencana panjang.",
  minggu: "Pekan dalam satu tahun menurut aturan internasional, 1 sampai 53.",
  bulan: "Dua belas bulan dalam satu tahun.",
  sandi:
    "Enam karakter adalah batas minimum yang masih masuk akal, 72 karakter adalah batas terpanjang yang bisa di-hash bcrypt.",
};

/** Batas waktu berlakunya tautan pengaturan ulang sandi, dalam menit. */
export const MASA_BERLAKU_RESET = 30;

/**
 * Seluruh kolom manual beserta batasnya.
 *
 * Dikelompokkan mengikuti nama formnya agar mudah dicari dan mudah diperiksa
 * kelengkapannya terhadap form yang benar-benar ada.
 */
export const SEMUA_BATAS: readonly BatasIsian[] = [
  // ---- Masuk, Daftar, Lupa Sandi, Atur Sandi -----------------------------
  {
    form: "Masuk / Daftar / Lupa Sandi",
    kolom: "username",
    jenis: "teks",
    min: 3,
    maks: 30,
    pola: KODE_USERNAME,
    pesanBawah: PESAN_USERNAME,
    pesanAtas: PESAN_USERNAME,
    aturan: "Huruf kecil, angka, titik, garis bawah, atau strip.",
  },
  {
    form: "Karyawan / Profil / Daftar",
    kolom: "nama",
    jenis: "teks",
    min: BATAS_NAMA.min,
    maks: BATAS_NAMA.maks,
    pesanBawah: "Nama minimal 2 karakter",
    pesanAtas: "Nama maksimal 100 karakter",
  },
  {
    form: "Karyawan / Daftar",
    kolom: "sandi",
    jenis: "teks",
    min: BATAS_SANDI.min,
    maks: BATAS_SANDI.maks,
    pesanBawah: "Sandi minimal 6 karakter",
    pesanAtas: "Sandi maksimal 72 karakter",
    aturan: "Enam sampai 72 karakter. Tidak pernah disimpan aplikasi dalam bentuk terbaca.",
  },
  {
    form: "Profil / Atur Sandi",
    kolom: "sandiBaru",
    jenis: "teks",
    min: BATAS_SANDI.min,
    maks: BATAS_SANDI.maks,
    pesanBawah: "Sandi minimal 6 karakter",
    pesanAtas: "Sandi maksimal 72 karakter",
  },
  {
    form: "Profil / Daftar / Atur Sandi",
    kolom: "ulangi",
    jenis: "teks",
    min: BATAS_SANDI.min,
    maks: BATAS_SANDI.maks,
    pesanBawah: "Sandi minimal 6 karakter",
    pesanAtas: "Sandi maksimal 72 karakter",
    pesanLain: "Ulangan sandi tidak sama",
    aturan: "Harus persis sama dengan sandi.",
  },

  // ---- Mesin -------------------------------------------------------------
  {
    form: "Mesin",
    kolom: "kode",
    jenis: "teks",
    min: 5,
    maks: 6,
    pola: KODE_MESIN,
    pesanBawah: PESAN_MESIN,
    pesanAtas: PESAN_MESIN,
    aturan: "Huruf dibesarkan otomatis.",
  },
  {
    form: "Mesin",
    kolom: "tipe",
    jenis: "teks",
    min: 3,
    maks: 50,
    pesanBawah: "Tipe mesin minimal 3 karakter",
    pesanAtas: "Tipe mesin maksimal 50 karakter",
  },
  {
    form: "Mesin",
    kolom: "capacity_kg",
    jenis: "angka",
    min: BATAS_KAPASITAS_KG.min,
    maks: BATAS_KAPASITAS_KG.maks,
    pesanBawah: "Kapasitas minimal 5 kg",
    pesanAtas: "Kapasitas maksimal 30 kg",
  },
  {
    form: "Mesin",
    kolom: "capacity_pcs",
    jenis: "angka",
    min: BATAS_KAPASITAS_PCS.min,
    maks: BATAS_KAPASITAS_PCS.maks,
    pesanBawah: "Kapasitas minimal 5 pcs",
    pesanAtas: "Kapasitas maksimal 50 pcs",
  },

  // ---- Layanan -----------------------------------------------------------
  {
    form: "Layanan",
    kolom: "nama",
    jenis: "teks",
    min: BATAS_NAMA.min,
    maks: BATAS_NAMA.maks,
    pesanBawah: "Nama layanan minimal 2 karakter",
    pesanAtas: "Nama layanan maksimal 100 karakter",
  },
  {
    form: "Layanan",
    kolom: "harga",
    jenis: "angka",
    min: BATAS_HARGA.min,
    maks: BATAS_HARGA.maks,
    pesanBawah: "Harga minimal Rp 1.000",
    pesanAtas: "Harga maksimal Rp 500.000",
  },
  {
    form: "Layanan",
    kolom: "durasi",
    jenis: "angka",
    min: BATAS_DURASI.min,
    maks: BATAS_DURASI.maks,
    pesanBawah: "Durasi minimal 15 menit",
    pesanAtas: "Durasi maksimal 4.320 menit (3 hari)",
    pesanLain: "Durasi harus bilangan bulat",
    aturan: "Wajib bilangan bulat.",
  },
  {
    form: "Layanan",
    kolom: "ikon",
    jenis: "teks",
    min: 0,
    maks: 24,
    pesanAtas: "Ikon maksimal 24 karakter",
    aturan: "Boleh dikosongkan, diberi nilai bawaan.",
  },

  // ---- Add-on ------------------------------------------------------------
  {
    form: "Add-on",
    kolom: "nama",
    jenis: "teks",
    min: BATAS_NAMA.min,
    maks: BATAS_NAMA.maks,
    pesanBawah: "Nama add-on minimal 2 karakter",
    pesanAtas: "Nama add-on maksimal 100 karakter",
  },
  {
    form: "Add-on",
    kolom: "harga",
    jenis: "angka",
    min: BATAS_HARGA.min,
    maks: BATAS_HARGA.maks,
    pesanBawah: "Harga minimal Rp 1.000",
    pesanAtas: "Harga maksimal Rp 500.000",
  },
  {
    form: "Add-on",
    kolom: "ikon",
    jenis: "teks",
    min: 0,
    maks: 24,
    pesanAtas: "Ikon maksimal 24 karakter",
    aturan: "Boleh dikosongkan, diberi nilai bawaan.",
  },

  // ---- Order -------------------------------------------------------------
  {
    form: "Order",
    kolom: "qty",
    jenis: "angka",
    min: BATAS_QTY.min,
    maks: BATAS_QTY.maks,
    pesanBawah: "Qty harus lebih dari 0",
    pesanAtas: "Melebihi kapasitas mesin",
    pesanLain: "Jumlah pcs harus bilangan bulat",
    aturan:
      "Batas atas = kapasitas terkecil dari mesin cuci dan mesin pengering yang dipilih. Bulat untuk layanan pcs, boleh pecahan dua angka untuk layanan kg.",
  },
  {
    form: "Order",
    kolom: "namaPelanggan",
    jenis: "teks",
    min: 1,
    maks: 100,
    pesanBawah: "Nama pelanggan minimal 1 karakter",
    pesanAtas: "Nama pelanggan maksimal 100 karakter",
    aturan: "Kosong diisi Walk-in.",
  },
  {
    form: "Order",
    kolom: "catatan",
    jenis: "teks",
    min: 0,
    maks: 500,
    pesanAtas: "Catatan maksimal 500 karakter",
    aturan: "Boleh dikosongkan.",
  },
  {
    form: "Batal Order",
    kolom: "alasan",
    jenis: "teks",
    min: 0,
    maks: 300,
    pesanAtas: "Alasan maksimal 300 karakter",
    aturan: "Boleh dikosongkan.",
  },

  // ---- Keuangan ----------------------------------------------------------
  {
    form: "Transaksi",
    kolom: "jumlah",
    jenis: "angka",
    min: BATAS_JUMLAH.min,
    maks: BATAS_JUMLAH.maks,
    pesanBawah: "Jumlah minimal Rp 500",
    pesanAtas: "Jumlah maksimal Rp 10.000.000",
    aturan:
      "Nominal kas satu transaksi. Berbeda dengan harga satu layanan, rentangnya lebih lebar karena bisa berupa pengeluaran besar.",
  },
  {
    form: "Transaksi",
    kolom: "deskripsi",
    jenis: "teks",
    min: 2,
    maks: 200,
    pesanBawah: "Deskripsi minimal 2 karakter",
    pesanAtas: "Deskripsi maksimal 200 karakter",
  },

  // ---- Filter Periode ----------------------------------------------------
  {
    form: "Filter Periode",
    kolom: "tahun",
    jenis: "angka",
    min: BATAS_TAHUN.min,
    maks: BATAS_TAHUN.maks,
    pesanBawah: "Tahun harus antara 2024 sampai 2035",
    pesanAtas: "Tahun harus antara 2024 sampai 2035",
  },
  {
    form: "Filter Periode",
    kolom: "minggu",
    jenis: "angka",
    min: BATAS_MINGGU.min,
    maks: BATAS_MINGGU.maks,
    pesanBawah: "Minggu harus antara 1 sampai 53",
    pesanAtas: "Minggu harus antara 1 sampai 53",
  },
  {
    form: "Filter Periode",
    kolom: "bulan",
    jenis: "angka",
    min: BATAS_BULAN.min,
    maks: BATAS_BULAN.maks,
    pesanBawah: "Bulan harus antara 1 sampai 12",
    pesanAtas: "Bulan harus antara 1 sampai 12",
  },

  // ---- Shift dan Absensi -------------------------------------------------
  {
    form: "Shift",
    kolom: "stasiun",
    jenis: "teks",
    min: 2,
    maks: 100,
    pesanBawah: "Stasiun minimal 2 karakter",
    pesanAtas: "Stasiun maksimal 100 karakter",
  },
  {
    form: "Persetujuan Absen",
    kolom: "catatan",
    jenis: "teks",
    min: 0,
    maks: 300,
    pesanAtas: "Catatan maksimal 300 karakter",
    aturan: "Boleh dikosongkan.",
  },

  // ---- Developer ---------------------------------------------------------
  {
    form: "Developer",
    kolom: "kunci",
    jenis: "teks",
    min: 1,
    maks: 200,
    pesanBawah: "Kunci salah",
    pesanAtas: "Kunci salah",
  },

  // ---- Kolom yang memang tidak punya rentang -----------------------------
  {
    form: "Karyawan / Profil / Layanan / Add-on",
    kolom: "aktif",
    jenis: "boolean",
    alasanTanpaBatas: "Nilai benar atau salah, tidak punya rentang.",
  },
  {
    form: "Mesin",
    kolom: "status",
    jenis: "pilihan",
    aturan: "Tersedia, Digunakan, atau Maintenance.",
  },
  {
    form: "Karyawan",
    kolom: "peran",
    jenis: "pilihan",
    aturan: "Admin atau Karyawan.",
  },
  {
    form: "Layanan",
    kolom: "satuan",
    jenis: "pilihan",
    aturan: "kg atau pcs.",
  },
  {
    form: "Transaksi",
    kolom: "tipe",
    jenis: "pilihan",
    aturan: "Pemasukan atau Pengeluaran.",
  },
  {
    form: "Transaksi / Order",
    kolom: "metode",
    jenis: "pilihan",
    aturan: "Transaksi: Cash, QRIS, Transfer. Order: Cash, QRIS.",
  },
  {
    form: "Shift",
    kolom: "tipe",
    jenis: "pilihan",
    aturan: "Shift 1 atau Shift 2.",
  },
  {
    form: "Absen",
    kolom: "status",
    jenis: "pilihan",
    aturan: "Pending, Approved, atau Rejected.",
  },
  {
    form: "Transaksi / Filter Periode / Absen",
    kolom: "tanggal",
    jenis: "tanggal",
    aturan: "Pola YYYY-MM-DD. Absen berlaku WIB, satu orang satu kali per hari.",
  },
  {
    form: "Order / Shift",
    kolom: "id rujukan",
    jenis: "rujukan",
    alasanTanpaBatas:
      "Kunci rujukan. Sahnya dibuktikan dengan pencarian datanya, bukan dengan rentang.",
  },
] as const;

/** Ambil baris rujukan untuk sebuah kolom, atau `null` bila tidak tercatat. */
export function cariBatas(kolom: string): BatasIsian | null {
  return SEMUA_BATAS.find((b) => b.kolom === kolom) ?? null;
}

/**
 * Batas atas jumlah cucian.
 *
 * Satu muatan harus lolos **kedua** mesin, sehingga yang dipakai adalah
 * kapasitas terkecil. Kolomnya mengikuti satuan layanan.
 */
export function batasQty(jumlah: {
  unit: "kg" | "pcs";
  kapasitasMesinCuci: { kg: number; pcs: number };
  kapasitasMesinPengering: { kg: number; pcs: number };
}): number {
  const kolom = jumlah.unit === "pcs" ? "pcs" : "kg";
  return Math.min(jumlah.kapasitasMesinCuci[kolom], jumlah.kapasitasMesinPengering[kolom]);
}

/** Apakah bilangan ini bulat sampai dua angka di belakang koma. */
export function bolehPecahan(n: number): boolean {
  return Math.abs(n * 100 - Math.round(n * 100)) < 1e-9;
}

/** Uji nilai terhadap batas sebuah kolom. Mengembalikan pesan penolakan, atau `null` bila sah. */
export function ujiBatas(kolom: string, nilai: unknown): string | null {
  const baris = cariBatas(kolom);
  if (!baris) return null;

  if (baris.jenis === "angka") {
    const n = typeof nilai === "number" ? nilai : Number(nilai);
    if (!Number.isFinite(n)) return baris.pesanLain ?? "Harus berupa angka";
    if (baris.min !== undefined && n < baris.min) return baris.pesanBawah ?? "Terlalu kecil";
    if (baris.maks !== undefined && n > baris.maks) return baris.pesanAtas ?? "Terlalu besar";
    return null;
  }

  if (baris.jenis === "teks") {
    const s = typeof nilai === "string" ? nilai.trim() : String(nilai ?? "");
    if (baris.min !== undefined && baris.min > 0 && s.length < baris.min) {
      return baris.pesanBawah ?? "Terlalu pendek";
    }
    if (baris.maks !== undefined && s.length > baris.maks) {
      return baris.pesanAtas ?? "Terlalu panjang";
    }
    if (baris.pola && s.length > 0 && !baris.pola.test(s)) {
      return baris.pesanLain ?? baris.pesanBawah ?? "Format tidak sesuai";
    }
    return null;
  }

  return null;
}
