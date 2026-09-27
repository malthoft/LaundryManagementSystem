"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { profilSaya } from "@/lib/auth";
import { catatKegagalan, teks, type AksiForm } from "@/lib/aksi";
import {
  pesanPerField,
  skemaIdUmum,
  skemaJawabTukar,
  skemaShift,
  skemaTemplateShift,
  skemaTukarShift,
} from "@/lib/validation";
import { berhasil, gagal } from "@/types/domain";
import { JAM_SHIFT, LABEL_HARI } from "@/lib/constants";
import { mingguSama, namaHari, tambahHari, awalMinggu, hariIni } from "@/lib/date";
import {
  ambilPengajuanTukar,
  ambilShiftById,
  ambilShiftOrang,
  ambilShiftOrangLain,
  ambilTemplateShift,
  batalkanPengajuanTukar,
  bentukJadwalDariTemplate,
  buatPengajuanTukar,
  buatShift,
  buatTemplateShift,
  hapusShift,
  hapusTemplateShift,
  jawabPengajuanTukar,
  putuskanTukarShift,
  shiftBentrok,
} from "@/models/shift.model";
import { ambilProfilAktif, ambilProfilById } from "@/models/profile.model";
import { kirimNotifikasi } from "@/models/notification.model";

// --- Jadwal -----------------------------------------------------------------

/** Buat atau ubah shift. Hanya Admin. */
export const simpanShiftAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") return gagal("Hanya Admin yang boleh menyusun jadwal.");

  const cek = skemaShift.safeParse({
    id: teks(data, "id") || undefined,
    karyawanId: teks(data, "karyawanId"),
    tanggal: teks(data, "tanggal"),
    tipe: teks(data, "tipe"),
    stasiun: teks(data, "stasiun"),
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian jadwal.", pesanPerField(cek.error));
  }

  const { karyawanId, tanggal, tipe, stasiun } = cek.data;
  const jam = JAM_SHIFT[tipe];
  const supabase = await buatKlienServer();

  const orang = await ambilProfilById(supabase, karyawanId);
  if (!orang) return gagal("Karyawan tidak ditemukan.");

  if (await shiftBentrok(supabase, karyawanId, tanggal, `${jam.mulai}:00`)) {
    return gagal(
      `${orang.full_name} sudah punya shift lain yang mulai jam ${jam.mulai} pada ${tanggal}.`
    );
  }

  try {
    await buatShift(supabase, {
      profile_id: karyawanId,
      work_day: namaHari(tanggal),
      work_date: tanggal,
      start_time: `${jam.mulai}:00`,
      end_time: `${jam.selesai}:00`,
      station: stasiun,
    });
  } catch (kesalahan) {
    catatKegagalan("simpanShiftAction", kesalahan);
    return gagal(
      "Jadwal gagal disimpan. Mungkin orang ini sudah punya shift di jam yang sama."
    );
  }

  await kirimNotifikasi(supabase, {
    judul: "Jadwal Baru",
    pesan: `Shift ${LABEL_HARI[namaHari(tanggal)]} (${jam.mulai}-${jam.selesai}) di ${stasiun} untuk ${orang.full_name}.`,
    tipe: "success",
    untukPeran: "All",
    tipeTerkait: "shift",
  });

  revalidatePath("/shifts");
  revalidatePath("/my-shift");
  return berhasil(null);
};

export const hapusShiftAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") return gagal("Hanya Admin yang boleh menghapus jadwal.");

  const cek = skemaIdUmum.safeParse({ id: teks(data, "id") });
  if (!cek.success) return gagal("Jadwal tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();

  try {
    await hapusShift(supabase, cek.data.id);
  } catch (kesalahan) {
    catatKegagalan("hapusShiftAction", kesalahan);
    return gagal("Jadwal gagal dihapus.");
  }

  revalidatePath("/shifts");
  revalidatePath("/my-shift");
  return berhasil(null);
};

/**
 * Isi jadwal satu minggu dari template berulang. Yang sudah ada dilewati,
 * jadi aman ditekan berkali-kali.
 */
export const bentukJadwalAction: AksiForm<{ jumlah: number }> = async (
  _sebelumnya,
  data
) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") return gagal("Hanya Admin yang boleh menyusun jadwal.");

  const tanggalAwal = teks(data, "tanggalAwal") || hariIni();
  const supabase = await buatKlienServer();

  const template = (await ambilTemplateShift(supabase)).filter((t) => t.is_active);
  if (template.length === 0) {
    return gagal("Belum ada pola shift. Tambahkan pola dulu di bagian bawah halaman.");
  }

  const senin = awalMinggu(tanggalAwal);
  const rencana = [];

  for (const pola of template) {
    const selisih = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(
      pola.day_of_week
    );
    const tanggal = tambahHari(senin, selisih);
    const jam = JAM_SHIFT[pola.shift_type];

    rencana.push({
      profile_id: pola.profile_id,
      work_day: pola.day_of_week,
      work_date: tanggal,
      start_time: `${jam.mulai}:00`,
      end_time: `${jam.selesai}:00`,
      station: pola.station,
    });
  }

  let jumlah = 0;

  try {
    jumlah = await bentukJadwalDariTemplate(supabase, rencana);
  } catch (kesalahan) {
    catatKegagalan("bentukJadwalAction", kesalahan);
    return gagal("Jadwal gagal dibentuk dari pola.");
  }

  revalidatePath("/shifts");
  revalidatePath("/my-shift");

  return berhasil({ jumlah });
};

// --- Pola shift berulang ---------------------------------------------------

export const simpanTemplateAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") return gagal("Hanya Admin yang boleh mengubah pola shift.");

  const cek = skemaTemplateShift.safeParse({
    karyawanId: teks(data, "karyawanId"),
    hari: teks(data, "hari"),
    tipe: teks(data, "tipe"),
    stasiun: teks(data, "stasiun"),
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian pola shift.", pesanPerField(cek.error));
  }

  const supabase = await buatKlienServer();

  try {
    await buatTemplateShift(supabase, {
      profile_id: cek.data.karyawanId,
      day_of_week: cek.data.hari,
      shift_type: cek.data.tipe,
      station: cek.data.stasiun,
    });
  } catch (kesalahan) {
    catatKegagalan("simpanTemplateAction", kesalahan);
    return gagal("Pola itu sudah ada untuk orang dan jam yang sama.");
  }

  revalidatePath("/shifts");
  return berhasil(null);
};

export const hapusTemplateAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") return gagal("Hanya Admin yang boleh mengubah pola shift.");

  const cek = skemaIdUmum.safeParse({ id: teks(data, "id") });
  if (!cek.success) return gagal("Pola tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();

  try {
    await hapusTemplateShift(supabase, cek.data.id);
  } catch (kesalahan) {
    catatKegagalan("hapusTemplateAction", kesalahan);
    return gagal("Pola gagal dihapus.");
  }

  revalidatePath("/shifts");
  return berhasil(null);
};

// --- Tukar shift -----------------------------------------------------------

/**
 * Ajukan tukar shift. Aturan yang dijaga di sini (BR-09):
 * shift sendiri, shift orang lain, tanggal dalam minggu ISO yang sama.
 */
export const ajukanTukarAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");

  const cek = skemaTukarShift.safeParse({
    shiftId: teks(data, "shiftId"),
    targetShiftId: teks(data, "targetShiftId"),
  });

  if (!cek.success) {
    return gagal("Periksa kembali pilihan shift.", pesanPerField(cek.error));
  }

  if (cek.data.shiftId === cek.data.targetShiftId) {
    return gagal("Shift yang dilepas dan yang diambil tidak boleh sama.");
  }

  const supabase = await buatKlienServer();

  const [shiftSaya, shiftTarget] = await Promise.all([
    ambilShiftById(supabase, cek.data.shiftId),
    ambilShiftById(supabase, cek.data.targetShiftId),
  ]);

  if (!shiftSaya || !shiftTarget) return gagal("Shift tidak ditemukan.");

  if (shiftSaya.profile_id !== profil.id) {
    return gagal("Yang bisa diajukan hanya shift Anda sendiri.");
  }

  if (shiftTarget.profile_id === profil.id) {
    return gagal("Pilih shift milik rekan kerja, bukan shift Anda sendiri.");
  }

  if (!mingguSama(shiftSaya.work_date, shiftTarget.work_date)) {
    return gagal(
      `Tukar shift hanya bisa dalam minggu yang sama. Shift Anda ${shiftSaya.work_date}, shift rekan ${shiftTarget.work_date}.`
    );
  }

  if (shiftSaya.work_date < hariIni()) {
    return gagal("Shift yang sudah lewat tidak bisa ditukar.");
  }

  const pengajuanLama = await ambilPengajuanTukar(supabase);
  const sudahAda = pengajuanLama.some(
    (baris) =>
      baris.shift_id === cek.data.shiftId &&
      ["Pending", "Accepted by Employee"].includes(baris.status)
  );

  if (sudahAda) {
    return gagal("Shift ini sedang dalam proses pengajuan tukar.");
  }

  const rekan = await ambilProfilById(supabase, shiftTarget.profile_id);
  if (!rekan) return gagal("Rekan kerja tidak ditemukan.");

  try {
    await buatPengajuanTukar(supabase, {
      shift_id: cek.data.shiftId,
      requester_id: profil.id,
      target_shift_id: cek.data.targetShiftId,
      target_employee_id: shiftTarget.profile_id,
    });
  } catch (kesalahan) {
    catatKegagalan("ajukanTukarAction", kesalahan);
    return gagal("Pengajuan tukar gagal dikirim.");
  }

  await kirimNotifikasi(supabase, {
    judul: "Pengajuan Tukar Shift",
    pesan: `${profil.full_name} mengajukan tukar shift ${shiftSaya.work_date}.`,
    tipe: "info",
    untukUserId: shiftTarget.profile_id,
    tipeTerkait: "shift_swap",
  });

  await kirimNotifikasi(supabase, {
    judul: "Pengajuan Tukar Shift",
    pesan: `${profil.full_name} mengajukan tukar shift dan menunggu jawaban rekan kerja.`,
    tipe: "warning",
    untukPeran: "Admin",
    tipeTerkait: "shift_swap",
  });

  revalidatePath("/my-shift");
  revalidatePath("/shifts");
  return berhasil(null);
};

/** Jawab pengajuan sebagai rekan kerja yang diminta. */
export const jawabTukarAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");

  const cek = skemaJawabTukar.safeParse({
    id: teks(data, "id"),
    setuju: teks(data, "setuju") === "true",
  });

  if (!cek.success) return gagal("Pengajuan tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();
  const daftar = await ambilPengajuanTukar(supabase);
  const pengajuan = daftar.find((baris) => baris.id === cek.data.id);

  if (!pengajuan) return gagal("Pengajuan tidak ditemukan.");
  if (pengajuan.target_employee_id !== profil.id) {
    return gagal("Pengajuan ini bukan untuk Anda.");
  }
  if (pengajuan.status !== "Pending") {
    return gagal("Pengajuan ini sudah dijawab.");
  }

  try {
    await jawabPengajuanTukar(supabase, cek.data.id, cek.data.setuju, profil.id);
  } catch (kesalahan) {
    catatKegagalan("jawabTukarAction", kesalahan);
    return gagal("Jawaban gagal disimpan.");
  }

  await kirimNotifikasi(supabase, {
    judul: cek.data.setuju ? "Tukar Shift Diterima" : "Tukar Shift Ditolak",
    pesan: cek.data.setuju
      ? `${profil.full_name} menerima tukar shift. Menunggu persetujuan Admin.`
      : `${profil.full_name} menolak tukar shift. Jadwal tidak berubah.`,
    tipe: cek.data.setuju ? "success" : "warning",
    untukPeran: cek.data.setuju ? "Admin" : "All",
    tipeTerkait: "shift_swap",
    idTerkait: cek.data.id,
  });

  revalidatePath("/my-shift");
  revalidatePath("/shifts");
  return berhasil(null);
};

/** Setujui atau tolak sebagai Admin. Penukaran jadwal dikerjakan di database. */
export const putuskanTukarAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") {
    return gagal("Hanya Admin yang boleh menyetujui tukar shift.");
  }

  const cek = skemaJawabTukar.safeParse({
    id: teks(data, "id"),
    setuju: teks(data, "setuju") === "true",
  });

  if (!cek.success) return gagal("Pengajuan tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();

  try {
    await putuskanTukarShift(supabase, cek.data.id, cek.data.setuju);
  } catch (kesalahan) {
    catatKegagalan("putuskanTukarAction", kesalahan);
    return gagal(
      kesalahan instanceof Error ? kesalahan.message : "Keputusan gagal disimpan."
    );
  }

  revalidatePath("/shifts");
  revalidatePath("/my-shift");
  return berhasil(null);
};

/** Batalkan pengajuan sendiri yang masih menunggu. */
export const batalkanTukarAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");

  const cek = skemaIdUmum.safeParse({ id: teks(data, "id") });
  if (!cek.success) return gagal("Pengajuan tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();
  const daftar = await ambilPengajuanTukar(supabase);
  const pengajuan = daftar.find((baris) => baris.id === cek.data.id);

  if (!pengajuan) return gagal("Pengajuan tidak ditemukan.");
  if (pengajuan.requester_id !== profil.id) {
    return gagal("Hanya pengaju yang boleh membatalkan pengajuan ini.");
  }
  if (pengajuan.status !== "Pending") {
    return gagal("Pengajuan sudah diproses, tidak bisa dibatalkan.");
  }

  try {
    await batalkanPengajuanTukar(supabase, cek.data.id);
  } catch (kesalahan) {
    catatKegagalan("batalkanTukarAction", kesalahan);
    return gagal("Pengajuan gagal dibatalkan.");
  }

  revalidatePath("/my-shift");
  revalidatePath("/shifts");
  return berhasil(null);
};

/** Daftar shift rekan kerja di minggu yang sama, untuk pilihan tukar. */
export async function shiftRekanMingguIni(karyawanId: string) {
  const supabase = await buatKlienServer();
  const awal = awalMinggu(hariIni());
  const akhir = tambahHari(awal, 6);

  const [milikSaya, milikRekan, semuaOrang] = await Promise.all([
    ambilShiftOrang(supabase, karyawanId, awal, akhir),
    ambilShiftOrangLain(supabase, karyawanId, awal, akhir),
    ambilProfilAktif(supabase),
  ]);

  return { milikSaya, milikRekan, semuaOrang, awal, akhir };
}
