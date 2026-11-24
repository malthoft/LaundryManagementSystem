/**
 * White-Box Unit Testing (Statement Coverage & Branch Coverage)
 * untuk modul validasi batas input (`src/lib/batas.ts`).
 *
 * Seluruh test case mengikuti pola Arrange–Act–Assert (AAA) dan
 * memverifikasi secara otomatis 10 jalur independen Pre-Lab pada
 * fungsi `ujiBatas` serta helper `bolehPecahan`.
 */
import { describe, it, expect } from "vitest";
import { ujiBatas, bolehPecahan } from "@/lib/batas";

describe("White-Box Testing: ujiBatas() — Statement & Branch Coverage", () => {
  it("TC-WB-01: mengembalikan null bila nama kolom tidak terdaftar (B1)", () => {
    // Arrange
    const kolom = "kolom_asing";
    const nilai = 10;

    // Act
    const hasil = ujiBatas(kolom, nilai);

    // Assert
    expect(hasil).toBeNull();
  });

  it("TC-WB-02: menolak nilai non-angka pada kolom angka (B2, B3, B5)", () => {
    // Arrange
    const kolomHarga = "harga";
    const kolomDurasi = "durasiOrder";
    const nilaiTidakSah = "abc";

    // Act
    const hasilHarga = ujiBatas(kolomHarga, nilaiTidakSah);
    const hasilDurasi = ujiBatas(kolomDurasi, nilaiTidakSah);

    // Assert
    expect(hasilHarga).toBe("Harus berupa angka");
    expect(hasilDurasi).toBe("Durasi harus bilangan bulat");
  });

  it("TC-WB-03: menolak nilai di bawah batas minimum kolom angka (B2, B3, B6, B7)", () => {
    // Arrange
    const kolom = "qty";
    const nilai = 0;

    // Act
    const hasil = ujiBatas(kolom, nilai);

    // Assert
    expect(hasil).toBe("Qty harus lebih dari 0");
  });

  it("TC-WB-04: menolak nilai di atas batas maksimum kolom angka (B2, B3, B6, B8, B9)", () => {
    // Arrange
    const kolom = "qty";
    const nilai = 51;

    // Act
    const hasil = ujiBatas(kolom, nilai);

    // Assert
    expect(hasil).toBe("Melebihi kapasitas mesin");
  });

  it("TC-WB-05: menerima nilai valid di dalam rentang kolom angka termasuk string numerik (B2, B3, B6, B8, B10)", () => {
    // Arrange
    const kolom = "qty";
    const nilaiAngka = 5;
    const nilaiTeksAngka = "10";

    // Act
    const hasilAngka = ujiBatas(kolom, nilaiAngka);
    const hasilTeksAngka = ujiBatas(kolom, nilaiTeksAngka);

    // Assert
    expect(hasilAngka).toBeNull();
    expect(hasilTeksAngka).toBeNull();
  });

  it("TC-WB-06: menolak teks lebih pendek dari batas minimum (B2, B4, B11, B13)", () => {
    // Arrange
    const kolom = "nama";
    const nilai = "A";

    // Act
    const hasil = ujiBatas(kolom, nilai);

    // Assert
    expect(hasil).toBe("Nama minimal 2 karakter");
  });

  it("TC-WB-07: menolak teks melebihi batas maksimum (B2, B4, B11, B14, B15)", () => {
    // Arrange
    const kolom = "nama";
    const nilai = "a".repeat(101);

    // Act
    const hasil = ujiBatas(kolom, nilai);

    // Assert
    expect(hasil).toBe("Nama maksimal 100 karakter");
  });

  it("TC-WB-08: menolak teks yang tidak sesuai pola regex meskipun panjangnya sah (B2, B4, B11, B14, B16, B17)", () => {
    // Arrange
    const kolom = "kode";
    const nilai = "AB123";

    // Act
    const hasil = ujiBatas(kolom, nilai);

    // Assert
    expect(hasil).toBe("Kode harus format WM-01 atau DM-01");
  });

  it("TC-WB-09: menerima teks yang memenuhi panjang dan pola regex serta menangani nilai null opsional (B2, B4, B11, B14, B16, B18)", () => {
    // Arrange
    const kolomKode = "kode";
    const nilaiKode = " WM-01 ";
    const kolomOpsional = "ikon";

    // Act
    const hasilKode = ujiBatas(kolomKode, nilaiKode);
    const hasilOpsional = ujiBatas(kolomOpsional, null);

    // Assert
    expect(hasilKode).toBeNull();
    expect(hasilOpsional).toBeNull();
  });

  it("TC-WB-10: mengembalikan null untuk kolom non-angka dan non-teks seperti boolean (B2, B4, B12)", () => {
    // Arrange
    const kolom = "aktif";
    const nilai = true;

    // Act
    const hasil = ujiBatas(kolom, nilai);

    // Assert
    expect(hasil).toBeNull();
  });
});

describe("White-Box Testing: bolehPecahan()", () => {
  it("menerima bilangan bulat dan pecahan maksimal dua angka di belakang koma", () => {
    // Arrange
    const nilaiValid = [1, 2.5, 3.75];

    // Act & Assert
    for (const n of nilaiValid) {
      expect(bolehPecahan(n)).toBe(true);
    }
  });

  it("menolak pecahan lebih dari dua angka di belakang koma", () => {
    // Arrange
    const nilaiTidakValid = 2.555;

    // Act
    const hasil = bolehPecahan(nilaiTidakValid);

    // Assert
    expect(hasil).toBe(false);
  });
});
