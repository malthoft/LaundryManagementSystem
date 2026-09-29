"use client";

import { useState } from "react";
import { OrderBaruModal } from "@/components/orders/OrderBaruModal";
import { Tombol } from "@/components/ui/Tombol";
import type { Addon, Layanan, Mesin } from "@/types/db";

/**
 * Tombol "Buat order" beserta modalnya, disatukan jadi satu komponen supaya
 * state `buka` tidak perlu dipegang halaman. Halaman /orders tetap bisa jadi
 * server component.
 *
 * Tombol ini adalah pemicu utama order, jadi tetap punya nama yang jelas dan
 * target sentuh 44px seperti tombol lain.
 */
export function PemicuOrderBaru({
  mesinCuci,
  mesinPengering,
  layanan,
  addon,
  awalBuka = false,
  label = "Buat order",
  varian = "utama",
  ikon = "add",
}: {
  mesinCuci: Mesin[];
  mesinPengering: Mesin[];
  layanan: Layanan[];
  addon: Addon[];
  /* Dipakai quick link /orders?aksi=baru: modal langsung terbuka begitu
     halaman dimuat, jadi kasir tidak perlu klik tombol dulu. */
  awalBuka?: boolean;
  label?: string;
  varian?: "utama" | "sekunder" | "halus" | "bahaya";
  ikon?: string;
}) {
  const [buka, setBuka] = useState(awalBuka);

  return (
    <>
      <Tombol type="button" varian={varian} ikon={ikon} onClick={() => setBuka(true)}>
        {label}
      </Tombol>

      <OrderBaruModal
        mesinCuci={mesinCuci}
        mesinPengering={mesinPengering}
        layanan={layanan}
        addon={addon}
        buka={buka}
        tutup={() => setBuka(false)}
      />
    </>
  );
}
