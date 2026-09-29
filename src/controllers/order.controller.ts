"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { profilSaya } from "@/lib/auth";
import { daftarAngka, catatKegagalan, teks, type AksiForm } from "@/lib/aksi";
import { pesanPerField, skemaBatalOrder, skemaIdOrder, skemaOrderBaru } from "@/lib/validation";
import { berhasil, gagal, type Hasil } from "@/types/domain";
import {
  ambilOrderById,
  batalkanOrder,
  buatOrder,
  selesaikanOrder,
  tutupOrderKedaluwarsa,
} from "@/models/order.model";
import { ambilMesinById } from "@/models/machine.model";
import { ambilLayananAktif } from "@/models/service.model";
import { kirimNotifikasi } from "@/models/notification.model";

/** Beri tahu semua pengguna bahwa ada order baru yang perlu dikerjakan. */
async function kabarkanOrderBaru(
  judul: string,
  pesan: string,
  tipe: "success" | "info" | "warning",
  orderId: number
): Promise<void> {
  const supabase = await buatKlienServer();
  await kirimNotifikasi(supabase, {
    judul,
    pesan,
    tipe,
    untukPeran: "All",
    tipeTerkait: "order",
    idTerkait: orderId,
  });
}

/**
 * Buat order baru.
 *
 * Validasi bentuk (BR-01, BR-05) di sini. Aturan yang butuh data terkini
 * (status mesin, tabrakan mesin, total uang) dikerjakan di dalam fungsi
 * database `buat_order`, supaya tidak ada celah antara memeriksa dan menyimpan.
 */
export const buatOrderBaru: AksiForm<{ kode: string }> = async (
  _sebelumnya,
  data
) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (!profil.is_active) return gagal("Akun Anda sedang tidak aktif.");

  const cek = skemaOrderBaru.safeParse({
    washerId: teks(data, "washerId"),
    dryerId: teks(data, "dryerId"),
    serviceId: teks(data, "serviceId"),
    namaPelanggan: teks(data, "namaPelanggan"),
    qty: teks(data, "qty"),
    addonIds: daftarAngka(data, "addonIds"),
    metodeBayar: teks(data, "metodeBayar"),
    catatan: teks(data, "catatan"),
  });

  if (!cek.success) {
    return gagal("Periksa kembali isian order.", pesanPerField(cek.error));
  }

  const isian = cek.data;

  if (isian.washerId === isian.dryerId) {
    return gagal("Mesin cuci dan pengering tidak boleh sama.", {
      dryerId: "Pilih mesin pengering yang berbeda",
    });
  }

  const supabase = await buatKlienServer();

  // Pemeriksaan awal supaya pesannya jelas. Fungsi database tetap memeriksa ulang.
  const [cuci, pengering] = await Promise.all([
    ambilMesinById(supabase, isian.washerId),
    ambilMesinById(supabase, isian.dryerId),
  ]);

  if (!cuci || !cuci.machine_code.startsWith("WM-")) {
    return gagal("Mesin cuci yang dipilih tidak sah.", {
      washerId: "Pilih mesin dari daftar mesin cuci",
    });
  }

  if (!pengering || !pengering.machine_code.startsWith("DM-")) {
    return gagal("Mesin pengering yang dipilih tidak sah.", {
      dryerId: "Pilih mesin dari daftar mesin pengering",
    });
  }

  if (cuci.status !== "Tersedia") {
    return gagal(`Mesin ${cuci.machine_code} sedang tidak tersedia. Muat ulang halaman.`, {
      washerId: "Mesin sudah dipakai order lain",
    });
  }

  if (pengering.status !== "Tersedia") {
    return gagal(
      `Mesin ${pengering.machine_code} sedang tidak tersedia. Muat ulang halaman.`,
      { dryerId: "Mesin sudah dipakai order lain" }
    );
  }

  const layanan = (await ambilLayananAktif(supabase)).find(
    (baris) => baris.id === isian.serviceId
  );

  if (!layanan) {
    return gagal("Layanan tidak ditemukan atau sudah tidak aktif.", {
      serviceId: "Pilih layanan yang aktif",
    });
  }

  if (layanan.duration_minutes < 1) {
    return gagal("Durasi layanan belum diatur. Perbaiki di menu Layanan.", {
      serviceId: "Durasi layanan minimal 1 menit",
    });
  }

  // Satuan pcs dihitung per barang, jadi pecahan tidak masuk akal. kg boleh
  // pecahan (mis. 2,5 kg), jadi yang diperiksa adalah unit layanan, bukan
  // qty-nya secara mutlak.
  if (layanan.unit === "pcs" && !Number.isInteger(isian.qty)) {
    return gagal("Jumlah pcs harus bilangan bulat.", {
      qty: `Jumlah untuk layanan ${layanan.service_name} harus bulat`,
    });
  }

  let kode = "";
  let orderId = 0;

  try {
    const order = await buatOrder(supabase, isian);
    kode = order.order_code;
    orderId = order.id;
  } catch (kesalahan) {
    catatKegagalan("buatOrderBaru", kesalahan);
    const pesan =
      kesalahan instanceof Error ? kesalahan.message : "Order gagal dibuat.";
    return gagal(pesan);
  }

  await kabarkanOrderBaru(
    "Order Baru",
    `Order ${kode} untuk ${cuci.machine_code} & ${pengering.machine_code} tercatat.`,
    "success",
    orderId
  );

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/machines");
  revalidatePath("/finance");

  return berhasil({ kode });
};

/** Tandai order selesai dan lepaskan mesinnya (BR-07). */
export const selesaikanOrderAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");

  const cek = skemaIdOrder.safeParse({ id: teks(data, "id") });
  if (!cek.success) return gagal("Order tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();
  const order = await ambilOrderById(supabase, cek.data.id);
  if (!order) return gagal("Order tidak ditemukan.");

  try {
    await selesaikanOrder(supabase, cek.data.id);
  } catch (kesalahan) {
    catatKegagalan("selesaikanOrderAction", kesalahan);
    return gagal(
      kesalahan instanceof Error ? kesalahan.message : "Order gagal diselesaikan."
    );
  }

  await kabarkanOrderBaru(
    "Order Selesai",
    `Order ${order.order_code} telah selesai. Mesin kembali tersedia.`,
    "info",
    order.id
  );

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/machines");
  return berhasil(null);
};

/** Batalkan order. Hanya Admin (BR-12), dijaga juga di fungsi database. */
export const batalkanOrderAction: AksiForm<null> = async (_sebelumnya, data) => {
  const profil = await profilSaya();
  if (!profil) return gagal("Sesi berakhir. Silakan masuk lagi.");
  if (profil.role !== "Admin") {
    return gagal("Hanya Admin yang boleh membatalkan order.");
  }

  const cek = skemaBatalOrder.safeParse({
    id: teks(data, "id"),
    alasan: teks(data, "alasan"),
  });

  if (!cek.success) return gagal("Order tidak valid.", pesanPerField(cek.error));

  const supabase = await buatKlienServer();
  const order = await ambilOrderById(supabase, cek.data.id);
  if (!order) return gagal("Order tidak ditemukan.");
  if (order.status === "Dibatalkan") return gagal("Order ini sudah dibatalkan.");

  try {
    await batalkanOrder(supabase, cek.data.id, cek.data.alasan);
  } catch (kesalahan) {
    catatKegagalan("batalkanOrderAction", kesalahan);
    return gagal(
      kesalahan instanceof Error ? kesalahan.message : "Order gagal dibatalkan."
    );
  }

  await kabarkanOrderBaru(
    "Order Dibatalkan",
    `Order ${order.order_code} dibatalkan. Pemasukan terkait dihapus.`,
    "warning",
    order.id
  );

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/machines");
  revalidatePath("/finance");
  return berhasil(null);
};

/**
 * Tutup order yang sudah lewat waktunya. Dipanggil saat halaman Order atau
 * Dashboard dimuat, menggantikan perilaku "Order Otomatis Selesai" v2.1.
 */
export async function rapikanOrderKedaluwarsa(): Promise<Hasil<number>> {
  const supabase = await buatKlienServer();

  try {
    const jumlah = await tutupOrderKedaluwarsa(supabase);
    return berhasil(jumlah);
  } catch (kesalahan) {
    catatKegagalan("rapikanOrderKedaluwarsa", kesalahan);
    return gagal("Gagal merapikan order kedaluwarsa.");
  }
}
