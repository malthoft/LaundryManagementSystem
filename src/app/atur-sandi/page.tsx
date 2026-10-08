import type { Metadata } from "next";
import Link from "next/link";
import { PesanHasil } from "@/components/ui/Keadaan";
import { FormAturSandi } from "./FormAturSandi";

export const metadata: Metadata = {
  title: "Penggantian sandi",
  robots: { index: false },
};

/** Halaman tujuan tautan reset yang diterbitkan developer. */
export default async function HalamanAturSandi({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-3.25rem)] items-center justify-center bg-bg px-4 py-8">
      <main className="w-full max-w-sm rounded-md border border-line bg-surface p-5 shadow-1">
        <h1 className="font-display text-lg text-ink">Penggantian sandi</h1>
        <p className="mt-1 text-kecil text-ink-muted">
          Tautan ini sekali pakai dan berlaku 30 menit sejak diterbitkan.
        </p>

        <div className="mt-5">
          {token ? (
            <FormAturSandi token={token} />
          ) : (
            <PesanHasil jenis="gagal">
              Tautan tidak lengkap. Buka tautan persis seperti yang dikirim
              developer, atau{" "}
              <Link href="/lupa-sandi" className="text-primary hover:underline">
                ajukan lupa sandi kembali
              </Link>
              .
            </PesanHasil>
          )}
        </div>
      </main>
    </div>
  );
}
