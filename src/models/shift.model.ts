import type { KlienSupabase } from "@/lib/supabase/server";
import type { HariKerja, Shift, StatusShift, TemplateShift, TipeShift } from "@/types/db";
import type { PengajuanTukarLengkap, ShiftLengkap } from "@/types/domain";

export const KOLOM_SHIFT =
  "id, profile_id, work_day, work_date, start_time, end_time, station, status, created_at";

const SELEKSI_SHIFT = `${KOLOM_SHIFT}, pemilik:profiles!shifts_profile_id_fkey(id, full_name, username)`;

const SELEKSI_TUKAR = `
  id, shift_id, requester_id, target_shift_id, target_employee_id,
  status, accepter_id, decided_by, decided_at, created_at,
  pemohon:profiles!shift_swap_requests_requester_id_fkey(id, full_name, username),
  calon_pengganti:profiles!shift_swap_requests_target_employee_id_fkey(id, full_name, username),
  shift_pemohon:shifts!shift_swap_requests_shift_id_fkey(id, work_date, start_time, end_time, station),
  shift_target:shifts!shift_swap_requests_target_shift_id_fkey(id, work_date, start_time, end_time, station)
`;

// --- Shift -----------------------------------------------------------------

/** Semua shift pada satu rentang tanggal, urut tanggal lalu jam. */
export async function ambilShiftRentang(
  supabase: KlienSupabase,
  mulai: string,
  selesai: string
): Promise<ShiftLengkap[]> {
  const { data } = await supabase
    .from("shifts")
    .select(SELEKSI_SHIFT)
    .gte("work_date", mulai)
    .lte("work_date", selesai)
    .order("work_date", { ascending: true })
    .order("start_time", { ascending: true })
    .returns<ShiftLengkap[]>();

  return data ?? [];
}

/** Shift milik satu orang pada satu rentang. */
export async function ambilShiftOrang(
  supabase: KlienSupabase,
  profileId: string,
  mulai: string,
  selesai: string
): Promise<Shift[]> {
  const { data } = await supabase
    .from("shifts")
    .select(KOLOM_SHIFT)
    .eq("profile_id", profileId)
    .gte("work_date", mulai)
    .lte("work_date", selesai)
    .order("work_date", { ascending: true })
    .order("start_time", { ascending: true })
    .returns<Shift[]>();

  return data ?? [];
}

/**
 * Shift orang lain pada rentang yang sama, untuk pilihan tukar. Hanya yang
 * masih akan datang yang masuk akal untuk ditukar.
 */
export async function ambilShiftOrangLain(
  supabase: KlienSupabase,
  profileId: string,
  mulai: string,
  selesai: string
): Promise<ShiftLengkap[]> {
  const { data } = await supabase
    .from("shifts")
    .select(SELEKSI_SHIFT)
    .neq("profile_id", profileId)
    .gte("work_date", mulai)
    .lte("work_date", selesai)
    .order("work_date", { ascending: true })
    .order("start_time", { ascending: true })
    .returns<ShiftLengkap[]>();

  return data ?? [];
}

export async function ambilShiftById(
  supabase: KlienSupabase,
  id: number
): Promise<Shift | null> {
  const { data } = await supabase
    .from("shifts")
    .select(KOLOM_SHIFT)
    .eq("id", id)
    .maybeSingle()
    .returns<Shift | null>();

  return data ?? null;
}

export async function buatShift(
  supabase: KlienSupabase,
  masukan: {
    profile_id: string;
    work_day: HariKerja;
    work_date: string;
    start_time: string;
    end_time: string;
    station: string;
  }
): Promise<void> {
  const { error } = await supabase.from("shifts").insert(masukan);
  if (error) throw new Error(error.message);
}

export async function ubahStatusShift(
  supabase: KlienSupabase,
  id: number,
  status: StatusShift
): Promise<void> {
  const { error } = await supabase.from("shifts").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function hapusShift(
  supabase: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await supabase.from("shifts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Sudah ada shift lain mulai di jam yang sama? BR-14. Dijaga juga oleh
 * constraint unik di database, ini hanya untuk pesan yang manusiawi.
 */
export async function shiftBentrok(
  supabase: KlienSupabase,
  profileId: string,
  tanggal: string,
  jamMulai: string,
  kecualiId?: number
): Promise<boolean> {
  let kueri = supabase
    .from("shifts")
    .select("id")
    .eq("profile_id", profileId)
    .eq("work_date", tanggal)
    .eq("start_time", jamMulai);

  if (kecualiId) kueri = kueri.neq("id", kecualiId);

  const { data } = await kueri.returns<Array<Pick<Shift, "id">>>();
  return (data ?? []).length > 0;
}

// --- Template shift --------------------------------------------------------

export async function ambilTemplateShift(
  supabase: KlienSupabase
): Promise<TemplateShift[]> {
  const { data } = await supabase
    .from("shift_templates")
    .select("id, profile_id, day_of_week, shift_type, station, is_active, created_at")
    .order("day_of_week", { ascending: true })
    .returns<TemplateShift[]>();

  return data ?? [];
}

export async function buatTemplateShift(
  supabase: KlienSupabase,
  masukan: {
    profile_id: string;
    day_of_week: HariKerja;
    shift_type: TipeShift;
    station: string;
  }
): Promise<void> {
  const { error } = await supabase.from("shift_templates").insert(masukan);
  if (error) throw new Error(error.message);
}

export async function hapusTemplateShift(
  supabase: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await supabase.from("shift_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Bentuk jadwal dari template untuk satu rentang tanggal. Yang sudah ada
 * dilewati, jadi aman dipanggil berulang.
 */
export async function bentukJadwalDariTemplate(
  supabase: KlienSupabase,
  hari: Array<{
    profile_id: string;
    work_day: HariKerja;
    work_date: string;
    start_time: string;
    end_time: string;
    station: string;
  }>
): Promise<number> {
  if (hari.length === 0) return 0;

  const { data, error } = await supabase
    .from("shifts")
    .upsert(hari, {
      onConflict: "profile_id,work_date,start_time",
      ignoreDuplicates: true,
    })
    .select("id")
    .returns<Array<{ id: number }>>();

  if (error) throw new Error(error.message);
  return (data ?? []).length;
}

// --- Tukar shift -----------------------------------------------------------

export async function ambilPengajuanTukar(
  supabase: KlienSupabase,
  opsi: { hanyaMenungguAdmin?: boolean } = {}
): Promise<PengajuanTukarLengkap[]> {
  let kueri = supabase
    .from("shift_swap_requests")
    .select(SELEKSI_TUKAR)
    .order("created_at", { ascending: false })
    .limit(100);

  if (opsi.hanyaMenungguAdmin) {
    kueri = kueri.eq("status", "Accepted by Employee");
  }

  const { data } = await kueri.returns<PengajuanTukarLengkap[]>();
  return data ?? [];
}

/** Pengajuan yang melibatkan seseorang: sebagai pemohon atau sebagai calon pengganti. */
export async function ambilPengajuanOrang(
  supabase: KlienSupabase,
  profileId: string
): Promise<PengajuanTukarLengkap[]> {
  const { data } = await supabase
    .from("shift_swap_requests")
    .select(SELEKSI_TUKAR)
    .or(`requester_id.eq.${profileId},target_employee_id.eq.${profileId}`)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<PengajuanTukarLengkap[]>();

  return data ?? [];
}

export async function buatPengajuanTukar(
  supabase: KlienSupabase,
  masukan: {
    shift_id: number;
    requester_id: string;
    target_shift_id: number;
    target_employee_id: string;
  }
): Promise<void> {
  const { error } = await supabase.from("shift_swap_requests").insert({
    ...masukan,
    status: "Pending",
  });
  if (error) throw new Error(error.message);
}

/** Jawaban rekan kerja atas pengajuan. */
export async function jawabPengajuanTukar(
  supabase: KlienSupabase,
  id: number,
  setuju: boolean,
  accepterId: string
): Promise<void> {
  const { error } = await supabase
    .from("shift_swap_requests")
    .update({
      status: setuju ? "Accepted by Employee" : "Rejected by Employee",
      accepter_id: setuju ? accepterId : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/** Batalkan pengajuan sendiri yang masih menunggu. */
export async function batalkanPengajuanTukar(
  supabase: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await supabase
    .from("shift_swap_requests")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/**
 * Setujui atau tolak tukar shift. Hanya Admin, dan penukaran pemilik shift
 * dikerjakan di dalam satu transaksi database (BR-10).
 */
export async function putuskanTukarShift(
  supabase: KlienSupabase,
  id: number,
  setuju: boolean
): Promise<void> {
  const { error } = await supabase.rpc("setujui_tukar_shift", {
    p_permintaan_id: id,
    p_setuju: setuju,
  });

  if (error) throw new Error(error.message);
}
