import { RangkaNavigasi } from "@/components/shell/RangkaNavigasi";
import { Kartu, IsiKartu } from "@/components/ui/Kartu";
import { KeadaanGagal } from "@/components/ui/Keadaan";
import { wajibMasuk } from "@/lib/auth";
import { buatKlienServer, sambunganSiap } from "@/lib/supabase/server";
import { ambilNotifikasi, jumlahBelumDibaca } from "@/models/notification.model";
import type { Notifikasi } from "@/types/db";

/**
 * Penjaga sesi untuk seluruh halaman dalam aplikasi, sekaligus tempat
 * notifikasi diambil sekali untuk bilah atas.
 *
 * `children` dirender langsung di sini sebagai saudara rangka navigasi, bukan
 * sebagai anak komponen klien. Lihat catatan di RangkaNavigasi.
 */

/*
 * Seluruh halaman di grup ini bergantung pada sesi pengguna, jadi wajib
 * dirender per permintaan. Tanpa ini, hasil build bergantung pada ada atau
 * tidaknya variabel lingkungan saat build, dan halaman bisa ikut ter-prerender
 * sebagai pengalihan ke halaman masuk.
 */
export const dynamic = "force-dynamic";

export default async function LayoutAplikasi({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Diperiksa sebelum menyentuh sesi, supaya pesan yang muncul adalah
     petunjuk penyiapan, bukan kegagalan tak terduga. */
  if (!sambunganSiap()) {
    return <LayarBelumSiap />;
  }

  const profil = await wajibMasuk();

  let notifikasi: Notifikasi[] = [];
  let jumlah = 0;

  try {
    const supabase = await buatKlienServer();
    const hasil = await Promise.all([
      ambilNotifikasi(supabase, 15),
      jumlahBelumDibaca(supabase),
    ]);
    notifikasi = hasil[0];
    jumlah = hasil[1];
  } catch (kesalahan) {
    console.error("[JoyOps] notifikasi gagal dimuat:", kesalahan);
  }

  return (
    <div className="min-h-screen">
      {/* Rangka navigasi disembunyikan saat mencetak, supaya struk bersih. */}
      <div className="print:hidden">
        <RangkaNavigasi
          nama={profil.full_name}
          peran={profil.role}
          username={profil.username}
          notifikasi={notifikasi}
          jumlahBelumDibaca={jumlah}
        />
      </div>

      <main className="pt-14 md:pl-60 print:p-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 print:max-w-none print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}

/** Ditampilkan saat variabel lingkungan Supabase belum diisi atau tidak terbaca. */
function LayarBelumSiap({
  pesan = "Aplikasi belum tersambung ke database. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di berkas .env.local, lalu jalankan ulang server.",
}: {
  pesan?: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10">
      <Kartu>
        <IsiKartu className="flex flex-col gap-4">
          <KeadaanGagal pesan={pesan} />
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-kecil text-ink-muted">
            <li>Jalankan berkas supabase/01_schema.sql di SQL Editor Supabase.</li>
            <li>Jalankan supabase/02_seed.sql untuk mengisi layanan, add-on, dan mesin.</li>
            <li>Salin .env.local.example menjadi .env.local, lalu isi tiga nilainya.</li>
            <li>Buat akun Admin dengan perintah npm run seed:akun.</li>
          </ol>
        </IsiKartu>
      </Kartu>
    </main>
  );
}
