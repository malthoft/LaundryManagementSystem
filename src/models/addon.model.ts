import type { KlienSupabase } from "@/lib/supabase/server";
import type { Addon } from "@/types/db";

export const KOLOM_ADDON =
  "id, addon_name, price, icon, is_active, created_at";

export interface AddonBaru {
  addon_name: string;
  price: number;
  icon: string;
  is_active: boolean;
}

export async function ambilSemuaAddon(
  supabase: KlienSupabase
): Promise<Addon[]> {
  const { data } = await supabase
    .from("addons")
    .select(KOLOM_ADDON)
    .order("is_active", { ascending: false })
    .order("addon_name", { ascending: true })
    .returns<Addon[]>();

  return data ?? [];
}

export async function ambilAddonAktif(
  supabase: KlienSupabase
): Promise<Addon[]> {
  const { data } = await supabase
    .from("addons")
    .select(KOLOM_ADDON)
    .eq("is_active", true)
    .order("addon_name", { ascending: true })
    .returns<Addon[]>();

  return data ?? [];
}

export async function buatAddon(
  supabase: KlienSupabase,
  masukan: AddonBaru
): Promise<void> {
  const { error } = await supabase.from("addons").insert(masukan);
  if (error) throw new Error(error.message);
}

export async function ubahAddon(
  supabase: KlienSupabase,
  id: number,
  perubahan: Partial<AddonBaru>
): Promise<void> {
  const { error } = await supabase.from("addons").update(perubahan).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function hapusAddon(
  supabase: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await supabase.from("addons").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Add-on yang sudah dipakai order tidak dihapus, cukup dinonaktifkan. */
export async function addonDipakaiOrder(
  supabase: KlienSupabase,
  id: number
): Promise<boolean> {
  const { count } = await supabase
    .from("order_addons")
    .select("id", { count: "exact", head: true })
    .eq("addon_id", id);

  return (count ?? 0) > 0;
}
