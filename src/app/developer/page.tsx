import type { Metadata } from "next";
import {
  Kartu,
  KepalaKartu,
  IsiKartu,
  JudulHalaman,
} from "@/components/ui/Kartu";
import { KeadaanKosong, PesanHasil } from "@/components/ui/Keadaan";
import { Tombol } from "@/components/ui/Tombol";
import {
  muatHalamanDeveloper,
  keluarDeveloperAction,
  type IsiHalamanDeveloper,
} from "@/controllers/developer.controller";
import {
  akunDeveloperSiap,
  emailDeveloper,
  PESAN_SANDI_BELUM_DIATUR,
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

const JENIS_IKON: Record<string, string> = {
  Pendaftaran: "person_add",
  "Lupa Sandi": "lock_reset",
};

const TANGGAL = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const ringkas = (nilai: string | null) =>
  nilai ? TANGGAL.format(new Date(nilai)) : "-";

/**
 * Kotak masuk developer. Pintunya email dan sandi developer yang diperiksa di
 * server, lalu muncul sebagai cookie sesi bertanda tangan. Tiga lapis
 * pemeriksaan: halaman ini, setiap server action, lalu fungsi
 * `putuskan_permintaan` di basis data.
 */
export default async function HalamanDeveloper() {
  if (!akunDeveloperSiap()) return <Pintu pesan={PESAN_SANDI_BELUM_DIATUR} />;
  if (!apakahAdminTersedia()) return <Pintu pesan={PESAN_TANPA_KUNCI_ADMIN} />;

  const isi: IsiHalamanDeveloper | null = await muatHalamanDeveloper();
  if (!isi) return <Gerbang />;

  const menunggu = isi.daftar.filter((m) => m.status === "Menunggu");
  const riwayat = isi.daftar.filter((m) => m.status !== "Menunggu");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-fg"
          >
            <span className="material-symbols-outlined text-[1.5rem]">
              terminal
            </span>
          </span>
          <JudulHalaman
            judul="Kotak masuk developer"
            keterangan="Permintaan akun yang menunggu keputusan, lalu riwayatnya."
          />
        </div>

        <form action={keluarDeveloperAction}>
          <Tombol type="submit" varian="sekunder" ukuran="kecil" ikon="logout">
            Keluar
          </Tombol>
        </form>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Angka
          label="Menunggu"
          nilai={menunggu.length}
          ikon="hourglass_top"
          nada="primary"
        />
        <Angka
          label="Disetujui"
          nilai={isi.ringkasan?.Disetujui ?? 0}
          ikon="check_circle"
          nada="ok"
        />
        <Angka
          label="Ditolak"
          nilai={isi.ringkasan?.Ditolak ?? 0}
          ikon="cancel"
          nada="danger"
        />
      </section>

      <TautanResetAktif />

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sedang font-bold text-ink">
            Menunggu keputusan
          </h2>
          {menunggu.length > 0 ? (
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-kecil font-semibold text-primary">
              {menunggu.length} permintaan
            </span>
          ) : null}
        </div>

        {menunggu.length === 0 ? (
          <div className="mt-3 rounded-md border border-line bg-surface">
            <KeadaanKosong
              ikon="inbox"
              judul="Tidak ada yang menunggu"
              keterangan="Semua permintaan sudah diputuskan. Kotak masuk ini akan terisi sendiri saat ada pengajuan baru."
            />
          </div>
        ) : (
          <ul className="mt-3 grid gap-4">
            {menunggu.map((m) => (
              <li key={m.id}>
                <Kartu>
                  <KepalaKartu
                    judul={JENIS_LABEL[m.jenis] ?? m.jenis}
                    ikon={JENIS_IKON[m.jenis] ?? "inbox"}
                    aksi={<Lencana status="Menunggu" />}
                  />
                  <IsiKartu className="grid gap-4">
                    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
                      <Baris label="Nama pengguna" nilai={m.username} />
                      <Baris label="Nama lengkap" nilai={m.full_name ?? "-"} />
                      <Baris label="Diajukan" nilai={ringkas(m.dibuat_pada)} />
                    </dl>

                    <div className="border-t border-line pt-4">
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
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sedang font-bold text-ink">
              Riwayat
            </h2>
            {riwayat.length > 0 ? (
              <span className="rounded-full bg-paper px-2.5 py-0.5 text-kecil font-semibold text-ink-muted">
                {riwayat.length}
              </span>
            ) : null}
          </div>
          {riwayat.length > 0 ? <HapusRiwayat id="semua" semua /> : null}
        </div>

        {riwayat.length === 0 ? (
          <div className="mt-3 rounded-md border border-line bg-surface">
            <KeadaanKosong
              ikon="history"
              judul="Riwayat masih kosong"
              keterangan="Setiap keputusan yang sudah diambil akan tercatat di sini."
            />
          </div>
        ) : (
          <ul className="mt-3 grid gap-2.5">
            {riwayat.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-line bg-surface p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-kecil font-semibold text-ink">
                      {JENIS_LABEL[m.jenis] ?? m.jenis}
                    </span>
                    <Lencana status={m.status} />
                  </div>
                  <p className="mt-1.5 truncate text-kecil text-ink-muted">
                    <span className="font-semibold text-ink">{m.username}</span>
                    {m.full_name ? <> · {m.full_name}</> : null}
                  </p>
                  <p className="mt-0.5 text-mikro text-ink-muted">
                    Diputuskan {ringkas(m.diputuskan_pada)}
                  </p>
                </div>

                <HapusRiwayat id={m.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8">
        <PesanHasil jenis="info">
          Menyetujui permintaan lupa sandi menerbitkan tautan atur ulang sekali
          pakai yang berlaku 30 menit.
        </PesanHasil>
      </div>
    </main>
  );
}

function Angka({
  label,
  nilai,
  ikon,
  nada,
}: {
  label: string;
  nilai: number;
  ikon: string;
  nada: "primary" | "ok" | "danger";
}) {
  const warna = {
    primary: "bg-primary-soft text-primary",
    ok: "bg-ok-soft text-ok",
    danger: "bg-danger-soft text-danger",
  }[nada];

  return (
    <Kartu>
      <IsiKartu className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${warna}`}
        >
          <span className="material-symbols-outlined text-[1.35rem]">
            {ikon}
          </span>
        </span>
        <div className="min-w-0">
          <p className="text-kecil font-medium text-ink-muted">{label}</p>
          <p className="angka font-display text-xl font-extrabold text-ink">
            {nilai}
          </p>
        </div>
      </IsiKartu>
    </Kartu>
  );
}

function Lencana({ status }: { status: string }) {
  const gaya =
    status === "Disetujui"
      ? "bg-ok-soft text-ok"
      : status === "Ditolak"
        ? "bg-danger-soft text-danger"
        : "bg-primary-soft text-primary";

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-mikro font-bold uppercase tracking-wide ${gaya}`}
    >
      {status}
    </span>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-mikro font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-kecil font-medium text-ink">
        {nilai}
      </dd>
    </div>
  );
}

/** Layar masuk saat sesi belum ada atau sudah kedaluwarsa. */
function Gerbang() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-fg"
        >
          <span className="material-symbols-outlined text-[1.5rem]">
            terminal
          </span>
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-lg font-extrabold tracking-tight text-ink">
            Halaman developer
          </h1>
          <p className="text-kecil text-ink-muted">
            Masuk untuk memutuskan permintaan akun.
          </p>
        </div>
      </div>

      <Kartu className="mt-5">
        <IsiKartu>
          <FormKunci emailAwal={emailDeveloper()} />
        </IsiKartu>
      </Kartu>

      <p className="mt-4 text-center text-mikro text-ink-muted">
        Halaman ini tidak muncul di menu mana pun dan tidak memakai akun masuk
        biasa.
      </p>
    </main>
  );
}

/** Layar saat penyiapan berkas lingkungan belum lengkap. */
function Pintu({ pesan }: { pesan: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10">
      <Kartu>
        <KepalaKartu judul="Halaman developer" ikon="settings" />
        <IsiKartu>
          <PesanHasil jenis="gagal">{pesan}</PesanHasil>
          <p className="mt-3 text-kecil text-ink-muted">
            Halaman ini tidak muncul di menu mana pun dan tidak memakai akun
            masuk biasa.
          </p>
        </IsiKartu>
      </Kartu>
    </main>
  );
}
