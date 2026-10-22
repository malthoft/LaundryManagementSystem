/**
 * Hierarki peran.
 *
 * Aturannya satu kalimat: seseorang hanya boleh mengatur peran yang berada
 * di bawahnya. Admin tidak bisa mengatur sesama Admin, dan Karyawan tidak
 * bisa mengatur siapa pun.
 *
 * Developer berdiri di luar tangga ini. Ia bukan peran ketiga di aplikasi,
 * melainkan pengelola sistem, jadi ia boleh mengatur semua akun.
 *
 * Angka di bawah ini murni urutan: makin besar makin tinggi. Jangan dipakai
 * sebagai nilai yang disimpan ke basis data.
 */

import type { Peran } from "@/types/db";

export const TINGKAT_PERAN: Record<Peran, number> = {
  Karyawan: 1,
  Admin: 2,
};

/** Semua peran, dari yang terendah. Dipakai untuk mengisi pilihan di formulir. */
export const SEMUA_PERAN: Peran[] = ["Karyawan", "Admin"];

/**
 * Apakah `pengatur` boleh mengubah peran `sasaran` menjadi `peranBaru`.
 *
 * Dua syarat, dua-duanya wajib:
 *   1. pengatur lebih tinggi dari peran sasaran (tidak boleh sesama atau lebih rendah)
 *   2. peran baru tidak lebih tinggi dari pengatur sendiri (tidak bisa menaikkan
 *      orang lain ke tingkatnya atau di atasnya)
 *
 * Konsekuensinya: Admin bisa menaikkan Karyawan jadi Admin, tapi tidak bisa
 * menyentuh Admin lain, dan tidak bisa menurunkan Admin lain.
 */
export function bolehKelolaPeran(
  pengatur: Peran,
  sasaran: Peran,
  peranBaru: Peran
): boolean {
  if (TINGKAT_PERAN[pengatur] <= TINGKAT_PERAN[sasaran]) return false;
  if (TINGKAT_PERAN[peranBaru] >= TINGKAT_PERAN[pengatur]) return false;
  return true;
}

/** Peran mana saja yang boleh dipilih `pengatur` untuk seorang `sasaran`. */
export function peranBolehDipilih(pengatur: Peran, sasaran: Peran): Peran[] {
  return SEMUA_PERAN.filter((peran) =>
    bolehKelolaPeran(pengatur, sasaran, peran)
  );
}

/** Kalimat penolakan yang siap tampil, supaya pesannya konsisten di semua layar. */
export function alasanTidakBoleh(pengatur: Peran, sasaran: Peran): string {
  if (pengatur === sasaran) {
    return `${pengatur} tidak boleh mengubah sesama ${sasaran}.`;
  }
  if (TINGKAT_PERAN[pengatur] < TINGKAT_PERAN[sasaran]) {
    return `${pengatur} hanya boleh mengatur peran yang di bawahnya.`;
  }
  return `${pengatur} tidak boleh mengubah peran ini.`;
}
