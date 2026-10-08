import type { Metadata } from "next";
import { FormGantiSandi, FormProfil } from "@/components/settings/FormProfil";
import { Kartu, IsiKartu, JudulHalaman, KepalaKartu } from "@/components/ui/Kartu";
import { Chip } from "@/components/ui/Lencana";
import { SakelarTema } from "@/components/ui/SakelarTema";
import { wajibMasuk } from "@/lib/auth";
import { BANTUAN_LUPA_SANDI } from "@/lib/constants";
import { tanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function HalamanPengaturan() {
  const profil = await wajibMasuk();

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul="Pengaturan"
        keterangan="Ubah nama tampilan, ganti sandi, dan pilih tema. Peran hanya bisa diubah Admin lewat menu Karyawan."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Kartu>
          <KepalaKartu judul="Profil saya" ikon="person" />
          <IsiKartu className="flex flex-col gap-4">
            <dl className="grid grid-cols-1 gap-2 text-kecil sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Username</dt>
                <dd className="angka font-semibold text-ink">@{profil.username}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Peran</dt>
                <dd className="font-semibold text-ink">{profil.role}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Terdaftar sejak</dt>
                <dd className="angka font-semibold text-ink">{tanggal(profil.created_at)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Status akun</dt>
                <dd className="font-semibold text-ink">
                  {profil.is_active ? "Aktif" : "Nonaktif"}
                </dd>
              </div>
            </dl>

            <div className="border-t border-line pt-4">
              <FormProfil nama={profil.full_name} />
            </div>
          </IsiKartu>
        </Kartu>

        <Kartu>
          <KepalaKartu
            judul="Ganti sandi"
            ikon="key"
            keterangan="Sandi lama tidak diminta karena sesi Anda sudah sah"
          />
          <IsiKartu>
            <FormGantiSandi />
          </IsiKartu>
        </Kartu>
      </div>

      <Kartu>
        <KepalaKartu judul="Tampilan" ikon="palette" />
        <IsiKartu className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-kecil font-semibold text-ink">Tema terang atau gelap</p>
            <p className="mt-0.5 text-kecil text-ink-muted">
              Terang jadi bawaan karena kasir bekerja di ruang terang dan laporan sering dicetak.
              Pilihan Anda disimpan di perangkat ini.
            </p>
          </div>
          <SakelarTema />
        </IsiKartu>
      </Kartu>

      <Kartu>
        <KepalaKartu judul="Bila lupa sandi" ikon="help" />
        <IsiKartu>
          <ul className="flex flex-col gap-2 text-kecil text-ink-muted">
            {BANTUAN_LUPA_SANDI.isi.map((baris) => (
              <li key={baris} className="flex items-start gap-2">
                <span aria-hidden="true" className="material-symbols-outlined text-[1.1em]">
                  arrow_right
                </span>
                <span>{baris}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-kecil text-ink-muted">
            <Chip>Catatan</Chip>
            <span>
              Ganti sandi bawaan dari Admin segera setelah Anda masuk pertama kali.
            </span>
          </p>
        </IsiKartu>
      </Kartu>
    </div>
  );
}
