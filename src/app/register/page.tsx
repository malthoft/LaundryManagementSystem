import type { Metadata } from "next";
import Link from "next/link";
import { FormDaftar } from "./FormDaftar";

export const metadata: Metadata = {
  title: "Daftar akun Admin",
};

/** Pendaftaran akun Admin. Hasilnya menunggu persetujuan developer. */
export default function HalamanDaftar() {
  return (
    <div className="flex min-h-[calc(100vh-3.25rem)] items-center justify-center bg-bg px-4 py-8">
      <main className="w-full max-w-sm rounded-md border border-line bg-surface p-5 shadow-1">
        <h1 className="font-display text-lg text-ink">Daftar akun Admin</h1>
        <p className="mt-1 text-kecil text-ink-muted">
          Pendaftaran dikirim ke developer untuk diverifikasi sebelum bisa dipakai.
        </p>

        <div className="mt-5">
          <FormDaftar />
        </div>

        <p className="mt-4 text-kecil text-ink-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </main>
    </div>
  );
}
