/**
 * White-Box Unit Testing — FS-008: Penambahan Order dan Pembukuan Arus Kas (RQ-008)
 * Target: `src/controllers/finance.controller.ts` (`simpanTransaksiAction`, `hapusTransaksiAction`)
 * Pola: Arrange–Act–Assert (AAA) dengan Dummy, Stub, Mock, dan Spy.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { KlienSupabase } from "@/lib/supabase/server";
import type { Profil } from "@/types/db";
import * as aksiModule from "@/lib/aksi";

let profilStub: Profil | null = null;
const revalidatePathMock = vi.fn((..._args: unknown[]) => {});
const buatTransaksiMock = vi.fn(async (..._args: unknown[]) => {});
const ubahTransaksiMock = vi.fn(async (..._args: unknown[]) => {});
const hapusTransaksiMock = vi.fn(async (..._args: unknown[]) => {});
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
vi.mock("@/models/transaction.model", () => ({
  buatTransaksi: (...args: unknown[]) => buatTransaksiMock(...args),
  ubahTransaksi: (...args: unknown[]) => ubahTransaksiMock(...args),
  hapusTransaksi: (...args: unknown[]) => hapusTransaksiMock(...args),
}));
vi.mock("@/models/notification.model", () => ({
  kirimNotifikasi: (...args: unknown[]) => kirimNotifikasiMock(...args),
}));

import {
  simpanTransaksiAction,
  hapusTransaksiAction,
} from "@/controllers/finance.controller";

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

function formTransaksi(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, string> = {
    tanggal: "2026-11-24",
    tipe: "Pemasukan",
    jumlah: "75000",
    metode: "Cash",
    deskripsi: "Pelunasan order kasir harian",
  };
  for (const [k, v] of Object.entries({ ...base, ...overrides })) fd.set(k, v);
  return fd;
}

describe("FS-008: White-Box Unit Testing — finance.controller.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profilStub = ADMIN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TC-FS08-01: menolak pencatatan kas bila sesi berakhir atau pengguna adalah Karyawan (BR-13)", async () => {
    // Arrange & Act 1: sesi null
    profilStub = null;
    const rNull = await simpanTransaksiAction(null, formTransaksi());

    // Arrange & Act 2: Karyawan
    profilStub = KARYAWAN;
    const rStaff = await simpanTransaksiAction(null, formTransaksi());

    // Assert
    expect(rNull).toEqual({ ok: false, error: "Sesi berakhir. Silakan masuk lagi." });
    expect(rStaff).toEqual({
      ok: false,
      error: "Hanya Admin yang boleh mengubah catatan keuangan.",
    });
  });

  it("TC-FS08-02: menolak nominal kas di luar batas Rp 500 – Rp 10.000.000", async () => {
    // Arrange
    const fdMin = formTransaksi({ jumlah: "499" });
    const fdMax = formTransaksi({ jumlah: "10000001" });

    // Act
    const rMin = await simpanTransaksiAction(null, fdMin);
    const rMax = await simpanTransaksiAction(null, fdMax);

    // Assert
    expect(rMin.ok).toBe(false);
    if (!rMin.ok) expect(rMin.field?.jumlah).toBe("Jumlah minimal Rp 500");
    expect(rMax.ok).toBe(false);
    if (!rMax.ok) expect(rMax.field?.jumlah).toBe("Jumlah maksimal Rp 10.000.000");
    expect(buatTransaksiMock).not.toHaveBeenCalled();
  });

  it("TC-FS08-03: berhasil mencatat transaksi Pemasukan baru dan mengirim notifikasi tipe success", async () => {
    // Arrange
    const fd = formTransaksi({ tipe: "Pemasukan", jumlah: "150000" });

    // Act
    const hasil = await simpanTransaksiAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: true, data: null });
    expect(buatTransaksiMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transaction_type: "Pemasukan",
        amount: 150_000,
        created_by: "u-admin",
      })
    );
    expect(kirimNotifikasiMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ judul: "Transaksi Baru", tipe: "success" })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/finance");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("TC-FS08-04: berhasil memperbarui transaksi Pengeluaran (id terisi) dengan notifikasi tipe warning", async () => {
    // Arrange
    const fd = formTransaksi({
      id: "12",
      tipe: "Pengeluaran",
      jumlah: "250000",
      metode: "Transfer",
      deskripsi: "Beli deterjen dan pewangi",
    });

    // Act
    const hasil = await simpanTransaksiAction(null, fd);

    // Assert
    expect(hasil).toEqual({ ok: true, data: null });
    expect(ubahTransaksiMock).toHaveBeenCalledWith(
      expect.anything(),
      12,
      expect.objectContaining({ transaction_type: "Pengeluaran", amount: 250_000 })
    );
    expect(kirimNotifikasiMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ judul: "Transaksi Diperbarui", tipe: "warning" })
    );
  });

  it("TC-FS08-05: menangani kegagalan database saat simpan transaksi melalui Spy catatKegagalan", async () => {
    // Arrange
    buatTransaksiMock.mockRejectedValueOnce(new Error("DB write failed"));
    const spyCatat = vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});

    // Act
    const hasil = await simpanTransaksiAction(null, formTransaksi());

    // Assert
    expect(spyCatat).toHaveBeenCalledWith("simpanTransaksiAction", expect.any(Error));
    expect(hasil).toEqual({ ok: false, error: "Transaksi gagal disimpan." });
  });

  it("TC-FS08-06: menguji hapusTransaksiAction (validasi izin, ID tidak valid, sukses, dan error DB)", async () => {
    // Arrange & Act 1: non-Admin
    profilStub = KARYAWAN;
    const fdValid = new FormData();
    fdValid.set("id", "9");
    const rNoAuth = await hapusTransaksiAction(null, fdValid);

    // Arrange & Act 2: ID tidak valid
    profilStub = ADMIN;
    const fdBad = new FormData();
    fdBad.set("id", "0");
    const rBad = await hapusTransaksiAction(null, fdBad);

    // Arrange & Act 3: Sukses
    const rOk = await hapusTransaksiAction(null, fdValid);

    // Arrange & Act 4: Error DB
    hapusTransaksiMock.mockRejectedValueOnce(new Error("FK constraint"));
    vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});
    const rErr = await hapusTransaksiAction(null, fdValid);

    // Assert
    expect(rNoAuth.ok).toBe(false);
    expect(rBad.ok).toBe(false);
    expect(rOk).toEqual({ ok: true, data: null });
    expect(rErr).toEqual({ ok: false, error: "Transaksi gagal dihapus." });
  });
});
