"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { catatKegagalan, teks, type AksiForm } from "@/lib/aksi";
import { pesanPerField, skemaTandaiNotif } from "@/lib/validation";
import { berhasil, gagal } from "@/types/domain";
import { tandaiDibaca, tandaiSemuaDibaca } from "@/models/notification.model";

/** Tandai satu notifikasi dibaca. RLS memastikan hanya milik sendiri. */
export const tandaiDibacaAction: AksiForm<null> = async (_sebelumnya, data) => {
  const cek = skemaTandaiNotif.safeParse({ id: teks(data, "id") });
  if (!cek.success) {
    return gagal("Notifikasi tidak valid.", pesanPerField(cek.error));
  }
  // Terpisah dari pemeriksaan di atas supaya penyempitan tipe `cek.error`
  // tetap berlaku.
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

  revalidatePath("/dashboard");
  return berhasil(null);
};

export const tandaiSemuaDibacaAction: AksiForm<null> = async () => {
  const supabase = await buatKlienServer();

  try {
    await tandaiSemuaDibaca(supabase);
  } catch (kesalahan) {
    catatKegagalan("tandaiSemuaDibacaAction", kesalahan);
    return gagal("Notifikasi gagal ditandai.");
  }

  revalidatePath("/dashboard");
  return berhasil(null);
};
