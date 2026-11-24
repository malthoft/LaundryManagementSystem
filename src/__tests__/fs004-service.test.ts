/**
 * White-Box Unit Testing — FS-004: Manajemen Katalog Layanan dan Tarif (RQ-004)
 * Target: `src/controllers/service.controller.ts` (`simpanLayananAction`, `hapusLayananAction`, `simpanAddonAction`, `hapusAddonAction`)
 * Pola: Arrange–Act–Assert (AAA) dengan Dummy, Stub, Mock, dan Spy.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { KlienSupabase } from "@/lib/supabase/server";
import type { Profil } from "@/types/db";
import * as aksiModule from "@/lib/aksi";

let profilStub: Profil | null = null;
const revalidatePathMock = vi.fn((..._args: unknown[]) => {});
const buatLayananMock = vi.fn(async (..._args: unknown[]) => {});
const ubahLayananMock = vi.fn(async (..._args: unknown[]) => {});
const hapusLayananMock = vi.fn(async (..._args: unknown[]) => {});
const layananDipakaiOrderMock = vi.fn(async (..._args: unknown[]) => false);
const buatAddonMock = vi.fn(async (..._args: unknown[]) => {});
const ubahAddonMock = vi.fn(async (..._args: unknown[]) => {});
const hapusAddonMock = vi.fn(async (..._args: unknown[]) => {});
const addonDipakaiOrderMock = vi.fn(async (..._args: unknown[]) => false);
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
vi.mock("@/models/service.model", () => ({
  buatLayanan: (...args: unknown[]) => buatLayananMock(...args),
  ubahLayanan: (...args: unknown[]) => ubahLayananMock(...args),
  hapusLayanan: (...args: unknown[]) => hapusLayananMock(...args),
  layananDipakaiOrder: (...args: unknown[]) => layananDipakaiOrderMock(...args),
}));
vi.mock("@/models/addon.model", () => ({
  buatAddon: (...args: unknown[]) => buatAddonMock(...args),
  ubahAddon: (...args: unknown[]) => ubahAddonMock(...args),
  hapusAddon: (...args: unknown[]) => hapusAddonMock(...args),
  addonDipakaiOrder: (...args: unknown[]) => addonDipakaiOrderMock(...args),
}));
vi.mock("@/models/notification.model", () => ({
  kirimNotifikasi: (...args: unknown[]) => kirimNotifikasiMock(...args),
}));

import {
  simpanLayananAction,
  hapusLayananAction,
  simpanAddonAction,
  hapusAddonAction,
} from "@/controllers/service.controller";

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

function formLayanan(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, string> = {
    nama: "Cuci Kering Lipat",
    harga: "8000",
    satuan: "kg",
    ikon: "local_laundry_service",
    aktif: "true",
  };
  for (const [k, v] of Object.entries({ ...base, ...overrides })) fd.set(k, v);
  return fd;
}

describe("FS-004: White-Box Unit Testing — service.controller.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profilStub = ADMIN;
    layananDipakaiOrderMock.mockResolvedValue(false);
    addonDipakaiOrderMock.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TC-FS04-01: menolak simpan layanan bila sesi berakhir atau pengguna adalah Karyawan", async () => {
    // Arrange & Act 1: sesi null
    profilStub = null;
    const rNull = await simpanLayananAction(null, formLayanan());

    // Arrange & Act 2: Karyawan
    profilStub = KARYAWAN;
    const rStaff = await simpanLayananAction(null, formLayanan());

    // Assert
    expect(rNull).toEqual({ ok: false, error: "Sesi berakhir. Silakan masuk lagi." });
    expect(rStaff).toEqual({
      ok: false,
      error: "Hanya Admin yang boleh mengubah layanan dan add-on.",
    });
  });

  it("TC-FS04-02: menolak harga layanan di luar batas Rp 1.000 – Rp 500.000", async () => {
    // Arrange
    const fd = formLayanan({ harga: "500" });

    // Act
    const hasil = await simpanLayananAction(null, fd);

    // Assert
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) {
      expect(hasil.error).toBe("Periksa kembali isian layanan.");
      expect(hasil.field?.harga).toBe("Harga minimal Rp 1.000");
    }
    expect(buatLayananMock).not.toHaveBeenCalled();
  });

  it("TC-FS04-03: berhasil menambah layanan baru (id kosong) dan merevalidasi cache", async () => {
    // Arrange
    const fd = formLayanan();

    // Act
    const hasil = await simpanLayananAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: true, data: null });
    expect(buatLayananMock).toHaveBeenCalledTimes(1);
    expect(ubahLayananMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/services");
    expect(revalidatePathMock).toHaveBeenCalledWith("/orders");
  });

  it("TC-FS04-04: berhasil memperbarui layanan yang sudah ada (id terisi)", async () => {
    // Arrange
    const fd = formLayanan({ id: "5", harga: "12000" });

    // Act
    const hasil = await simpanLayananAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: true, data: null });
    expect(ubahLayananMock).toHaveBeenCalledWith(
      expect.anything(),
      5,
      expect.objectContaining({ price: 12_000 })
    );
  });

  it("TC-FS04-05: menangani error database saat simpan layanan melalui Spy catatKegagalan", async () => {
    // Arrange
    buatLayananMock.mockRejectedValueOnce(new Error("Insert failed"));
    const spyCatat = vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});

    // Act
    const hasil = await simpanLayananAction(null, formLayanan());

    // Assert
    expect(spyCatat).toHaveBeenCalledWith("simpanLayananAction", expect.any(Error));
    expect(hasil).toEqual({ ok: false, error: "Layanan gagal disimpan." });
  });

  it("TC-FS04-06: menolak hapus layanan yang sudah dipakai order, dan berhasil hapus layanan bebas", async () => {
    // Arrange
    const fd = new FormData();
    fd.set("id", "3");
    layananDipakaiOrderMock.mockResolvedValueOnce(true);

    // Act 1: sudah dipakai order
    const rDipakai = await hapusLayananAction(null, fd);
    // Act 2: tidak dipakai order
    const rBebas = await hapusLayananAction(null, fd);

    // Assert
    expect(rDipakai.ok).toBe(false);
    if (!rDipakai.ok) expect(rDipakai.error).toContain("sudah dipakai order lama");
    expect(rBebas).toEqual({ ok: true, data: null });
    expect(hapusLayananMock).toHaveBeenCalledWith(expect.anything(), 3);
  });

  it("TC-FS04-07: mengelola add-on (tambah + notifikasi, ubah, dan hapus)", async () => {
    // Arrange
    const fdBaru = new FormData();
    fdBaru.set("nama", "Pewangi Premium");
    fdBaru.set("harga", "3000");
    fdBaru.set("aktif", "true");

    const fdUbah = new FormData();
    fdUbah.set("id", "2");
    fdUbah.set("nama", "Pewangi Premium");
    fdUbah.set("harga", "4000");
    fdUbah.set("aktif", "true");

    const fdHapus = new FormData();
    fdHapus.set("id", "2");

    // Act
    const rBaru = await simpanAddonAction(null, fdBaru);
    const rUbah = await simpanAddonAction(null, fdUbah);
    const rHapus = await hapusAddonAction(null, fdHapus);

    // Assert
    expect(rBaru).toEqual({ ok: true, data: null });
    expect(kirimNotifikasiMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ judul: "Add-on Baru" })
    );
    expect(rUbah).toEqual({ ok: true, data: null });
    expect(ubahAddonMock).toHaveBeenCalledTimes(1);
    expect(rHapus).toEqual({ ok: true, data: null });
    expect(hapusAddonMock).toHaveBeenCalledWith(expect.anything(), 2);
  });
});
