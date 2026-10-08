"use client";

import { useEffect, useActionState, useState } from "react";
import { Catatan } from "@/components/ui/Kolom";
import { Tombol } from "@/components/ui/Tombol";
import { PesanHasil } from "@/components/ui/Keadaan";
import { putuskanPermintaanAction } from "@/controllers/developer.controller";
import { simpanTautanReset } from "./TautanResetAktif";

/**
 * Keputusan atas satu permintaan.
 *
 * Sesudah menyetujui "Lupa Sandi", tautan resetnya **harus terlihat di sini**.
 * Tautan itu sekali pakai dan berlaku 30 menit, jadi inilah satu-satunya
 * kesempatan menyalinnya sebelum permintaan pindah ke riwayat.
 */
export function AksiPermintaan({ id }: { id: number }) {
  const [hasil, kirim, jalan] = useActionState(putuskanPermintaanAction, null);
  const galat = hasil && !hasil.ok ? (hasil.field ?? {}) : {};

  const tautan = hasil?.ok ? (hasil.data?.tautanReset ?? null) : null;

  // Simpan juga di penyimpanan sesi: baris ini akan ter-unmount begitu
  // permintaannya pindah ke riwayat, jadi jangan mengandalkan panel di sini.
  useEffect(() => {
    if (tautan) {
      const lengkap = window.location.origin + "/atur-sandi?token=" + tautan;
      simpanTautanReset(lengkap);
    }
  }, [tautan]);

  if (hasil?.ok) {
    return (
      <div>
        {tautan ? (
          <>
            <PesanHasil jenis="sukses">
              Disetujui. Tautan reset sudah diterbitkan — salin lalu berikan
              ke pemilik akun. Berlaku 30 menit, sekali pakai.
            </PesanHasil>
            <TautanReset token={tautan} />
          </>
        ) : (
          <PesanHasil jenis="sukses">
            Disetujui. Akun sudah aktif dan bisa langsung dipakai untuk masuk.
          </PesanHasil>
        )}
      </div>
    );
  }

  return (
    <div>
      {hasil && !hasil.ok ? (
        <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <form action={kirim} className="flex items-end gap-2">
          <input type="hidden" name="id" value={String(id)} />
          <input type="hidden" name="setuju" value="1" />
          <Tombol type="submit" varian="utama" disabled={jalan}>
            {jalan ? "Memproses..." : "Setujui"}
          </Tombol>
        </form>

        <form action={kirim} className="flex flex-1 items-end gap-2">
          <input type="hidden" name="id" value={String(id)} />
          <input type="hidden" name="setuju" value="0" />
          <div className="min-w-[12rem] flex-1">
            <Catatan
              name="catatan"
              label="Catatan penolakan"
              rows={2}
              placeholder="Boleh dikosongkan"
              galat={galat?.catatan}
            />
          </div>
          <Tombol type="submit" varian="bahaya" disabled={jalan}>
            Tolak
          </Tombol>
        </form>
      </div>
    </div>
  );
}

/** Tautan reset lengkap beserta tombol salin. */
function TautanReset({ token }: { token: string }) {
  const [tersalin, setTersalin] = useState(false);
  const [tautan, setTautan] = useState("");

  // Dibangun dari asal halaman supaya benar untuk lokal maupun domain publik.
  if (!tautan && typeof window !== "undefined") {
    setTautan(window.location.origin + "/atur-sandi?token=" + token);
  }

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(tautan);
      setTersalin(true);
    } catch {
      setTersalin(false);
    }
  };

  return (
    <div className="mt-3 rounded-md border border-line bg-hov px-3 py-3">
      <p className="font-mono text-kecil uppercase tracking-wider text-muted">
        Tautan pengaturan ulang sandi
      </p>
      <p className="mt-2 break-all font-mono text-badan text-aksen">{tautan}</p>
      <div className="mt-2 flex items-center gap-2">
        <Tombol type="button" varian="sekunder" onClick={salin}>
          {tersalin ? "Tersalin" : "Salin tautan"}
        </Tombol>
        <a
          href={tautan}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-kecil text-muted underline hover:text-ink"
        >
          Buka halaman atur sandi
        </a>
      </div>
      <p className="mt-2 font-mono text-kecil text-muted">
        Halaman ini bisa dipakai untuk menguji sendiri alurnya, atau tautannya
        dikirimkan ke pemilik akun.
      </p>
    </div>
  );
}
