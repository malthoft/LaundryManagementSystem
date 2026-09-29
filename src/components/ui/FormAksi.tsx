"use client";

import { useActionState } from "react";
import { Tombol, type VarianTombol } from "@/components/ui/Tombol";
import type { AksiForm } from "@/lib/aksi";

/**
 * Form satu tombol untuk aksi yang tidak butuh isian, misalnya "tandai
 * selesai" atau "hapus". Semua controller di JoyOps memakai bentuk
 * `AksiForm`, jadi satu pembungkus ini cukup untuk seluruh aplikasi dan
 * tombolnya otomatis punya keadaan menunggu.
 */
export function FormAksi<T>({
  aksi,
  muatan,
  label,
  ikon,
  varian = "sekunder",
  ukuran = "kecil",
  judulMenunggu,
}: {
  aksi: AksiForm<T>;
  muatan: Record<string, string | number>;
  label: string;
  ikon?: string;
  varian?: VarianTombol;
  ukuran?: "sedang" | "kecil";
  judulMenunggu?: string;
}) {
  const [hasil, kirim, sedangKirim] = useActionState(aksi, null);

  return (
    <form action={kirim} className="inline-flex flex-col items-start gap-1">
      {Object.entries(muatan).map(([nama, nilai]) => (
        <input key={nama} type="hidden" name={nama} value={nilai} />
      ))}

      <Tombol
        type="submit"
        varian={varian}
        ukuran={ukuran}
        ikon={ikon}
        keadaan={sedangKirim ? "memuat" : "normal"}
      >
        {sedangKirim && judulMenunggu ? judulMenunggu : label}
      </Tombol>

      {hasil && !hasil.ok ? (
        <span role="alert" className="text-mini font-medium text-danger">
          {hasil.error}
        </span>
      ) : null}
    </form>
  );
}
