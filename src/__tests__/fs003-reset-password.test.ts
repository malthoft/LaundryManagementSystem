/**
 * White-Box Unit Testing — FS-003: Pemulihan Kata Sandi dengan Persetujuan Developer (RQ-003)
 * Target: `src/controllers/akun.controller.ts` (`lupaSandiAction` & `aturSandiAction`)
 * Pola: Arrange–Act–Assert (AAA) dengan Dummy, Stub, Mock, dan Spy.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { KlienSupabase } from "@/lib/supabase/server";
import * as aksiModule from "@/lib/aksi";
import { PESAN_MENUNGGU_RESET } from "@/lib/pesan-akun";

let adminTersediaStub = true;
let profilUsernameStub: { id: string; username: string } | null = {
  id: "u-1",
  username: "althof123",
};
let permintaanTokenStub: {
  id: number;
  username: string;
  token_terpakai: boolean;
  token_hangus_pada: string | null;
} | null = null;

const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const catatPermintaanMock = vi.fn();
const tandaiTokenTerpakaiMock = vi.fn(async (..._args: unknown[]) => {});
const listUsersMock = vi.fn();
const updateUserByIdMock = vi.fn(async (..._args: unknown[]) => ({ error: null }));
const kirimEmailMock = vi.fn(async (..._args: unknown[]) => true);

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));
vi.mock("@/lib/supabase/server", () => ({
  buatKlienServer: vi.fn(async () => ({}) as KlienSupabase),
}));
vi.mock("@/lib/supabase/admin", () => ({
  apakahAdminTersedia: () => adminTersediaStub,
  buatKlienAdmin: () =>
    ({
      auth: {
        admin: {
          listUsers: (...args: unknown[]) => listUsersMock(...args),
          updateUserById: (...args: unknown[]) => updateUserByIdMock(...args),
        },
      },
    }) as unknown as KlienSupabase,
}));
vi.mock("@/models/profile.model", () => ({
  ambilProfilByUsername: vi.fn(async () => profilUsernameStub),
}));
vi.mock("@/models/permintaan.model", () => ({
  catatPermintaan: (...args: unknown[]) => catatPermintaanMock(...args),
  cariPermintaanDenganToken: vi.fn(async () => permintaanTokenStub),
  tandaiTokenTerpakai: (...args: unknown[]) => tandaiTokenTerpakaiMock(...args),
}));
vi.mock("@/lib/email", () => ({
  kirimRingkasanPermintaan: (...args: unknown[]) => kirimEmailMock(...args),
}));

import { lupaSandiAction, aturSandiAction } from "@/controllers/akun.controller";

const TOKEN_VALID = "a".repeat(64);

describe("FS-003: White-Box Unit Testing — akun.controller.ts (lupaSandiAction & aturSandiAction)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminTersediaStub = true;
    profilUsernameStub = { id: "u-1", username: "althof123" };
    catatPermintaanMock.mockResolvedValue("ok");
    permintaanTokenStub = {
      id: 7,
      username: "althof123",
      token_terpakai: false,
      token_hangus_pada: new Date(Date.now() + 30 * 60_000).toISOString(),
    };
    listUsersMock.mockResolvedValue({
      data: { users: [{ id: "auth-1", user_metadata: { username: "althof123" } }] },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- lupaSandiAction() ---
  it("TC-FS03-01: menolak pengajuan lupa sandi dengan format username tidak valid", async () => {
    // Arrange
    const fd = new FormData();
    fd.set("username", "ab");

    // Act
    const hasil = await lupaSandiAction(null, fd);

    // Assert
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toBe("Ada isian yang belum benar.");
  });

  it("TC-FS03-02: menolak bila layanan admin belum aktif", async () => {
    // Arrange
    adminTersediaStub = false;
    const fd = new FormData();
    fd.set("username", "althof123");

    // Act
    const hasil = await lupaSandiAction(null, fd);

    // Assert
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toContain("Layanan akun belum aktif");
  });

  it("TC-FS03-03: menolak username yang tidak terdaftar di basis data", async () => {
    // Arrange
    profilUsernameStub = null;
    const fd = new FormData();
    fd.set("username", "tidakada99");

    // Act
    const hasil = await lupaSandiAction(null, fd);

    // Assert
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) {
      expect(hasil.error).toBe("Nama pengguna tidak ditemukan.");
      expect(hasil.field?.username).toContain("tidak terdaftar");
    }
  });

  it("TC-FS03-04: menolak pengajuan ganda saat permintaan lupa sandi masih Menunggu", async () => {
    // Arrange
    catatPermintaanMock.mockResolvedValue("sudah_ada");
    const fd = new FormData();
    fd.set("username", "althof123");

    // Act
    const hasil = await lupaSandiAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: false, error: PESAN_MENUNGGU_RESET });
  });

  it("TC-FS03-05: fallback klien admin gagal -> mengembalikan pesan gagal catat permintaan", async () => {
    // Arrange
    catatPermintaanMock.mockResolvedValue("gagal");
    const fd = new FormData();
    fd.set("username", "althof123");

    // Act
    const hasil = await lupaSandiAction(null, fd);

    // Assert
    expect(catatPermintaanMock).toHaveBeenCalledTimes(2);
    expect(hasil).toEqual({
      ok: false,
      error: "Belum bisa mencatat permintaan. Coba lagi.",
    });
  });

  it("TC-FS03-06: berhasil mengajukan lupa sandi untuk username terdaftar & mengirim notifikasi developer", async () => {
    // Arrange
    const fd = new FormData();
    fd.set("username", "althof123");

    // Act
    const hasil = await lupaSandiAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: true, data: null });
    expect(kirimEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ jenis: "Lupa Sandi", username: "althof123" })
    );
  });

  it("TC-FS03-07: menangani exception pada lupaSandiAction via Spy catatKegagalan", async () => {
    // Arrange
    catatPermintaanMock.mockRejectedValue(new Error("DB timeout"));
    const spyCatat = vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});
    const fd = new FormData();
    fd.set("username", "althof123");

    // Act
    const hasil = await lupaSandiAction(null, fd);

    // Assert
    expect(spyCatat).toHaveBeenCalledWith("lupaSandiAction", expect.any(Error));
    expect(hasil.ok).toBe(false);
  });

  // --- aturSandiAction() ---
  it("TC-FS03-08: menolak token tidak dikenal, sudah dipakai, atau sudah kedaluwarsa", async () => {
    // Arrange
    const makeFd = () => {
      const fd = new FormData();
      fd.set("token", TOKEN_VALID);
      fd.set("sandiBaru", "SandiBaru123");
      fd.set("ulangi", "SandiBaru123");
      return fd;
    };

    // Act 1: token tidak ditemukan
    permintaanTokenStub = null;
    const rNull = await aturSandiAction(null, makeFd());

    // Act 2: token sudah terpakai
    permintaanTokenStub = {
      id: 7,
      username: "althof123",
      token_terpakai: true,
      token_hangus_pada: new Date(Date.now() + 10_000).toISOString(),
    };
    const rUsed = await aturSandiAction(null, makeFd());

    // Act 3: token kedaluwarsa
    permintaanTokenStub = {
      id: 7,
      username: "althof123",
      token_terpakai: false,
      token_hangus_pada: new Date(Date.now() - 60_000).toISOString(),
    };
    const rExpired = await aturSandiAction(null, makeFd());

    // Assert
    expect(rNull).toEqual({ ok: false, error: "Tautan reset tidak dikenal." });
    expect(rUsed).toEqual({ ok: false, error: "Tautan reset sudah dipakai." });
    expect(rExpired).toEqual({
      ok: false,
      error: "Tautan reset sudah kedaluwarsa. Ajukan lupa sandi lagi.",
    });
  });

  it("TC-FS03-09: berhasil memperbarui sandi dengan token sah, menandai token terpakai, dan redirect ke /login", async () => {
    // Arrange
    const fd = new FormData();
    fd.set("token", TOKEN_VALID);
    fd.set("sandiBaru", "SandiBaru123");
    fd.set("ulangi", "SandiBaru123");

    // Act & Assert
    await expect(aturSandiAction(null, fd)).rejects.toThrow(
      "NEXT_REDIRECT:/login?pesan=sandi-diubah"
    );
    expect(updateUserByIdMock).toHaveBeenCalledWith("auth-1", { password: "SandiBaru123" });
    expect(tandaiTokenTerpakaiMock).toHaveBeenCalledWith(expect.anything(), 7);
  });
});
