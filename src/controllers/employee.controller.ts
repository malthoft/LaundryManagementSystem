"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { emailDariUsername, profilSaya } from "@/lib/auth";
import { apakahAdminTersedia, buatKlienAdmin } from "@/lib/supabase/admin";
import { catatKegagalan, teks, type AksiForm } from "@/lib/aksi";
import {
  pesanPerField,
  skemaKaryawanBaru,
  skemaResetSandi,
  skemaUbahKaryawan,
} from "@/lib/validation";
import { berhasil, gagal } from "@/types/domain";
import {
  ambilProfilById,
  ambilProfilByUsername,
  hitungAdminAktif,
  simpanProfil,
} from "@/models/profile.model";
import { kirimNotifikasi } from "@/models/notification.model";

const PESAN_TANPA_KUNCI =
  "SUPABASE_SERVICE_ROLE_KEY belum diisi, jadi akun tidak bisa dibuat atau sandinya direset. Isi dulu di berkas .env.local.";

/**
 * Tambah karyawan baru.
 *
 * Akun dibuat lewat API resmi Supabase Auth (butuh service role), lalu trigger
 * `handle_new_user()` di database membuat baris `profiles` dari metadata.
 * Jadi tidak ada dua tempat yang menulis data yang sama.
 */
export const tambahKaryawanAction: AksiForm<{ sandi: string }> = async (
  _sebelumnya,
  data
) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") {
    return gagal("Hanya Admin yang boleh menambah karyawan.");
  }

  if (!apakahAdminTersedia()) return gagal(PESAN_TANPA_KUNCI);

  const cek = skemaKaryawanBaru.safeParse({
    username: teks(data, "username").toLowerCase(),
    nama: teks(data, "nama"),
    peran: teks(data, "peran"),
    sandi: teks(data, "sandi"),
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian karyawan.", pesanPerField(cek.error));
  }

  const { username, nama, peran, sandi } = cek.data;
  const supabase = await buatKlienServer();

  if (await ambilProfilByUsername(supabase, username)) {
    return gagal("Username itu sudah dipakai.", {
      username: "Username sudah terpakai",
    });
  }

  const admin = buatKlienAdmin();

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email: emailDariUsername(username),
      password: sandi,
      email_confirm: true,
      user_metadata: { username, full_name: nama, role: peran },
    });

    if (error || !data.user) {
      const mentah = error?.message ?? "";
      return gagal(
        mentah.toLowerCase().includes("already")
          ? "Email untuk username itu sudah terdaftar di Supabase Auth."
          : `Akun gagal dibuat: ${mentah || "penyebab tidak diketahui"}`
      );
    }

    // Trigger sudah membuat profilnya. Samakan nama dan peran sebagai jaring pengaman.
    await simpanProfil(supabase, data.user.id, { full_name: nama, role: peran });

    await kirimNotifikasi(supabase, {
      judul: "Karyawan Baru",
      pesan: `${nama} didaftarkan sebagai ${peran}.`,
      tipe: "success",
      untukPeran: "All",
      tipeTerkait: "profile",
    });
  } catch (kesalahan) {
    catatKegagalan("tambahKaryawanAction", kesalahan);
    return gagal("Akun gagal dibuat.");
  }

  revalidatePath("/employees");
  revalidatePath("/shifts");

  return berhasil({ sandi });
};

/** Ubah nama, peran, atau status aktif seorang karyawan. */
export const ubahKaryawanAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") {
    return gagal("Hanya Admin yang boleh mengubah data karyawan.");
  }

  const cek = skemaUbahKaryawan.safeParse({
    id: teks(data, "id"),
    nama: teks(data, "nama"),
    peran: teks(data, "peran"),
    aktif: teks(data, "aktif") === "true",
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian karyawan.", pesanPerField(cek.error));
  }

  const { id, nama, peran, aktif } = cek.data;
  const supabase = await buatKlienServer();

  const sasaran = await ambilProfilById(supabase, id);
  if (!sasaran) return gagal("Karyawan tidak ditemukan.");

  // Jangan sampai instalasi ini kehilangan Admin terakhirnya.
  const kehilanganAdmin =
    sasaran.role === "Admin" && (peran !== "Admin" || !aktif);

  if (kehilanganAdmin && (await hitungAdminAktif(supabase)) <= 1) {
    return gagal(
      "Ini satu-satunya Admin aktif. Angkat Admin lain dulu sebelum mengubah yang ini."
    );
  }

  try {
    await simpanProfil(supabase, id, { full_name: nama, role: peran, is_active: aktif });
  } catch (kesalahan) {
    catatKegagalan("ubahKaryawanAction", kesalahan);
    return gagal("Perubahan gagal disimpan.");
  }

  revalidatePath("/employees");
  revalidatePath("/shifts");
  return berhasil(null);
};

/** Reset sandi karyawan. Ini satu-satunya jalur pemulihan, karena email sintetis. */
export const resetSandiAction: AksiForm<{ sandi: string }> = async (
  _sebelumnya,
  data
) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") return gagal("Hanya Admin yang boleh mereset sandi.");

  if (!apakahAdminTersedia()) return gagal(PESAN_TANPA_KUNCI);

  const cek = skemaResetSandi.safeParse({
    id: teks(data, "id"),
    sandi: teks(data, "sandi"),
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian sandi.", pesanPerField(cek.error));
  }

  const supabase = await buatKlienServer();
  const sasaran = await ambilProfilById(supabase, cek.data.id);
  if (!sasaran) return gagal("Karyawan tidak ditemukan.");

  const admin = buatKlienAdmin();

  try {
    const { error } = await admin.auth.admin.updateUserById(cek.data.id, {
      password: cek.data.sandi,
    });

    if (error) return gagal(`Sandi gagal direset: ${error.message}`);

    await kirimNotifikasi(supabase, {
      judul: "Sandi Direset",
      pesan: `Sandi ${sasaran.full_name} telah direset Admin.`,
      tipe: "warning",
      untukPeran: "Admin",
      tipeTerkait: "profile",
    });
  } catch (kesalahan) {
    catatKegagalan("resetSandiAction", kesalahan);
    return gagal("Sandi gagal direset.");
  }

  revalidatePath("/employees");
  return berhasil({ sandi: cek.data.sandi });
};
