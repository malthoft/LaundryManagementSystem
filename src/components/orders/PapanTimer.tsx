"use client";

import { useEffect, useState } from "react";
import { FormAksi } from "@/components/ui/FormAksi";
import { selesaikanOrderAction } from "@/controllers/order.controller";
import { hitungMundur } from "@/lib/format";

export interface OrderBerjalan {
  id: number;
  order_code: string;
  customer_name: string;
  mesin: string;
  selesai: string;
}

/**
 * Papan hitung mundur untuk order yang sedang berjalan. Ini satu-satunya
 * komponen yang punya jam berdetak, dan hanya karena operator memang perlu
 * tahu sisa waktu mesin.
 */
export function PapanTimer({ daftar }: { daftar: OrderBerjalan[] }) {
  /*
   * Dimulai dari null, bukan Date.now(), dan baru diisi di useEffect.
   * Kalau diisi saat render, server menghitung dengan jam server dan klien
   * dengan jam klien; selisihnya bikin teks hidrasi tidak cocok dan React
   * membuang seluruh subtree. Selama null, tampilannya "--:--" dulu.
   */
  const [sekarang, setSekarang] = useState<number | null>(null);
  const kosong = daftar.length === 0;

  useEffect(() => {
    if (kosong) return;

    setSekarang(Date.now());
    const pengatur = setInterval(() => setSekarang(Date.now()), 1000);
    return () => clearInterval(pengatur);
  }, [kosong]);

  if (daftar.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-kecil text-ink-muted">
        Tidak ada mesin yang sedang berjalan.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {daftar.map((order) => {
        const sisa = sekarang === null ? null : new Date(order.selesai).getTime() - sekarang;
        const habis = sisa !== null && sisa <= 0;

        return (
          <li
            key={order.id}
            className={`flex flex-col gap-2 rounded-md border p-3 ${
              habis ? "border-danger bg-danger-soft" : "border-line bg-surface"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="angka text-kecil font-bold text-ink">{order.order_code}</p>
                <p className="truncate text-kecil text-ink-muted">
                  {order.customer_name} · {order.mesin}
                </p>
              </div>
              <span
                aria-hidden="true"
                className={`material-symbols-outlined ${
                  habis ? "text-danger" : "text-busy"
                }`}
              >
                {habis ? "alarm_on" : "autorenew"}
              </span>
            </div>

            <p
              className={`angka text-2xl font-extrabold ${habis ? "text-danger" : "text-ink"}`}
            >
              {sisa === null ? "--:--" : habis ? "Waktu habis" : hitungMundur(sisa)}
            </p>

            <FormAksi
              aksi={selesaikanOrderAction}
              muatan={{ id: order.id }}
              label="Tandai selesai"
              ikon="check"
              varian={habis ? "utama" : "sekunder"}
            />
          </li>
        );
      })}
    </ul>
  );
}
