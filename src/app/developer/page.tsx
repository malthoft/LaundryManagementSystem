import type { Metadata } from "next";
import {
  Kartu,
  KepalaKartu,
  IsiKartu,
  JudulHalaman,
} from "@/components/ui/Kartu";
import { KeadaanKosong, PesanHasil } from "@/components/ui/Keadaan";
import {
  muatHalamanDeveloper,
  keluarDeveloperAction,
  type IsiHalamanDeveloper,
} from "@/controllers/developer.controller";
import {
  kunciDeveloper,
  PESAN_TANPA_KUNCI,
  PESAN_TANPA_KUNCI_ADMIN,
} from "@/lib/developer";
import { apakahAdminTersedia } from "@/lib/supabase/admin";
import { FormKunci } from "./FormKunci";
import { AksiPermintaan } from "./AksiPermintaan";
import { HapusRiwayat } from "./HapusRiwayat";
import { TautanResetAktif } from "./TautanResetAktif";

export const metadata: Metadata = {
  title: "Kotak masuk developer",
  robots: { index: false, follow: false },
};

const JENIS_LABEL: Record<string, string> = {
  Pendaftaran: "Pendaftaran akun",
  "Lupa Sandi": "Lupa sandi",
};

const TANGGAL = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const ringkas = (nilai: string | null) =>
  nilai ? TANGGAL.format(new Date(nilai)) : "-";

/**
 * Kotak masuk developer. Pintunya kunci rahasia yang dibandingkan di server,
 * lalu muncul sebagai cookie hanya-HTTP. Tiga lapis pemeriksaan: halaman ini,
 * setiap server action, lalu fungsi `putuskan_permintaan` di basis data.
 */
export default async function HalamanDeveloper() {
  if (!kunciDeveloper()) return <Pintu pesan={PESAN_TANPA_KUNCI} />;
  if (!apakahAdminTersedia()) return <Pintu pesan={PESAN_TANPA_KUNCI_ADMIN} />;

  const isi: IsiHalamanDeveloper | null = await muatHalamanDeveloper();
  if (!isi) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <FormKunci />
      </main>
    );
  }

  const menunggu = isi.daftar.filter((m) => m.status === "Menunggu");
  const riwayat = isi.daftar.filter((m) => m.status !== "Menunggu");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <JudulHalaman
          judul="Kotak masuk developer"
          keterangan="Permintaan yang menunggu keputusan, lalu riwayatnya."
        />
        <form action={keluarDeveloperAction}>
          <button
            type="submit"
            className="rounded-md border border-line px-3 py-2 font-mono text-kecil text-muted hover:bg-hov"
          >
            Keluar
          </button>
        </form>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Angka label="Menunggu" nilai={menunggu.length} warna="text-aksen" />
        <Angka
          label="Disetujui"
          nilai={isi.ringkasan?.Disetujui ?? 0}
          warna="text-ok"
        />
        <Angka
          label="Ditolak"
          nilai={isi.ringkasan?.Ditolak ?? 0}
          warna="text-dang"
        />
      </section>

      <TautanResetAktif />

      <section className="mt-8">
        <h2 className="font-display text-[1.15rem] font-bold text-ink">
          Menunggu keputusan
        </h2>
        {menunggu.length === 0 ? (
          <div className="mt-3">
            <KeadaanKosong
              judul="Tidak ada yang menunggu"
              keterangan="Semua permintaan sudah diputuskan."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-4">
            {menunggu.map((m) => (
              <li key={m.id}>
                <Kartu>
                  <KepalaKartu
                    judul={JENIS_LABEL[m.jenis] ?? m.jenis}
                    aksi={
                      <span className="rounded-full bg-aksen/12 px-2.5 py-1 font-mono text-kecil font-bold text-aksen">
                        Menunggu
                      </span>
                    }
                  />
                  <IsiKartu>
                    <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                      <Baris label="Nama pengguna" nilai={m.username} />
                      <Baris
                        label="Nama lengkap"
                        nilai={m.full_name ?? "-"}
                      />
                      <Baris label="Masuk" nilai={ringkas(m.dibuat_pada)} />
                    </dl>
                    <div className="mt-4 border-t border-line pt-4">
                      <AksiPermintaan id={m.id} />
                    </div>
                  </IsiKartu>
                </Kartu>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[1.15rem] font-bold text-ink">
            Riwayat
          </h2>
          {riwayat.length > 0 ? <HapusRiwayat id="semua" semua /> : null}
        </div>

        {riwayat.length === 0 ? (
          <div className="mt-3">
            <KeadaanKosong
              judul="Riwayat masih kosong"
              keterangan="Keputusan yang sudah diambil akan tercatat di sini."
            />
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-hov">
                  <th className="px-3 py-2 font-mono text-kecil uppercase tracking-wider text-muted">
                    Keperluan
                  </th>
                  <th className="px-3 py-2 font-mono text-kecil uppercase tracking-wider text-muted">
                    Nama pengguna
                  </th>
                  <th className="px-3 py-2 font-mono text-kecil uppercase tracking-wider text-muted">
                    Keputusan
                  </th>
                  <th className="px-3 py-2 font-mono text-kecil uppercase tracking-wider text-muted">
                    Diputuskan
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {riwayat.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 font-mono text-badan text-ink">
                      {JENIS_LABEL[m.jenis] ?? m.jenis}
                    </td>
                    <td className="px-3 py-2 font-mono text-badan text-ink">
                      {m.username}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-kecil font-bold ${
                          m.status === "Disetujui"
                            ? "bg-ok/12 text-ok"
                            : "bg-dang/12 text-dang"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-kecil text-muted">
                      {ringkas(m.diputuskan_pada)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <HapusRiwayat id={m.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-8">
        <PesanHasil jenis="info">
          Menyetujui permintaan lupa sandi menerbitkan tautan reset sekali pakai
          yang berlaku 30 menit.
        </PesanHasil>
      </div>
    </main>
  );
}

function Angka({
  label,
  nilai,
  warna,
}: {
  label: string;
  nilai: number;
  warna: string;
}) {
  return (
    <Kartu>
      <IsiKartu>
        <p className="font-mono text-kecil uppercase tracking-wider text-muted">
          {label}
        </p>
        <p className={`mt-1 font-mono text-[1.75rem] font-bold tabular-nums ${warna}`}>
          {nilai}
        </p>
      </IsiKartu>
    </Kartu>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div>
      <dt className="font-mono text-kecil uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="font-mono text-badan text-ink">{nilai}</dd>
    </div>
  );
}

function Pintu({ pesan }: { pesan: string }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <Kartu>
        <KepalaKartu judul="Halaman developer" />
        <IsiKartu>
          <PesanHasil jenis="gagal">{pesan}</PesanHasil>
          <p className="mt-3 font-mono text-kecil text-muted">
            Halaman ini tidak muncul di menu mana pun dan tidak memakai akun
            masuk biasa.
          </p>
        </IsiKartu>
      </Kartu>
    </main>
  );
}

