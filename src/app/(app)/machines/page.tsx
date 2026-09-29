import type { Metadata } from "next";
import { FormMesin } from "@/components/machines/FormMesin";
import { KartuMesin } from "@/components/machines/KartuMesin";
import { RingkasanMesin } from "@/components/dashboard/RingkasanMesin";
import { Kartu, JudulHalaman, KepalaKartu } from "@/components/ui/Kartu";
import { KeadaanKosong } from "@/components/ui/Keadaan";
import { wajibMasuk } from "@/lib/auth";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilRingkasanMesin, ambilSemuaMesin } from "@/models/machine.model";
import type { Mesin } from "@/types/db";

export const metadata: Metadata = { title: "Mesin" };

export default async function HalamanMesin() {
  const profil = await wajibMasuk();
  const admin = profil.role === "Admin";

  const supabase = await buatKlienServer();
  const [daftar, ringkasan] = await Promise.all([
    ambilSemuaMesin(supabase),
    ambilRingkasanMesin(supabase),
  ]);

  const cuci = daftar.filter((item) => item.machine_code.startsWith("WM-"));
  const pengering = daftar.filter((item) => item.machine_code.startsWith("DM-"));

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul="Mesin"
        keterangan={
          admin
            ? "Tambah, ubah status, dan hapus mesin. Status menentukan mesin bisa dipilih saat membuat order."
            : "Pantau mesin mana yang tersedia sebelum membuat order."
        }
      />

      <RingkasanMesin ringkasan={ringkasan} />

      {daftar.length === 0 ? (
        <Kartu>
          <KeadaanKosong
            ikon="local_laundry_service"
            judul="Belum ada mesin"
            keterangan="Tambahkan minimal satu mesin cuci dan satu mesin pengering supaya order bisa dibuat."
            aksi={admin ? <FormMesin label="Tambah mesin" /> : undefined}
          />
        </Kartu>
      ) : (
        <>
          <KelompokMesin
            judul="Mesin cuci"
            ikon="local_laundry_service"
            daftar={cuci}
            admin={admin}
          />
          <KelompokMesin
            judul="Mesin pengering"
            ikon="dry_cleaning"
            daftar={pengering}
            admin={admin}
          />
        </>
      )}
    </div>
  );
}

function KelompokMesin({
  judul,
  ikon,
  daftar,
  admin,
}: {
  judul: string;
  ikon: string;
  daftar: Mesin[];
  admin: boolean;
}) {
  return (
    <Kartu>
      <KepalaKartu
        judul={judul}
        ikon={ikon}
        keterangan={`${daftar.length} unit`}
        aksi={admin ? <FormMesin label="Tambah mesin" /> : undefined}
      />
      {daftar.length === 0 ? (
        <KeadaanKosong
          ikon={ikon}
          judul={`Belum ada ${judul.toLowerCase()}`}
          keterangan="Mesin yang ditambahkan akan muncul di sini."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {daftar.map((mesin) => (
            <KartuMesin key={mesin.id} mesin={mesin} admin={admin} />
          ))}
        </ul>
      )}
    </Kartu>
  );
}
