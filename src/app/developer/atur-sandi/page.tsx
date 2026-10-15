import type { Metadata } from "next";
import Link from "next/link";
import { Kartu, IsiKartu } from "@/components/ui/Kartu";
import { PesanHasil } from "@/components/ui/Keadaan";
import { FormAturSandiDeveloper } from "./FormAturSandi";

export const metadata: Metadata = {
  title: "Atur ulang sandi developer",
  robots: { index: false, follow: false },
};

/** Halaman tujuan tautan atur ulang sandi yang dikirim ke surel developer. */
export default async function HalamanAturSandiDeveloper({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-fg"
        >
          <span className="material-symbols-outlined text-[1.5rem]">
            password
          </span>
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-lg font-extrabold tracking-tight text-ink">
            Atur ulang sandi developer
          </h1>
          <p className="text-kecil text-ink-muted">
            Tautan ini sekali pakai dan berlaku 30 menit sejak dikirim.
          </p>
        </div>
      </div>

      <Kartu className="mt-5">
        <IsiKartu>
          {token ? (
            <FormAturSandiDeveloper token={token} />
          ) : (
            <PesanHasil jenis="gagal">
              Tautan tidak lengkap. Buka tautan persis seperti yang dikirim ke
              surel, atau{" "}
              <Link
                href="/developer/lupa-sandi"
                className="font-semibold underline"
              >
                minta tautan baru
              </Link>
              .
            </PesanHasil>
          )}
        </IsiKartu>
      </Kartu>
    </div>
  );
}
