import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TombolCetak } from "@/components/orders/TombolCetak";
import { Lencana } from "@/components/ui/Lencana";
import { TautanTombol } from "@/components/ui/Tombol";
import { wajibMasuk } from "@/lib/auth";
import { LABEL_STATUS_ORDER, NADA_ORDER } from "@/lib/constants";
import { angkaDesimal, durasi, jam, pasanganMesin, rupiah, tanggalJam } from "@/lib/format";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilOrderById } from "@/models/order.model";

export const metadata: Metadata = { title: "Struk order" };

/**
 * Struk siap cetak. Harga yang ditampilkan adalah harga yang sudah tersalin ke
 * baris order (BR-08), jadi mencetak struk lama tidak ikut berubah kalau tarif
 * layanan dinaikkan.
 *
 * Rangka navigasi disembunyikan lewat `print:hidden` di layout, dan bilah
 * tombol di halaman ini juga disembunyikan, jadi yang tercetak hanya struknya.
 */
export default async function HalamanStruk({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await wajibMasuk();

  const { id } = await params;
  const nomor = Number(id);
  if (!Number.isInteger(nomor) || nomor <= 0) notFound();

  const supabase = await buatKlienServer();
  const order = await ambilOrderById(supabase, nomor);
  if (!order) notFound();

  const baris = [
    {
      nama: order.layanan?.service_name ?? "Layanan",
      keterangan: `${angkaDesimal(order.qty)} ${order.layanan?.unit ?? ""}`.trim(),
      jumlah: rupiah(order.service_price),
    },
    ...(order.baris_addon ?? []).map((addon) => ({
      nama: addon.addon_name,
      keterangan: `${angkaDesimal(addon.qty)} x ${rupiah(addon.price)}`,
      jumlah: rupiah(addon.subtotal),
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Bilah aksi tidak ikut tercetak. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <TautanTombol href="/orders" varian="halus" ikon="arrow_back">
          Kembali ke order
        </TautanTombol>
        <TombolCetak />
      </div>

      <div className="rounded-md border border-line bg-surface p-6 print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-3 border-b border-dashed border-line pb-4">
          <div>
            <p className="font-display text-lg font-extrabold text-ink">JoyOps Laundry</p>
            <p className="text-mini text-ink-muted">Struk order</p>
          </div>
          <Lencana nada={NADA_ORDER[order.status]} ikon>
            {LABEL_STATUS_ORDER[order.status]}
          </Lencana>
        </header>

        <div className="flex items-baseline justify-between gap-3 py-4">
          <span className="angka text-lg font-extrabold text-ink">{order.order_code}</span>
          <span className="text-mini text-ink-muted">{tanggalJam(order.start_time)}</span>
        </div>

        <dl className="flex flex-col gap-1.5 border-y border-dashed border-line py-4 text-kecil">
          <BarisMeta label="Pelanggan" nilai={order.customer_name} />
          <BarisMeta label="Mesin" nilai={pasanganMesin(order.washer, order.dryer)} />
          <BarisMeta label="Estimasi selesai" nilai={jam(order.end_time)} />
          <BarisMeta label="Durasi" nilai={durasi(order.duration_minutes)} />
          <BarisMeta label="Pembayaran" nilai={order.payment_method} />
          <BarisMeta label="Kasir" nilai={order.pembuat?.full_name ?? "-"} />
        </dl>

        <div className="flex flex-col gap-2.5 py-4">
          {baris.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-kecil font-semibold text-ink">{item.nama}</p>
                <p className="text-mini text-ink-muted">{item.keterangan}</p>
              </div>
              <p className="angka shrink-0 text-kecil text-ink">{item.jumlah}</p>
            </div>
          ))}
        </div>

        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4">
          <span className="font-display font-bold text-ink">Total</span>
          <span className="angka text-lg font-extrabold text-ink">{rupiah(order.grand_total)}</span>
        </div>

        {order.notes ? (
          <p className="mt-4 rounded-sm border border-line px-3 py-2 text-mini text-ink-muted">
            Catatan: {order.notes}
          </p>
        ) : null}

        <p className="mt-5 border-t border-dashed border-line pt-4 text-center text-mini text-ink-muted">
          Terima kasih. Simpan struk ini sebagai bukti pengambilan.
        </p>
      </div>
    </div>
  );
}

function BarisMeta({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{nilai}</dd>
    </div>
  );
}
