import type { Metadata } from "next";
import { FormMasuk } from "./FormMasuk";
import { Kartu, IsiKartu } from "@/components/ui/Kartu";
import { PesanHasil } from "@/components/ui/Keadaan";
import { BANTUAN_LUPA_SANDI } from "@/lib/constants";
import { PESAN_TERKIRIM } from "@/lib/pesan-akun";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Masuk",
};

/* Halaman masuk juga bergantung pada cookie sesi dan parameter URL. */
export const dynamic = "force-dynamic";

const PESAN_URL: Record<string, string> = {
  nonaktif: "Akun ini sedang tidak aktif. Hubungi Admin untuk mengaktifkan kembali.",
  keluar: "Anda sudah keluar dari sistem.",
  "sandi-diubah":
    "Sandi berhasil diubah. Silakan masuk dengan sandi baru Anda.",
  terkirim: PESAN_TERKIRIM,
};

export default async function HalamanMasuk({
  searchParams,
}: {
  searchParams: Promise<{ pesan?: string }>;
}) {
  const { pesan } = await searchParams;
  const catatan = pesan ? PESAN_URL[pesan] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-soft"
          >
            <span className="material-symbols-outlined text-ikon text-primary">
              local_laundry_service
            </span>
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-primary">
            JoyOps
          </h1>
          <p className="mt-1 text-kecil text-ink-muted">
            Sistem operasional laundry
          </p>
        </div>

        <Kartu>
          <IsiKartu className="flex flex-col gap-4">
            {catatan ? <PesanHasil jenis="info">{catatan}</PesanHasil> : null}
            <FormMasuk />
          </IsiKartu>
        </Kartu>

        <section className="mt-4 rounded-md border border-line bg-surface px-4 py-3">
          <h2 className="font-display text-kecil font-bold text-ink">
            Lupa sandi
          </h2>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-kecil text-ink-muted">
            {BANTUAN_LUPA_SANDI.isi.map((baris) => (
              <li key={baris}>{baris}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-kecil">
            <Link href="/lupa-sandi" className="font-semibold text-primary">
              Ajukan lupa sandi
            </Link>
            <Link href="/register" className="font-semibold text-primary">
              Belum punya akun? Daftar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
