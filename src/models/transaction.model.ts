import type { KlienSupabase } from "@/lib/supabase/server";
import type { MetodeKas, TipeTransaksi, Transaksi } from "@/types/db";
import type { Periode, RingkasanKas } from "@/types/domain";

export const KOLOM_TRANSAKSI =
  "id, transaction_date, transaction_type, amount, payment_method, description, order_id, created_by, created_at";

export interface TransaksiBaru {
  transaction_date: string;
  transaction_type: TipeTransaksi;
  amount: number;
  payment_method: MetodeKas;
  description: string;
}

/** Terbaru lebih dulu. Tanpa periode, mengambil 100 terakhir. */
export async function ambilTransaksi(
  supabase: KlienSupabase,
  periode?: Periode
): Promise<Transaksi[]> {
  let kueri = supabase
    .from("transactions")
    .select(KOLOM_TRANSAKSI)
    .order("transaction_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(periode ? 1000 : 100);

  if (periode) {
    kueri = kueri
      .gte("transaction_date", periode.mulai)
      .lte("transaction_date", periode.selesai);
  }

  const { data } = await kueri.returns<Transaksi[]>();
  return data ?? [];
}

/**
 * Ringkasan uang untuk satu periode. Dijumlahkan dari baris yang benar-benar
 * ada, bukan dari kolom tersimpan, supaya tidak ada angka yang tidak bisa
 * ditelusuri.
 */
export async function ringkasKas(
  supabase: KlienSupabase,
  periode: Periode
): Promise<RingkasanKas> {
  const { data } = await supabase
    .from("transactions")
    .select("transaction_type, amount")
    .gte("transaction_date", periode.mulai)
    .lte("transaction_date", periode.selesai)
    .returns<Array<Pick<Transaksi, "transaction_type" | "amount">>>();

  const daftar = data ?? [];
  const jumlahkan = (tipe: TipeTransaksi) =>
    daftar
      .filter((baris) => baris.transaction_type === tipe)
      .reduce((jumlah, baris) => jumlah + Number(baris.amount ?? 0), 0);

  const pemasukan = jumlahkan("Pemasukan");
  const pengeluaran = jumlahkan("Pengeluaran");

  return {
    pemasukan,
    pengeluaran,
    netto: pemasukan - pengeluaran,
    jumlahTransaksi: daftar.length,
  };
}

export async function ambilTransaksiOrder(
  supabase: KlienSupabase,
  orderId: number
): Promise<Transaksi | null> {
  const { data } = await supabase
    .from("transactions")
    .select(KOLOM_TRANSAKSI)
    .eq("order_id", orderId)
    .maybeSingle()
    .returns<Transaksi | null>();

  return data ?? null;
}

export async function buatTransaksi(
  supabase: KlienSupabase,
  masukan: TransaksiBaru & { created_by: string }
): Promise<void> {
  const { error } = await supabase.from("transactions").insert(masukan);
  if (error) throw new Error(error.message);
}

export async function ubahTransaksi(
  supabase: KlienSupabase,
  id: number,
  perubahan: TransaksiBaru
): Promise<void> {
  // order_id sengaja tidak diubah: pemasukan dari order menempel pada ordernya.
  const { error } = await supabase
    .from("transactions")
    .update(perubahan)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function hapusTransaksi(
  supabase: KlienSupabase,
  id: number
): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
