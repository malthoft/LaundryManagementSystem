import type { KlienSupabase } from "@/lib/supabase/server";
import type { Absensi, StatusAbsen } from "@/types/db";
import type { AbsensiLengkap } from "@/types/domain";

export const KOLOM_ABSENSI =
  "id, profile_id, shift_id, work_date, clock_in, clock_out, status, approved_by, notes, created_at";

const SELEKSI_ABSENSI = `
  ${KOLOM_ABSENSI},
  karyawan:profiles!attendance_profile_id_fkey(id, full_name, username),
  shift:shifts!attendance_shift_id_fkey(id, work_date, start_time, end_time, station)
`;

/** Semua absensi pada satu rentang tanggal, terbaru lebih dulu (tampilan Admin). */
export async function ambilSemuaAbsensi(
  supabase: KlienSupabase,
  mulai: string,
  selesai: string
): Promise<AbsensiLengkap[]> {
  const { data } = await supabase
    .from("attendance")
    .select(SELEKSI_ABSENSI)
    .gte("work_date", mulai)
    .lte("work_date", selesai)
    .order("work_date", { ascending: false })
    .returns<AbsensiLengkap[]>();

  return data ?? [];
}

/** Absensi satu orang (tampilan karyawan). */
export async function ambilAbsensiOrang(
  supabase: KlienSupabase,
  profileId: string,
  batas = 30
): Promise<Absensi[]> {
  const { data } = await supabase
    .from("attendance")
    .select(KOLOM_ABSENSI)
    .eq("profile_id", profileId)
    .order("work_date", { ascending: false })
    .limit(batas)
    .returns<Absensi[]>();

  return data ?? [];
}

export async function ambilAbsensiHariIni(
  supabase: KlienSupabase,
  profileId: string,
  tanggal: string
): Promise<Absensi | null> {
  const { data } = await supabase
    .from("attendance")
    .select(KOLOM_ABSENSI)
    .eq("profile_id", profileId)
    .eq("work_date", tanggal)
    .maybeSingle()
    .returns<Absensi | null>();

  return data ?? null;
}

/** Clock in. Dijalankan fungsi database supaya satu hari hanya satu baris. */
export async function absenMasuk(
  supabase: KlienSupabase,
  shiftId?: number
): Promise<Absensi> {
  const { data, error } = await supabase
    .rpc("absen_masuk", { p_shift_id: shiftId ?? null })
    .returns<Absensi | Absensi[]>();

  if (error) throw new Error(error.message);

  const baris = Array.isArray(data) ? data[0] : data;
  if (!baris) throw new Error("Absen masuk gagal disimpan");
  return baris;
}

export async function absenKeluar(supabase: KlienSupabase): Promise<Absensi> {
  const { data, error } = await supabase
    .rpc("absen_keluar")
    .returns<Absensi | Absensi[]>();

  if (error) throw new Error(error.message);

  const baris = Array.isArray(data) ? data[0] : data;
  if (!baris) throw new Error("Absen keluar gagal disimpan");
  return baris;
}

/** Admin menyetujui atau menolak absensi. */
export async function putuskanAbsensi(
  supabase: KlienSupabase,
  id: number,
  status: StatusAbsen,
  catatan: string | null,
  adminId: string
): Promise<void> {
  const { error } = await supabase
    .from("attendance")
    .update({ status, notes: catatan, approved_by: adminId })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/** Berapa absensi yang masih menunggu persetujuan, untuk lencana di menu. */
export async function hitungAbsensiMenunggu(
  supabase: KlienSupabase
): Promise<number> {
  const { count } = await supabase
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .eq("status", "Pending");

  return count ?? 0;
}
