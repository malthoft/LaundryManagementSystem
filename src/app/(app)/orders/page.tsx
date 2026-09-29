import type { Metadata } from "next";
import { PemicuOrderBaru } from "@/components/orders/PemicuOrderBaru";
import { PapanTimer, type OrderBerjalan } from "@/components/orders/PapanTimer";
import { TabelOrder } from "@/components/orders/TabelOrder";
import { Kartu, KepalaKartu, JudulHalaman } from "@/components/ui/Kartu";
import { rapikanOrderKedaluwarsa } from "@/controllers/order.controller";
import { wajibMasuk } from "@/lib/auth";
import { hariIni } from "@/lib/date";
import { pasanganMesin, tanggal } from "@/lib/format";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilAddonAktif } from "@/models/addon.model";
import { ambilMesinTersedia } from "@/models/machine.model";
import { ambilOrderTanggal } from "@/models/order.model";
import { ambilLayananAktif } from "@/models/service.model";

export const metadata: Metadata = { title: "Order & Pembayaran" };

export default async function HalamanOrder({
  searchParams,
}: {
  searchParams: Promise<{ aksi?: string }>;
}) {
  const profil = await wajibMasuk();
  const hari = hariIni();
  /* Quick link /orders?aksi=baru: URL sebagai penanda, tanpa state tambahan. */
  const { aksi } = await searchParams;

  /* Mesin yang waktunya sudah lewat dikembalikan lebih dulu, supaya daftar
     mesin tersedia di form tidak menahan mesin yang sebenarnya kosong. */
  await rapikanOrderKedaluwarsa();

  const supabase = await buatKlienServer();
  const [mesin, layanan, addon, orderHariIni] = await Promise.all([
    ambilMesinTersedia(supabase),
    ambilLayananAktif(supabase),
    ambilAddonAktif(supabase),
    ambilOrderTanggal(supabase, hari),
  ]);

  const berjalan: OrderBerjalan[] = orderHariIni
    .filter((order) => order.status === "Berjalan")
    .map((order) => ({
      id: order.id,
      order_code: order.order_code,
      customer_name: order.customer_name,
      mesin: pasanganMesin(order.washer, order.dryer),
      selesai: order.end_time,
    }));

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul="Order & Pembayaran"
        keterangan={`${orderHariIni.length} order hari ini, ${tanggal(hari)}`}
      />

      <Kartu id="papan-timer" className="scroll-mt-20">
        <KepalaKartu
          judul="Mesin sedang berjalan"
          ikon="timer"
          keterangan="Tandai selesai setelah cucian diangkat, supaya mesin bisa dipakai order berikutnya"
        />
        <PapanTimer daftar={berjalan} />
      </Kartu>

      <Kartu>
        <KepalaKartu
          judul="Order hari ini"
          ikon="receipt_long"
          keterangan={`${orderHariIni.length} order`}
          aksi={
            <PemicuOrderBaru
              mesinCuci={mesin.cuci}
              mesinPengering={mesin.pengering}
              layanan={layanan}
              addon={addon}
              awalBuka={aksi === "baru"}
              label="Buat order"
            />
          }
        />
        <TabelOrder
          daftar={orderHariIni}
          bolehBatalkan={profil.role === "Admin"}
          tampilkanPembuat
        />
      </Kartu>
    </div>
  );
}
