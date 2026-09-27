import type { KlienSupabase } from "@/lib/supabase/server";
import type { Layanan, SatuanLayanan } from "@/types/db";

export const KOLOM_LAYANAN =
  "id, service_name, price, unit, duration_minutes, icon, is_active, created_at";

export interface LayananBaru {
  service_name: string;
  price: number;
  unit: SatuanLayanan;
  duration_minutes: number;
  icon: string;
  is_active: boolean;
}

export async function ambilSemuaLayanan(
  supabase: KlienSupabase
): Promise<Layanan[]> {
  const { data } = await supabase
    .from("services")
    .select(KOLOM_LAYANAN)
    .order("is_active", { ascending: false })
    .order("service_name", { ascending: true })
    .returns<Layanan[]>();

  return data ?? [];
}

/** Hanya layanan aktif. Dipakai form order supaya tidak bisa memilih yang mati (BR-05). */
export async function ambilLayananAktif(
  supabase: KlienSupabase
): Promise<Layanan[]> {
  const { data } = await supabase
    .from("services")
    .select(KOLOM_LAYANAN)
    .eq("is_active", true)
    .order("service_name", { ascending: true })
    .returns<Layanan[]>();

  return data ?? [];
}

export async function buatLayanan(
  supabase: KlienSupabase,
  masukan: LayananBaru
): Promise<void> {
  const { error } = await supabase.from("services").insert(masukan);
  if (error) throw new Error(error.message);
}

export async function ubahLayanan(
  supabase: KlienSupabase,
  id: number,
  perubahan: Partial<LayananBaru>
): Promise<void> {
  const { error } = await supabase.from("services").update(perubahan).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function hapusLayanan(
  supabase: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Apakah layanan sudah dipakai order. Harga lama tetap utuh, jadi jangan dihapus. */
export async function layananDipakaiOrder(
  supabase: KlienSupabase,
  id: number
): Promise<boolean> {
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("service_id", id);

  return (count ?? 0) > 0;
}
