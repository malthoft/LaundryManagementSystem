#!/usr/bin/env node
/**
 * JoyOps, pemeriksa kontras token warna.
 *
 * Membaca src/app/globals.css, mengambil seluruh token --color-* dari blok
 * @theme (mode terang) dan .dark (mode gelap), lalu menghitung rasio kontras
 * untuk pasangan yang benar-benar dipakai di tampilan.
 *
 * Aturan: WCAG AA menuntut 4.5:1 untuk teks normal dan 3:1 untuk teks besar.
 *
 * Pakai:
 *   node scripts/cek-kontras.mjs          ringkas, keluar dengan kode 1 bila ada yang gagal
 *   node scripts/cek-kontras.mjs --semua  tampilkan nilai tiap pasangan
 */

import { readFileSync } from "node:fs";

const berkas = "src/app/globals.css";
const css = readFileSync(berkas, "utf8");

/** Ambil token warna dari dalam sebuah blok selektor. */
function tokenDari(blok) {
  const token = {};
  const pola = /--color-([a-z0-9-]+):\s*oklch\(([^)]+)\)/g;
  let cocok;
  while ((cocok = pola.exec(blok)) !== null) {
    const nama = cocok[1];
    const bagian = cocok[2].trim().split(/\s+/).map(Number);
    token[nama] = { L: bagian[0], C: bagian[1], H: bagian[2] ?? 0 };
  }
  return token;
}

/* Blok dicari lewat awal baris, karena ".dark" juga muncul di dalam
   @custom-variant sebelum blok @theme. */
const awalTheme = css.search(/^@theme\s*\{/m);
const awalDark = css.search(/^\.dark\s*\{/m);

if (awalTheme === -1 || awalDark === -1 || awalDark < awalTheme) {
  console.error("Gagal: blok @theme atau .dark tidak ditemukan di " + berkas);
  process.exit(2);
}

const terang = tokenDari(css.slice(awalTheme, awalDark));
const gelap = tokenDari(css.slice(awalDark));

/** OKLCH ke sRGB linier, lalu ke luminans relatif. */
function luminans({ L, C, H }) {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const batasi = (n) => Math.min(1, Math.max(0, n));
  return 0.2126 * batasi(r) + 0.7152 * batasi(g) + 0.0722 * batasi(bl);
}

function rasio(warna1, warna2, token) {
  const a = luminans(token[warna1]);
  const b = luminans(token[warna2]);
  const atas = Math.max(a, b);
  const bawah = Math.min(a, b);
  return (atas + 0.05) / (bawah + 0.05);
}

/* Pasangan yang benar-benar dipakai di komponen. */
const PASANGAN = [
  ["ink", "paper", "Teks badan di latar halaman", 4.5],
  ["ink", "surface", "Teks di dalam kartu", 4.5],
  ["ink", "sidebar", "Nama menu aktif di sidebar", 4.5],
  ["ink", "ok-soft", "Lencana status tersedia", 4.5],
  ["ink", "busy-soft", "Lencana status berjalan", 4.5],
  ["ink", "danger-soft", "Lencana status gagal", 4.5],
  ["ink", "accent", "Teks di chip aksen", 4.5],
  ["ink-muted", "paper", "Keterangan di latar halaman", 4.5],
  ["ink-muted", "surface", "Keterangan di dalam kartu", 4.5],
  ["ink-muted", "sidebar", "Nama menu tidak aktif", 4.5],
  ["primary", "paper", "Angka pokok dan tautan", 4.5],
  ["primary", "surface", "Angka pokok di kartu", 4.5],
  ["primary", "primary-soft", "Lencana info", 4.5],
  ["primary-fg", "primary", "Teks di tombol utama", 4.5],
  ["primary-fg", "ok", "Teks di tombol keadaan sukses", 4.5],
  ["ok", "ok-soft", "Lencana tersedia", 4.5],
  ["busy", "busy-soft", "Lencana berjalan", 4.5],
  ["danger", "danger-soft", "Lencana gagal", 4.5],
  ["danger", "paper", "Teks galat di latar halaman", 4.5],
  ["danger", "surface", "Teks galat di kartu", 4.5],
  ["danger-fg", "danger", "Teks di tombol hapus", 4.5],
  ["focus", "paper", "Cincin fokus di latar halaman", 3],
  ["focus", "surface", "Cincin fokus di kartu", 3],
];

const tampilSemua = process.argv.includes("--semua");
let gagal = 0;

for (const [mode, token] of [
  ["TERANG", terang],
  ["GELAP", gelap],
]) {
  console.log(`\n${mode}`);
  for (const [depan, belakang, keterangan, minimum] of PASANGAN) {
    if (!token[depan] || !token[belakang]) {
      console.log(`  ? ${depan} di ${belakang}: token tidak ada`);
      gagal += 1;
      continue;
    }
    const nilai = rasio(depan, belakang, token);
    const lulus = nilai >= minimum;
    if (!lulus) gagal += 1;
    if (tampilSemua || !lulus) {
      console.log(
        `  ${lulus ? "OK " : "GAGAL"} ${nilai.toFixed(2)}:1 (min ${minimum}) ${depan} di ${belakang} - ${keterangan}`
      );
    }
  }
}

if (gagal === 0) {
  console.log("\nSemua pasangan lolos ambang WCAG AA.");
} else {
  console.log(`\n${gagal} pasangan gagal. Perbaiki token di globals.css.`);
}

process.exit(gagal === 0 ? 0 : 1);
