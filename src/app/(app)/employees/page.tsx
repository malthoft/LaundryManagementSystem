import type { Metadata } from "next";
import {
  FormKaryawanBaru,
  FormResetSandi,
  FormUbahKaryawan,
} from "@/components/employees/FormKaryawan";
import { Kartu, IsiKartu, JudulHalaman, KepalaKartu } from "@/components/ui/Kartu";
import { Lencana } from "@/components/ui/Lencana";
import { KeadaanKosong, PesanHasil } from "@/components/ui/Keadaan";
import { BarisTabel, KepalaTabel, SelTabel, Tabel } from "@/components/ui/Tabel";
import { apakahAdminTersedia } from "@/lib/supabase/admin";
import { wajibMasuk } from "@/lib/auth";
import { NADA_AKTIF } from "@/lib/constants";
import { tanggal } from "@/lib/format";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSemuaProfil, hitungAdminAktif } from "@/models/profile.model";

export const metadata: Metadata = { title: "Karyawan" };

export default async function HalamanKaryawan() {
  const profil = await wajibMasuk();

  if (profil.role !== "Admin") {
    return (
      <div className="flex flex-col gap-5">
        <JudulHalaman judul="Karyawan" />
        <Kartu>
          <PesanHasil jenis="info">
            Data karyawan hanya bisa dibuka Admin. Hubungi Admin bila ada data yang perlu diubah.
          </PesanHasil>
        </Kartu>
      </div>
    );
  }

  const supabase = await buatKlienServer();
  const [daftar, jumlahAdmin] = await Promise.all([
    ambilSemuaProfil(supabase),
    hitungAdminAktif(supabase),
  ]);

  const siapKelola = apakahAdminTersedia();

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul="Karyawan"
        keterangan={`${daftar.length} akun terdaftar. Menambah karyawan dan mereset sandi butuh kunci layanan Supabase.`}
      />

      {!siapKelola ? (
        <Kartu>
          <IsiKartu>
            <PesanHasil jenis="gagal">
              Kunci layanan Supabase belum diisi di server. Tanpa itu, menambah karyawan dan
              mereset sandi tidak bisa dipakai. Isi SUPABASE_SERVICE_ROLE_KEY lalu muat ulang.
            </PesanHasil>
          </IsiKartu>
        </Kartu>
      ) : null}

      <Kartu>
        <KepalaKartu
          judul="Daftar akun"
          ikon="group"
          keterangan={`${jumlahAdmin} Admin aktif`}
          aksi={siapKelola ? <FormKaryawanBaru jumlahAdmin={jumlahAdmin} /> : undefined}
        />
        {daftar.length === 0 ? (
          <KeadaanKosong
            ikon="group"
            judul="Belum ada akun"
            keterangan="Jalankan skrip pembuatan akun untuk membuat Admin pertama."
          />
        ) : (
          <Tabel minWidth="52rem">
            <KepalaTabel
              kolom={[
                { label: "Nama" },
                { label: "Username" },
                { label: "Peran" },
                { label: "Status" },
                { label: "Terdaftar" },
                { label: "Aksi" },
              ]}
            />
            <tbody>
              {daftar.map((orang) => (
                <BarisTabel key={orang.id}>
                  <SelTabel className="font-semibold">
                    {orang.full_name}
                    {orang.id === profil.id ? (
                      <span className="ml-2 text-mini font-medium text-ink-muted">
                        (Anda)
                      </span>
                    ) : null}
                  </SelTabel>
                  <SelTabel className="angka">@{orang.username}</SelTabel>
                  <SelTabel>
                    <Lencana
                      nada={
                        orang.role === "Admin"
                          ? { soft: "bg-primary-soft", kuat: "text-primary", ikon: "shield_person" }
                          : { soft: "bg-accent", kuat: "text-ink", ikon: "badge" }
                      }
                      ikon
                    >
                      {orang.role}
                    </Lencana>
                  </SelTabel>
                  <SelTabel>
                    <Lencana
                      nada={NADA_AKTIF[orang.is_active ? "aktif" : "nonaktif"]}
                      ikon
                    >
                      {orang.is_active ? "Aktif" : "Nonaktif"}
                    </Lencana>
                  </SelTabel>
                  <SelTabel className="angka">{tanggal(orang.created_at)}</SelTabel>
                  <SelTabel>
                    {siapKelola ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <FormUbahKaryawan karyawan={orang} />
                        <FormResetSandi karyawan={orang} />
                      </div>
                    ) : (
                      <span className="text-kecil text-ink-muted">Tidak tersedia</span>
                    )}
                  </SelTabel>
                </BarisTabel>
              ))}
            </tbody>
          </Tabel>
        )}
        <div className="border-t border-line px-4 py-3">
          <p className="text-kecil text-ink-muted">
            Karyawan yang dinonaktifkan tidak bisa masuk, tetapi seluruh riwayat order, absensi,
            dan shift-nya tetap tersimpan. Akun tidak pernah dihapus supaya laporan lama tetap
            utuh.
          </p>
        </div>
      </Kartu>

      <Kartu>
        <KepalaKartu judul="Catatan keamanan" ikon="shield" />
        <IsiKartu className="flex flex-col gap-2 text-kecil text-ink-muted">
          <p>
            Sandi tidak pernah ditampilkan lagi setelah dibuat. Bila karyawan lupa, gunakan Reset
            sandi.
          </p>
          <p>
            Minimal satu Admin aktif harus selalu ada. Menonaktifkan Admin terakhir akan membuat
            sistem tidak bisa dikelola.
          </p>
          <p>
            Karyawan tidak bisa membaca buku kas. Pembatasan itu dipasang di database (RLS), bukan
            hanya disembunyikan di tampilan.
          </p>
        </IsiKartu>
      </Kartu>
    </div>
  );
}
