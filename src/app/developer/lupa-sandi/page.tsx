import type { Metadata } from "next";
import Link from "next/link";
import { Kartu, IsiKartu } from "@/components/ui/Kartu";
import { FormLupaSandiDeveloper } from "./FormLupaSandi";
import { emailDeveloper } from "@/lib/developer";

export const metadata: Metadata = {
  title: "Lupa sandi developer",
  robots: { index: false, follow: false },
};

/** Permintaan tautan atur ulang sandi developer, dikirim lewat surel. */
export default function HalamanLupaSandiDeveloper() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-fg"
        >
          <span className="material-symbols-outlined text-[1.5rem]">
            lock_reset
          </span>
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-lg font-extrabold tracking-tight text-ink">
            Lupa sandi developer
          </h1>
          <p className="text-kecil text-ink-muted">
            Tautan atur ulang dikirim ke surel developer yang terdaftar.
          </p>
        </div>
      </div>

      <Kartu className="mt-5">
        <IsiKartu>
          <FormLupaSandiDeveloper emailAwal={emailDeveloper()} />
        </IsiKartu>
      </Kartu>

      <p className="mt-4 text-center text-kecil text-ink-muted">
        Ingat sandinya?{" "}
        <Link href="/developer" className="font-semibold text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
