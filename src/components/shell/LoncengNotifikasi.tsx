"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { tandaiDibacaAction, tandaiSemuaDibacaAction } from "@/controllers/notification.controller";
import { NADA_NOTIF } from "@/lib/constants";
import { tanggalJam } from "@/lib/format";
import type { Notifikasi } from "@/types/db";

/**
 * Lonceng notifikasi. Daftarnya sudah diambil server saat render; panel ini
 * hanya membuka dan menutup, plus menandai dibaca.
 */
export function LoncengNotifikasi({
  daftar,
  jumlah,
}: {
  daftar: Notifikasi[];
  jumlah: number;
}) {
  const [buka, setBuka] = useState(false);
  const [, aksiTandai] = useActionState(tandaiDibacaAction, null);
  const [, aksiTandaiSemua] = useActionState(tandaiSemuaDibacaAction, null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setBuka((nilai) => !nilai)}
        aria-expanded={buka}
        aria-haspopup="dialog"
        className="joyops-aksi relative flex h-11 w-11 items-center justify-center rounded-sm text-ink-muted hover:bg-paper hover:text-ink"
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          notifications
        </span>
        {jumlah > 0 ? (
          <span className="angka absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-sm bg-danger px-1 text-nano font-bold text-danger-fg">
            {jumlah > 9 ? "9+" : jumlah}
          </span>
        ) : null}
        <span className="sr-only">
          Notifikasi{jumlah > 0 ? `, ${jumlah} belum dibaca` : ""}
        </span>
      </button>

      {buka ? (
        <div
          role="dialog"
          aria-label="Daftar notifikasi"
          className="gerak-muncul absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-surface shadow-menu"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="font-display text-kecil font-bold text-ink">Notifikasi</h2>
            {jumlah > 0 ? (
              <form action={aksiTandaiSemua}>
                <button
                  type="submit"
                  className="joyops-aksi min-h-11 rounded-sm px-2 text-mini font-bold text-primary hover:bg-paper"
                >
                  Tandai semua dibaca
                </button>
              </form>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {daftar.length === 0 ? (
              <p className="px-4 py-8 text-center text-kecil text-ink-muted">
                Belum ada notifikasi.
              </p>
            ) : (
              daftar.map((item) => {
                const nada = NADA_NOTIF[item.type];

                return (
                  <form key={item.id} action={aksiTandai}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      disabled={item.is_read}
                      className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 ${
                        item.is_read ? "opacity-70" : "hover:bg-paper"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`material-symbols-outlined text-[1.15em] ${nada.kuat}`}
                      >
                        {nada.ikon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-kecil font-bold text-ink">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-kecil text-ink-muted">
                          {item.message}
                        </span>
                        <span className="angka mt-1 block text-mikro text-ink-muted">
                          {tanggalJam(item.created_at)}
                        </span>
                      </span>
                      {!item.is_read ? (
                        <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-sm bg-primary" />
                      ) : null}
                    </button>
                  </form>
                );
              })
            )}
          </div>

          <div className="border-t border-line px-4 py-2">
            <Link
              href="/dashboard"
              onClick={() => setBuka(false)}
              className="joyops-aksi inline-flex min-h-11 items-center text-mini font-bold text-primary hover:underline"
            >
              Buka dashboard
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
