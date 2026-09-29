import Link from "next/link";
import { Kartu, IsiKartu } from "@/components/ui/Kartu";
import { TautanTombol } from "@/components/ui/Tombol";

export default function TidakDitemukan() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10">
      <Kartu>
        <IsiKartu className="flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-ikon-besar text-ink-muted"
          >
            search_off
          </span>
          <h1 className="font-display text-lg font-bold text-ink">Halaman tidak ditemukan</h1>
          <p className="max-w-md text-kecil text-ink-muted">
            Alamat yang dibuka tidak ada. Menu di samping berisi seluruh halaman yang
            tersedia.
          </p>
          <TautanTombol href="/dashboard" varian="utama" ikon="dashboard">
            Buka dashboard
          </TautanTombol>
          <Link
            href="/guide"
            className="joyops-aksi inline-flex min-h-11 items-center text-kecil font-bold text-primary hover:underline"
          >
            Baca panduan
          </Link>
        </IsiKartu>
      </Kartu>
    </main>
  );
}
