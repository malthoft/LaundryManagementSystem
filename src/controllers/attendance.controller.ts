"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { profilSaya } from "@/lib/auth";
import { catatKegagalan, teks, type AksiForm } from "@/lib/aksi";
import { pesanPerField, skemaApproveAbsen } from "@/lib/validation";
import { berhasil, gagal } from "@/types/domain";
import { absenKeluar, absenMasuk, putuskanAbsensi } from "@/models/attendance.model";
import { kirimNotifikasi } from "@/models/notification.model";
import { hariIni } from "@/lib/date";
import { ambilShiftOrang } from "@/models/shift.model";

/** Clock in. Kalau `shiftId` kosong, shift hari ini dicari otomatis. */
export const absenMasukAction: AksiForm<{ waktu: string }> = async (
  _sebelumnya,
  data
) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");

  const supabase = await buatKlienServer();
  const dikirim = Number(teks(data, "shiftId"));
  let shiftId: number | undefined = Number.isFinite(dikirim) && dikirim > 0 ? dikirim : undefined;

  if (!shiftId) {
    const shiftHariIni = await ambilShiftOrang(
      supabase,
      profil.id,
      hariIni(),
      hariIni()
    );
    shiftId = shiftHariIni[0]?.id;
  }

  try {
    const absensi = await absenMasuk(supabase, shiftId);

    await kirimNotifikasi(supabase, {
      judul: "Absen Masuk",
      pesan: `${profil.full_name} melakukan clock in.`,
      tipe: "info",
      untukPeran: "Admin",
      tipeTerkait: "attendance",
      idTerkait: absensi.id,
    });

    revalidatePath("/attendance");
    revalidatePath("/my-shift");

    return berhasil({ waktu: absensi.clock_in ?? "" });
  } catch (kesalahan) {
    catatKegagalan("absenMasukAction", kesalahan);
    return gagal(
      kesalahan instanceof Error ? kesalahan.message : "Absen masuk gagal disimpan."
    );
  }
};

export const absenKeluarAction: AksiForm<null> = async () => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");

  const supabase = await buatKlienServer();

  try {
    await absenKeluar(supabase);
  } catch (kesalahan) {
    catatKegagalan("absenKeluarAction", kesalahan);
    return gagal(
      kesalahan instanceof Error ? kesalahan.message : "Absen keluar gagal disimpan."
    );
  }

  revalidatePath("/attendance");
  revalidatePath("/my-shift");
  return berhasil(null);
};

/** Admin menyetujui atau menolak absensi. */
export const putuskanAbsensiAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") {
    return gagal("Hanya Admin yang boleh menyetujui absensi.");
  }

  const cek = skemaApproveAbsen.safeParse({
    id: teks(data, "id"),
    status: teks(data, "status"),
    catatan: teks(data, "catatan"),
  });

  if (!cek.success) return gagal("Absensi tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();

  try {
    await putuskanAbsensi(
      supabase,
      cek.data.id,
      cek.data.status,
      cek.data.catatan?.trim() || null,
      profil.id
    );
  } catch (kesalahan) {
    catatKegagalan("putuskanAbsensiAction", kesalahan);
    return gagal("Keputusan absensi gagal disimpan.");
  }

  revalidatePath("/attendance");
  return berhasil(null);
};
