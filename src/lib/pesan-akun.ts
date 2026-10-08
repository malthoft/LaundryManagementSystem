/**
 * Pesan yang muncul di pintu masuk dan halaman pendaftaran, sesuai aturan
 * bisnis BR-20 dan BR-21 di `docs/PRD_v3.1.md`.
 *
 * Sengaja berdiri sendiri, bukan di dalam berkas "use server", karena berkas
 * begitu hanya boleh mengekspor fungsi. Teks ini dipakai dari beberapa tempat.
 */

export const PESAN_MENUNGGU =
  "Pendaftaran Anda masih menunggu verifikasi developer.";

export const PESAN_DITOLAK = "Pendaftaran Anda ditolak developer.";

export const PESAN_MENUNGGU_RESET =
  "Permintaan reset sandi Anda masih menunggu verifikasi developer.";

export const PESAN_DITOLAK_RESET =
  "Permintaan reset sandi Anda ditolak developer.";

export const PESAN_SANDI_DIUBAH =
  "Sandi berhasil diubah. Silakan masuk dengan sandi baru.";

export const PESAN_TERKIRIM =
  "Permintaan Anda tercatat. Developer akan memeriksanya.";

/**
 * Terjemahkan hasil `status_permintaan()` menjadi pesan yang tepat.
 * Formatnya "Status|Jenis", misalnya "Menunggu|Pendaftaran".
 */
export function pesanDariStatus(nilai: string | null): string | null {
  if (!nilai) return null;
  const [status, jenis] = nilai.split("|");

  if (status === "Menunggu") {
    return jenis === "Lupa Sandi" ? PESAN_MENUNGGU_RESET : PESAN_MENUNGGU;
  }
  if (status === "Ditolak") {
    return jenis === "Lupa Sandi" ? PESAN_DITOLAK_RESET : PESAN_DITOLAK;
  }
  return null;
}
