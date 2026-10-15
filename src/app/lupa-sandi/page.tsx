import type { Metadata } from "next";
import Link from "next/link";
import { Kartu, IsiKartu } from "@/components/ui/Kartu";
import { FormLupaSandi } from "./FormLupaSandi";

export const metadata: Metadata = {
  title: "Lupa sandi",
};

/** Permintaan pengaturan ulang sandi, melewati verifikasi developer. */
export default function HalamanLupaSandi() {
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
            Lupa sandi
          </h1>
          <p className="text-kecil text-ink-muted">
            Permintaan Anda diverifikasi developer sebelum tautan reset
            diterbitkan.
          </p>
        </div>
      </div>

      <Kartu className="mt-5">
        <IsiKartu>
          <FormLupaSandi />
        </IsiKartu>
      </Kartu>

      <p className="mt-4 text-center text-kecil text-ink-muted">
        Ingat sandinya?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
