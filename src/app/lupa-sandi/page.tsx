import type { Metadata } from "next";
import Link from "next/link";
import { FormLupaSandi } from "./FormLupaSandi";

export const metadata: Metadata = {
  title: "Lupa sandi",
};

/** Permintaan pengaturan ulang sandi, melewati verifikasi developer. */
export default function HalamanLupaSandi() {
  return (
    <div className="flex min-h-[calc(100vh-3.25rem)] items-center justify-center bg-bg px-4 py-8">
      <main className="w-full max-w-sm rounded-md border border-line bg-surface p-5 shadow-1">
        <h1 className="font-display text-lg text-ink">Lupa sandi</h1>
        <p className="mt-1 text-kecil text-ink-muted">
          Permintaan Anda akan diverifikasi developer sebelum tautan reset
          diterbitkan.
        </p>

        <div className="mt-5">
          <FormLupaSandi />
        </div>

        <p className="mt-4 text-kecil text-ink-muted">
          Ingat sandinya?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </main>
    </div>
  );
}
