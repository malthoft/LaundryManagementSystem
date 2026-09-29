import { Konfirmasi } from "@/components/ui/Konfirmasi";
import { FormAksi } from "@/components/ui/FormAksi";
import { Lencana } from "@/components/ui/Lencana";
import { KeadaanKosong } from "@/components/ui/Keadaan";
import { BarisTabel, KepalaTabel, SelTabel, Tabel } from "@/components/ui/Tabel";
import { TautanTombol } from "@/components/ui/Tombol";
import { batalkanOrderAction, selesaikanOrderAction } from "@/controllers/order.controller";
import { LABEL_STATUS_ORDER, NADA_ORDER } from "@/lib/constants";
import { angkaDesimal, jam, pasanganMesin, rupiah } from "@/lib/format";
import type { OrderLengkap } from "@/types/domain";

/**
 * Tabel order dipakai di dashboard dan di halaman order, jadi bentuknya satu.
 * Aksi yang tersedia mengikuti status order, bukan mengikuti halaman.
 */
export function TabelOrder({
  daftar,
  bolehBatalkan = false,
  tampilkanPembuat = false,
}: {
  daftar: OrderLengkap[];
  bolehBatalkan?: boolean;
  tampilkanPembuat?: boolean;
}) {
  if (daftar.length === 0) {
    return (
      <KeadaanKosong
        ikon="receipt_long"
        judul="Belum ada order"
        keterangan="Order yang dibuat hari ini akan muncul di sini."
      />
    );
  }

  const kolom = [
    { label: "Kode" },
    { label: "Mesin" },
    { label: "Layanan" },
    { label: "Pelanggan" },
    { label: "Qty", num: true },
    { label: "Total", num: true },
    { label: "Status" },
    { label: "Mulai" },
    ...(tampilkanPembuat ? [{ label: "Kasir" }] : []),
    { label: "Aksi" },
  ];

  return (
    <Tabel minWidth="60rem">
      <KepalaTabel kolom={kolom} />
      <tbody>
        {daftar.map((order) => (
          <BarisTabel key={order.id}>
            <SelTabel className="angka font-semibold">{order.order_code}</SelTabel>
            <SelTabel>{pasanganMesin(order.washer, order.dryer)}</SelTabel>
            <SelTabel>{order.layanan?.service_name ?? "-"}</SelTabel>
            <SelTabel>{order.customer_name}</SelTabel>
            <SelTabel num>
              {angkaDesimal(order.qty, 0)} {order.layanan?.unit ?? ""}
            </SelTabel>
            <SelTabel num className="font-semibold">
              {rupiah(order.grand_total)}
            </SelTabel>
            <SelTabel>
              <Lencana nada={NADA_ORDER[order.status]} ikon>
                {LABEL_STATUS_ORDER[order.status]}
              </Lencana>
            </SelTabel>
            <SelTabel className="angka">{jam(order.start_time)}</SelTabel>
            {tampilkanPembuat ? (
              <SelTabel>{order.pembuat?.full_name ?? "-"}</SelTabel>
            ) : null}
            <SelTabel>
              <div className="flex flex-wrap items-center gap-2">
                {order.status === "Berjalan" ? (
                  <FormAksi
                    aksi={selesaikanOrderAction}
                    muatan={{ id: order.id }}
                    label="Selesai"
                    ikon="check"
                    varian="sekunder"
                  />
                ) : null}

                {bolehBatalkan && order.status === "Berjalan" ? (
                  <Konfirmasi
                    label="Batalkan"
                    ikon="cancel"
                    varian="halus"
                    judul={`Batalkan ${order.order_code}?`}
                    pesan="Order ditandai dibatalkan, mesin dikembalikan ke status tersedia, dan pemasukan terkait dihapus."
                    labelYa="Batalkan order"
                    aksi={batalkanOrderAction}
                    muatan={{ id: order.id }}
                  />
                ) : null}

                {order.status !== "Berjalan" ? (
                  <span className="text-kecil text-ink-muted">Selesai</span>
                ) : null}

                {/* Quick link: struk langsung dari baris, tanpa buka halaman lain. */}
                <TautanTombol
                  href={`/orders/${order.id}/struk`}
                  varian="halus"
                  ukuran="kecil"
                  ikon="print"
                >
                  Struk
                </TautanTombol>
              </div>
            </SelTabel>
          </BarisTabel>
        ))}
      </tbody>
    </Tabel>
  );
}
