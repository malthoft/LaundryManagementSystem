"use client";

import { useEffect, useState } from "react";
import { FormOrder } from "@/components/orders/FormOrder";
import { Modal } from "@/components/ui/Modal";
import type { Addon, Layanan, Mesin } from "@/types/db";

/**
 * Membungkus FormOrder ke dalam dialog. Halaman /orders tetap komponen server:
 * hanya pemicunya yang jadi komponen klien ini, dan data mesin, layanan, serta
 * add-on diteruskan apa adanya.
 *
 * State preservation tidak perlu lift state apa pun. `Modal` memuat children-nya
 * ke dalam elemen <dialog> sejak awal, dan <dialog> yang tertutup tetap ada di
 * DOM. Jadi state FormOrder (hasil useActionState, layanan yang dipilih, jumlah,
 * add-on yang dicentang) tetap hidup walau dialog ditutup lalu dibuka lagi.
 * Kalau Modal nanti diubah supaya children di-unmount saat tertutup, pemulangan
 * state ini harus dipindah ke sini.
 */
export function OrderBaruModal({
  mesinCuci,
  mesinPengering,
  layanan,
  addon,
  buka,
  tutup,
}: {
  mesinCuci: Mesin[];
  mesinPengering: Mesin[];
  layanan: Layanan[];
  addon: Addon[];
  buka: boolean;
  tutup: () => void;
}) {
  /* Fokus ke kolom pelanggan hanya saat dialog pertama kali dibuka. Kalau
     selalu diulang, setiap kali pemakai membuka ulang, kursor kembali ke awal
     dan WV mengetik ulang. */
  const [sudahTerbuka, setSudahTerbuka] = useState(false);
  useEffect(() => {
    if (buka) setSudahTerbuka(true);
  }, [buka]);

  return (
    <Modal
      buka={buka}
      tutup={tutup}
      judul="Buat order baru"
      keterangan="Satu order memakai satu mesin cuci dan satu mesin pengering"
      lebar="besar"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <FormOrder
          mesinCuci={mesinCuci}
          mesinPengering={mesinPengering}
          layanan={layanan}
          addon={addon}
          fokusAwal={sudahTerbuka && buka}
        />
      </div>
    </Modal>
  );
}
