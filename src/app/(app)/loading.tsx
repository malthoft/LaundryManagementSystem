import { Kartu, KepalaKartu } from "@/components/ui/Kartu";
import { RangkaMuat } from "@/components/ui/Keadaan";

/**
 * Keadaan memuat untuk seluruh halaman di dalam aplikasi. Rangka ini meniru
 * bentuk daftar supaya tata letak tidak melompat saat data tiba.
 */
export default function MemuatHalaman() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-5 w-40 rounded-sm bg-line" />
        <div className="skeleton h-3.5 w-64 rounded-sm bg-line" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border border-line bg-surface p-4 sm:p-5">
            <div className="skeleton h-3 w-24 rounded-sm bg-line" />
            <div className="skeleton mt-3 h-7 w-28 rounded-sm bg-line" />
          </div>
        ))}
      </div>

      <Kartu>
        <KepalaKartu judul="Memuat data" ikon="hourglass_top" />
        <RangkaMuat baris={5} kolom={4} />
      </Kartu>
    </div>
  );
}
