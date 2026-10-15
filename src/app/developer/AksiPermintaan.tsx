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
 * Sesudah menyetujui "Lupa Sandi", tautan resetnya harus terlihat di sini.
 * Tautan itu sekali pakai dan berlaku 30 menit, jadi inilah satu-satunya
 * kesempatan menyalinnya sebelum permintaan pindah ke riwayat.
 *
 * Pesan hasilnya mengikuti keputusan yang benar-benar diambil, bukan selalu
 * "disetujui": persetujuan dan penolakan punya kalimatnya masing-masing.
 */
export function AksiPermintaan({ id }: { id: number }) {
  const [hasil, kirim, jalan] = useActionState(putuskanPermintaanAction, null);
  const galat = hasil && !hasil.ok ? (hasil.field ?? {}) : {};

  const tautan = hasil?.ok ? (hasil.data?.tautanReset ?? null) : null;
  const setuju = hasil?.ok ? (hasil.data?.setuju ?? false) : false;

  // Simpan juga di penyimpanan sesi: baris ini akan ter-unmount begitu
  // permintaannya pindah ke riwayat, jadi jangan mengandalkan panel di sini.
  useEffect(() => {
    if (tautan) {
      simpanTautanReset(window.location.origin + "/atur-sandi?token=" + tautan);
    }
  }, [tautan]);

  if (hasil?.ok) {
    if (!setuju) {
      return (
        <PesanHasil jenis="info">
          Permintaan <strong>ditolak</strong>. Akun tidak diaktifkan dan tidak
          ada tautan yang diterbitkan.
        </PesanHasil>
      );
    }

    if (tautan) {
      return (
        <div className="grid gap-3">
          <PesanHasil jenis="sukses">
            Disetujui. Tautan atur ulang sandi sudah diterbitkan — salin lalu
            berikan ke pemilik akun. Berlaku 30 menit, sekali pakai.
          </PesanHasil>
          <TautanReset token={tautan} />
        </div>
      );
    }

    return (
      <PesanHasil jenis="sukses">
        Disetujui. Akun sudah aktif dan bisa langsung dipakai untuk masuk.
      </PesanHasil>
    );
  }

  return (
    <div className="grid gap-4">
      {hasil && !hasil.ok ? (
        <PesanHasil jenis="gagal">{hasil.error}</PesanHasil>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <form action={kirim}>
          <input type="hidden" name="id" value={String(id)} />
          <input type="hidden" name="setuju" value="1" />
          <Tombol
            type="submit"
            varian="utama"
            lebarPenuh
            ikon="check_circle"
            disabled={jalan}
          >
            {jalan ? "Memproses…" : "Setujui"}
          </Tombol>
        </form>

        <form action={kirim} className="grid gap-3">
          <input type="hidden" name="id" value={String(id)} />
          <input type="hidden" name="setuju" value="0" />
          <Catatan
            name="catatan"
            label="Alasan penolakan (opsional)"
            rows={2}
            maxLength={300}
            placeholder="Contoh: data pendaftar tidak dikenal"
            galat={galat?.catatan}
          />
          <Tombol
            type="submit"
            varian="bahaya"
            lebarPenuh
            ikon="cancel"
            disabled={jalan}
          >
            {jalan ? "Memproses…" : "Tolak"}
          </Tombol>
        </form>
      </div>
    </div>
  );
}

/** Tautan atur ulang lengkap beserta tombol salin. */
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
    <div className="rounded-md border border-line bg-paper p-4">
      <p className="text-mikro font-semibold uppercase tracking-wide text-ink-muted">
        Tautan atur ulang sandi
      </p>
      <p className="mt-2 break-all rounded-sm border border-line bg-surface px-3 py-2.5 font-numeric text-kecil text-ink">
        {tautan}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Tombol
          type="button"
          varian="utama"
          ukuran="kecil"
          ikon={tersalin ? "check" : "content_copy"}
          onClick={salin}
        >
          {tersalin ? "Tersalin" : "Salin tautan"}
        </Tombol>
        <a
          href={tautan}
          target="_blank"
          rel="noreferrer"
          className="joyops-aksi inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-2 text-kecil font-semibold text-ink hover:bg-paper sm:min-h-9"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[1.15em]"
          >
            open_in_new
          </span>
          Buka halaman
        </a>
      </div>
      <p className="mt-3 text-mikro text-ink-muted">
        Halaman ini bisa dipakai untuk menguji sendiri alurnya, atau tautannya
        dikirimkan ke pemilik akun.
      </p>
    </div>
  );
}
