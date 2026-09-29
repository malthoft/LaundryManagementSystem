import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { profilSaya } from "@/lib/auth";
import { hariIni, hitungPeriode, labelPeriode } from "@/lib/date";
import { rupiah } from "@/lib/format";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilTransaksi, ringkasKas } from "@/models/transaction.model";
import type { JenisPeriode } from "@/types/domain";

/**
 * Ekspor buku kas ke PDF. Dijalankan di server supaya data mentah tidak perlu
 * dikirim ke peramban lebih dulu.
 */
export async function GET(permintaan: NextRequest) {
  const profil = await profilSaya();
  if (!profil) {
    return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });
  }
  if (profil.role !== "Admin") {
    return NextResponse.json({ error: "Hanya Admin yang boleh mengekspor." }, { status: 403 });
  }

  const kueri = permintaan.nextUrl.searchParams;
  const jenis = (kueri.get("jenis") ?? "bulan") as JenisPeriode;

  const periode = hitungPeriode(jenis, {
    bulan: kueri.get("bulan") ?? undefined,
    tahun: kueri.get("tahun") ?? undefined,
    minggu: kueri.get("minggu") ?? undefined,
    mulai: kueri.get("mulai") ?? undefined,
    selesai: kueri.get("selesai") ?? undefined,
  });

  const supabase = await buatKlienServer();
  const [ringkasan, transaksi] = await Promise.all([
    ringkasKas(supabase, periode),
    ambilTransaksi(supabase, periode),
  ]);

  const dokumen = await PDFDocument.create();
  const tebal = await dokumen.embedFont(StandardFonts.HelveticaBold);
  const biasa = await dokumen.embedFont(StandardFonts.Helvetica);

  const lebar = 595;
  const tinggi = 842;
  const margin = 48;
  const barisPerHalaman = 26;

  let halaman = dokumen.addPage([lebar, tinggi]);
  let y = tinggi - margin;

  const tulis = (teks: string, ukuran: number, pakaiTebal = false, geser = 0) => {
    halaman.drawText(teks, {
      x: margin + geser,
      y,
      size: ukuran,
      font: pakaiTebal ? tebal : biasa,
      color: rgb(0.1, 0.12, 0.13),
    });
  };

  tulis("JoyOps", 20, true);
  y -= 22;
  tulis("Laporan Keuangan", 13, true);
  y -= 18;
  tulis(`Periode: ${labelPeriode(periode)}`, 10);
  y -= 14;
  tulis(`Dibuat: ${hariIni()}`, 10);
  y -= 24;

  tulis(`Pemasukan: ${rupiah(ringkasan.pemasukan)}`, 11, true);
  y -= 16;
  tulis(`Pengeluaran: ${rupiah(ringkasan.pengeluaran)}`, 11, true);
  y -= 16;
  tulis(`Netto: ${rupiah(ringkasan.netto)}`, 11, true);
  y -= 16;
  tulis(`Jumlah transaksi: ${ringkasan.jumlahTransaksi}`, 10);
  y -= 28;

  tulis("Tanggal", 9, true);
  tulis("Jenis", 9, true, 80);
  tulis("Keterangan", 9, true, 170);
  tulis("Metode", 9, true, 330);
  tulis("Jumlah", 9, true, 430);
  y -= 8;

  halaman.drawLine({
    start: { x: margin, y },
    end: { x: lebar - margin, y },
    thickness: 0.5,
    color: rgb(0.75, 0.78, 0.79),
  });
  y -= 14;

  let dihalaman = 0;

  for (const baris of transaksi) {
    if (dihalaman >= barisPerHalaman) {
      halaman = dokumen.addPage([lebar, tinggi]);
      y = tinggi - margin;
      dihalaman = 0;
    }

    const keterangan =
      (baris.description ?? "-").length > 46
        ? `${(baris.description ?? "-").slice(0, 45)}...`
        : baris.description ?? "-";

    tulis(baris.transaction_date, 9, false);
    tulis(baris.transaction_type, 9, false, 80);
    tulis(keterangan, 9, false, 170);
    tulis(baris.payment_method, 9, false, 330);
    tulis(rupiah(baris.amount), 9, false, 430);

    y -= 14;
    dihalaman += 1;
  }

  if (transaksi.length === 0) {
    tulis("Tidak ada catatan pada periode ini.", 10);
  }

  const bytePdf = await dokumen.save();

  /* Disalin ke penyangga baru supaya tipenya pasti Uint8Array atas ArrayBuffer,
     yang diterima sebagai isi balasan. */
  const isiPdf = new Uint8Array(bytePdf.byteLength);
  isiPdf.set(bytePdf);

  return new NextResponse(isiPdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="joyops-keuangan-${periode.mulai}-${periode.selesai}.pdf"`,
    },
  });
}
