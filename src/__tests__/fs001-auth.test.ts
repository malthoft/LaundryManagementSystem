/**
 * White-Box Unit Testing — FS-001: Autentikasi Masuk (RQ-001)
 * Target: `src/controllers/auth.controller.ts` (`masuk`, `keluar`) & `src/lib/pesan-akun.ts` (`pesanDariStatus`)
 * Pola: Arrange–Act–Assert (AAA) dengan Dummy, Stub, Mock, dan Spy.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { KlienSupabase } from "@/lib/supabase/server";
import * as aksiModule from "@/lib/aksi";
import {
  pesanDariStatus,
  PESAN_MENUNGGU,
  PESAN_DITOLAK,
  PESAN_MENUNGGU_RESET,
  PESAN_DITOLAK_RESET,
} from "@/lib/pesan-akun";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const revalidatePathMock = vi.fn((..._args: unknown[]) => {});
const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn(async () => ({ error: null }));
let statusPermintaanStub: string | null = null;
let statusPermintaanError = false;

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  buatKlienServer: vi.fn(
    async () =>
      ({
        auth: {
          signInWithPassword: (...args: unknown[]) => signInWithPasswordMock(...args),
          signOut: () => signOutMock(),
        },
      }) as unknown as KlienSupabase
  ),
}));
vi.mock("@/models/permintaan.model", () => ({
  statusPermintaan: vi.fn(async () => {
    if (statusPermintaanError) throw new Error("RPC gagal");
    return statusPermintaanStub;
  }),
}));
vi.mock("@/models/profile.model", () => ({
  ubahNamaSaya: vi.fn(async () => {}),
}));
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    profilSaya: vi.fn(async () => null),
    penggunaSaya: vi.fn(async () => null),
  };
});

import { masuk, keluar } from "@/controllers/auth.controller";

function buatFormLogin(username: string, password: string): FormData {
  const fd = new FormData();
  fd.set("username", username);
  fd.set("password", password);
  return fd;
}

describe("FS-001: White-Box Unit Testing — auth.controller.ts (masuk) & pesanDariStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    statusPermintaanStub = null;
    statusPermintaanError = false;
    signInWithPasswordMock.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TC-FS01-01: menolak input tidak valid (username < 3 karakter / sandi kosong)", async () => {
    // Arrange
    const fd = buatFormLogin("ab", "");

    // Act
    const hasil = await masuk(null, fd);

    // Assert
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) {
      expect(hasil.error).toBe("Periksa kembali isian Anda.");
      expect(hasil.field?.username).toContain("3 sampai 30");
      expect(hasil.field?.password).toBe("Sandi wajib diisi");
    }
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });

  it("TC-FS01-02: menolak login bila akun masih berstatus Menunggu persetujuan developer", async () => {
    // Arrange
    statusPermintaanStub = "Menunggu|Pendaftaran";
    const fd = buatFormLogin("adminbaru", "Admin123");

    // Act
    const hasil = await masuk(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: false, error: PESAN_MENUNGGU });
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });

  it("TC-FS01-03: menolak login bila pendaftaran akun berstatus Ditolak developer", async () => {
    // Arrange
    statusPermintaanStub = "Ditolak|Pendaftaran";
    const fd = buatFormLogin("adminditolak", "Admin123");

    // Act
    const hasil = await masuk(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: false, error: PESAN_DITOLAK });
  });

  it("TC-FS01-04: menolak login bila kredensial salah dan tetap lanjut saat cek statusPermintaan error", async () => {
    // Arrange
    statusPermintaanError = true;
    signInWithPasswordMock.mockResolvedValue({ error: { message: "Invalid login" } });
    const spyCatat = vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});
    const fd = buatFormLogin("althof123", "Salah999");

    // Act
    const hasil = await masuk(null, fd);

    // Assert
    expect(spyCatat).toHaveBeenCalledWith("masuk/statusPermintaan", expect.any(Error));
    expect(hasil).toEqual({ ok: false, error: "Username atau sandi salah." });
  });

  it("TC-FS01-05: menangani gangguan jaringan saat signInWithPassword melempar exception", async () => {
    // Arrange
    signInWithPasswordMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const spyCatat = vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});
    const fd = buatFormLogin("althof123", "Admin123");

    // Act
    const hasil = await masuk(null, fd);

    // Assert
    expect(spyCatat).toHaveBeenCalledWith("masuk", expect.any(Error));
    expect(hasil).toEqual({
      ok: false,
      error: "Tidak bisa menghubungi server. Periksa koneksi internet.",
    });
  });

  it("TC-FS01-06: login valid pada akun aktif mengarahkan pengguna ke /dashboard", async () => {
    // Arrange
    const fd = buatFormLogin("althof123", "Admin123");

    // Act & Assert
    await expect(masuk(null, fd)).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "althof123@joyops.local",
      password: "Admin123",
    });
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("memverifikasi seluruh cabang pesanDariStatus() dan aksi keluar()", async () => {
    // Arrange & Act & Assert
    expect(pesanDariStatus(null)).toBeNull();
    expect(pesanDariStatus("Menunggu|Pendaftaran")).toBe(PESAN_MENUNGGU);
    expect(pesanDariStatus("Menunggu|Lupa Sandi")).toBe(PESAN_MENUNGGU_RESET);
    expect(pesanDariStatus("Ditolak|Pendaftaran")).toBe(PESAN_DITOLAK);
    expect(pesanDariStatus("Ditolak|Lupa Sandi")).toBe(PESAN_DITOLAK_RESET);
    expect(pesanDariStatus("Disetujui|Pendaftaran")).toBeNull();

    await expect(keluar()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });
});
