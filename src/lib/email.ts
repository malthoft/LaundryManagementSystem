import nodemailer from "nodemailer";
import { catatKegagalan } from "@/lib/aksi";

/**
 * Pengirim surel pemberitahuan ke developer.
 *
 * Sifatnya **pelengkap**, bukan jalur utama. Aplikasi tetap berfungsi penuh
 * tanpa kredensial surel: kotak masuk di `/developer` adalah jalur utama.
 * Karena itu tidak satu pun fungsi di berkas ini boleh melempar galat sampai
 * menggagalkan pendaftaran. Kegagalan cukup dicatat di peladen.
 */

/** Lima variabel ini wajib terisi semua, surel baru aktif. */
const VARIABEL_SUREL = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "EMAIL_DEVELOPER",
] as const;

export interface StatusSurel {
  aktif: boolean;
  alasan: string;
}

/** Periksa apakah pengiriman surel sudah bisa dipakai. */
export function statusSurel(): StatusSurel {
  const belum = VARIABEL_SUREL.filter((nama) => !process.env[nama]?.trim());
  if (belum.length > 0) {
    return {
      aktif: false,
      alasan: `Surel belum aktif. Lengkapi ${belum.join(", ")} di berkas lingkungan.`,
    };
  }
  return { aktif: true, alasan: "Surel aktif." };
}

/** Alamat tujuan pemberitahuan. */
export function emailDeveloper(): string | null {
  return process.env.EMAIL_DEVELOPER?.trim() || null;
}

export interface IsiSurel {
  jenis: string;
  username: string;
  nama: string | null;
  nomor: number;
}

/**
 * Kirim ringkasan permintaan akun ke developer.
 *
 * Mengembalikan `true` bila terkirim. Mengembalikan `false` bila surel belum
 * diisi atau pengirimannya gagal; keduanya bukan kegagalan pendaftaran.
 */
export async function kirimRingkasanPermintaan(isi: IsiSurel): Promise<boolean> {
  if (!statusSurel().aktif) return false;

  try {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const pengirim = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await pengirim.sendMail({
      from: process.env.SMTP_USER,
      to: emailDeveloper() ?? "",
      subject: `[JoyOps] ${isi.jenis} baru dari ${isi.username}`,
      text: [
        "Ada permintaan akun baru yang menunggu persetujuan Anda.",
        "",
        `Nomor permintaan : ${isi.nomor}`,
        `Jenis             : ${isi.jenis}`,
        `Nama pengguna     : ${isi.username}`,
        `Nama lengkap      : ${isi.nama ?? "-"}`,
        "",
        "Buka halaman developer untuk memutuskan.",
      ].join("\n"),
    });

    return true;
  } catch (kesalahan) {
    catatKegagalan("kirimRingkasanPermintaan", kesalahan);
    return false;
  }
}
