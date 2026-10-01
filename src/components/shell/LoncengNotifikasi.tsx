"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  hapusSemuaNotifikasiAction,
  tandaiDibacaAction,
  tandaiSemuaDibacaAction,
} from "@/controllers/notification.controller";
import { NADA_NOTIF } from "@/lib/constants";
import { tanggalJam } from "@/lib/format";
import { IonIcon } from "@/components/ui/IonIcon";
import type { Notifikasi } from "@/types/db";

/**
 * Petakan tipe notifikasi ke nama ikon Ionicons resmi
 */
function ikonNotif(tipe: string): string {
  switch (tipe) {
    case "success":
      return "checkmark-circle-outline";
    case "warning":
      return "alert-circle-outline";
    case "error":
      return "close-circle-outline";
    case "info":
    default:
      return "information-circle-outline";
  }
}

/**
 * Lonceng notifikasi kompak dan presisi:
 * - Menampilkan 2 notifikasi paling baru secara default
 * - Ukuran dropdown lebih ramping dan elegan
 * - Ikon murni Ionicons v7 tanpa kebocoran teks
 * - Pembersihan manual & otomatis 24 jam
 */
export function LoncengNotifikasi({
  daftar,
  jumlah,
}: {
  daftar: Notifikasi[];
  jumlah: number;
}) {
  const [buka, setBuka] = useState(false);
  const [tampilkanSemua, setTampilkanSemua] = useState(false);
  const [items, setItems] = useState<Notifikasi[]>(daftar);
  const [unreadCount, setUnreadCount] = useState<number>(jumlah);
  const [sedangMemproses, startTransition] = useTransition();
  const wadahRef = useRef<HTMLDivElement>(null);

  // Selaraskan dengan data server saat ada navigasi atau data baru
  useEffect(() => {
    setItems(daftar);
    setUnreadCount(jumlah);
  }, [daftar, jumlah]);

  // Tutup dropdown saat klik di luar atau tekan tombol Escape
  useEffect(() => {
    function handleKlikLuar(e: MouseEvent) {
      if (wadahRef.current && !wadahRef.current.contains(e.target as Node)) {
        setBuka(false);
      }
    }

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setBuka(false);
      }
    }

    if (buka) {
      document.addEventListener("mousedown", handleKlikLuar);
      document.addEventListener("keydown", handleKeydown);
    }

    return () => {
      document.removeEventListener("mousedown", handleKlikLuar);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [buka]);

  // Tandai semua dibaca secara optimis (instan di layar)
  function handleTandaiSemua() {
    setUnreadCount(0);
    setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));

    startTransition(async () => {
      const data = new FormData();
      await tandaiSemuaDibacaAction(null, data);
    });
  }

  // Hapus semua notifikasi secara manual
  function handleHapusSemua() {
    setUnreadCount(0);
    setItems([]);

    startTransition(async () => {
      const data = new FormData();
      await hapusSemuaNotifikasiAction(null, data);
    });
  }

  // Tandai satu notifikasi saat diklik
  function handleTandaiSatu(id: number, sudahDibaca: boolean) {
    if (sudahDibaca) return;

    setUnreadCount((prev) => Math.max(0, prev - 1));
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );

    startTransition(async () => {
      const data = new FormData();
      data.append("id", String(id));
      await tandaiDibacaAction(null, data);
    });
  }

  // Batasi hanya 2 notifikasi terbaru yang terbuka secara default
  const itemsTampil = tampilkanSemua ? items : items.slice(0, 2);

  return (
    <div ref={wadahRef} className="relative">
      <button
        type="button"
        onClick={() => setBuka((nilai) => !nilai)}
        aria-expanded={buka}
        aria-haspopup="dialog"
        title="Notifikasi Operasional"
        className={`joyops-aksi relative flex h-11 w-11 items-center justify-center rounded-lg border transition-all duration-150 ${
          buka
            ? "border-primary bg-primary/10 text-primary shadow-xs"
            : "border-line bg-surface text-ink-muted hover:border-primary/50 hover:bg-paper hover:text-ink shadow-xs active:scale-95"
        }`}
      >
        <IonIcon
          name={unreadCount > 0 ? "notifications" : "notifications-outline"}
          size={20}
          className={unreadCount > 0 ? "text-primary" : "text-ink-muted"}
        />

        {unreadCount > 0 ? (
          <span className="angka absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-nano font-extrabold text-white shadow-xs ring-2 ring-surface animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}

        <span className="sr-only">
          Notifikasi{unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ""}
        </span>
      </button>

      {buka ? (
        <div
          role="dialog"
          aria-label="Daftar notifikasi"
          className="gerak-muncul absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-menu backdrop-blur-md"
        >
          {/* Header Panel Notifikasi Kompak */}
          <div className="flex items-center justify-between gap-2 border-b border-line bg-paper/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <IonIcon name="notifications-outline" size={16} className="text-primary" />
              <h2 className="font-display text-kecil font-bold text-ink">Notifikasi</h2>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                  {unreadCount}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  disabled={sedangMemproses}
                  onClick={handleTandaiSemua}
                  title="Tandai semua dibaca"
                  className="joyops-aksi flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <IonIcon name="checkmark-done-outline" size={13} />
                  <span>Tandai</span>
                </button>
              ) : null}

              {items.length > 0 ? (
                <button
                  type="button"
                  disabled={sedangMemproses}
                  onClick={handleHapusSemua}
                  title="Bersihkan semua notifikasi"
                  className="joyops-aksi flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-danger hover:bg-danger/10 transition-colors"
                >
                  <IonIcon name="trash-outline" size={13} />
                  <span>Bersihkan</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Daftar Notifikasi (Default: 2 Terbaru, Ukuran Kompak) */}
          <div className="max-h-72 overflow-y-auto divide-y divide-line/60">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink-muted">
                  <IonIcon name="notifications-outline" size={20} />
                </div>
                <p className="mt-2 text-mikro font-semibold text-ink">Tidak ada notifikasi baru</p>
                <p className="mt-0.5 max-w-[190px] text-[11px] text-ink-muted">
                  Otomatis terhapus setelah 24 jam.
                </p>
              </div>
            ) : (
              itemsTampil.map((item) => {
                const nada = NADA_NOTIF[item.type] || NADA_NOTIF.info;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleTandaiSatu(item.id, item.is_read)}
                    className={`group flex w-full cursor-pointer items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
                      item.is_read
                        ? "bg-surface/50 opacity-70 hover:opacity-100 hover:bg-paper"
                        : "bg-surface hover:bg-paper/80 font-medium"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper ${nada.kuat}`}
                    >
                      {item.is_read ? (
                        <IonIcon name="checkmark" size={13} />
                      ) : (
                        <IonIcon name={ikonNotif(item.type)} size={14} />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="block truncate text-mikro font-bold text-ink">
                          {item.title}
                        </span>
                        {!item.is_read ? (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        ) : null}
                      </div>

                      <p className="mt-0.5 text-mikro text-ink-muted leading-snug line-clamp-2">
                        {item.message}
                      </p>

                      <div className="mt-1 flex items-center gap-1 text-[11px] text-ink-muted">
                        <IonIcon name="time-outline" size={12} />
                        <span>{tanggalJam(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Opsi Tampilkan Semua Jika Lebih Dari 2 */}
          {items.length > 2 ? (
            <div>
              {!tampilkanSemua ? (
                <button
                  type="button"
                  onClick={() => setTampilkanSemua(true)}
                  className="joyops-aksi w-full border-t border-line/60 bg-paper/40 py-1.5 text-center text-[11px] font-semibold text-primary hover:bg-paper/80 transition-colors"
                >
                  Lihat {items.length - 2} notifikasi sebelumnya
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTampilkanSemua(false)}
                  className="joyops-aksi w-full border-t border-line/60 bg-paper/40 py-1.5 text-center text-[11px] font-medium text-ink-muted hover:bg-paper/80 transition-colors"
                >
                  Tampilkan 2 terbaru saja
                </button>
              )}
            </div>
          ) : null}

          {/* Footer Keterangan & Navigasi Kompak */}
          <div className="flex items-center justify-between border-t border-line bg-paper/60 px-3 py-2 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1">
              <IonIcon name="time-outline" size={12} />
              <span>Bersih dalam 24 jam</span>
            </span>

            <Link
              href="/dashboard"
              onClick={() => setBuka(false)}
              className="joyops-aksi font-semibold text-primary hover:underline"
            >
              Dashboard
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
