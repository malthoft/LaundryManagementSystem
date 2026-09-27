import type { KlienSupabase } from "@/lib/supabase/server";
import type { Mesin, StatusMesin } from "@/types/db";
import type { MesinTersedia, RingkasanMesin } from "@/types/domain";

export const KOLOM_MESIN =
  "id, machine_code, machine_type, status, last_used, available_at, created_at";

export interface MesinBaru {
  machine_code: string;
  machine_type: string;
  status: StatusMesin;
}

/** Semua mesin. Yang Tersedia tampil lebih dulu supaya cepat dipilih. */
export async function ambilSemuaMesin(
  supabase: KlienSupabase
): Promise<Mesin[]> {
  const { data } = await supabase
    .from("machines")
    .select(KOLOM_MESIN)
    .order("machine_code", { ascending: true })
    .returns<Mesin[]>();

  return data ?? [];
}

/**
 * Mesin untuk form order. Perawatan tidak muncul (BR-11), dan hanya status
 * Tersedia yang bisa dipilih supaya tidak ada mesin terpakai ganda (BR-02).
 */
export async function ambilMesinTersedia(
  supabase: KlienSupabase
): Promise<MesinTersedia> {
  const { data } = await supabase
    .from("machines")
    .select(KOLOM_MESIN)
    .eq("status", "Tersedia")
    .order("machine_code", { ascending: true })
    .returns<Mesin[]>();

  const semua = data ?? [];
  return {
    cuci: semua.filter((mesin) => mesin.machine_code.startsWith("WM-")),
    pengering: semua.filter((mesin) => mesin.machine_code.startsWith("DM-")),
  };
}

export async function ambilMesinById(
  supabase: KlienSupabase,
  id: number
): Promise<Mesin | null> {
  const { data } = await supabase
    .from("machines")
    .select(KOLOM_MESIN)
    .eq("id", id)
    .maybeSingle()
    .returns<Mesin | null>();

  return data ?? null;
}

/** Hitung jumlah mesin per status. Dihitung di kode dari satu query. */
export async function ambilRingkasanMesin(
  supabase: KlienSupabase
): Promise<RingkasanMesin> {
  const { data } = await supabase
    .from("machines")
    .select("status")
    .returns<Pick<Mesin, "status">[]>();

  const daftar = data ?? [];
  const hitung = (status: StatusMesin) =>
    daftar.filter((baris) => baris.status === status).length;

  return {
    tersedia: hitung("Tersedia"),
    digunakan: hitung("Digunakan"),
    maintenance: hitung("Maintenance"),
    total: daftar.length,
  };
}

export async function buatMesin(
  supabase: KlienSupabase,
  masukan: MesinBaru
): Promise<void> {
  const { error } = await supabase.from("machines").insert(masukan);
  if (error) throw new Error(error.message);
}

export async function ubahMesin(
  supabase: KlienSupabase,
  id: number,
  perubahan: Partial<MesinBaru>
): Promise<void> {
  const { error } = await supabase.from("machines").update(perubahan).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function ubahStatusMesin(
  supabase: KlienSupabase,
  id: number,
  status: StatusMesin
): Promise<void> {
  const { error } = await supabase
    .from("machines")
    .update({ status, available_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function hapusMesin(
  supabase: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await supabase.from("machines").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Apakah mesin masih dipakai order yang berjalan. Mencegah hapus yang gagal. */
export async function mesinDipakaiOrder(
  supabase: KlienSupabase,
  id: number
): Promise<boolean> {
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "Berjalan")
    .or(`washer_machine_id.eq.${id},dryer_machine_id.eq.${id}`);

  return (count ?? 0) > 0;
}
