/**
 * White-Box Unit Testing — FS-007: Pemantauan Timer & Penyelesaian Order (RQ-007)
 * Target: `src/lib/format.ts` (`hitungMundur`, `durasi`, `selisihMenit`) — melengkapi
 * `selesaikanOrderAction` & `rapikanOrderKedaluwarsa` di `order.controller.test.ts`.
 * Pola: Arrange–Act–Assert (AAA).
 */
import { describe, it, expect } from "vitest";
import { hitungMundur, durasi, selisihMenit } from "@/lib/format";

describe("FS-007: White-Box Unit Testing — Timer & Durasi Order (src/lib/format.ts)", () => {
  it("TC-FS07-01: hitungMundur() memformat sisa waktu >= 1 jam sebagai HH:MM:SS", () => {
    // Arrange (1 jam 23 menit 45 detik = 5.025.000 ms)
    const sisaMs = (3600 + 23 * 60 + 45) * 1000;

    // Act
    const hasil = hitungMundur(sisaMs);

    // Assert
    expect(hasil).toBe("01:23:45");
  });

  it("TC-FS07-02: hitungMundur() memformat sisa waktu < 1 jam sebagai MM:SS", () => {
    // Arrange (12 menit 30 detik = 750.000 ms)
    const sisaMs = (12 * 60 + 30) * 1000;

    // Act
    const hasil = hitungMundur(sisaMs);

    // Assert
    expect(hasil).toBe("12:30");
  });

  it("TC-FS07-03: hitungMundur() mengembalikan 00:00 bila sisa waktu <= 0 (order kedaluwarsa)", () => {
    // Arrange
    const sisaNegatif = -5000;

    // Act
    const hasil = hitungMundur(sisaNegatif);

    // Assert
    expect(hasil).toBe("00:00");
  });

  it("TC-FS07-04: durasi() mencakup seluruh cabang (< 60 menit, tepat jam bulat, dan jam + menit)", () => {
    // Arrange & Act & Assert
    expect(durasi(45)).toBe("45 menit");
    expect(durasi(120)).toBe("2 jam");
    expect(durasi(90)).toBe("1 jam 30 menit");
    expect(durasi(null)).toBe("0 menit");
  });

  it("TC-FS07-05: selisihMenit() menangani input valid, null, dan format tanggal tidak valid", () => {
    // Arrange & Act & Assert
    expect(selisihMenit(null, "2026-11-24T10:00:00Z")).toBe(0);
    expect(selisihMenit("invalid-date", "2026-11-24T10:00:00Z")).toBe(0);
    expect(selisihMenit("2026-11-24T09:00:00Z", "2026-11-24T10:30:00Z")).toBe(90);
  });
});
