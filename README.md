# JoyOps

Sistem operasional laundry: kasir, mesin, jadwal shift, absensi, dan buku kas.

Versi 3.0. Sebelumnya PHP prosedural dengan MariaDB (v2.1). Sekarang Next.js,
React, TypeScript, dan Supabase Postgres.

- Arah desain: `DESIGN.md`
- Kebutuhan produk: `docs/PRD.md`
- Spesifikasi teknis: `docs/TECHNICAL_SPEC.md`
- Rencana kerja dan status: `docs/IMPLEMENTATION_PLAN.md`
- Manual pengguna: `docs/Guide_Book_JoyOps.md`

---

## Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Kerangka | Next.js 15 App Router | Server component untuk baca data, server action untuk tulis |
| Bahasa | TypeScript strict | Tidak ada `any` |
| Gaya | Tailwind v4 dengan token `@theme` | Token didefinisikan sekali di `src/app/globals.css` |
| Database | Supabase Postgres + RLS | Izin dijaga di database, bukan hanya di tampilan |
| Auth | Supabase Auth | Login memakai username, dipetakan ke email sintetis |
| Gerak | Primitif CSS di `globals.css`: `gerak-muncul`, pasangan `panel-*`, `menu-*`, `toast-*` (masuk/keluar) | Hanya transisi antar keadaan, lihat `DESIGN.md`. Tidak ada pustaka animasi |
| PDF | pdf-lib | Ekspor buku kas |

## Arsitektur

Tiga lapisan, batasnya tegas. Rinciannya di `docs/TECHNICAL_SPEC.md` bagian 2.

```
View        src/app/**/page.tsx, src/components/**   Komponen server + komponen klien
Controller  src/controllers/*.ts                     Server action. Batas kepercayaan.
Model       src/models/*.ts                          Query Supabase, tanpa aturan bisnis
```

Aturan yang mengikat:

1. View tidak pernah mengimpor klien Supabase untuk menulis. Membaca boleh
   lewat fungsi `ambil*` di `src/models`.
2. Hanya controller yang menulis ke database.
3. Controller selalu mengembalikan `Hasil<T>`, tidak pernah melempar error ke klien.
4. Izin dijaga RLS di database, lalu dicek ulang di controller untuk pesan yang manusiawi.

## Menyiapkan Supabase

1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Buka SQL Editor, jalankan isi `supabase/01_schema.sql`.
   Berisi 12 tabel, fungsi, trigger, dan seluruh policy RLS.
3. Jalankan `supabase/02_seed.sql`. Berisi layanan, add-on, dan 12 mesin awal.
4. Buka Settings, API. Catat Project URL, anon key, dan service role key.

`supabase/03_auth_users.sql` adalah jalur cadangan bila akun harus dibuat
lewat SQL. Jalur utama ada di skrip Node pada langkah berikutnya.

Jalur cadangan itu dipakai kalau `SUPABASE_SERVICE_ROLE_KEY` belum diisi:
tanpa kunci tersebut, `npm run seed:akun` tidak bisa membuat akun. Cara
menjalankannya, dari mesin sendiri:

```bash
# ganti nilai PGHOST/PGUSER/PGPASSWORD dengan milik proyek Anda
psql "host=aws-0-<wilayah>.pooler.supabase.com port=6543 dbname=postgres \
      user=postgres.<project-ref> password=<password-database> sslmode=require" \
      -f supabase/03_auth_users.sql
```

Berkas itu membuat tiga akun contoh (satu Admin, dua Karyawan) dengan sandi
sementara `JoyOps#2026`. Ganti sandi itu setelah login pertama.

## Variabel lingkungan

Salin `.env.local.example` menjadi `.env.local`, lalu isi:

| Nama | Rahasia | Isi |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | tidak | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tidak | Kunci anon. Aman di klien karena RLS aktif |
| `SUPABASE_SERVICE_ROLE_KEY` | **ya** | Hanya untuk membuat karyawan dan reset sandi. Jangan pernah dipakai di komponen klien |
| `AUTH_EMAIL_DOMAIN` | tidak | Default `joyops.local` |
| `NEXT_PUBLIC_APP_NAME` | tidak | `JoyOps` |

`.env.local` ada di `.gitignore` dan tidak boleh di-commit.

## Menjalankan

```bash
npm install
npm run seed:akun     # membuat akun dari daftar di scripts/seed-auth-users.mjs
npm run dev           # http://localhost:3000
```

Skrip `seed:akun` membaca daftar akun di `scripts/seed-auth-users.mjs`
(Admin `admin`, karyawan `operator1` dan `operator2`) dan memakai sandi sementara
`JoyOps#2026` bila `SEED_TEMP_PASSWORD` tidak diisi. Ubah daftarnya sesuai toko,
lalu ganti sandi setiap akun setelah login pertama.

Skrip lain:

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run cek:kontras   # periksa kontras token WCAG AA, terang dan gelap
npm run build         # build produksi
```

## Mengembangkan dengan Supabase lokal

Berguna kalau tidak ingin menyentuh proyek produksi. Butuh Docker.

```bash
npx supabase start                       # menyalakan Postgres, Auth, REST, Studio
docker exec -i supabase_db_JoyOps psql -U postgres -d postgres < supabase/01_schema.sql
docker exec -i supabase_db_JoyOps psql -U postgres -d postgres < supabase/02_seed.sql
docker exec -i supabase_db_JoyOps psql -U postgres -d postgres < supabase/03_auth_users.sql
```

Setelah itu `.env.local` diisi dengan nilai yang dicetak `npx supabase status`
(URL `http://127.0.0.1:54321`, anon key, service role key). Akun contoh:
`admin` sebagai Admin, `operator1` dan `operator2` sebagai karyawan, sandi
sementara `JoyOps#2026`. Studio ada di `http://127.0.0.1:54323`.

Hentikan dengan `npx supabase stop`.

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Di Vercel, Import Project, pilih repo ini. Framework terdeteksi otomatis.
3. Isi Environment Variables yang sama seperti `.env.local`, untuk Production,
   Preview, dan Development.
4. Deploy. Setelah itu jalankan `npm run seed:akun` dengan env produksi bila
   akun karyawan dibuat belakangan.

Catatan: `SUPABASE_SERVICE_ROLE_KEY` hanya boleh ada di Environment Variables
server. Jangan pernah menaruhnya di variabel berawalan `NEXT_PUBLIC_`.

## Peran dan izin

| Peran | Bisa |
|---|---|
| Admin | Semua: order, mesin, jadwal, absensi, buku kas, data karyawan |
| Karyawan | Order, mesin (lihat), shift sendiri, absensi sendiri, layanan (lihat) |

Karyawan tidak bisa membaca tabel `transactions`. Pembatasan itu policy RLS di
database, jadi tetap berlaku walau permintaan dibuat langsung ke API Supabase
tanpa lewat aplikasi.

Daftar rekan kerja (`profiles`) boleh dibaca semua karyawan yang sudah masuk,
karena dipakai di layar kerja: kolom Kasir pada tabel order dan nama rekan pada
pengajuan tukar shift. Isinya hanya identitas kerja, tanpa bahan rahasia.
Menulis ke tabel itu tetap hanya untuk Admin, jadi peran tidak bisa dinaikkan
sendiri.

## Struktur folder

```
src/
  app/
    layout.tsx              html, font, skrip tema
    globals.css             token Tailwind dan gaya dasar
    page.tsx                arahkan ke /dashboard
    login/                  halaman masuk
    (app)/                  kerangka: sidebar, bilah atas, penjaga sesi
      dashboard/  orders/  machines/  shifts/  my-shift/
      attendance/  services/  finance/  employees/  settings/  guide/
      loading.tsx  error.tsx
  components/
    shell/                  Kerangka, Sidebar, LoncengNotifikasi, MenuProfil
    ui/                     Tombol, Kartu, Kolom, Tabel, Modal, Keadaan, dst
    orders/ machines/ services/ shifts/ finance/ employees/ settings/ dashboard/
  controllers/              server action, batas kepercayaan
  models/                   query Supabase
  lib/                      auth, constants, format, date, validation, supabase/*
  types/                    db.ts (baris tabel), domain.ts (bentuk gabungan)
supabase/                   01_schema.sql, 02_seed.sql, 03_auth_users.sql, config.toml
scripts/                    seed-auth-users.mjs
docs/                       PRD, spec teknis, rencana, manual pengguna
```

`supabase/config.toml` hanya dipakai kalau Anda ingin menjalankan Supabase di
mesin sendiri (`supabase start`). Untuk proyek cloud, berkas itu tidak
mengganggu dan boleh diabaikan.

## Menambah kolom atau tabel

1. Ubah `supabase/01_schema.sql`, lalu jalankan perubahannya di SQL Editor.
2. Setiap tabel baru wajib langsung punya RLS dan policy. Tabel tanpa policy
   dianggap bug.
3. Tambahkan tipe barisnya di `src/types/db.ts`, lalu fungsi `ambil*`/`ubah*`
   di `src/models/`.
4. Baru terakhir dipakai di controller dan halaman.

## Yang sudah terbukti jalan

Lihat bagian verifikasi di `docs/IMPLEMENTATION_PLAN.md`. Ringkasnya:
`npm run build`, `npm run lint`, dan `npm run typecheck` hijau; seluruh 15 rute
merespons; halaman masuk tampil; keadaan memuat, kosong, dan gagal tersedia di
setiap layar data.
