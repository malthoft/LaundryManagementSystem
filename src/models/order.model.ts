import type { KlienSupabase } from "@/lib/supabase/server";
import type { MetodeBayar, Order } from "@/types/db";
import type { OrderLengkap } from "@/types/domain";

/**
 * Satu query untuk daftar order, dengan semua relasi yang dibutuhkan tabel.
 * Tidak ada query per baris.
 */
const SELEKSI_ORDER = `
  id, order_code, washer_machine_id, dryer_machine_id, service_id,
  customer_name, qty, service_price, addon_total, grand_total,
  duration_minutes, start_time, end_time, status, payment_method,
  notes, created_by, created_at,
  washer:machines!orders_washer_machine_id_fkey(id, machine_code, machine_type, status),
  dryer:machines!orders_dryer_machine_id_fkey(id, machine_code, machine_type, status),
  layanan:services!orders_service_id_fkey(id, service_name, price, unit),
  pembuat:profiles!orders_created_by_fkey(id, full_name, username),
  baris_addon:order_addons(id, order_id, addon_id, addon_name, qty, price, subtotal)
`;

export interface OrderBaru {
  washerId: number;
  dryerId: number;
  serviceId: number;
  namaPelanggan: string;
  qty: number;
  addonIds: number[];
  metodeBayar: MetodeBayar;
  catatan?: string;
}

export async function ambilOrderById(
  supabase: KlienSupabase,
  id: number
): Promise<OrderLengkap | null> {
  const { data } = await supabase
    .from("orders")
    .select(SELEKSI_ORDER)
    .eq("id", id)
    .maybeSingle()
    .returns<OrderLengkap | null>();

  return data ?? null;
}

/** Order yang dibuat pada satu tanggal (zona Jakarta). */
export async function ambilOrderTanggal(
  supabase: KlienSupabase,
  tanggal: string
): Promise<OrderLengkap[]> {
  const { data } = await supabase
    .from("orders")
    .select(SELEKSI_ORDER)
    .gte("created_at", `${tanggal}T00:00:00+07:00`)
    .lte("created_at", `${tanggal}T23:59:59.999+07:00`)
    .order("created_at", { ascending: false })
    .returns<OrderLengkap[]>();

  return data ?? [];
}

/**
 * Buat order lewat fungsi database. Seluruh langkah (kunci mesin, hitung total,
 * tandai mesin, catat pemasukan, kirim notifikasi) berjalan dalam satu transaksi,
 * jadi tidak ada data separuh jadi kalau ada yang gagal.
 */
export async function buatOrder(
  supabase: KlienSupabase,
  masukan: OrderBaru
): Promise<Order> {
  const { data, error } = await supabase.rpc("buat_order", {
    p_washer_id: masukan.washerId,
    p_dryer_id: masukan.dryerId,
    p_service_id: masukan.serviceId,
    p_customer_name: masukan.namaPelanggan,
    p_qty: masukan.qty,
    p_addon_ids: masukan.addonIds,
    p_payment_method: masukan.metodeBayar,
    p_notes: masukan.catatan ?? null,
  });

  if (error) throw new Error(error.message);

  const order = (Array.isArray(data) ? data[0] : data) as Order | undefined;
  if (!order) throw new Error("Order gagal dibuat");
  return order;
}

/** Tandai order selesai. Mesin dilepas oleh fungsi database. */
export async function selesaikanOrder(
  supabase: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await supabase.rpc("selesaikan_order", { p_order_id: id });
  if (error) throw new Error(error.message);
}

/** Batalkan order. Hanya Admin (dijaga di fungsi database, BR-12). */
export async function batalkanOrder(
  supabase: KlienSupabase,
  id: number,
  alasan?: string
): Promise<void> {
  const { error } = await supabase.rpc("batalkan_order", {
    p_order_id: id,
    p_alasan: alasan ?? null,
  });
  if (error) throw new Error(error.message);
}

/**
 * Tutup order yang sudah lewat `end_time` dan lepaskan mesinnya. Meniru
 * perilaku "Order Otomatis Selesai" v2.1 tanpa perlu cron. Mengembalikan
 * jumlah order yang ditutup.
 */
export async function tutupOrderKedaluwarsa(
  supabase: KlienSupabase
): Promise<number> {
  const { data, error } = await supabase
    .rpc("tutup_order_kedaluwarsa")
    .returns<number>();

  if (error) return 0;
  return typeof data === "number" ? data : 0;
}

/** Ringkasan order untuk dashboard: jumlah dan total per status hari ini. */
export async function ringkasOrderTanggal(
  supabase: KlienSupabase,
  tanggal: string
): Promise<{ jumlah: number; berjalan: number; selesai: number; total: number }> {
  const { data } = await supabase
    .from("orders")
    .select("status, grand_total")
    .gte("created_at", `${tanggal}T00:00:00+07:00`)
    .lte("created_at", `${tanggal}T23:59:59.999+07:00`)
    .returns<Array<Pick<Order, "status" | "grand_total">>>();

  const daftar = data ?? [];
  return {
    jumlah: daftar.length,
    berjalan: daftar.filter((o) => o.status === "Berjalan").length,
    selesai: daftar.filter((o) => o.status === "Selesai").length,
    total: daftar
      .filter((o) => o.status !== "Dibatalkan")
      .reduce((jumlah, o) => jumlah + Number(o.grand_total ?? 0), 0),
  };
}
