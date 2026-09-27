import type { KlienSupabase } from "@/lib/supabase/server";
import type { Notifikasi, TipeNotifikasi } from "@/types/db";

export const KOLOM_NOTIFIKASI =
  "id, user_id, title, message, type, related_type, related_id, is_read, created_at";

/** Notifikasi milik satu orang. RLS menjamin hanya barisnya sendiri yang terbaca. */
export async function ambilNotifikasi(
  supabase: KlienSupabase,
  batas = 20
): Promise<Notifikasi[]> {
  const { data } = await supabase
    .from("notifications")
    .select(KOLOM_NOTIFIKASI)
    .order("created_at", { ascending: false })
    .limit(batas)
    .returns<Notifikasi[]>();

  return data ?? [];
}

export async function jumlahBelumDibaca(
  supabase: KlienSupabase
): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  return count ?? 0;
}

export async function tandaiDibaca(
  supabase: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function tandaiSemuaDibaca(
  supabase: KlienSupabase
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) throw new Error(error.message);
}

/**
 * Kirim notifikasi. Fan-out ke penerima dikerjakan fungsi database supaya
 * aturannya hanya ada di satu tempat.
 */
export async function kirimNotifikasi(
  supabase: KlienSupabase,
  masukan: {
    judul: string;
    pesan: string;
    tipe?: TipeNotifikasi;
    untukPeran?: "Admin" | "Karyawan" | "All";
    untukUserId?: string | null;
    tipeTerkait?: string | null;
    idTerkait?: number | null;
  }
): Promise<void> {
  const { error } = await supabase.rpc("notify", {
    p_title: masukan.judul,
    p_message: masukan.pesan,
    p_type: masukan.tipe ?? "info",
    p_for_role: masukan.untukPeran ?? "All",
    p_user_id: masukan.untukUserId ?? null,
    p_related_type: masukan.tipeTerkait ?? null,
    p_related_id: masukan.idTerkait ?? null,
  });

  // Notifikasi bersifat pelengkap. Kegagalan mengirimnya tidak boleh
  // menggagalkan aksi utama yang sudah tersimpan.
  if (error) return;
}
