import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Kartu,
  KepalaKartu,
  IsiKartu,
  JudulHalaman,
} from "@/components/ui/Kartu";
import { KeadaanKosong } from "@/components/ui/Keadaan";
import { apakahAdminTersedia } from "@/lib/supabase/admin";
import { akunDeveloperSiap } from "@/lib/developer";
import { muatDaftarAkunDeveloper } from "@/controllers/developer.controller";
import { BarisAkun } from "./BarisAkun";

export const metadata: Metadata = {
  title: "Kelola akun",
  robots: { index: false, follow: false },
};

const TANGGAL = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

/**
 * Daftar seluruh akun di basis data, khusus mode developer.
 *
 * Halaman ini sengaja terpisah dari kotak masuk developer supaya beban
 * kerjanya jelas: di sana menangani permintaan pendaftaran dan lupa sandi,
 * di sini mengatur akun yang sudah ada.
 */
export default async function HalamanKelolaAkun() {
  if (!(await akunDeveloperSiap())) redirect("/developer");
  if (!apakahAdminTersedia()) redirect("/developer");

  const { akun, jumlahAdmin } = await muatDaftarAkunDeveloper();

  const jumlahAktif = akun.filter((a) => a.aktif).length;

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <JudulHalaman
            judul="Kelola akun"
            keterangan="Ubah nama, peran, status aktif, dan sandi setiap akun yang terdaftar."
          />
          <a
            href="/developer"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:bg-hov"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              arrow_back
            </span>
            Kotak masuk
          </a>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Ringkasan label="Total akun" nilai={String(akun.length)} ikon="group" />
          <Ringkasan label="Akun aktif" nilai={String(jumlahAktif)} ikon="how_to_reg" />
          <Ringkasan
            label="Admin aktif"
            nilai={String(jumlahAdmin)}
            ikon="shield_person"
            catatan={jumlahAdmin <= 1 ? "Minimal satu wajib ada" : undefined}
          />
        </div>

        <div className="mt-6">
          <Kartu>
            <KepalaKartu
              judul="Daftar akun"
              ikon="group"
              keterangan="Developer boleh mengatur semua peran, termasuk sesama Admin."
            />
            <IsiKartu>
              {akun.length === 0 ? (
                <KeadaanKosong
                  ikon="group_off"
                  judul="Belum ada akun"
                  keterangan="Akun muncul di sini setelah seseorang mendaftar."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {akun.map((satu) => (
                    <BarisAkun
                      key={satu.id}
                      akun={satu}
                      adminTerakhir={satu.peran === "Admin" && jumlahAdmin <= 1}
                      tanggal={TANGGAL.format(new Date(satu.dibuat))}
                    />
                  ))}
                </ul>
              )}
            </IsiKartu>
          </Kartu>
        </div>

        <p className="mt-6 flex items-start gap-2 rounded-sm border border-line bg-paper px-4 py-3 text-kecil text-ink-muted">
          <span aria-hidden="true" className="material-symbols-outlined text-lg">
            info
          </span>
          <span>
            Batas hierarki hanya berlaku untuk Admin di dalam aplikasi. Sebagai
            developer, Anda tidak dibatasi hierarki itu.
          </span>
        </p>
      </div>
    </div>
  );
}

function Ringkasan({
  label,
  nilai,
  ikon,
  catatan,
}: {
  label: string;
  nilai: string;
  ikon: string;
  catatan?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-line bg-paper px-4 py-3">
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-2xl text-primary"
      >
        {ikon}
      </span>
      <div className="min-w-0">
        <p className="text-kecil text-ink-muted">{label}</p>
        <p className="text-lg font-semibold text-ink">{nilai}</p>
        {catatan ? (
          <p className="text-mini text-danger">{catatan}</p>
        ) : null}
      </div>
    </div>
  );
}
