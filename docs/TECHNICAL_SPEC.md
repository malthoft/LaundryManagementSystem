# TECHNICAL SPEC: JoyOps v3

Spesifikasi teknis untuk implementasi. Dokumen ini mengikat. Kalau kode dan
dokumen berbeda, salah satunya harus diperbaiki.

- Versi: 3.0
- Tanggal: 28 September 2026
- PRD terkait: `docs/PRD.md`
- Arah desain: `DESIGN.md`

---

## 1. Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js App Router | Server component + server action, satu proses untuk baca dan tulis, deploy Vercel tanpa konfigurasi |
| Bahasa | TypeScript `strict` | Menangkap kesalahan bentuk data di batas Supabase |
| UI | React 19 + Tailwind CSS v4 | Tailwind di build step, bukan CDN seperti v2.1 |
| Komponen | Buatan sendiri di `src/components/ui` | Tidak menarik satu design system pihak ketiga; kebutuhan hanya tabel, kartu, tombol, modal, form |
| Motion | `framer-motion` | Hanya 3 primitif di `DESIGN.md`. Kalau primitif bisa CSS murni, pakai CSS |
| Database | Supabase Postgres | Postgres sungguhan, RLS, Auth, dan dashboard SQL manual |
| Auth | Supabase Auth (`@supabase/ssr`) | Sesi disimpan di cookie httpOnly, di-refresh di middleware |
| Validasi | `zod` | Satu skema dipakai untuk validasi server dan pesan error |
| Ikon | Material Symbols Outlined | Nama ikon semantik, sesuai isi fitur, sudah jadi identitas JoyOps |
| Font | Manrope (judul/angka), Inter (badan) | Sama seperti v2.1 |
| PDF | `pdf-lib` | Ekspor laporan keuangan tanpa dependensi berat |

Versi paket dikunci di `package.json`. Tidak ada dependensi yang ditambah tanpa
alasan tertulis di commit message.

---

## 2. Arsitektur MVC

Tiga lapisan. Aturannya ketat supaya tidak jadi kode kacau lagi.

```
View        src/app/**/page.tsx        Komponen server. Menyusun tampilan.
            src/components/**          Komponen presentasional.

Controller  src/controllers/*.ts       Server action. Batas kepercayaan.
                                       Validasi zod, cek peran, panggil model,
                                       bungkus hasil jadi { ok, data | error }.

Model       src/models/*.ts            Query Supabase. Nama fungsi bahasa
                                       Indonesia yang jelas. Tanpa aturan bisnis.
```

Aturan yang mengikat:

1. View **tidak pernah** mengimpor klien Supabase. Kalau butuh data, panggil
   controller atau fungsi baca di `src/models` yang memang boleh dipanggil
   server component untuk render (lihat 2.1).
2. Controller adalah satu-satunya tempat yang boleh menulis ke database.
3. Model tidak boleh memutuskan izin. Izin di RLS (database) dan dicek ulang
   di controller untuk pesan error yang manusiawi.
4. Controller selalu mengembalikan bentuk `Hasil<T>`:

```ts
export type Hasil<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: Record<string, string> };
```

5. Server action tidak melempar error ke klien. Error tak terduga di-`console.error`
   di server, lalu dikembalikan sebagai pesan umum.

### 2.1 Membaca data untuk render

Server component butuh data saat render. Dua cara, dan pemilihannya harus
konsisten:

- **Baca langsung**: komponen server memanggil fungsi `ambil*` di `src/models`.
  Dipakai untuk daftar sederhana (mesin, layanan, add-on, profil).
- **Lewat controller**: dipakai kalau pembacaan melibatkan aturan (misal
  ringkasan dashboard yang menghitung periode, atau penutupan order otomatis).

Tidak ada `useEffect` yang mengambil data awal. Tidak ada endpoint API yang
cuma meneruskan query.

---

## 3. Struktur folder

```
D:\JoyOps\
  DESIGN.md
  README.md
  .env.local.example
  .gitignore
  eslint.config.mjs
  next.config.ts
  package.json
  postcss.config.mjs
  tsconfig.json
  middleware.ts                     sesi + penjaga rute

  docs/
    PRD.md
    TECHNICAL_SPEC.md
    IMPLEMENTATION_PLAN.md
    Guide_Book_JoyOps.md            manual pengguna (sumber halaman /guide)

  supabase/
    01_schema.sql                   tabel, tipe, indeks, fungsi, trigger, RLS
    02_seed.sql                     layanan, add-on, mesin awal
    03_auth_users.sql               opsional: akun karyawan lewat SQL

  scripts/
    seed-auth-users.mjs             jalur utama pembuatan akun karyawan

  src/
    app/
      layout.tsx                    html, font, provider tema
      globals.css                   token Tailwind + gaya dasar
      page.tsx                      arahkan ke dashboard sesuai peran
      login/page.tsx
      (app)/
        layout.tsx                  kerangka: sidebar + topbar + penjaga sesi
        dashboard/page.tsx
        orders/page.tsx
        machines/page.tsx
        shifts/page.tsx
        attendance/page.tsx
        services/page.tsx
        finance/page.tsx
        employees/page.tsx
        settings/page.tsx
        guide/page.tsx
    components/
      shell/                        AppShell, Sidebar, Topbar, NavItem, NotifBell, ProfileMenu
      ui/                           Button, Card, Field, Select, Modal, Toast,
                                    Badge, Stat, Table, Empty, Skeleton,
                                    ErrorState, ConfirmDialog, ThemeToggle
      orders/                       OrderForm, OrderTable, OrderTimer
      machines/                     MachineForm, MachineGrid
      finance/                      TransactionForm, TransactionTable, PeriodFilter
      shifts/                       ShiftBoard, SwapRequestForm, SwapApprovalList
    controllers/
      auth.controller.ts
      order.controller.ts
      machine.controller.ts
      service.controller.ts
      finance.controller.ts
      shift.controller.ts
      attendance.controller.ts
      employee.controller.ts
      notification.controller.ts
    models/
      profile.model.ts
      machine.model.ts
      service.model.ts
      addon.model.ts
      order.model.ts
      transaction.model.ts
      shift.model.ts
      attendance.model.ts
      notification.model.ts
    lib/
      supabase/server.ts            klien per-request (cookie)
      supabase/middleware.ts        refresh sesi
      supabase/admin.ts             service role, hanya server
      auth.ts                       ambil pengguna, wajibAdmin(), wajibMasuk()
      constants.ts                  pemetaan label, warna status, kode
      format.ts                     rupiah, tanggal, jam, durasi
      date.ts                       batas hari/minggu/bulan dalam Asia/Jakarta
      validation.ts                 skema zod bersama
    types/
      db.ts                         tipe baris tabel
      domain.ts                     tipe gabungan yang dipakai UI
```

---

## 4. Skema database

Sumber tunggal: `supabase/01_schema.sql`. Ringkasnya:

### 4.1 Tabel

| Tabel | Isi | Kunci |
|---|---|---|
| `profiles` | Pengguna aplikasi, 1:1 dengan `auth.users` | `id` uuid = `auth.users.id`, `username` unik, `role` Admin/Karyawan |
| `machines` | Mesin cuci dan pengering | `id`, `machine_code` unik (`WM-01`, `DM-01`) |
| `services` | Layanan laundry | `id`, `duration_minutes` (baru), `unit` (kg/pcs) |
| `addons` | Add-on | `id`, `is_active` |
| `orders` | Order | `id`, `order_code` unik, `washer_machine_id`, `dryer_machine_id` |
| `order_addons` | Add-on per order | `order_id`, `addon_id`, `qty`, `price`, `subtotal` |
| `transactions` | Buku kas | `id`, `order_id` (null untuk manual), `transaction_type`, `payment_method` |
| `shifts` | Jadwal terwujud | `id`, `profile_id`, `work_date`, `start_time`, `end_time` |
| `shift_templates` | Pola shift berulang | `id`, `profile_id`, `day_of_week`, `shift_type` |
| `shift_swap_requests` | Pengajuan tukar shift | `id`, `shift_id`, `requester_id`, `target_shift_id`, `status` |
| `attendance` | Absensi | `id`, `profile_id`, `work_date`, `clock_in`, `clock_out` |
| `notifications` | Notifikasi per penerima | `id`, `user_id`, `is_read` |

### 4.2 Perubahan dari v2.1

| v2.1 | v3.0 | Alasan |
|---|---|---|
| `users` | `profiles` menunjuk ke `auth.users` | Password ditangani Supabase Auth |
| `orders.machine_id` | `orders.washer_machine_id` | Nama lama ambigu setelah ada kolom pengering |
| `orders` punya FK dobel ke `machines` | satu FK per kolom | FK dobel pernah bikin hapus mesin gagal |
| `transactions` tanpa relasi order | `transactions.order_id` | Mencegah pemasukan dobel |
| `services` tanpa durasi | `services.duration_minutes` | v2.1 menyimpan durasi di order, jadi tiap order bisa beda tanpa alasan |
| `notifications.for_role` + fan-out manual di PHP | fungsi SQL `notify()` | Satu tempat untuk aturan pengiriman |
| `test_shift_swap_requests` | dihapus | Sisa debug |
| enum MySQL | `text` + `check` | Menambah nilai tidak butuh `ALTER TYPE` |
| `timestamp` polos | `timestamptz` | Tidak ada lagi jam yang bergeser 7 jam |

### 4.3 Fungsi dan trigger

| Nama | Jenis | Fungsi |
|---|---|---|
| `public.peran_saya()` | fungsi | Ambil `role` pengguna yang sedang login |
| `public.adminkah()` | fungsi | `peran_saya() = 'Admin'` |
| `public.notify(...)` | fungsi | Kirim notifikasi, fan-out ke penerima yang tepat |
| `handle_new_user()` | trigger pada `auth.users` | Buat baris `profiles` otomatis dari metadata |
| `order_selesai_otomatis()` | fungsi | Tutup order lewat `end_time`, lepaskan mesin |

### 4.4 RLS

RLS aktif di semua tabel. Prinsipnya:

- Baca data operasional (mesin, layanan, add-on, order, shift, absensi,
  notifikasi) : semua pengguna yang sudah masuk.
- Tulis data operasional: pengguna yang sudah masuk, dengan pembatasan peran.
- Keuangan (`transactions`): hanya Admin, untuk baca dan tulis.
- Data karyawan (`profiles`): baca sendiri, Admin baca semua, tulis hanya Admin.
- Notifikasi: baca dan ubah hanya baris milik sendiri.

Policy ditulis lengkap di `01_schema.sql`. Kalau ada tabel tanpa policy,
akses ditolak, jadi ini gagal-tertutup.

---

## 5. Alur autentikasi

Login tetap memakai **username**, seperti v2.1. Supabase Auth butuh email, jadi
username dipetakan ke email sintetis.

```
username  "althof123"
email     "althof123@joyops.local"     AUTH_EMAIL_DOMAIN dari env
```

Alur:

1. Form login mengirim `username` dan `password` ke `masuk()` di
   `auth.controller.ts` (server action).
2. Controller menormalkan username (huruf kecil, buang spasi), memvalidasi
   dengan zod, lalu menyusun email sintetis.
3. `supabase.auth.signInWithPassword({ email, password })`.
4. Klien server `@supabase/ssr` menulis cookie sesi.
5. Klien diarahkan ke `/dashboard`. Layout `(app)` memverifikasi sesi; kalau
   kosong, diarahkan ke `/login`.
6. Peran dibaca dari `profiles` lewat `peranSaya()`, di-cache per request dengan
   `cache()` dari React supaya tidak query berulang.

Catatan penting:

- `AUTH_EMAIL_DOMAIN` hanya dipakai di server. Tidak pernah dikirim ke klien.
- Domain default `joyops.local`. Kalau Supabase menolak domain tersebut saat
  pembuatan akun, ganti lewat env tanpa mengubah kode.
- Konfirmasi email tidak dipakai. Akun dibuat Admin dengan `email_confirm: true`.
- Lupa password ditangani Admin (reset dari menu Employees), karena email
  karyawan sintetis tidak bisa menerima surat.

---

## 6. Peta rute

| Rute | Peran | Isi |
|---|---|---|
| `/` | semua | Arahkan ke `/dashboard` |
| `/login` | publik | Form masuk, informasi lupa password |
| `/dashboard` | Admin dan Karyawan | Ringkasan berbeda sesuai peran |
| `/orders` | Admin dan Karyawan | Daftar order, form buat order, timer, tandai selesai |
| `/machines` | Admin dan Karyawan | Daftar mesin. CRUD hanya Admin |
| `/shifts` | Admin | Jadwal minggu berjalan, kelola shift, persetujuan tukar |
| `/my-shift` | Karyawan | Jadwal sendiri, ajukan tukar, clock in/out |
| `/attendance` | Admin dan Karyawan | Absensi. Persetujuan hanya Admin |
| `/services` | Admin dan Karyawan | Layanan dan add-on. CRUD hanya Admin |
| `/finance` | Admin | Buku kas, filter periode, ekspor PDF |
| `/employees` | Admin | Data karyawan, tambah, ubah, reset password |
| `/settings` | semua | Profil sendiri, ganti password, tema |
| `/guide` | semua | Panduan pemakaian |

Rute yang bukan haknya: diarahkan ke `/dashboard` dengan pesan, bukan halaman
kosong. Menu sidebar hanya menampilkan rute yang boleh diakses.

---

## 7. Kontrak lapisan

### 7.1 Model

```ts
// src/models/order.model.ts
export async function ambilOrderBerjalan(supabase: KlienSupabase): Promise<OrderLengkap[]>
export async function ambilOrderById(supabase: KlienSupabase, id: number): Promise<OrderLengkap | null>
export async function buatOrder(supabase: KlienSupabase, input: OrderBaru): Promise<OrderLengkap>
export async function ubahStatusOrder(supabase: KlienSupabase, id: number, status: StatusOrder): Promise<void>
export async function ambilOrderHariIni(supabase: KlienSupabase): Promise<OrderLengkap[]>
```

Aturan:

- Nama fungsi Bahasa Indonesia, kata kerja di depan (`ambil`, `buat`, `ubah`, `hapus`).
- Klien Supabase selalu parameter pertama, supaya bisa diuji dan supaya jelas
  klien mana yang dipakai.
- Query yang butuh data gabungan memakai satu kali panggil dengan `select`
  bersarang, bukan query berulang per baris.

### 7.2 Controller

```ts
// src/controllers/order.controller.ts
'use server';

export async function buatOrderAction(input: unknown): Promise<Hasil<{ orderCode: string }>>
export async function selesaikanOrderAction(id: number): Promise<Hasil<null>>
export async function batalkanOrderAction(id: number): Promise<Hasil<null>>
```

Urutan tetap di dalam controller:

1. Ambil sesi. Kalau tidak ada, kembalikan `{ ok: false, error: 'Sesi berakhir...' }`.
2. Validasi input dengan zod. Kalau gagal, kembalikan error per field.
3. Cek peran bila aksi memang dibatasi peran.
4. Jalankan aturan bisnis yang tidak bisa dijamin database (BR-01 sampai BR-14).
5. Panggil model.
6. Kirim notifikasi bila perlu.
7. `revalidatePath` untuk rute yang terpengaruh.

### 7.3 View

- Komponen server untuk pengambilan data, komponen klien hanya untuk interaksi.
- Form memakai `useActionState` dan menampilkan error per field.
- Setiap tabel punya keadaan: kosong, memuat, gagal.
- Tombol yang menunggu server menampilkan keadaan `pending` dan tidak bisa ditekan dua kali.

### 7.4 Notifikasi

Fan-out dikerjakan fungsi SQL `notify()` supaya tidak berulang di kode:

```sql
select public.notify(
  p_title => 'Order Baru',
  p_message => 'Order ORD-20260928-0001 untuk WM-01 dan DM-02',
  p_type => 'success',
  p_for_role => 'Admin',
  p_user_id => null
);
```

---

## 8. Token desain

Token didefinisikan sekali di `src/app/globals.css` memakai blok `@theme`
Tailwind v4. Nilai dan alasannya ada di `DESIGN.md`. Nama variabel:

```
--color-primary  --color-primary-600  --color-paper  --color-surface
--color-ink      --color-ink-muted    --color-line
--color-ok       --color-busy         --color-danger  --color-accent
--font-display   --font-body          --font-numeric
--space-1 .. --space-12
--radius-sm --radius-md --radius-lg
--shadow-pop
--ease-out --ease-in-out
```

Tidak ada nilai warna langsung di komponen. Semua lewat token.

---

## 9. Variabel lingkungan

`.env.local` (lokal) dan Environment Variables Vercel (produksi):

| Nama | Rahasia | Isi |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | tidak | URL proyek Supabase, `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tidak | Kunci anon. Aman di klien karena RLS aktif |
| `SUPABASE_SERVICE_ROLE_KEY` | **ya** | Hanya untuk pembuatan karyawan dan reset password. Jangan pernah dipakai di komponen klien |
| `AUTH_EMAIL_DOMAIN` | tidak | Domain email sintetis. Default `joyops.local` |
| `NEXT_PUBLIC_APP_NAME` | tidak | `JoyOps` |

`.env.local.example` berisi daftar di atas dengan nilai kosong. `.env.local`
masuk `.gitignore` dan tidak boleh pernah di-commit.

---

## 10. Urutan penyiapan

1. Buat proyek Supabase baru.
2. Jalankan `supabase/01_schema.sql` di SQL Editor.
3. Jalankan `supabase/02_seed.sql`.
4. Ambil Project URL, anon key, dan service role key dari Settings, API.
5. Isi `.env.local`.
6. Jalankan `npm install`, lalu `node scripts/seed-auth-users.mjs` untuk membuat
   akun karyawan pertama (Admin wajib ada).
7. `npm run dev`, login, ganti password sementara.
8. Push ke GitHub, sambungkan repo ke Vercel, isi Environment Variables yang sama.
9. Deploy. Sesudah deploy, jalankan `node scripts/seed-auth-users.mjs` dengan
   env produksi bila akun dibuat belakangan.

---

## 11. Aturan kode

1. TypeScript `strict`. Dilarang `any`. Kalau terpaksa, tulis alasannya.
2. Nama domain dan fungsi dalam Bahasa Indonesia (`buatOrder`, `ambilMesin`).
   Nama teknis tetap Inggris (`useState`, `createClient`).
3. Satu file satu tanggung jawab. Komponen di atas 200 baris dipecah.
4. Tidak ada `console.log` di kode yang dikirim. Pakai `console.error` hanya
   untuk kegagalan tak terduga di server.
5. Tidak ada nilai ajaib. Warna, jarak, dan label masuk `constants.ts` atau token.
6. Query Supabase selalu menyebut kolom yang diambil. Tidak ada `select('*')`
   di halaman yang dirender.
7. Setiap perhitungan uang memakai `numeric` di database dan pembulatan eksplisit
   di kode. Tidak ada `float`.
8. Tanggal dan jam selalu lewat `src/lib/date.ts`. Tidak ada
   `new Date().toISOString()` yang tersebar.
9. Tidak ada `transition: all` di CSS. Sebut propertinya.
10. Setiap tabel baru wajib langsung punya RLS dan policy. Tabel tanpa policy
    dianggap bug.
