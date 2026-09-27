/** Angka dari Postgres bisa datang sebagai number atau string. Terima keduanya. */
export type AngkaMasuk = number | string | null | undefined;

const ZONA = "Asia/Jakarta";

function keAngka(nilai: AngkaMasuk): number {
  if (nilai === null || nilai === undefined) return 0;
  const angka = typeof nilai === "number" ? nilai : Number(nilai);
  return Number.isFinite(angka) ? angka : 0;
}

const PEMFORMAT_RUPIAH = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 45000 menjadi "Rp 45.000". */
export function rupiah(nilai: AngkaMasuk): string {
  return `Rp ${PEMFORMAT_RUPIAH.format(Math.round(keAngka(nilai)))}`;
}

/** 2.5 menjadi "2,5". Dipakai untuk qty kg. */
export function angkaDesimal(nilai: AngkaMasuk, desimal = 2): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: desimal,
  }).format(keAngka(nilai));
}

/** 1.5 menjadi "1,5 kg" atau "3 pcs". */
export function qtyDenganSatuan(nilai: AngkaMasuk, satuan: string): string {
  return `${angkaDesimal(nilai)} ${satuan}`;
}

const PEMFORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  timeZone: ZONA,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const PEMFORMAT_TANGGAL_PANJANG = new Intl.DateTimeFormat("id-ID", {
  timeZone: ZONA,
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const PEMFORMAT_JAM = new Intl.DateTimeFormat("id-ID", {
  timeZone: ZONA,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const PEMFORMAT_JAM_DETIK = new Intl.DateTimeFormat("id-ID", {
  timeZone: ZONA,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** "2026-09-28" atau ISO lengkap menjadi "28 Sep 2026". */
export function tanggal(nilai: string | null | undefined): string {
  if (!nilai) return "-";
  const waktu = new Date(nilai.length === 10 ? `${nilai}T00:00:00+07:00` : nilai);
  if (Number.isNaN(waktu.getTime())) return "-";
  return PEMFORMAT_TANGGAL.format(waktu);
}

/** "Senin, 28 September 2026". */
export function tanggalPanjang(nilai: string | null | undefined): string {
  if (!nilai) return "-";
  const waktu = new Date(nilai.length === 10 ? `${nilai}T00:00:00+07:00` : nilai);
  if (Number.isNaN(waktu.getTime())) return "-";
  return PEMFORMAT_TANGGAL_PANJANG.format(waktu);
}

/** "14:30" dari ISO lengkap, atau dari "14:30:00". */
export function jam(nilai: string | null | undefined): string {
  if (!nilai) return "-";
  const waktu = new Date(nilai.length <= 8 ? `1970-01-01T${nilai}Z` : nilai);
  if (Number.isNaN(waktu.getTime())) return "-";
  return nilai.length <= 8
    ? nilai.slice(0, 5)
    : PEMFORMAT_JAM.format(waktu);
}

/** "14:30:05", dipakai pada tabel absensi. */
export function jamDetik(nilai: string | null | undefined): string {
  if (!nilai) return "-";
  const waktu = new Date(nilai);
  if (Number.isNaN(waktu.getTime())) return "-";
  return PEMFORMAT_JAM_DETIK.format(waktu);
}

/** "28 Sep 2026, 14:30". */
export function tanggalJam(nilai: string | null | undefined): string {
  if (!nilai) return "-";
  return `${tanggal(nilai)}, ${jam(nilai)}`;
}

/** 90 menjadi "1 jam 30 menit". */
export function durasi(menit: AngkaMasuk): string {
  const total = Math.max(0, Math.round(keAngka(menit)));
  const jamBagian = Math.floor(total / 60);
  const menitBagian = total % 60;

  if (jamBagian === 0) return `${menitBagian} menit`;
  if (menitBagian === 0) return `${jamBagian} jam`;
  return `${jamBagian} jam ${menitBagian} menit`;
}

/** Selisih dua waktu, dalam menit. */
export function selisihMenit(
  dari: string | null | undefined,
  sampai: string | null | undefined
): number {
  if (!dari || !sampai) return 0;
  const awal = new Date(dari).getTime();
  const akhir = new Date(sampai).getTime();
  if (Number.isNaN(awal) || Number.isNaN(akhir)) return 0;
  return Math.max(0, Math.round((akhir - awal) / 60000));
}

/** Hitung mundur "01:23:45" atau "12:30" dari sisa milidetik. */
export function hitungMundur(sisaMs: number): string {
  const total = Math.max(0, Math.floor(sisaMs / 1000));
  const jam = Math.floor(total / 3600);
  const menit = Math.floor((total % 3600) / 60);
  const detik = total % 60;
  const dua = (n: number) => String(n).padStart(2, "0");
  return jam > 0
    ? `${dua(jam)}:${dua(menit)}:${dua(detik)}`
    : `${dua(menit)}:${dua(detik)}`;
}

/** Potong teks panjang untuk sel tabel. */
export function pendek(teks: string | null | undefined, maksimal = 40): string {
  if (!teks) return "-";
  return teks.length > maksimal ? `${teks.slice(0, maksimal - 1)}...` : teks;
}

/** Inisial nama untuk avatar. "Damar Galih" menjadi "DG". */
export function inisial(nama: string | null | undefined): string {
  if (!nama) return "?";
  const bagian = nama.trim().split(/\s+/).slice(0, 2);
  return bagian.map((kata) => kata.charAt(0).toUpperCase()).join("") || "?";
}

/** Jalan pintas yang sering dipakai di tampilan order. */
export function pasanganMesin(
  cuci: { machine_code: string } | null,
  pengering: { machine_code: string } | null
): string {
  const a = cuci?.machine_code ?? "-";
  const b = pengering?.machine_code ?? "-";
  return `${a} & ${b}`;
}
