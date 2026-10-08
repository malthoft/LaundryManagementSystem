"use server";

import { redirect } from "next/navigation";
import { buatKlienAdmin, apakahAdminTersedia } from "@/lib/supabase/admin";
import { buatKlienServer } from "@/lib/supabase/server";
import { emailDariUsername } from "@/lib/auth";
import {
  skemaDaftar,
  skemaLupaSandi,
  skemaAturSandi,
  pesanPerField,
} from "@/lib/validation";
import { teks, catatKegagalan } from "@/lib/aksi";
import { berhasil, gagal } from "@/types/domain";
import type { AksiForm } from "@/lib/aksi";
import {
  cariPermintaanDenganToken,
  catatPermintaan,
  tandaiTokenTerpakai,
} from "@/models/permintaan.model";
import { kirimRingkasanPermintaan } from "@/lib/email";
import {
  PESAN_MENUNGGU,
  PESAN_MENUNGGU_RESET,
} from "@/lib/pesan-akun";

const LAYANAN_BELUM_AKTIF =
  "Layanan akun belum aktif. Hubungi developer untuk mengisi kunci layanan.";

/** Pemberitahuan surel bersifat pelengkap dan tidak boleh menggagalkan simpanan. */
function beritahuDeveloper(isi: {
  nomor: number;
  jenis: string;
  username: string;
  nama: string;
}): void {
  try {
    void kirimRingkasanPermintaan(isi).catch(() => undefined);
  } catch {
    /* surel bukan jalur utama */
  }
}

export const daftarAction: AksiForm<null> = async (_sebelum, data) => {
  const cek = skemaDaftar.safeParse({
    username: teks(data, "username"),
    nama: teks(data, "nama"),
    sandi: teks(data, "sandi"),
    ulangi: teks(data, "ulangi"),
  });
  if (!cek.success) return gagal("Ada isian yang belum benar.", pesanPerField(cek.error));
  if (!apakahAdminTersedia()) return gagal(LAYANAN_BELUM_AKTIF);

  try {
    // 1) Buat akun Supabase Auth-nya sekarang, supaya sandi cukup di-hash sekali
    //    di sini. Trigger handle_new_user otomatis membuat baris `profiles`.
    const admin = buatKlienAdmin();
    await admin.auth.admin.createUser({
      email: emailDariUsername(cek.data.username),
      password: cek.data.sandi,
      email_confirm: true,
      user_metadata: {
        username: cek.data.username,
        full_name: cek.data.nama,
        role: "Admin",
      },
    });

    // 2) Langsung matikan dulu: baru bisa masuk setelah developer menyetujui.
    await admin
      .from("profiles")
      .update({ is_active: false })
      .eq("username", cek.data.username);

    // 3) Catat permintaannya untuk kotak masuk developer.
    const klien = await buatKlienServer();
    let hasil = await catatPermintaan(klien, {
      /* klien sesi: RLS permintaan_ajukan */
      jenis: "Pendaftaran",
      username: cek.data.username,
      full_name: cek.data.nama,
    });
    if (hasil === "gagal") hasil = await catatPermintaan(buatKlienAdmin(), {
      jenis: "Pendaftaran",
      username: cek.data.username,
      full_name: cek.data.nama,
    });
    if (hasil === "sudah_ada") return gagal(PESAN_MENUNGGU);
    if (hasil === "gagal") return gagal("Belum bisa mencatat pendaftaran. Coba lagi.");

    beritahuDeveloper({
      nomor: 0,
      jenis: "Pendaftaran",
      username: cek.data.username,
      nama: cek.data.nama,
    });
    return berhasil(null);
  } catch (kesalahan) {
    catatKegagalan("daftarAction", kesalahan);
    return gagal(
      "Belum bisa menyimpan permintaan: " +
        (kesalahan instanceof Error ? kesalahan.message : "galat tidak diketahui")
    );
  }
};

export const lupaSandiAction: AksiForm<null> = async (_sebelum, data) => {
  const cek = skemaLupaSandi.safeParse({ username: teks(data, "username") });
  if (!cek.success) return gagal("Ada isian yang belum benar.", pesanPerField(cek.error));
  if (!apakahAdminTersedia()) return gagal(LAYANAN_BELUM_AKTIF);
  try {
    const klien = await buatKlienServer();
    let catat = await catatPermintaan(klien, {
      jenis: "Lupa Sandi",
      username: cek.data.username,
      full_name: null,
    });
    if (catat === "gagal") catat = await catatPermintaan(buatKlienAdmin(), {
      jenis: "Lupa Sandi",
      username: cek.data.username,
      full_name: null,
    });
    if (catat === "sudah_ada") return gagal(PESAN_MENUNGGU_RESET);
    if (catat === "gagal") return gagal("Belum bisa mencatat permintaan. Coba lagi.");
    beritahuDeveloper({
      nomor: 0,
      jenis: "Lupa Sandi",
      username: cek.data.username,
      nama: "",
    });
    return berhasil(null);
  } catch (kesalahan) {
    catatKegagalan("lupaSandiAction", kesalahan);
    return gagal(
      "Belum bisa menyimpan permintaan: " +
        (kesalahan instanceof Error ? kesalahan.message : "galat tidak diketahui")
    );
  }
};

export const aturSandiAction: AksiForm<null> = async (_sebelum, data) => {
  const cek = skemaAturSandi.safeParse({
    token: teks(data, "token"),
    sandiBaru: teks(data, "sandiBaru"),
    ulangi: teks(data, "ulangi"),
  });
  if (!cek.success) return gagal("Ada isian yang belum benar.", pesanPerField(cek.error));
  if (!apakahAdminTersedia()) return gagal(LAYANAN_BELUM_AKTIF);
  const klien = buatKlienAdmin();
  try {
    const permintaan = await cariPermintaanDenganToken(klien, cek.data.token);
    if (!permintaan) return gagal("Tautan reset tidak dikenal.");
    if (permintaan.token_terpakai) return gagal("Tautan reset sudah dipakai.");
    if (!permintaan.token_hangus_pada || new Date(permintaan.token_hangus_pada).getTime() < Date.now()) {
      return gagal("Tautan reset sudah kedaluwarsa. Ajukan lupa sandi lagi.");
    }
    const { data: daftar } = await klien.auth.admin.listUsers({ page: 1, perPage: 200 });
    const pengguna = daftar?.users.find(
      (u) => (u.user_metadata?.username ?? "") === permintaan.username
    );
    if (!pengguna) return gagal("Akun tidak ditemukan.");
    await klien.auth.admin.updateUserById(pengguna.id, { password: cek.data.sandiBaru });
    await tandaiTokenTerpakai(klien, permintaan.id);
  } catch (kesalahan) {
    catatKegagalan("aturSandiAction", kesalahan);
    return gagal(
      "Belum bisa menyimpan permintaan: " +
        (kesalahan instanceof Error ? kesalahan.message : "galat tidak diketahui")
    );
  }
  redirect("/login?pesan=sandi-diubah");
};
