import type { Metadata } from "next";
import { FormAddon } from "@/components/services/FormAddon";
import { FormLayanan } from "@/components/services/FormLayanan";
import { Kartu, JudulHalaman, KepalaKartu } from "@/components/ui/Kartu";
import { Konfirmasi } from "@/components/ui/Konfirmasi";
import { Chip, Lencana } from "@/components/ui/Lencana";
import { KeadaanKosong } from "@/components/ui/Keadaan";
import { BarisTabel, KepalaTabel, SelTabel, Tabel } from "@/components/ui/Tabel";
import { hapusAddonAction, hapusLayananAction } from "@/controllers/service.controller";
import { wajibMasuk } from "@/lib/auth";
import { NADA_AKTIF } from "@/lib/constants";
import { durasi, rupiah } from "@/lib/format";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSemuaAddon } from "@/models/addon.model";
import { ambilSemuaLayanan } from "@/models/service.model";

export const metadata: Metadata = { title: "Layanan & Add-on" };

export default async function HalamanLayanan() {
  const profil = await wajibMasuk();
  const admin = profil.role === "Admin";

  const supabase = await buatKlienServer();
  const [layanan, addon] = await Promise.all([
    ambilSemuaLayanan(supabase),
    ambilSemuaAddon(supabase),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <JudulHalaman
        judul="Layanan & Add-on"
        keterangan={
          admin
            ? "Harga dan durasi di sini yang dipakai saat menghitung total order."
            : "Daftar harga layanan dan add-on yang berlaku."
        }
      />

      <Kartu>
        <KepalaKartu
          judul="Layanan"
          ikon="payments"
          keterangan={`${layanan.length} layanan`}
          aksi={admin ? <FormLayanan label="Tambah layanan" /> : undefined}
        />
        {layanan.length === 0 ? (
          <KeadaanKosong
            ikon="payments"
            judul="Belum ada layanan"
            keterangan="Tanpa layanan, order tidak bisa dibuat karena harga belum ada."
            aksi={admin ? <FormLayanan label="Tambah layanan" /> : undefined}
          />
        ) : (
          <Tabel minWidth="46rem">
            <KepalaTabel
              kolom={[
                { label: "Layanan" },
                { label: "Harga", num: true },
                { label: "Satuan" },
                { label: "Durasi" },
                { label: "Status" },
                { label: "Aksi" },
              ]}
            />
            <tbody>
              {layanan.map((item) => (
                <BarisTabel key={item.id}>
                  <SelTabel className="font-semibold">{item.service_name}</SelTabel>
                  <SelTabel num>{rupiah(item.price)}</SelTabel>
                  <SelTabel>{item.unit}</SelTabel>
                  <SelTabel>{durasi(item.duration_minutes)}</SelTabel>
                  <SelTabel>
                    <Lencana
                      nada={NADA_AKTIF[item.is_active ? "aktif" : "nonaktif"]}
                      ikon
                    >
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </Lencana>
                  </SelTabel>
                  <SelTabel>
                    {admin ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <FormLayanan
                          layanan={item}
                          label="Ubah"
                          ikon="edit"
                          varian="halus"
                          ukuran="kecil"
                        />
                        <Konfirmasi
                          label="Hapus"
                          ikon="delete"
                          varian="halus"
                          judul={`Hapus layanan ${item.service_name}?`}
                          pesan="Layanan yang sudah dipakai order tidak bisa dihapus. Nonaktifkan saja supaya tidak muncul di form order."
                          labelYa="Hapus layanan"
                          aksi={hapusLayananAction}
                          muatan={{ id: item.id }}
                        />
                      </div>
                    ) : (
                      <span className="text-kecil text-ink-muted">-</span>
                    )}
                  </SelTabel>
                </BarisTabel>
              ))}
            </tbody>
          </Tabel>
        )}
      </Kartu>

      <Kartu>
        <KepalaKartu
          judul="Add-on"
          ikon="add_circle"
          keterangan={`${addon.length} add-on`}
          aksi={admin ? <FormAddon label="Tambah add-on" /> : undefined}
        />
        {addon.length === 0 ? (
          <KeadaanKosong
            ikon="add_circle"
            judul="Belum ada add-on"
            keterangan="Add-on bersifat pilihan. Tambahkan bila pelanggan sering minta tambahan."
            aksi={admin ? <FormAddon label="Tambah add-on" /> : undefined}
          />
        ) : (
          <Tabel minWidth="38rem">
            <KepalaTabel
              kolom={[
                { label: "Add-on" },
                { label: "Harga", num: true },
                { label: "Status" },
                { label: "Aksi" },
              ]}
            />
            <tbody>
              {addon.map((item) => (
                <BarisTabel key={item.id}>
                  <SelTabel className="font-semibold">{item.addon_name}</SelTabel>
                  <SelTabel num>{rupiah(item.price)}</SelTabel>
                  <SelTabel>
                    <Lencana
                      nada={NADA_AKTIF[item.is_active ? "aktif" : "nonaktif"]}
                      ikon
                    >
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </Lencana>
                  </SelTabel>
                  <SelTabel>
                    {admin ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <FormAddon
                          addon={item}
                          label="Ubah"
                          ikon="edit"
                          varian="halus"
                          ukuran="kecil"
                        />
                        <Konfirmasi
                          label="Hapus"
                          ikon="delete"
                          varian="halus"
                          judul={`Hapus add-on ${item.addon_name}?`}
                          pesan="Add-on yang sudah dipakai order tidak bisa dihapus. Nonaktifkan saja."
                          labelYa="Hapus add-on"
                          aksi={hapusAddonAction}
                          muatan={{ id: item.id }}
                        />
                      </div>
                    ) : (
                      <span className="text-kecil text-ink-muted">-</span>
                    )}
                  </SelTabel>
                </BarisTabel>
              ))}
            </tbody>
          </Tabel>
        )}
        <div className="border-t border-line px-4 py-3">
          <p className="flex flex-wrap items-center gap-2 text-kecil text-ink-muted">
            <Chip>Aturan</Chip>
            <span>
              Layanan atau add-on yang sudah dipakai order tidak bisa dihapus. Nonaktifkan
              agar tidak muncul di form order, riwayat lama tetap utuh.
            </span>
          </p>
        </div>
      </Kartu>
    </div>
  );
}
