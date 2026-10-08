import { describe, it, expect } from "vitest";
import {
  SEMUA_BATAS,
  cariBatas,
  ujiBatas,
  batasQty,
  BATAS_HARGA,
  BATAS_DURASI,
  BATAS_JUMLAH,
  BATAS_TAHUN,
  BATAS_KAPASITAS_KG,
  BATAS_KAPASITAS_PCS,
  RASIONAL_BATAS,
} from "@/lib/batas";

/**
 * Daftar kolom yang diketik tangan oleh pengguna, dikelompokkan per form.
 * Bila sebuah kolom ditambahkan ke form, nama kolomnya wajib masuk ke sini.
 */
const KOLOM_WAJIB: readonly string[] = [
  "username",
  "nama",
  "sandi",
  "sandiBaru",
  "ulangi",
  "kode",
  "tipe",
  "capacity_kg",
  "capacity_pcs",
  "harga",
  "durasi",
  "ikon",
  "qty",
  "namaPelanggan",
  "catatan",
  "alasan",
  "jumlah",
  "deskripsi",
  "tahun",
  "minggu",
  "bulan",
  "stasiun",
  "kunci",
];

/** Kolom angka yang batasnya harus masuk akal untuk sebuah laundry. */
const KOLOM_ANGKA = [
  "harga",
  "durasi",
  "jumlah",
  "tahun",
  "minggu",
  "bulan",
  "capacity_kg",
  "capacity_pcs",
] as const;

describe("tabel rujukan batas isian", () => {
  it("mencatat setiap kolom yang diketik tangan", () => {
    const belum = KOLOM_WAJIB.filter((kolom) => !cariBatas(kolom));
    expect(belum).toEqual([]);
  });

  it("tidak punya kolom ganda", () => {
    const nama = SEMUA_BATAS.map((b) => `${b.form}|${b.kolom}`);
    expect(new Set(nama).size).toBe(nama.length);
  });

  it("setiap kolom angka punya batas bawah dan batas atas yang tercatat", () => {
    for (const kolom of KOLOM_ANGKA) {
      const baris = cariBatas(kolom);
      expect(baris, `${kolom} belum tercatat`).toBeTruthy();
      expect(baris!.min, `${kolom} belum punya batas bawah`).toBeTypeOf("number");
      expect(baris!.maks, `${kolom} belum punya batas atas`).toBeTypeOf("number");
      expect(baris!.min!).toBeLessThan(baris!.maks!);
    }
  });

  it("setiap kolom angka punya alasan yang bisa dijelaskan", () => {
    for (const kolom of KOLOM_ANGKA) {
      expect(RASIONAL_BATAS[kolom], `${kolom} belum punya alasan`).toBeTruthy();
    }
  });
});

describe("batasnya masuk akal untuk laundry", () => {
  it("harga berada di kisaran harga laundry, bukan batas teknis kolom", () => {
    expect(BATAS_HARGA).toEqual({ min: 1_000, maks: 500_000 });
  });

  it("jumlah transkasaksi berada di kisaran kas toko", () => {
    expect(BATAS_JUMLAH).toEqual({ min: 500, maks: 10_000_000 });
  });

  it("durasi paling lama tiga hari, bukan sehari", () => {
    expect(BATAS_DURASI).toEqual({ min: 15, maks: 4_320 });
  });

  it("kapasitas mesin berada di kisaran mesin laundry", () => {
    expect(BATAS_KAPASITAS_KG).toEqual({ min: 5, maks: 30 });
    expect(BATAS_KAPASITAS_PCS).toEqual({ min: 5, maks: 50 });
  });

  it("tahun menutup rentang yang wajar, bukan seratus tahun", () => {
    expect(BATAS_TAHUN).toEqual({ min: 2024, maks: 2035 });
  });

  it("tidak ada batas angka yang terlalu besar untuk sebuah toko", () => {
    for (const kolom of KOLOM_ANGKA) {
      expect(cariBatas(kolom)!.maks!, `${kolom} batasnya kebesaran`).toBeLessThan(100_000_000);
    }
  });
});

describe("nilai tepat di batas: yang di dalam diterima, yang di luar ditolak", () => {
  const kasus: Array<{
    kolom: string;
    min: number;
    maks: number;
    pesanBawah: string;
    pesanAtas: string;
  }> = [
    {
      kolom: "harga",
      min: BATAS_HARGA.min,
      maks: BATAS_HARGA.maks,
      pesanBawah: "Harga minimal Rp 1.000",
      pesanAtas: "Harga maksimal Rp 500.000",
    },
    {
      kolom: "durasi",
      min: BATAS_DURASI.min,
      maks: BATAS_DURASI.maks,
      pesanBawah: "Durasi minimal 15 menit",
      pesanAtas: "Durasi maksimal 4.320 menit (3 hari)",
    },
    {
      kolom: "jumlah",
      min: BATAS_JUMLAH.min,
      maks: BATAS_JUMLAH.maks,
      pesanBawah: "Jumlah minimal Rp 500",
      pesanAtas: "Jumlah maksimal Rp 10.000.000",
    },
    {
      kolom: "tahun",
      min: BATAS_TAHUN.min,
      maks: BATAS_TAHUN.maks,
      pesanBawah: "Tahun harus antara 2024 sampai 2035",
      pesanAtas: "Tahun harus antara 2024 sampai 2035",
    },
    {
      kolom: "capacity_kg",
      min: BATAS_KAPASITAS_KG.min,
      maks: BATAS_KAPASITAS_KG.maks,
      pesanBawah: "Kapasitas minimal 5 kg",
      pesanAtas: "Kapasitas maksimal 30 kg",
    },
  ];

  for (const u of kasus) {
    it(`${u.kolom}: empat titik di sekitar batas`, () => {
      expect(ujiBatas(u.kolom, u.min - 1)).toBe(u.pesanBawah);
      expect(ujiBatas(u.kolom, u.min)).toBeNull();
      expect(ujiBatas(u.kolom, u.maks)).toBeNull();
      expect(ujiBatas(u.kolom, u.maks + 1)).toBe(u.pesanAtas);
    });
  }

  it("panjang karakter diperiksa pada batas bawah dan atasnya", () => {
    expect(ujiBatas("nama", "A")).toBe("Nama minimal 2 karakter");
    expect(ujiBatas("nama", "Ab")).toBeNull();
    expect(ujiBatas("nama", "x".repeat(100))).toBeNull();
    expect(ujiBatas("nama", "x".repeat(101))).toBe("Nama maksimal 100 karakter");
  });

  it("username punya dua batas sekaligus: panjang dan huruf yang diperbolehkan", () => {
    const pesan =
      "Username hanya huruf kecil, angka, titik, garis bawah, atau strip (3 sampai 30)";
    expect(ujiBatas("username", "ab")).toBe(pesan);
    expect(ujiBatas("username", "abc")).toBeNull();
    expect(ujiBatas("username", "ABC")).toBe(pesan);
    expect(ujiBatas("username", "a".repeat(31))).toBe(pesan);
  });
});

describe("batas jumlah cucian mengikuti kapasitas mesin", () => {
  const mesin = {
    unit: "kg" as const,
    kapasitasMesinCuci: { kg: 10, pcs: 20 },
    kapasitasMesinPengering: { kg: 8, pcs: 30 },
  };

  it("memakai kapasitas terkecil karena satu muatan harus lolos kedua mesin", () => {
    expect(batasQty(mesin)).toBe(8);
  });

  it("memakai kolom satuan yang sesuai dengan jenis layanan", () => {
    expect(batasQty({ ...mesin, unit: "pcs" })).toBe(20);
    expect(batasQty({ ...mesin, unit: "kg" })).toBe(8);
  });

  it("berubah mengikuti mesin yang dipilih", () => {
    expect(
      batasQty({
        ...mesin,
        kapasitasMesinCuci: { kg: 30, pcs: 50 },
        kapasitasMesinPengering: { kg: 30, pcs: 50 },
      })
    ).toBe(30);
  });
});
