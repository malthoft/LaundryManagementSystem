# IMPLEMENTATION PLAN: JoyOps v3

Rencana kerja migrasi. Urutannya penting: skema dulu, baru kode, baru UI.

- Tanggal: 28 September 2026
- PRD: `docs/PRD.md`
- Spec: `docs/TECHNICAL_SPEC.md`

---

## Definisi selesai

Pekerjaan dinyatakan selesai hanya kalau semua ini terpenuhi:

- [ ] `npm run build` hijau, tanpa error tipe dan tanpa error lint.
- [ ] Semua rute di bagian 6 spec ada dan bisa dibuka.
- [ ] Setiap layar data punya keadaan kosong, memuat, dan gagal.
- [ ] Karyawan tidak bisa membaca tabel `transactions` (dibuktikan di database).
- [ ] Tidak ada geser horizontal di 320px, 375px, 414px, 768px.
- [ ] Semua kontrol bisa dijangkau keyboard, fokus terlihat.
- [ ] Tidak ada em dash di teks UI maupun dokumen.
- [ ] Tidak ada angka, testimoni, atau klaim karangan.

---

## Fase 0: Bersih-bersih dan pengamanan

- [x] Arsipkan versi PHP ke `D:\JoyOps-legacy-php-2026-09-28.zip` (98 entri, 368 KB).
- [x] Hapus 46 file PHP, file `.bak`, file `*.sql` lepas, `pagination.js`,
      `temp_script.js`, folder `database/`.
- [x] Pindahkan `Guide_Book_JoyOps.md` ke `docs/`.
- [x] Tulis `DESIGN.md` sebagai arah desain.

## Fase 1: Dokumen

- [x] `docs/PRD.md`
- [x] `docs/TECHNICAL_SPEC.md`
- [x] `docs/IMPLEMENTATION_PLAN.md` (file ini)

## Fase 2: Skema database Supabase

- [ ] `supabase/01_schema.sql` berisi:
  - [ ] ekstensi yang dipakai (`pgcrypto` bila perlu)
  - [ ] 12 tabel dengan kunci, `check`, dan indeks
  - [ ] `timestamptz` di seluruh kolom waktu
  - [ ] fungsi `peran_saya()`, `adminkah()`, `notify()`, `order_selesai_otomatis()`
  - [ ] trigger `handle_new_user()` pada `auth.users`
  - [ ] RLS dan policy untuk setiap tabel, tanpa pengecualian
  - [ ] `grant` yang benar untuk peran `authenticated`
- [ ] `supabase/02_seed.sql` berisi 3 layanan, 6 add-on, 12 mesin.
- [ ] `supabase/03_auth_users.sql` (opsional) berisi cara membuat akun lewat SQL,
      ditandai jelas sebagai jalur cadangan.
- [ ] `scripts/seed-auth-users.mjs` sebagai jalur utama pembuatan akun.

## Fase 3: Kerangka Next.js

- [ ] `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
      `eslint.config.mjs`, `.gitignore`, `.env.local.example`.
- [ ] `src/app/layout.tsx` dengan Manrope, Inter, Material Symbols, dan
      `lang="id"`.
- [ ] `src/app/globals.css` dengan token `@theme` sesuai `DESIGN.md`.
- [ ] `npm install` berhasil.
- [ ] `npm run build` hijau (halaman kosong dulu).

## Fase 4: Lapisan data dan auth

- [ ] `src/lib/supabase/{server,middleware,admin}.ts`
- [ ] `src/lib/{auth,constants,format,date,validation}.ts`
- [ ] `src/types/{db,domain}.ts`
- [ ] `middleware.ts` me-refresh sesi dan menjaga rute `(app)`.
- [ ] `src/app/login/page.tsx` + `auth.controller.ts` (masuk, keluar).
- [ ] Login berhasil dengan username dan password.

## Fase 5: Model

- [ ] `profile.model.ts`, `machine.model.ts`, `service.model.ts`,
      `addon.model.ts`, `order.model.ts`, `transaction.model.ts`,
      `shift.model.ts`, `attendance.model.ts`, `notification.model.ts`.
- [ ] Tiap model diuji sekali lewat pemanggilan nyata dari halaman.

## Fase 6: Komponen bersama

- [ ] `shell/`: AppShell, Sidebar (peran-aware), Topbar, NotifBell, ProfileMenu.
- [ ] `ui/`: Button (8 keadaan), Card, Field, Select, Modal, Toast, Badge,
      Stat, Table, Empty, Skeleton, ErrorState, ConfirmDialog, ThemeToggle.
- [ ] Semua memakai token, tanpa nilai warna langsung.

## Fase 7: Halaman

Urutan pengerjaan dari yang paling menentukan alur kerja:

- [ ] `/dashboard` (Admin dan Karyawan)
- [ ] `/orders` + form buat order + timer + tandai selesai
- [ ] `/machines`
- [ ] `/services` (layanan dan add-on)
- [ ] `/my-shift` + pengajuan tukar
- [ ] `/shifts` + persetujuan tukar
- [ ] `/attendance`
- [ ] `/finance` + filter periode + ekspor PDF
- [ ] `/employees`
- [ ] `/settings`
- [ ] `/guide`

## Fase 8: Verifikasi dan serah terima

- [ ] `npm run build` hijau.
- [ ] `npm run lint` hijau.
- [ ] Jalankan `npm run dev`, klik setiap kontrol satu per satu, catat hasilnya.
- [ ] Uji RLS: login sebagai karyawan, coba baca `transactions`, harus gagal.
- [ ] Uji 320px, 375px, 414px, 768px: tidak ada geser horizontal.
- [ ] Uji keyboard: Tab, Enter, Escape di sidebar, modal, dan form.
- [ ] Jalankan Delivery Gate `antislop` dan laporkan PASS/FAIL per butir.
- [ ] Tulis `README.md`: cara menyiapkan Supabase, env, menjalankan, deploy Vercel.

---

## Catatan pengerjaan

- Fase 2 sebelum fase 5. Model yang dibangun sebelum skema pasti akan diubah dua kali.
- Fase 6 sebelum fase 7. Kalau tidak, tiap halaman akan menulis tombol dan kartunya sendiri,
  dan itulah yang membuat v2.1 berakhir dengan sidebar yang disalin 12 kali.
- Satu halaman dianggap selesai setelah keadaannya lengkap (kosong, memuat, gagal),
  bukan setelah tampilannya benar saat data ada.
