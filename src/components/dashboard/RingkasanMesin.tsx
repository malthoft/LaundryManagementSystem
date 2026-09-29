import { BatangProporsi } from "@/components/ui/AngkaPokok";
import { Kartu, IsiKartu, KepalaKartu } from "@/components/ui/Kartu";
import type { RingkasanMesin } from "@/types/domain";

/**
 * Ringkasan mesin. Tiga angka dengan batang proporsi, karena pertanyaan
 * pemakainya selalu "berapa yang kosong sekarang".
 */
export function RingkasanMesin({ ringkasan }: { ringkasan: RingkasanMesin }) {
  const { tersedia, digunakan, maintenance, total } = ringkasan;

  const bagian = [
    {
      label: "Tersedia",
      nilai: tersedia,
      kelas: "text-ok",
      batang: "bg-ok",
    },
    {
      label: "Digunakan",
      nilai: digunakan,
      kelas: "text-busy",
      batang: "bg-busy",
    },
    {
      label: "Perawatan",
      nilai: maintenance,
      kelas: "text-danger",
      batang: "bg-danger",
    },
  ];

  return (
    <Kartu>
      <KepalaKartu
        judul="Status mesin"
        ikon="local_laundry_service"
        keterangan={total > 0 ? `${total} mesin terdaftar` : undefined}
      />
      <IsiKartu>
        {total === 0 ? (
          <p className="text-kecil text-ink-muted">
            Belum ada mesin terdaftar. Tambahkan mesin dari menu Mesin.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {bagian.map((item) => (
              <div key={item.label} className="min-w-0">
                <p className={`angka text-2xl font-extrabold sm:text-3xl ${item.kelas}`}>
                  {item.nilai}
                </p>
                <p className="mt-0.5 text-kecil font-medium text-ink-muted">
                  {item.label}
                </p>
                <div className="mt-2">
                  <BatangProporsi
                    nilai={item.nilai}
                    total={total}
                    kelasWarna={item.batang}
                    label={item.label}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </IsiKartu>
    </Kartu>
  );
}
