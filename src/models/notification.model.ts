import type { KlienSupabase } from "@/lib/supabase/server";
import type { Notifikasi, TipeNotifikasi } from "@/types/db";

export const KOLOM_NOTIFIKASI =
  "id, user_id, title, message, type, related_type, related_id, is_read, created_at";

/**
 * Batas waktu 24 jam terakhir untuk notifikasi aktif.
 * Notifikasi yang lebih tua dari 24 jam otomatis disembunyikan/dibersihkan.
 */
export function batas24Jam(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

/** Notifikasi milik satu orang dalam 24 jam terakhir. RLS menjamin barisnya sendiri yang terbaca. */
export async function ambilNotifikasi(
  supabase: KlienSupabase,
  batas = 20
): Promise<Notifikasi[]> {
  const sejak = batas24Jam();
  const { data } = await supabase
    .from("notifications")
    .select(KOLOM_NOTIFIKASI)
    .gte("created_at", sejak)
    .order("created_at", { ascending: false })
    .limit(batas)
    .returns<Notifikasi[]>();

  return data ?? [];
}

/** Jumlah notifikasi belum dibaca dalam 24 jam terakhir. */
export async function jumlahBelumDibaca(
  supabase: KlienSupabase
): Promise<number> {
  const sejak = batas24Jam();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sejak)
    .eq("is_read", false);

  return count ?? 0;
}

/** Tandai satu notifikasi telah dibaca. */
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

/** Tandai semua notifikasi pengguna saat ini sebagai telah dibaca. */
export async function tandaiSemuaDibaca(
  supabase: KlienSupabase
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) throw new Error(error.message);
}

/** Hapus / bersihkan seluruh notifikasi pengguna secara manual. */
export async function hapusSemuaNotifikasi(
  supabase: KlienSupabase
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .gt("id", 0);

  if (error) throw new Error(error.message);
}

/**
 * Pembersihan otomatis: hapus notifikasi yang sudah melewati 24 jam dari database.
 */
export async function bersihkanNotifikasiKedaluwarsa(
  supabase: KlienSupabase
): Promise<void> {
  try {
    const sejak = batas24Jam();
    await supabase.from("notifications").delete().lt("created_at", sejak);
  } catch {
    // Non-blocking cleanup
  }
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

  if (error) return;
}
