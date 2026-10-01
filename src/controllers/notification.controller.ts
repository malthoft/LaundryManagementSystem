"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { catatKegagalan, teks, type AksiForm } from "@/lib/aksi";
import { pesanPerField, skemaTandaiNotif } from "@/lib/validation";
import { berhasil, gagal } from "@/types/domain";
import {
  hapusSemuaNotifikasi,
  tandaiDibaca,
  tandaiSemuaDibaca,
} from "@/models/notification.model";

/** Tandai satu notifikasi dibaca. RLS memastikan hanya baris milik sendiri. */
export const tandaiDibacaAction: AksiForm<null> = async (_sebelumnya, data) => {
  const cek = skemaTandaiNotif.safeParse({ id: teks(data, "id") });
  if (!cek.success) {
    return gagal("Notifikasi tidak valid.", pesanPerField(cek.error));
  }
  if (!cek.data.id) {
    return gagal("Notifikasi tidak valid.");
  }

  const supabase = await buatKlienServer();

  try {
    await tandaiDibaca(supabase, cek.data.id);
  } catch (kesalahan) {
    catatKegagalan("tandaiDibacaAction", kesalahan);
    return gagal("Notifikasi gagal ditandai.");
  }

  // Revalidate seluruh layout agar ikon lonceng di bilah atas langsung diperbarui
  revalidatePath("/", "layout");
  return berhasil(null);
};

/** Tandai semua notifikasi milik pengguna yang sedang login sebagai telah dibaca. */
export const tandaiSemuaDibacaAction: AksiForm<null> = async () => {
  const supabase = await buatKlienServer();

  try {
    await tandaiSemuaDibaca(supabase);
  } catch (kesalahan) {
    catatKegagalan("tandaiSemuaDibacaAction", kesalahan);
    return gagal("Notifikasi gagal ditandai.");
  }

  revalidatePath("/", "layout");
  return berhasil(null);
};

/** Hapus secara manual seluruh notifikasi pengguna saat ini. */
export const hapusSemuaNotifikasiAction: AksiForm<null> = async () => {
  const supabase = await buatKlienServer();

  try {
    await hapusSemuaNotifikasi(supabase);
  } catch (kesalahan) {
    catatKegagalan("hapusSemuaNotifikasiAction", kesalahan);
    return gagal("Gagal membersihkan notifikasi.");
  }

  revalidatePath("/", "layout");
  return berhasil(null);
};
