"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { profilSaya } from "@/lib/auth";
import { catatKegagalan, teks, type AksiForm } from "@/lib/aksi";
import { pesanPerField, skemaIdMesin, skemaMesin } from "@/lib/validation";
import { berhasil, gagal } from "@/types/domain";
import {
  ambilMesinById,
  buatMesin,
  hapusMesin,
  mesinDipakaiOrder,
  ubahMesin,
  ubahStatusMesin,
} from "@/models/machine.model";
import { kirimNotifikasi } from "@/models/notification.model";
import type { StatusMesin } from "@/types/db";

/** Semua perubahan mesin hanya untuk Admin. RLS menjaga ini juga. */
async function pastikanAdmin(): Promise<string | null> {
  const profil = await profilSaya();
  if (!profil) return "Sesi berakhir. Silakan masuk lagi.";
  if (profil.role !== "Admin") return "Hanya Admin yang boleh mengubah data mesin.";
  return null;
}

/** Tambah mesin baru, atau ubah mesin yang sudah ada bila `id` terisi. */
export const simpanMesinAction: AksiForm<null> = async (_sebelumnya, data) => {
  const tolakan = await pastikanAdmin();
  if (tolakan) return gagal(tolakan);

  const cek = skemaMesin.safeParse({
    id: teks(data, "id") || undefined,
    kode: teks(data, "kode"),
    tipe: teks(data, "tipe"),
    status: teks(data, "status"),
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian mesin.", pesanPerField(cek.error));
  }

  const { id, kode, tipe, status } = cek.data;
  const supabase = await buatKlienServer();

  try {
    if (id) {
      await ubahMesin(supabase, id, {
        machine_code: kode,
        machine_type: tipe,
        status,
      });
    } else {
      await buatMesin(supabase, {
        machine_code: kode,
        machine_type: tipe,
        status,
      });
    }

    await kirimNotifikasi(supabase, {
      judul: id ? "Mesin Diperbarui" : "Mesin Ditambahkan",
      pesan: `Mesin ${kode} (${tipe}) ${id ? "telah diperbarui" : "berhasil ditambahkan"}.`,
      tipe: "success",
      untukPeran: "All",
      tipeTerkait: "machine",
      idTerkait: id ?? null,
    });
  } catch (kesalahan) {
    catatKegagalan("simpanMesinAction", kesalahan);
    const mentah = kesalahan instanceof Error ? kesalahan.message : "";
    return gagal(
      mentah.includes("machine_code")
        ? "Kode mesin itu sudah dipakai mesin lain."
        : "Mesin gagal disimpan."
    );
  }

  revalidatePath("/machines");
  revalidatePath("/orders");
  return berhasil(null);
};

/** Ubah status mesin saja (Tersedia, Digunakan, Perawatan). */
export const ubahStatusMesinAction: AksiForm<null> = async (
  _sebelumnya,
  data
) => {
  const tolakan = await pastikanAdmin();
  if (tolakan) return gagal(tolakan);

  const cek = skemaIdMesin.safeParse({ id: teks(data, "id") });
  const status = teks(data, "status") as StatusMesin;

  if (!cek.success) return gagal("Mesin tidak valid.", pesanPerField(cek.error));
  if (!["Tersedia", "Digunakan", "Maintenance"].includes(status)) {
    return gagal("Status mesin tidak dikenal.");
  }

  const supabase = await buatKlienServer();
  const mesin = await ambilMesinById(supabase, cek.data.id);
  if (!mesin) return gagal("Mesin tidak ditemukan.");

  if (status === "Tersedia" && (await mesinDipakaiOrder(supabase, cek.data.id))) {
    return gagal(
      `Mesin ${mesin.machine_code} masih dipakai order yang berjalan. Selesaikan ordernya dulu.`
    );
  }

  try {
    await ubahStatusMesin(supabase, cek.data.id, status);
  } catch (kesalahan) {
    catatKegagalan("ubahStatusMesinAction", kesalahan);
    return gagal("Status mesin gagal diubah.");
  }

  revalidatePath("/machines");
  revalidatePath("/orders");
  return berhasil(null);
};

/** Hapus mesin. Ditolak kalau masih terpakai order berjalan. */
export const hapusMesinAction: AksiForm<null> = async (_sebelumnya, data) => {
  const tolakan = await pastikanAdmin();
  if (tolakan) return gagal(tolakan);

  const cek = skemaIdMesin.safeParse({ id: teks(data, "id") });
  if (!cek.success) return gagal("Mesin tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();
  const mesin = await ambilMesinById(supabase, cek.data.id);
  if (!mesin) return gagal("Mesin tidak ditemukan.");

  if (await mesinDipakaiOrder(supabase, cek.data.id)) {
    return gagal(
      `Mesin ${mesin.machine_code} masih dipakai order yang berjalan. Selesaikan ordernya dulu.`
    );
  }

  try {
    await hapusMesin(supabase, cek.data.id);
  } catch (kesalahan) {
    catatKegagalan("hapusMesinAction", kesalahan);
    // Mesin yang pernah dipakai order lama ditolak oleh foreign key.
    return gagal(
      `Mesin ${mesin.machine_code} pernah dipakai order lama, jadi riwayatnya tidak boleh hilang. Ubah statusnya jadi Perawatan sebagai gantinya.`
    );
  }

  revalidatePath("/machines");
  revalidatePath("/orders");
  return berhasil(null);
};
