/**
 * White-Box Unit Testing & Implementasi 5 Jenis Test Double
 * untuk Fitur Manajemen Order Kasir (FS-005 & FS-007) pada
 * `src/controllers/order.controller.ts`.
 *
 * Test Double yang diterapkan:
 *  1. Dummy — `dummyPrevState` & `dummySupabaseClient` (memenuhi parameter wajib tanpa dipanggil).
 *  2. Stub  — `profilSayaStub`, `ambilMesinByIdStub`, `ambilLayananAktifStub` (respon terkontrol).
 *  3. Mock  — `kirimNotifikasiMock`, `revalidatePathMock` (verifikasi interaksi & argumen).
 *  4. Fake  — `FakeOrderRepository` (repositori order in-memory sebagai pengganti PostgreSQL).
 *  5. Spy   — `vi.spyOn(batasModule, "batasQty")` & `vi.spyOn(aksiModule, "catatKegagalan")`.
 *
 * Seluruh test case menggunakan pola Arrange–Act–Assert (AAA).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { KlienSupabase } from "@/lib/supabase/server";
import type { Layanan, Mesin, Order, Profil } from "@/types/db";
import type { Hasil, OrderLengkap } from "@/types/domain";
import type { OrderBaru } from "@/models/order.model";
import * as batasModule from "@/lib/batas";
import * as aksiModule from "@/lib/aksi";

// ===========================================================================
// 1. FAKE OBJECT: In-Memory Order Repository (menggantikan database Supabase)
// ===========================================================================
class FakeOrderRepository {
  private orders = new Map<number, OrderLengkap>();
  private nextId = 1;
  private expiredCount = 0;
  public failNextCreateWith: unknown = null;
  public failNextCompleteWith: unknown = null;
  public failNextCancelWith: unknown = null;
  public failNextCloseExpired = false;

  reset(): void {
    this.orders.clear();
    this.nextId = 1;
    this.expiredCount = 0;
    this.failNextCreateWith = null;
    this.failNextCompleteWith = null;
    this.failNextCancelWith = null;
    this.failNextCloseExpired = false;
  }

  seed(order: OrderLengkap): void {
    this.orders.set(order.id, { ...order });
    if (order.id >= this.nextId) this.nextId = order.id + 1;
  }

  setExpiredCount(count: number): void {
    this.expiredCount = count;
  }

  create(masukan: OrderBaru): Order {
    if (this.failNextCreateWith !== null) {
      const err = this.failNextCreateWith;
      this.failNextCreateWith = null;
      throw err;
    }

    const id = this.nextId++;
    const hargaSatuan = 7_000;
    const addonTotal = masukan.addonIds.length * 3_000;
    const grandTotal = Math.round(hargaSatuan * masukan.qty) + addonTotal;
    const now = "2026-11-24T10:00:00+07:00";

    const baru: OrderLengkap = {
      id,
      order_code: `ORD-${String(id).padStart(3, "0")}`,
      washer_machine_id: masukan.washerId,
      dryer_machine_id: masukan.dryerId,
      service_id: masukan.serviceId,
      customer_name: masukan.namaPelanggan,
      qty: masukan.qty,
      service_price: hargaSatuan,
      addon_total: addonTotal,
      grand_total: grandTotal,
      duration_minutes: masukan.durasiOrder,
      start_time: now,
      end_time: now,
      status: "Berjalan",
      payment_method: masukan.metodeBayar,
      notes: masukan.catatan ?? null,
      created_by: "user-admin-1",
      created_at: now,
      washer: null,
      dryer: null,
      layanan: null,
      pembuat: null,
      baris_addon: [],
    };
    this.orders.set(id, baru);
    return baru;
  }

  findById(id: number): OrderLengkap | null {
    return this.orders.get(id) ?? null;
  }

  complete(id: number): void {
    if (this.failNextCompleteWith !== null) {
      const err = this.failNextCompleteWith;
      this.failNextCompleteWith = null;
      throw err;
    }
    const existing = this.orders.get(id);
    if (!existing) throw new Error("Order tidak ditemukan");
    existing.status = "Selesai";
  }

  cancel(id: number, alasan?: string): void {
    if (this.failNextCancelWith !== null) {
      const err = this.failNextCancelWith;
      this.failNextCancelWith = null;
      throw err;
    }
    const existing = this.orders.get(id);
    if (!existing) throw new Error("Order tidak ditemukan");
    existing.status = "Dibatalkan";
    if (alasan) existing.notes = alasan;
  }

  closeExpired(): number {
    if (this.failNextCloseExpired) {
      this.failNextCloseExpired = false;
      throw new Error("Koneksi RPC terputus");
    }
    return this.expiredCount;
  }

  getAll(): OrderLengkap[] {
    return Array.from(this.orders.values());
  }
}

const fakeOrderRepo = new FakeOrderRepository();

// ===========================================================================
// 2. DUMMY, STUB, & MOCK REGISTRATIONS
// ===========================================================================

// Dummy: objek kosong hanya untuk memenuhi parameter `supabase` tanpa dipakai.
const dummySupabaseClient = {} as KlienSupabase;

// Stub state: dikendalikan per test case.
let profilStub: Profil | null = null;
let mesinStubMap = new Map<number, Mesin>();
let layananStubList: Layanan[] = [];

// Mock functions: memverifikasi interaksi (call count & arguments).
const revalidatePathMock = vi.fn((..._args: unknown[]) => {});
const kirimNotifikasiMock = vi.fn(async (..._args: unknown[]) => {});

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  buatKlienServer: vi.fn(async () => dummySupabaseClient),
}));

vi.mock("@/lib/auth", () => ({
  profilSaya: vi.fn(async () => profilStub),
}));

vi.mock("@/models/machine.model", () => ({
  ambilMesinById: vi.fn(async (_supabase: KlienSupabase, id: number) => {
    return mesinStubMap.get(id) ?? null;
  }),
}));

vi.mock("@/models/service.model", () => ({
  ambilLayananAktif: vi.fn(async () => layananStubList),
}));

vi.mock("@/models/order.model", () => ({
  buatOrder: vi.fn(async (_supabase: KlienSupabase, masukan: OrderBaru) =>
    fakeOrderRepo.create(masukan)
  ),
  ambilOrderById: vi.fn(async (_supabase: KlienSupabase, id: number) =>
    fakeOrderRepo.findById(id)
  ),
  selesaikanOrder: vi.fn(async (_supabase: KlienSupabase, id: number) =>
    fakeOrderRepo.complete(id)
  ),
  batalkanOrder: vi.fn(
    async (_supabase: KlienSupabase, id: number, alasan?: string) =>
      fakeOrderRepo.cancel(id, alasan)
  ),
  tutupOrderKedaluwarsa: vi.fn(async () => fakeOrderRepo.closeExpired()),
}));

vi.mock("@/models/notification.model", () => ({
  kirimNotifikasi: (...args: unknown[]) => kirimNotifikasiMock(...args),
}));

import {
  buatOrderBaru,
  selesaikanOrderAction,
  batalkanOrderAction,
  rapikanOrderKedaluwarsa,
} from "@/controllers/order.controller";

// ===========================================================================
// DATA BANTU (FIXTURES)
// ===========================================================================
const PROFIL_ADMIN: Profil = {
  id: "user-admin-1",
  username: "althof123",
  full_name: "Muhammad Althof",
  role: "Admin",
  legacy_id: null,
  is_active: true,
  created_at: "2026-10-01T00:00:00Z",
};

const PROFIL_KARYAWAN: Profil = {
  ...PROFIL_ADMIN,
  id: "user-staff-1",
  username: "staf01",
  full_name: "Budi Santoso",
  role: "Karyawan",
};

const MESIN_CUCI_10KG: Mesin = {
  id: 1,
  machine_code: "WM-01",
  machine_type: "Washer Front Load",
  status: "Tersedia",
  capacity_kg: 10,
  capacity_pcs: 20,
  last_used: null,
  available_at: null,
  created_at: "2026-10-01T00:00:00Z",
};

const MESIN_PENGERING_8KG: Mesin = {
  id: 2,
  machine_code: "DM-01",
  machine_type: "Dryer Commercial",
  status: "Tersedia",
  capacity_kg: 8,
  capacity_pcs: 25,
  last_used: null,
  available_at: null,
  created_at: "2026-10-01T00:00:00Z",
};

const LAYANAN_KG: Layanan = {
  id: 10,
  service_name: "Cuci Kering Reguler",
  price: 7_000,
  unit: "kg",
  icon: "local_laundry_service",
  is_active: true,
  created_at: "2026-10-01T00:00:00Z",
};

const LAYANAN_PCS: Layanan = {
  id: 11,
  service_name: "Cuci Bed Cover Satuan",
  price: 25_000,
  unit: "pcs",
  icon: "bed",
  is_active: true,
  created_at: "2026-10-01T00:00:00Z",
};

function buatFormDataOrder(overrides: Record<string, string | string[]> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string | string[]> = {
    washerId: "1",
    dryerId: "2",
    serviceId: "10",
    namaPelanggan: "Siti Aminah",
    qty: "5",
    durasiOrder: "60",
    metodeBayar: "Cash",
    catatan: "Pisahkan pakaian putih",
    addonIds: ["1"],
  };
  const merged = { ...defaults, ...overrides };
  for (const [key, val] of Object.entries(merged)) {
    if (Array.isArray(val)) {
      for (const item of val) fd.append(key, item);
    } else {
      fd.set(key, val);
    }
  }
  return fd;
}

// ===========================================================================
// TEST SUITE
// ===========================================================================
describe("Unit Testing: order.controller.ts (FS-005 & FS-007)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeOrderRepo.reset();
    profilStub = PROFIL_ADMIN;
    mesinStubMap = new Map<number, Mesin>([
      [MESIN_CUCI_10KG.id, { ...MESIN_CUCI_10KG }],
      [MESIN_PENGERING_8KG.id, { ...MESIN_PENGERING_8KG }],
    ]);
    layananStubList = [{ ...LAYANAN_KG }, { ...LAYANAN_PCS }];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. buatOrderBaru()
  // -------------------------------------------------------------------------
  describe("buatOrderBaru()", () => {
    it("berhasil membuat order valid, menyimpan ke Fake Repository, memanggil Spy batasQty, serta Mock notifikasi & cache", async () => {
      // Arrange
      const dummyPrevState: Hasil<{ kode: string; pelanggan: string; total: number }> | null = null;
      const formData = buatFormDataOrder({ qty: "5", addonIds: ["1", "2"] });
      const spyBatasQty = vi.spyOn(batasModule, "batasQty");

      // Act
      const hasil = await buatOrderBaru(dummyPrevState, formData);

      // Assert
      expect(hasil.ok).toBe(true);
      if (hasil.ok) {
        expect(hasil.data).toEqual({
          kode: "ORD-001",
          pelanggan: "Siti Aminah",
          total: 41_000, // (5 * 7000) + (2 * 3000)
        });
      }
      // Verifikasi Fake Repository menyimpan order di memori
      expect(fakeOrderRepo.getAll()).toHaveLength(1);
      expect(fakeOrderRepo.findById(1)?.status).toBe("Berjalan");

      // Verifikasi Spy mengamati eksekusi nyata batasQty()
      expect(spyBatasQty).toHaveBeenCalledTimes(1);
      expect(spyBatasQty).toHaveBeenCalledWith({
        unit: "kg",
        kapasitasMesinCuci: { kg: 10, pcs: 20 },
        kapasitasMesinPengering: { kg: 8, pcs: 25 },
      });

      // Verifikasi Mock notifikasi & revalidatePath
      expect(kirimNotifikasiMock).toHaveBeenCalledTimes(1);
      expect(kirimNotifikasiMock).toHaveBeenCalledWith(
        dummySupabaseClient,
        expect.objectContaining({
          judul: "Order Baru",
          tipe: "success",
          untukPeran: "All",
          tipeTerkait: "order",
          idTerkait: 1,
        })
      );
      expect(revalidatePathMock).toHaveBeenCalledWith("/orders");
      expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
      expect(revalidatePathMock).toHaveBeenCalledWith("/machines");
      expect(revalidatePathMock).toHaveBeenCalledWith("/finance");
    });

    it("menolak pembuatan order bila sesi pengguna sudah berakhir (profil null)", async () => {
      // Arrange
      profilStub = null;
      const formData = buatFormDataOrder();

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil).toEqual({
        ok: false,
        error: "Sesi berakhir. Silakan masuk lagi.",
      });
      expect(kirimNotifikasiMock).not.toHaveBeenCalled();
    });

    it("menolak pembuatan order bila akun pengguna tidak aktif", async () => {
      // Arrange
      profilStub = { ...PROFIL_KARYAWAN, is_active: false };
      const formData = buatFormDataOrder();

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil).toEqual({
        ok: false,
        error: "Akun Anda sedang tidak aktif.",
      });
      expect(fakeOrderRepo.getAll()).toHaveLength(0);
    });

    it("menolak input yang melanggar skema validasi Zod (qty = 0)", async () => {
      // Arrange
      const formData = buatFormDataOrder({ qty: "0" });

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil.ok).toBe(false);
      if (!hasil.ok) {
        expect(hasil.error).toBe("Periksa kembali isian order.");
        expect(hasil.field?.qty).toBe("Qty minimal 1");
      }
      expect(kirimNotifikasiMock).not.toHaveBeenCalled();
    });

    it("menolak bila ID mesin cuci dan mesin pengering sama", async () => {
      // Arrange
      const formData = buatFormDataOrder({ washerId: "1", dryerId: "1" });

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil.ok).toBe(false);
      if (!hasil.ok) {
        expect(hasil.error).toBe("Mesin cuci dan pengering tidak boleh sama.");
        expect(hasil.field?.dryerId).toBe("Pilih mesin pengering yang berbeda");
      }
    });

    it("menolak bila mesin cuci tidak ditemukan atau tidak berkode WM-", async () => {
      // Arrange
      mesinStubMap.set(1, { ...MESIN_CUCI_10KG, machine_code: "DM-99" });
      const formData = buatFormDataOrder();

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil.ok).toBe(false);
      if (!hasil.ok) {
        expect(hasil.error).toBe("Mesin cuci yang dipilih tidak sah.");
        expect(hasil.field?.washerId).toBe("Pilih mesin dari daftar mesin cuci");
      }
    });

    it("menolak bila mesin pengering tidak ditemukan atau tidak berkode DM-", async () => {
      // Arrange
      mesinStubMap.delete(2);
      const formData = buatFormDataOrder();

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil.ok).toBe(false);
      if (!hasil.ok) {
        expect(hasil.error).toBe("Mesin pengering yang dipilih tidak sah.");
        expect(hasil.field?.dryerId).toBe("Pilih mesin dari daftar mesin pengering");
      }
    });

    it("menolak bila mesin cuci berstatus Digunakan / tidak Tersedia", async () => {
      // Arrange
      mesinStubMap.set(1, { ...MESIN_CUCI_10KG, status: "Digunakan" });
      const formData = buatFormDataOrder();

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil.ok).toBe(false);
      if (!hasil.ok) {
        expect(hasil.error).toContain("Mesin WM-01 sedang tidak tersedia");
      }
    });

    it("menolak bila mesin pengering berstatus Maintenance / tidak Tersedia", async () => {
      // Arrange
      mesinStubMap.set(2, { ...MESIN_PENGERING_8KG, status: "Maintenance" });
      const formData = buatFormDataOrder();

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil.ok).toBe(false);
      if (!hasil.ok) {
        expect(hasil.error).toContain("Mesin DM-01 sedang tidak tersedia");
      }
    });

    it("menolak bila layanan tidak ditemukan atau tidak aktif", async () => {
      // Arrange
      const formData = buatFormDataOrder({ serviceId: "999" });

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil.ok).toBe(false);
      if (!hasil.ok) {
        expect(hasil.error).toBe("Layanan tidak ditemukan atau sudah tidak aktif.");
        expect(hasil.field?.serviceId).toBe("Pilih layanan yang aktif");
      }
    });

    it("menolak qty pecahan untuk layanan bersatuan pcs", async () => {
      // Arrange
      const formData = buatFormDataOrder({ serviceId: "11", qty: "2.5" });

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil.ok).toBe(false);
      if (!hasil.ok) {
        expect(hasil.error).toBe("Jumlah pcs harus bilangan bulat.");
        expect(hasil.field?.qty).toContain("Cuci Bed Cover Satuan");
      }
    });

    it("menolak qty melebihi kapasitas terkecil dari pasangan mesin (BR-18)", async () => {
      // Arrange: WM-01 = 10 kg, DM-01 = 8 kg -> batas efektif = 8 kg; input 9 kg harus ditolak
      const formData = buatFormDataOrder({ qty: "9" });
      const spyBatasQty = vi.spyOn(batasModule, "batasQty");

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(spyBatasQty).toHaveBeenCalledTimes(1);
      expect(spyBatasQty).toHaveReturnedWith(8);
      expect(hasil.ok).toBe(false);
      if (!hasil.ok) {
        expect(hasil.error).toContain("Maksimal 8 kg");
        expect(hasil.field?.qty).toContain("Maksimal 8 kg");
      }
      expect(fakeOrderRepo.getAll()).toHaveLength(0);
    });

    it("menangani kegagalan penyimpanan database dan mencatat error melalui Spy catatKegagalan", async () => {
      // Arrange
      fakeOrderRepo.failNextCreateWith = new Error("Mesin terkunci transaksi lain");
      const spyCatat = vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});
      const formData = buatFormDataOrder();

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil).toEqual({
        ok: false,
        error: "Mesin terkunci transaksi lain",
      });
      expect(spyCatat).toHaveBeenCalledTimes(1);
      expect(spyCatat).toHaveBeenCalledWith("buatOrderBaru", expect.any(Error));
      expect(kirimNotifikasiMock).not.toHaveBeenCalled();
    });

    it("mengembalikan pesan fallback bila pengecualian yang dilempar bukan instance Error", async () => {
      // Arrange
      fakeOrderRepo.failNextCreateWith = "kesalahan tak terduga";
      vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});
      const formData = buatFormDataOrder();

      // Act
      const hasil = await buatOrderBaru(null, formData);

      // Assert
      expect(hasil).toEqual({ ok: false, error: "Order gagal dibuat." });
    });
  });

  // -------------------------------------------------------------------------
  // 2. selesaikanOrderAction()
  // -------------------------------------------------------------------------
  describe("selesaikanOrderAction()", () => {
    it("berhasil menyelesaikan order, mengubah status di Fake Repository, dan mengirim notifikasi", async () => {
      // Arrange
      const created = fakeOrderRepo.create({
        washerId: 1,
        dryerId: 2,
        serviceId: 10,
        namaPelanggan: "Andi",
        qty: 4,
        durasiOrder: 45,
        addonIds: [],
        metodeBayar: "QRIS",
      });
      const fd = new FormData();
      fd.set("id", String(created.id));

      // Act
      const hasil = await selesaikanOrderAction(null, fd);

      // Assert
      expect(hasil).toEqual({ ok: true, data: null });
      expect(fakeOrderRepo.findById(created.id)?.status).toBe("Selesai");
      expect(kirimNotifikasiMock).toHaveBeenCalledWith(
        dummySupabaseClient,
        expect.objectContaining({
          judul: "Order Selesai",
          tipe: "info",
          idTerkait: created.id,
        })
      );
      expect(revalidatePathMock).toHaveBeenCalledWith("/orders");
      expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
      expect(revalidatePathMock).toHaveBeenCalledWith("/machines");
    });

    it("menolak bila sesi berakhir, ID tidak valid, order tidak ditemukan, atau RPC gagal", async () => {
      // Arrange & Act 1: sesi null
      profilStub = null;
      const fdValid = new FormData();
      fdValid.set("id", "1");
      const resNoAuth = await selesaikanOrderAction(null, fdValid);

      // Arrange & Act 2: ID tidak valid
      profilStub = PROFIL_KARYAWAN;
      const fdInvalid = new FormData();
      fdInvalid.set("id", "0");
      const resInvalidId = await selesaikanOrderAction(null, fdInvalid);

      // Arrange & Act 3: Order tidak ada
      const resNotFound = await selesaikanOrderAction(null, fdValid);

      // Arrange & Act 4: Error saat RPC
      const order = fakeOrderRepo.create({
        washerId: 1,
        dryerId: 2,
        serviceId: 10,
        namaPelanggan: "Dina",
        qty: 3,
        durasiOrder: 30,
        addonIds: [],
        metodeBayar: "Cash",
      });
      fakeOrderRepo.failNextCompleteWith = new Error("RPC timeout");
      vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});
      const fdOrder = new FormData();
      fdOrder.set("id", String(order.id));
      const resRpcErr = await selesaikanOrderAction(null, fdOrder);

      fakeOrderRepo.failNextCompleteWith = "non-error";
      const resNonErr = await selesaikanOrderAction(null, fdOrder);

      // Assert
      expect(resNoAuth).toEqual({ ok: false, error: "Sesi berakhir. Silakan masuk lagi." });
      expect(resInvalidId.ok).toBe(false);
      expect(resNotFound).toEqual({ ok: false, error: "Order tidak ditemukan." });
      expect(resRpcErr).toEqual({ ok: false, error: "RPC timeout" });
      expect(resNonErr).toEqual({ ok: false, error: "Order gagal diselesaikan." });
    });
  });

  // -------------------------------------------------------------------------
  // 3. batalkanOrderAction()
  // -------------------------------------------------------------------------
  describe("batalkanOrderAction()", () => {
    it("berhasil membatalkan order oleh Admin, menyimpan alasan ke Fake Repository, dan mengirim notifikasi warning", async () => {
      // Arrange
      const order = fakeOrderRepo.create({
        washerId: 1,
        dryerId: 2,
        serviceId: 10,
        namaPelanggan: "Rina",
        qty: 2,
        durasiOrder: 30,
        addonIds: [],
        metodeBayar: "Cash",
      });
      const fd = new FormData();
      fd.set("id", String(order.id));
      fd.set("alasan", "Pelanggan membatalkan sebelum dicuci");

      // Act
      const hasil = await batalkanOrderAction(null, fd);

      // Assert
      expect(hasil).toEqual({ ok: true, data: null });
      expect(fakeOrderRepo.findById(order.id)?.status).toBe("Dibatalkan");
      expect(fakeOrderRepo.findById(order.id)?.notes).toBe(
        "Pelanggan membatalkan sebelum dicuci"
      );
      expect(kirimNotifikasiMock).toHaveBeenCalledWith(
        dummySupabaseClient,
        expect.objectContaining({
          judul: "Order Dibatalkan",
          tipe: "warning",
          idTerkait: order.id,
        })
      );
      expect(revalidatePathMock).toHaveBeenCalledWith("/finance");
    });

    it("menolak pembatalan oleh Karyawan (BR-12), tanpa sesi, ID tidak sah, tidak ditemukan, sudah dibatalkan, atau RPC gagal", async () => {
      // Arrange: seed satu order aktif dan satu order sudah dibatalkan
      const aktif = fakeOrderRepo.create({
        washerId: 1,
        dryerId: 2,
        serviceId: 10,
        namaPelanggan: "Tono",
        qty: 3,
        durasiOrder: 40,
        addonIds: [],
        metodeBayar: "Cash",
      });
      const fdAktif = new FormData();
      fdAktif.set("id", String(aktif.id));
      fdAktif.set("alasan", "Salah input");

      // Act 1: sesi null
      profilStub = null;
      const resNoAuth = await batalkanOrderAction(null, fdAktif);

      // Act 2: Karyawan dilarang membatalkan (BR-12)
      profilStub = PROFIL_KARYAWAN;
      const resKaryawan = await batalkanOrderAction(null, fdAktif);

      // Act 3: ID tidak valid
      profilStub = PROFIL_ADMIN;
      const fdBad = new FormData();
      fdBad.set("id", "-5");
      const resBadId = await batalkanOrderAction(null, fdBad);

      // Act 4: Order tidak ditemukan
      const fdMissing = new FormData();
      fdMissing.set("id", "999");
      const resMissing = await batalkanOrderAction(null, fdMissing);

      // Act 5: Error saat RPC (Error & non-Error)
      vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});
      fakeOrderRepo.failNextCancelWith = new Error("Gagal hapus transaksi");
      const resRpcErr = await batalkanOrderAction(null, fdAktif);
      fakeOrderRepo.failNextCancelWith = "unexpected";
      const resNonErr = await batalkanOrderAction(null, fdAktif);

      // Act 6: Order sudah berstatus Dibatalkan
      fakeOrderRepo.cancel(aktif.id, "Sudah batal");
      const resAlreadyCanceled = await batalkanOrderAction(null, fdAktif);

      // Assert
      expect(resNoAuth).toEqual({ ok: false, error: "Sesi berakhir. Silakan masuk lagi." });
      expect(resKaryawan).toEqual({
        ok: false,
        error: "Hanya Admin yang boleh membatalkan order.",
      });
      expect(resBadId.ok).toBe(false);
      expect(resMissing).toEqual({ ok: false, error: "Order tidak ditemukan." });
      expect(resRpcErr).toEqual({ ok: false, error: "Gagal hapus transaksi" });
      expect(resNonErr).toEqual({ ok: false, error: "Order gagal dibatalkan." });
      expect(resAlreadyCanceled).toEqual({
        ok: false,
        error: "Order ini sudah dibatalkan.",
      });
    });
  });

  // -------------------------------------------------------------------------
  // 4. rapikanOrderKedaluwarsa()
  // -------------------------------------------------------------------------
  describe("rapikanOrderKedaluwarsa()", () => {
    it("mengembalikan jumlah order kedaluwarsa yang berhasil ditutup", async () => {
      // Arrange
      fakeOrderRepo.setExpiredCount(3);

      // Act
      const hasil = await rapikanOrderKedaluwarsa();

      // Assert
      expect(hasil).toEqual({ ok: true, data: 3 });
    });

    it("menangani kegagalan RPC dan mencatat error via Spy catatKegagalan", async () => {
      // Arrange
      fakeOrderRepo.failNextCloseExpired = true;
      const spyCatat = vi.spyOn(aksiModule, "catatKegagalan").mockImplementation(() => {});

      // Act
      const hasil = await rapikanOrderKedaluwarsa();

      // Assert
      expect(hasil).toEqual({
        ok: false,
        error: "Gagal merapikan order kedaluwarsa.",
      });
      expect(spyCatat).toHaveBeenCalledWith("rapikanOrderKedaluwarsa", expect.any(Error));
    });
  });
});
