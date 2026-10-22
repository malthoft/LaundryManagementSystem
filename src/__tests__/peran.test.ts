import { describe, expect, it } from "vitest";
import {
  TINGKAT_PERAN,
  SEMUA_PERAN,
  bolehKelolaPeran,
  peranBolehDipilih,
  alasanTidakBoleh,
} from "@/lib/peran";
import type { Peran } from "@/types/db";

/**
 * Aturan hierarki peran.
 *
 * Inti aturannya satu kalimat: seseorang hanya boleh mengatur peran yang di
 * bawahnya. Test di bawah mengunci tiga hal yang mudah rusak kalau nanti ada
 * yang menambah peran baru atau menukar urutan angka.
 */
describe("hierarki peran", () => {
  it("punya urutan yang jelas, Karyawan di bawah Admin", () => {
    expect(TINGKAT_PERAN.Karyawan).toBeLessThan(TINGKAT_PERAN.Admin);
    expect(SEMUA_PERAN).toEqual(["Karyawan", "Admin"]);
  });

  it("mengizinkan Admin mengatur Karyawan", () => {
    expect(bolehKelolaPeran("Admin", "Karyawan", "Karyawan")).toBe(true);
    // Tapi tidak bisa menaikkannya jadi Admin: itu berarti menyamai tingkat
    // pengatur sendiri. Membuat Admin baru hanya lewat mode developer.
    expect(bolehKelolaPeran("Admin", "Karyawan", "Admin")).toBe(false);
  });

  it("menolak Admin mengatur sesama Admin", () => {
    expect(bolehKelolaPeran("Admin", "Admin", "Admin")).toBe(false);
    expect(bolehKelolaPeran("Admin", "Admin", "Karyawan")).toBe(false);
  });

  it("menolak Karyawan mengatur siapa pun", () => {
    expect(bolehKelolaPeran("Karyawan", "Karyawan", "Karyawan")).toBe(false);
    expect(bolehKelolaPeran("Karyawan", "Admin", "Karyawan")).toBe(false);
  });

  it("menolak menaikkan peran sampai setinggi pengatur sendiri", () => {
    // Karyawan tidak bisa menaikkan diri sendiri atau orang lain jadi Admin.
    expect(bolehKelolaPeran("Karyawan", "Karyawan", "Admin")).toBe(false);
    // Admin tidak bisa menaikkan Admin lain, karena sasarannya setingkat.
    expect(bolehKelolaPeran("Admin", "Admin", "Admin")).toBe(false);
  });

  it("hanya menawarkan peran yang benar-benar boleh dipilih", () => {
    expect(peranBolehDipilih("Admin", "Karyawan")).toEqual(["Karyawan"]);
    expect(peranBolehDipilih("Admin", "Admin")).toEqual([]);
    expect(peranBolehDipilih("Karyawan", "Karyawan")).toEqual([]);
  });

  it("memberi alasan yang sesuai dengan sebab penolakannya", () => {
    expect(alasanTidakBoleh("Admin", "Admin")).toContain("sesama Admin");
    expect(alasanTidakBoleh("Karyawan", "Admin")).toContain("di bawahnya");
  });

  it("tidak pernah mengizinkan peran yang lebih tinggi dari pengatur", () => {
    const pengatur: Peran[] = ["Admin", "Karyawan"];
    const sasaran: Peran[] = ["Admin", "Karyawan"];
    const tujuan: Peran[] = ["Admin", "Karyawan"];

    for (const p of pengatur) {
      for (const s of sasaran) {
        for (const t of tujuan) {
          if (bolehKelolaPeran(p, s, t)) {
            expect(TINGKAT_PERAN[t]).toBeLessThan(TINGKAT_PERAN[p]);
          }
        }
      }
    }
  });
});
