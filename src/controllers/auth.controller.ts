"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { emailDariUsername, penggunaSaya, profilSaya } from "@/lib/auth";
import { pesanPerField, skemaGantiSandiSendiri, skemaLogin, skemaProfilSaya } from "@/lib/validation";
import { catatKegagalan, teks, type AksiForm } from "@/lib/aksi";
import { gagal, berhasil, type Hasil } from "@/types/domain";
import { ubahNamaSaya } from "@/models/profile.model";

/**
 * Login. Hanya lapisan ini yang menyentuh Supabase Auth.
 *
 * Pesan kesalahan sengaja disamakan untuk username tidak ada dan sandi salah,
 * supaya tidak bisa dipakai menebak username mana yang terdaftar.
 */
export async function masuk(
  _sebelumnya: Hasil<null> | null,
  data: FormData
): Promise<Hasil<null>> {
  const cek = skemaLogin.safeParse({
    username: teks(data, "username"),
    password: teks(data, "password"),
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian Anda.", pesanPerField(cek.error));
  }

  const supabase = await buatKlienServer();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: emailDariUsername(cek.data.username),
      password: cek.data.password,
    });

    if (error) {
      return gagal("Username atau sandi salah.");
    }
  } catch (kesalahan) {
    catatKegagalan("masuk", kesalahan);
    return gagal("Tidak bisa menghubungi server. Periksa koneksi internet.");
  }

  // redirect() melempar, jadi harus di luar blok try.
  redirect("/dashboard");
}

/** Keluar dan hapus cookie sesi. */
export async function keluar(): Promise<void> {
  const supabase = await buatKlienServer();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Ubah nama tampilan sendiri. Peran tidak bisa diubah dari sini. */
export const ubahProfilSaya: AksiForm<null> = async (_sebelumnya, data) => {
  const cek = skemaProfilSaya.safeParse({ nama: teks(data, "nama") });
  if (!cek.success) {
    return gagal("Periksa kembali isian Anda.", pesanPerField(cek.error));
  }

  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");

  const supabase = await buatKlienServer();

  try {
    await ubahNamaSaya(supabase, cek.data.nama);
  } catch (kesalahan) {
    catatKegagalan("ubahProfilSaya", kesalahan);
    return gagal("Nama gagal disimpan.");
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return berhasil(null);
};

/** Ganti sandi sendiri. Sandi lama tidak diminta karena sesi sudah sah. */
export const gantiSandiSaya: AksiForm<null> = async (_sebelumnya, data) => {
  const cek = skemaGantiSandiSendiri.safeParse({
    sandiBaru: teks(data, "sandiBaru"),
    ulangi: teks(data, "ulangi"),
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian Anda.", pesanPerField(cek.error));
  }

  const pengguna = await penggunaSaya();
  if (!pengguna) return gagal("Sesi berakhir. Silakan masuk lagi.");

  const supabase = await buatKlienServer();

  try {
    const { error } = await supabase.auth.updateUser({
      password: cek.data.sandiBaru,
    });

    if (error) {
      return gagal(
        error.message.toLowerCase().includes("should be different")
          ? "Sandi baru tidak boleh sama dengan yang lama."
          : "Sandi gagal diubah."
      );
    }
  } catch (kesalahan) {
    catatKegagalan("gantiSandiSaya", kesalahan);
    return gagal("Sandi gagal diubah.");
  }

  return berhasil(null);
};
