/**
 * Pengujian otomatis kriteria Performance (Software Inspection No. 4).
 * Mengukur satu komputasi terberat: menghitung total order.
 */
import { describe, it, expect } from "vitest";
import { ringkasOrderTanggal } from "@/models/order.model";
import type { KlienSupabase } from "@/lib/supabase/server";

const AMBANG_MS = 50;
const JUMLAH_ORDER = 5000;

/** Klien Supabase tiruan: mengembalikan data uji tanpa jaringan. */
function klienTiruan(data: unknown[]): KlienSupabase {
  const rantai: Record<string, unknown> = {};
  rantai.select = () => rantai;
  rantai.gte = () => rantai;
  rantai.lte = () => rantai;
  rantai.returns = async () => ({ data, error: null });
  return { from: () => rantai } as unknown as KlienSupabase;
}

describe("Performance", () => {
  it(`menghitung total ${JUMLAH_ORDER} order di bawah ${AMBANG_MS} ms`, async () => {
    const data = Array.from({ length: JUMLAH_ORDER }, (_, i) => ({
      status: i % 5 === 0 ? "Dibatalkan" : "Berjalan",
      grand_total: 15000 + (i % 40) * 500,
    }));

    const mulai = performance.now();
    const hasil = await ringkasOrderTanggal(klienTiruan(data), "2026-09-29");
    const durasi = performance.now() - mulai;

    // Hasil harus benar, bukan cuma cepat.
    expect(hasil.jumlah).toBe(JUMLAH_ORDER);
    expect(durasi).toBeLessThan(AMBANG_MS);
  });
});
