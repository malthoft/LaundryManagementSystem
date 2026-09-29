"use client";

import { useActionState, useState } from "react";
import { ajukanTukarAction } from "@/controllers/shift.controller";
import { Pilihan } from "@/components/ui/Kolom";
import { PesanHasil } from "@/components/ui/Keadaan";
import { Tombol } from "@/components/ui/Tombol";
import { LABEL_HARI } from "@/lib/constants";
import { jam, tanggal } from "@/lib/format";
import type { Shift } from "@/types/db";
import type { ShiftLengkap } from "@/types/domain";

function labelShift(shift: Shift | ShiftLengkap): string {
  return `${LABEL_HARI[shift.work_day]}, ${tanggal(shift.work_date)} · ${jam(
    `2000-01-01T${shift.start_time}`
  )} sampai ${jam(`2000-01-01T${shift.end_time}`)} · ${shift.station}`;
}

/**
 * Pengajuan tukar shift. Hanya menampilkan shift minggu berjalan, karena
 * aturan tukar memang hanya berlaku dalam minggu yang sama.
 */
export function FormTukar({
  milikSaya,
  milikRekan,
}: {
  milikSaya: Shift[];
  milikRekan: ShiftLengkap[];
}) {
  const [hasil, kirim, sedangKirim] = useActionState(ajukanTukarAction, null);
  const galat = hasil && !hasil.ok ? hasil.field : undefined;

  const [pilihan, setPilihan] = useState("");
  const rekanTerkait = milikRekan.filter((shift) => {
    const dipilih = milikSaya.find((item) => String(item.id) === pilihan);
    return !dipilih || shift.work_date === dipilih.work_date;
  });

  if (milikSaya.length === 0 || milikRekan.length === 0) {
    return (
      <PesanHasil jenis="info">
        Tukar shift hanya bisa dilakukan dalam minggu ini, dan butuh shift Anda serta
        shift rekan kerja di minggu yang sama. Belum ada pasangan shift yang memenuhi.
      </PesanHasil>
    );
  }

  return (
    <form action={kirim} className="flex flex-col gap-4">
      {hasil && !hasil.ok && !galat ? <PesanHasil jenis="gagal">{hasil.error}</PesanHasil> : null}
      {hasil?.ok ? (
        <PesanHasil jenis="sukses">
          Pengajuan terkirim. Rekan kerja akan menerima permintaan, lalu Admin menyetujui.
        </PesanHasil>
      ) : null}

      <Pilihan
        label="Shift saya yang dilepas"
        name="shiftId"
        required
        kosong="Pilih shift Anda"
        galat={galat?.shiftId}
        value={pilihan}
        onChange={(peristiwa) => setPilihan(peristiwa.target.value)}
        opsi={milikSaya.map((shift) => ({ nilai: shift.id, label: labelShift(shift) }))}
      />

      <Pilihan
        label="Shift rekan yang diambil"
        name="targetShiftId"
        required
        kosong={pilihan ? "Pilih shift rekan" : "Pilih shift Anda lebih dulu"}
        disabled={!pilihan}
        galat={galat?.targetShiftId}
        petunjuk="Hanya shift rekan kerja di tanggal yang sama yang bisa ditukar."
        opsi={rekanTerkait.map((shift) => ({
          nilai: shift.id,
          label: `${labelShift(shift)} · ${shift.pemilik?.full_name ?? "rekan"}`,
        }))}
      />

      <div className="flex justify-end">
        <Tombol type="submit" ikon="swap_horiz" keadaan={sedangKirim ? "memuat" : "normal"}>
          {sedangKirim ? "Mengirim" : "Ajukan tukar"}
        </Tombol>
      </div>
    </form>
  );
}
