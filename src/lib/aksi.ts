import type { Hasil } from "@/types/domain";

/**
 * Bentuk fungsi yang dipakai `useActionState` di komponen form.
 * Parameter pertama adalah hasil pemanggilan sebelumnya (null saat pertama).
 */
export type AksiForm<T> = (
  sebelumnya: Hasil<T> | null,
  data: FormData
) => Promise<Hasil<T>>;

/** Ubah unknown dari FormData menjadi teks. Kembalikan "" bila kosong. */
export function teks(data: FormData, nama: string): string {
  const nilai = data.get(nama);
  return typeof nilai === "string" ? nilai : "";
}

/** Ambil daftar angka dari sekumpulan checkbox bernama sama. */
export function daftarAngka(data: FormData, nama: string): number[] {
  return data
    .getAll(nama)
    .map((nilai) => Number(nilai))
    .filter((angka) => Number.isFinite(angka) && angka > 0);
}

/** Pesan kesalahan yang aman ditampilkan untuk kegagalan tak terduga. */
export const PESAN_KEGAGALAN_UMUM =
  "Terjadi gangguan saat menyimpan. Coba lagi sebentar lagi.";

/** Catat kegagalan tak terduga di server, tanpa membocorkan detailnya ke pemakai. */
export function catatKegagalan(konteks: string, kesalahan: unknown): void {
  console.error(`[JoyOps] ${konteks}:`, kesalahan);
}
