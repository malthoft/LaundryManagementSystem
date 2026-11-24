/**
 * White-Box Unit Testing — FS-002: Pendaftaran Akun Admin dengan Persetujuan Developer (RQ-002)
 * Target: `src/controllers/akun.controller.ts` (`daftarAction`)
 * Pola: Arrange–Act–Assert (AAA) dengan Dummy, Stub, Mock, dan Spy.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { KlienSupabase } from "@/lib/supabase/server";
import * as aksiModule from "@/lib/aksi";
import { PESAN_MENUNGGU } from "@/lib/pesan-akun";

let adminTersediaStub = true;
const createUserMock = vi.fn();
const eqUpdateMock = vi.fn(async (..._args: unknown[]) => ({ error: null }));
const catatPermintaanMock = vi.fn();
const kirimEmailMock = vi.fn(async (..._args: unknown[]) => true);

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  buatKlienServer: vi.fn(async () => ({}) as KlienSupabase),
}));
vi.mock("@/lib/supabase/admin", () => ({
  apakahAdminTersedia: () => adminTersediaStub,
  buatKlienAdmin: () =>
    ({
      auth: { admin: { createUser: (...args: unknown[]) => createUserMock(...args) } },
      from: () => ({
        update: () => ({
          eq: (...args: unknown[]) => eqUpdateMock(...args),
        }),
      }),
    }) as unknown as KlienSupabase,
}));
vi.mock("@/models/permintaan.model", () => ({
  catatPermintaan: (...args: unknown[]) => catatPermintaanMock(...args),
  cariPermintaanDenganToken: vi.fn(),
  tandaiTokenTerpakai: vi.fn(),
}));
vi.mock("@/models/profile.model", () => ({
  ambilProfilByUsername: vi.fn(),
}));
vi.mock("@/lib/email", () => ({
  kirimRingkasanPermintaan: (...args: unknown[]) => kirimEmailMock(...args),
}));

import { daftarAction } from "@/controllers/akun.controller";

function buatFormDaftar(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, string> = {
    username: "adminbaru",
    nama: "Admin Baru JoyOps",
    sandi: "Rahasia123",
    ulangi: "Rahasia123",
  };
  for (const [k, v] of Object.entries({ ...base, ...overrides })) fd.set(k, v);
  return fd;
}

describe("FS-002: White-Box Unit Testing — akun.controller.ts (daftarAction)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminTersediaStub = true;
    createUserMock.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null });
    catatPermintaanMock.mockResolvedValue("ok");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TC-FS02-01: menolak pendaftaran bila sandi < 6 karakter atau ulangan sandi tidak sama", async () => {
    // Arrange
    const fd = buatFormDaftar({ sandi: "12345", ulangi: "12346" });

    // Act
    const hasil = await daftarAction(null, fd);

    // Assert
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) {
      expect(hasil.error).toBe("Ada isian yang belum benar.");
      expect(hasil.field?.sandi).toBe("Sandi minimal 6 karakter");
      expect(hasil.field?.ulangi).toBe("Ulangan sandi tidak sama");
    }
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("TC-FS02-02: menolak pendaftaran bila layanan admin (service role key) belum aktif", async () => {
    // Arrange
    adminTersediaStub = false;
    const fd = buatFormDaftar();

    // Act
    const hasil = await daftarAction(null, fd);

    // Assert
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toContain("Layanan akun belum aktif");
  });

  it("TC-FS02-03: menolak pendaftaran ganda ketika username sudah berstatus Menunggu", async () => {
    // Arrange
    catatPermintaanMock.mockResolvedValue("sudah_ada");
    const fd = buatFormDaftar();

    // Act
    const hasil = await daftarAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: false, error: PESAN_MENUNGGU });
    expect(kirimEmailMock).not.toHaveBeenCalled();
  });

  it("TC-FS02-04: mencoba fallback klien admin lalu mengembalikan gagal jika catatPermintaan tetap gagal", async () => {
    // Arrange
    catatPermintaanMock.mockResolvedValue("gagal");
    const fd = buatFormDaftar();

    // Act
    const hasil = await daftarAction(null, fd);

    // Assert
    expect(catatPermintaanMock).toHaveBeenCalledTimes(2);
    expect(hasil).toEqual({
      ok: false,
      error: "Belum bisa mencatat pendaftaran. Coba lagi.",
    });
  });

  it("TC-FS02-05: berhasil mendaftarkan Admin nonaktif, mencatat permintaan, dan mengirim email notifikasi", async () => {
    // Arrange
    const fd = buatFormDaftar();

    // Act
    const hasil = await daftarAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: true, data: null });
    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "adminbaru@joyops.local",
        email_confirm: true,
      })
    );
    expect(eqUpdateMock).toHaveBeenCalledWith("username", "adminbaru");
    expect(kirimEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ jenis: "Pendaftaran", username: "adminbaru" })
    );
  });

  it("TC-FS02-06: menangani exception dari Supabase Auth dan mencatat via Spy catatKegagalan", async () => {
    // Arrange
    createUserMock.mockRejectedValue(new Error("Email already registered"));
    const spyCatat = vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});
    const fd = buatFormDaftar();

    // Act
    const hasil = await daftarAction(null, fd);

    // Assert
    expect(spyCatat).toHaveBeenCalledWith("daftarAction", expect.any(Error));
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toContain("Email already registered");
  });
});
