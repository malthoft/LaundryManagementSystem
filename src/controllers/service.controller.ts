"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { profilSaya } from "@/lib/auth";
import { catatKegagalan, teks, type AksiForm } from "@/lib/aksi";
import { pesanPerField, skemaAddon, skemaIdUmum, skemaLayanan } from "@/lib/validation";
import { berhasil, gagal } from "@/types/domain";
import {
  addonDipakaiOrder,
  buatAddon,
  hapusAddon,
  ubahAddon,
} from "@/models/addon.model";
import {
  buatLayanan,
  hapusLayanan,
  layananDipakaiOrder,
  ubahLayanan,
} from "@/models/service.model";
import { kirimNotifikasi } from "@/models/notification.model";

async function pastikanAdmin(): Promise<string | null> {
  const profil = await profilSaya();
  if (!profil) return "Sesi berakhir. Silakan masuk lagi.";
  if (profil.role !== "Admin") {
    return "Hanya Admin yang boleh mengubah layanan dan add-on.";
  }
  return null;
}

// --- Layanan ---------------------------------------------------------------

export const simpanLayananAction: AksiForm<null> = async (_sebelumnya, data) => {
  const tolakan = await pastikanAdmin();
  if (tolakan) return gagal(tolakan);

  const cek = skemaLayanan.safeParse({
    id: teks(data, "id") || undefined,
    nama: teks(data, "nama"),
    harga: teks(data, "harga"),
    satuan: teks(data, "satuan"),
    durasi: teks(data, "durasi"),
    ikon: teks(data, "ikon") || "local_laundry_service",
    aktif: teks(data, "aktif") !== "off",
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian layanan.", pesanPerField(cek.error));
  }

  const { id, nama, harga, satuan, durasi, ikon, aktif } = cek.data;
  const supabase = await buatKlienServer();

  const isian = {
    service_name: nama,
    price: harga,
    unit: satuan,
    duration_minutes: durasi,
    icon: ikon,
    is_active: aktif,
  };

  try {
    if (id) {
      await ubahLayanan(supabase, id, isian);
    } else {
      await buatLayanan(supabase, isian);
    }
  } catch (kesalahan) {
    catatKegagalan("simpanLayananAction", kesalahan);
    return gagal("Layanan gagal disimpan.");
  }

  revalidatePath("/services");
  revalidatePath("/orders");
  return berhasil(null);
};

export const hapusLayananAction: AksiForm<null> = async (_sebelumnya, data) => {
  const tolakan = await pastikanAdmin();
  if (tolakan) return gagal(tolakan);

  const cek = skemaIdUmum.safeParse({ id: teks(data, "id") });
  if (!cek.success) return gagal("Layanan tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();

  if (await layananDipakaiOrder(supabase, cek.data.id)) {
    return gagal(
      "Layanan ini sudah dipakai order lama. Riwayat order harus tetap utuh, jadi nonaktifkan saja layanannya."
    );
  }

  try {
    await hapusLayanan(supabase, cek.data.id);
  } catch (kesalahan) {
    catatKegagalan("hapusLayananAction", kesalahan);
    return gagal("Layanan gagal dihapus.");
  }

  revalidatePath("/services");
  revalidatePath("/orders");
  return berhasil(null);
};

// --- Add-on ----------------------------------------------------------------

export const simpanAddonAction: AksiForm<null> = async (_sebelumnya, data) => {
  const tolakan = await pastikanAdmin();
  if (tolakan) return gagal(tolakan);

  const cek = skemaAddon.safeParse({
    id: teks(data, "id") || undefined,
    nama: teks(data, "nama"),
    harga: teks(data, "harga"),
    ikon: teks(data, "ikon") || "add_circle",
    aktif: teks(data, "aktif") !== "off",
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian add-on.", pesanPerField(cek.error));
  }

  const { id, nama, harga, ikon, aktif } = cek.data;
  const supabase = await buatKlienServer();

  const isian = {
    addon_name: nama,
    price: harga,
    icon: ikon,
    is_active: aktif,
  };

  try {
    if (id) {
      await ubahAddon(supabase, id, isian);
    } else {
      await buatAddon(supabase, isian);
      await kirimNotifikasi(supabase, {
        judul: "Add-on Baru",
        pesan: `Add-on ${nama} ditambahkan.`,
        tipe: "success",
        untukPeran: "All",
        tipeTerkait: "addon",
      });
    }
  } catch (kesalahan) {
    catatKegagalan("simpanAddonAction", kesalahan);
    return gagal("Add-on gagal disimpan.");
  }

  revalidatePath("/services");
  revalidatePath("/orders");
  return berhasil(null);
};

export const hapusAddonAction: AksiForm<null> = async (_sebelumnya, data) => {
  const tolakan = await pastikanAdmin();
  if (tolakan) return gagal(tolakan);

  const cek = skemaIdUmum.safeParse({ id: teks(data, "id") });
  if (!cek.success) return gagal("Add-on tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();

  if (await addonDipakaiOrder(supabase, cek.data.id)) {
    return gagal(
      "Add-on ini sudah dipakai order lama. Nonaktifkan saja supaya riwayat tetap utuh."
    );
  }

  try {
    await hapusAddon(supabase, cek.data.id);
  } catch (kesalahan) {
    catatKegagalan("hapusAddonAction", kesalahan);
    return gagal("Add-on gagal dihapus.");
  }

  revalidatePath("/services");
  revalidatePath("/orders");
  return berhasil(null);
};
