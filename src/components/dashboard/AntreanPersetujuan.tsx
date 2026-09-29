import Link from "next/link";
import { Kartu, IsiKartu, KepalaKartu } from "@/components/ui/Kartu";
import { tanggal } from "@/lib/format";
import type { PengajuanTukarLengkap } from "@/types/domain";

/**
 * Antrean yang menunggu keputusan Admin. Ini alasan utama Admin membuka
 * dashboard, jadi ditaruh tinggi di halaman, bukan di menu terpisah.
 */
export function AntreanPersetujuan({
  tukar,
  absenMenunggu,
}: {
  tukar: PengajuanTukarLengkap[];
  absenMenunggu: number;
}) {
  const kosong = tukar.length === 0 && absenMenunggu === 0;

  return (
    <Kartu>
      <KepalaKartu judul="Menunggu keputusan Anda" ikon="approval" />
      <IsiKartu className="flex flex-col gap-3">
        {kosong ? (
          <p className="text-kecil text-ink-muted">
            Tidak ada yang menunggu. Antrean bersih.
          </p>
        ) : null}

        {absenMenunggu > 0 ? (
          <Link
            href="/attendance"
            className="joyops-aksi flex min-h-11 items-center gap-3 rounded-sm border border-line px-3 py-2.5 hover:bg-paper"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-busy">
              badge
            </span>
            <span className="min-w-0 flex-1 text-kecil text-ink">
              <strong className="angka font-bold">{absenMenunggu}</strong> absensi menunggu
              persetujuan
            </span>
            <span aria-hidden="true" className="material-symbols-outlined text-ink-muted">
              chevron_right
            </span>
          </Link>
        ) : null}

        {tukar.map((item) => (
          <Link
            key={item.id}
            href="/shifts"
            className="joyops-aksi flex min-h-11 items-center gap-3 rounded-sm border border-line px-3 py-2.5 hover:bg-paper"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-busy">
              swap_horiz
            </span>
            <span className="min-w-0 flex-1 text-kecil text-ink">
              Tukar shift {item.pemohon?.full_name ?? "karyawan"} dengan{" "}
              {item.calon_pengganti?.full_name ?? "rekan"}
              {item.shift_pemohon ? `, ${tanggal(item.shift_pemohon.work_date)}` : ""}
            </span>
            <span aria-hidden="true" className="material-symbols-outlined text-ink-muted">
              chevron_right
            </span>
          </Link>
        ))}
      </IsiKartu>
    </Kartu>
  );
}
