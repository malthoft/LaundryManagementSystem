/**
 * Pengujian otomatis kriteria Security (Software Inspection No. 3).
 * Sengaja hanya dua kondisi supaya mudah dibaca dan dijelaskan.
 */
import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Next.js tidak jalan di Node, jadi bagian ini diganti tiruan.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

// Peran pengguna bisa diatur dari dalam test.
let peranSekarang: string | null = null;
vi.mock("@/lib/auth", () => ({
  profilSaya: vi.fn(async () =>
    peranSekarang ? { id: "uji-1", role: peranSekarang } : null
  ),
}));
vi.mock("@/lib/supabase/server", () => ({
  buatKlienServer: vi.fn(async () => ({})),
  sambunganSiap: () => true,
}));
vi.mock("@/models/transaction.model", () => ({
  buatTransaksi: vi.fn(async () => {}),
  hapusTransaksi: vi.fn(async () => {}),
  ubahTransaksi: vi.fn(async () => {}),
}));
vi.mock("@/models/notification.model", () => ({
  kirimNotifikasi: vi.fn(async () => {}),
}));

const AKAR = path.resolve(__dirname, "..");

/** Kumpulkan semua berkas .ts/.tsx di src, kecuali folder test. */
function semuaBerkasSumber(): string[] {
  const hasil: string[] = [];
  const telusuri = (dir: string) => {
    for (const isi of fs.readdirSync(dir, { withFileTypes: true })) {
      const penuh = path.join(dir, isi.name);
      if (isi.isDirectory()) {
        if (isi.name === "__tests__" || isi.name === "node_modules") continue;
        telusuri(penuh);
      } else if (/\.(ts|tsx)$/.test(isi.name)) {
        hasil.push(penuh);
      }
    }
  };
  telusuri(AKAR);
  return hasil;
}

describe("Security", () => {
  it("tidak ada kata sandi atau kunci API yang ditulis langsung di kode", () => {
    // Pola rahasia yang biasanya keliru ditulis langsung.
    const pola = [
      /(?:password|passwd|sandi)\s*[:=]\s*["'][^"']{6,}["']/i,
      /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*["'][^"']{8,}["']/i,
      /sk-[A-Za-z0-9]{20,}/,
    ];
    // Nilai contoh yang memang aman dipakai di template.
    const dikecualikan = /(process\.env|contoh|example|dummy|placeholder|xxxx|\*{3,})/i;

    const temuan: string[] = [];
    for (const berkas of semuaBerkasSumber()) {
      fs.readFileSync(berkas, "utf8")
        .split("\n")
        .forEach((baris, nomor) => {
          if (dikecualikan.test(baris)) return;
          if (pola.some((p) => p.test(baris))) {
            temuan.push(`${path.relative(AKAR, berkas)}:${nomor + 1}`);
          }
        });
    }

    // Kosong berarti tidak ada rahasia yang bocor di kode.
    expect(temuan).toEqual([]);
  });

  it("Karyawan tidak bisa menyimpan catatan keuangan (hanya Admin)", async () => {
    peranSekarang = "Karyawan";
    const { simpanTransaksiAction } = await import(
      "@/controllers/finance.controller"
    );

    const hasil = await simpanTransaksiAction(null, new FormData());

    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toMatch(/Hanya Admin/i);
  });
});
