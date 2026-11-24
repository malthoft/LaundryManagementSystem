/**
 * White-Box Unit Testing — FS-006: Status dan Kapasitas Unit Mesin (RQ-006)
 * Target: `src/controllers/machine.controller.ts` (`ubahStatusMesinAction`, `simpanMesinAction`, `hapusMesinAction`)
 * Pola: Arrange–Act–Assert (AAA) dengan Dummy, Stub, Mock, dan Spy.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { KlienSupabase } from "@/lib/supabase/server";
import type { Mesin, Profil } from "@/types/db";
import * as aksiModule from "@/lib/aksi";

let profilStub: Profil | null = null;
let mesinStub: Mesin | null = null;
let dipakaiOrderStub = false;

const revalidatePathMock = vi.fn((..._args: unknown[]) => {});
const buatMesinMock = vi.fn(async (..._args: unknown[]) => {});
const ubahMesinMock = vi.fn(async (..._args: unknown[]) => {});
const ubahStatusMesinMock = vi.fn(async (..._args: unknown[]) => {});
const hapusMesinMock = vi.fn(async (..._args: unknown[]) => {});
const kirimNotifikasiMock = vi.fn(async (..._args: unknown[]) => {});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  buatKlienServer: vi.fn(async () => ({}) as KlienSupabase),
}));
vi.mock("@/lib/auth", () => ({
  profilSaya: vi.fn(async () => profilStub),
}));
vi.mock("@/models/machine.model", () => ({
  ambilMesinById: vi.fn(async () => mesinStub),
  buatMesin: (...args: unknown[]) => buatMesinMock(...args),
  ubahMesin: (...args: unknown[]) => ubahMesinMock(...args),
  ubahStatusMesin: (...args: unknown[]) => ubahStatusMesinMock(...args),
  hapusMesin: (...args: unknown[]) => hapusMesinMock(...args),
  mesinDipakaiOrder: vi.fn(async () => dipakaiOrderStub),
}));
vi.mock("@/models/notification.model", () => ({
  kirimNotifikasi: (...args: unknown[]) => kirimNotifikasiMock(...args),
}));

import {
  simpanMesinAction,
  ubahStatusMesinAction,
  hapusMesinAction,
} from "@/controllers/machine.controller";

const ADMIN: Profil = {
  id: "u-admin",
  username: "althof123",
  full_name: "Althof",
  role: "Admin",
  legacy_id: null,
  is_active: true,
  created_at: "2026-10-01T00:00:00Z",
};
const KARYAWAN: Profil = { ...ADMIN, id: "u-staff", role: "Karyawan" };
const MESIN_WM01: Mesin = {
  id: 1,
  machine_code: "WM-01",
  machine_type: "Washer Front Load",
  status: "Digunakan",
  capacity_kg: 10,
  capacity_pcs: 20,
  last_used: null,
  available_at: null,
  created_at: "2026-10-01T00:00:00Z",
};

function formStatus(id: string, status: string): FormData {
  const fd = new FormData();
  fd.set("id", id);
  fd.set("status", status);
  return fd;
}

describe("FS-006: White-Box Unit Testing — machine.controller.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profilStub = ADMIN;
    mesinStub = { ...MESIN_WM01 };
    dipakaiOrderStub = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- ubahStatusMesinAction() (Manual White-Box Target FS-006) ---
  it("TC-FS06-01: menolak ubah status bila sesi berakhir atau pengguna bukan Admin", async () => {
    // Arrange & Act 1: sesi null
    profilStub = null;
    const rNull = await ubahStatusMesinAction(null, formStatus("1", "Maintenance"));

    // Arrange & Act 2: Karyawan
    profilStub = KARYAWAN;
    const rStaff = await ubahStatusMesinAction(null, formStatus("1", "Maintenance"));

    // Assert
    expect(rNull).toEqual({ ok: false, error: "Sesi berakhir. Silakan masuk lagi." });
    expect(rStaff).toEqual({
      ok: false,
      error: "Hanya Admin yang boleh mengubah data mesin.",
    });
  });

  it("TC-FS06-02: menolak ID mesin tidak valid", async () => {
    // Arrange
    const fd = formStatus("0", "Tersedia");

    // Act
    const hasil = await ubahStatusMesinAction(null, fd);

    // Assert
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toBe("Mesin tidak valid.");
  });

  it("TC-FS06-03: menolak status mesin yang tidak dikenal", async () => {
    // Arrange
    const fd = formStatus("1", "RusakBerat");

    // Act
    const hasil = await ubahStatusMesinAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: false, error: "Status mesin tidak dikenal." });
  });

  it("TC-FS06-04: menolak bila mesin tidak ditemukan di database", async () => {
    // Arrange
    mesinStub = null;
    const fd = formStatus("99", "Maintenance");

    // Act
    const hasil = await ubahStatusMesinAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: false, error: "Mesin tidak ditemukan." });
  });

  it("TC-FS06-05: menolak mengubah status ke Tersedia jika mesin masih dipakai order berjalan", async () => {
    // Arrange
    dipakaiOrderStub = true;
    const fd = formStatus("1", "Tersedia");

    // Act
    const hasil = await ubahStatusMesinAction(null, fd);

    // Assert
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toContain("masih dipakai order yang berjalan");
    expect(ubahStatusMesinMock).not.toHaveBeenCalled();
  });

  it("TC-FS06-06: menangani kegagalan database saat ubah status via Spy catatKegagalan", async () => {
    // Arrange
    ubahStatusMesinMock.mockRejectedValueOnce(new Error("DB error"));
    const spyCatat = vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});

    // Act
    const hasil = await ubahStatusMesinAction(null, formStatus("1", "Maintenance"));

    // Assert
    expect(spyCatat).toHaveBeenCalledWith("ubahStatusMesinAction", expect.any(Error));
    expect(hasil).toEqual({ ok: false, error: "Status mesin gagal diubah." });
  });

  it("TC-FS06-07: berhasil mengubah status mesin dan merevalidasi /machines & /orders", async () => {
    // Arrange
    const fd = formStatus("1", "Maintenance");

    // Act
    const hasil = await ubahStatusMesinAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: true, data: null });
    expect(ubahStatusMesinMock).toHaveBeenCalledWith(expect.anything(), 1, "Maintenance");
    expect(revalidatePathMock).toHaveBeenCalledWith("/machines");
    expect(revalidatePathMock).toHaveBeenCalledWith("/orders");
  });

  // --- simpanMesinAction() & hapusMesinAction() ---
  it("TC-FS06-08: memvalidasi kapasitas mesin (5–30 kg, 5–50 pcs), menyimpan mesin baru, dan mendeteksi duplikat kode", async () => {
    // Arrange: kapasitas tidak sah (< 5 kg)
    const fdBad = new FormData();
    fdBad.set("kode", "WM-05");
    fdBad.set("tipe", "Washer 5kg");
    fdBad.set("status", "Tersedia");
    fdBad.set("kapasitasKg", "3");
    fdBad.set("kapasitasPcs", "20");

    // Arrange: data sah
    const fdOk = new FormData();
    fdOk.set("kode", "WM-05");
    fdOk.set("tipe", "Washer Commercial");
    fdOk.set("status", "Tersedia");
    fdOk.set("kapasitasKg", "15");
    fdOk.set("kapasitasPcs", "30");

    // Act
    const rBad = await simpanMesinAction(null, fdBad);
    const rOk = await simpanMesinAction(null, fdOk);

    buatMesinMock.mockRejectedValueOnce(new Error("duplicate key machine_code"));
    vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});
    const rDup = await simpanMesinAction(null, fdOk);

    // Assert
    expect(rBad.ok).toBe(false);
    expect(rOk).toEqual({ ok: true, data: null });
    expect(kirimNotifikasiMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ judul: "Mesin Ditambahkan" })
    );
    expect(rDup).toEqual({ ok: false, error: "Kode mesin itu sudah dipakai mesin lain." });
  });

  it("TC-FS06-09: menolak hapus mesin yang dipakai order berjalan dan berhasil hapus mesin bebas", async () => {
    // Arrange
    const fd = new FormData();
    fd.set("id", "1");

    // Act 1: dipakai order
    dipakaiOrderStub = true;
    const rBusy = await hapusMesinAction(null, fd);

    // Act 2: bebas
    dipakaiOrderStub = false;
    const rOk = await hapusMesinAction(null, fd);

    // Assert
    expect(rBusy.ok).toBe(false);
    expect(rOk).toEqual({ ok: true, data: null });
    expect(hapusMesinMock).toHaveBeenCalledWith(expect.anything(), 1);
  });
});
