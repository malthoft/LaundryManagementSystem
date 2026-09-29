import { labelPeriode } from "@/lib/date";
import type { JenisPeriode, Periode } from "@/types/domain";

const PILIHAN: { nilai: JenisPeriode; label: string }[] = [
  { nilai: "hari", label: "Hari ini" },
  { nilai: "minggu", label: "Minggu tertentu" },
  { nilai: "bulan", label: "Bulan tertentu" },
  { nilai: "tahun", label: "Tahun tertentu" },
  { nilai: "bebas", label: "Rentang bebas" },
];

const KENDALI =
  "rounded-sm border border-line bg-surface px-3 py-2 text-kecil text-ink min-h-11";

/**
 * Filter periode memakai form GET biasa, bukan JavaScript. Alasannya: hasilnya
 * bisa di-bookmark dan dibagikan, dan tidak ada keadaan klien yang perlu dijaga.
 */
export function FilterPeriode({
  periode,
  nilaiMinggu,
  nilaiBulan,
  nilaiTahun,
}: {
  periode: Periode;
  nilaiMinggu: string;
  nilaiBulan: string;
  nilaiTahun: string;
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <div className="min-w-0">
        <label htmlFor="jenis" className="mb-1.5 block text-kecil font-semibold text-ink">
          Periode
        </label>
        <select id="jenis" name="jenis" defaultValue={periode.jenis} className={KENDALI}>
          {PILIHAN.map((item) => (
            <option key={item.nilai} value={item.nilai}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0">
        <label htmlFor="minggu" className="mb-1.5 block text-kecil font-semibold text-ink">
          Minggu
        </label>
        <input
          id="minggu"
          name="minggu"
          type="week"
          defaultValue={nilaiMinggu}
          className={KENDALI}
        />
      </div>

      <div className="min-w-0">
        <label htmlFor="bulan" className="mb-1.5 block text-kecil font-semibold text-ink">
          Bulan
        </label>
        <input
          id="bulan"
          name="bulan"
          type="month"
          defaultValue={nilaiBulan}
          className={KENDALI}
        />
      </div>

      <div className="min-w-0">
        <label htmlFor="tahun" className="mb-1.5 block text-kecil font-semibold text-ink">
          Tahun
        </label>
        <input
          id="tahun"
          name="tahun"
          type="number"
          min="2000"
          max="2100"
          defaultValue={nilaiTahun}
          className={KENDALI}
        />
      </div>

      <div className="min-w-0">
        <label htmlFor="mulai" className="mb-1.5 block text-kecil font-semibold text-ink">
          Mulai
        </label>
        <input
          id="mulai"
          name="mulai"
          type="date"
          defaultValue={periode.jenis === "bebas" ? periode.mulai : ""}
          className={KENDALI}
        />
      </div>

      <div className="min-w-0">
        <label htmlFor="selesai" className="mb-1.5 block text-kecil font-semibold text-ink">
          Selesai
        </label>
        <input
          id="selesai"
          name="selesai"
          type="date"
          defaultValue={periode.jenis === "bebas" ? periode.selesai : ""}
          className={KENDALI}
        />
      </div>

      <button
        type="submit"
        className="joyops-aksi inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-4 text-kecil font-bold text-primary-fg hover:bg-primary-600"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[1.15em]">
          filter_alt
        </span>
        Tampilkan
      </button>

      <p className="w-full text-kecil text-ink-muted">
        Periode aktif: <span className="angka font-semibold text-ink">{labelPeriode(periode)}</span>.
        Kolom yang tidak dipakai oleh jenis periode diabaikan.
      </p>
    </form>
  );
}
