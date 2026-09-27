# PRD: JoyOps v3

Sistem operasional laundry. Migrasi dari PHP prosedural + MariaDB ke
Next.js + Supabase, agar bisa di-deploy di Vercel dan dirawat jangka panjang.

- Versi: 3.0
- Tanggal: 28 September 2026
- Status: disetujui, siap implementasi

---

## 1. Ringkasan

JoyOps adalah aplikasi web internal untuk satu (atau beberapa) toko laundry.
Dipakai dua peran: Admin (pemilik/manajer) dan Karyawan (kasir/operator).
Isi aplikasi: kasir digital, pemantauan mesin, jadwal shift dan tukar shift,
absensi, layanan, keuangan, dan data karyawan.

Versi 2.1 berjalan sebagai 46 skrip PHP di root folder, tanpa framework, tanpa
build step, tanpa test. Versi 3.0 mempertahankan seluruh perilaku yang sudah
dipakai, tapi dirapikan: satu framework, satu bahasa (TypeScript), struktur MVC,
skema database bernormal, dan kontrol akses di level database (RLS), bukan di
level halaman.

---

## 2. Masalah yang diselesaikan

| Masalah di v2.1 | Akibat | Perbaikan di v3.0 |
|---|---|---|
| 46 skrip PHP flat di root, tiap file menyusun HTML sendiri | Duplikasi sidebar, topbar, dan modal di setiap file | Satu layout aplikasi, komponen dipakai ulang |
| Tabel dibuat saat runtime oleh `initNotifications()` | Skema berubah tanpa jejak, rawan gagal senyap | Migrasi SQL sekali jalan, versi terkontrol |
| Tabel sisa debug (`test_shift_swap_requests`) dan FK dobel di `orders` | Kebingungan saat query | Skema bersih, satu FK per relasi |
| File `test_*.php`, `fix_*.php`, `check_*.php`, `run_*.php` di root produksi | Tidak jelas mana yang dipakai | Root bersih, tidak ada skrip sekali pakai |
| Tailwind lewat CDN | Tidak bisa purging, FOUC, tidak bisa di-cache | Tailwind di build step |
| Otorisasi cek `$_SESSION['role']` per halaman | Satu halaman lupa cek, data bocor | RLS di Supabase, aturan di database |
| Tidak ada validasi input terpusat | Order bisa disimpan dengan mesin terisi dua kali | Validasi di lapisan controller (zod) |
| Tidak bisa di-deploy ke platform modern | Harus VPS/cPanel | Vercel + Supabase |

---

## 3. Pengguna dan peran

### 3.1 Admin

Pemilik atau manajer. Akses penuh: dashboard keuangan, mesin, jadwal semua
orang, persetujuan tukar shift, data karyawan, layanan, transaksi manual.

### 3.2 Karyawan

Kasir/operator. Boleh membuat order, memantau mesin, melihat jadwal sendiri,
mengajukan tukar shift, absen masuk. Tidak boleh melihat keuangan, tidak
boleh mengubah data karyawan, tidak boleh mengubah harga layanan.

### 3.3 Siapa yang membuat akun

Admin. Karyawan tidak bisa mendaftar sendiri. Menu `register.php` di v2.1
dihapus dan diganti pembuatan karyawan dari dalam aplikasi oleh Admin.

---

## 4. Ruang lingkup

### 4.1 Masuk ruang lingkup

1. Login (username + password), logout.
2. Dashboard Admin: pendapatan hari ini, jumlah transaksi hari ini, ringkasan
   status mesin, aktivitas terbaru.
3. Dashboard Karyawan: order hari ini, mesin tersedia, shift sendiri.
4. Orders: buat order (1 mesin cuci + 1 mesin pengering + layanan + add-on),
   timer berjalan, tandai selesai, batal (admin).
5. Machines: daftar mesin, tambah, ubah, ubah status, hapus.
6. Services: CRUD layanan (nama, harga, satuan, durasi).
7. Add-ons: CRUD add-on.
8. Shifts: jadwal mingguan per karyawan, template shift berulang.
9. Tukar shift: karyawan ajukan, rekan terima/tolak, admin setujui/tolak.
10. Attendance: clock in karyawan, clock out, persetujuan admin.
11. Finance: daftar transaksi, filter periode (hari, minggu, bulan, tahun,
    rentang bebas), catat pengeluaran, ekspor PDF.
12. Employees: daftar karyawan, tambah, ubah, reset password, nonaktifkan.
13. Notifications: lonceng notifikasi, tandai dibaca, tandai semua dibaca.
14. Guide: panduan pemakaian dari dalam aplikasi.
15. Settings: profil sendiri, ganti password, tema.

### 4.2 Di luar ruang lingkup

- Pembayaran online (Midtrans/Xendit). Pembayaran dicatat manual (Cash, QRIS).
- Multi-tenant (satu instalasi = satu toko). Struktur DB tidak dibuat multi-toko.
- Aplikasi mobile native.
- Pendaftaran mandiri.
- Print thermal langsung. Ekspor PDF saja.
- Riwayat audit penuh. Hanya notifikasi aktivitas seperti v2.1.
- Reset password lewat email. Admin yang mereset, karena email karyawan sintetis.

---

## 5. Alur kerja inti

### 5.1 Buat order

1. Karyawan buka Orders, tekan Buat Order.
2. Pilih 1 mesin berstatus Tersedia dari daftar mesin cuci (kode `WM-*`).
3. Pilih 1 mesin berstatus Tersedia dari daftar mesin pengering (kode `DM-*`).
4. Isi nama pelanggan dan qty (berat kg untuk layanan kiloan, jumlah pcs untuk
   layanan satuan).
5. Pilih layanan, centang add-on bila ada.
6. Sistem menghitung: `service_price = qty x harga_layanan`,
   `addon_total = jumlah(qty_addon x harga_addon)`,
   `grand_total = service_price + addon_total`.
7. Simpan. Kedua mesin berubah jadi Digunakan, `available_at` = `end_time`.
   Satu transaksi pemasukan otomatis tercatat. Notifikasi dikirim.
8. Timer berjalan sampai `end_time`.
9. Setelah selesai, karyawan menandai order Selesai. Kedua mesin kembali
   Tersedia.

### 5.2 Order selesai otomatis

Kalau `end_time` sudah lewat tapi order belum ditandai selesai, sistem
menutupnya otomatis saat halaman Orders atau Dashboard dimuat, dan
mengembalikan mesin ke Tersedia. Ini mempertahankan perilaku v2.1
("Order Otomatis Selesai") tanpa perlu cron.

### 5.3 Tukar shift

1. Karyawan A buka Shift Saya, tekan Ajukan Tukar.
2. Pilih shift miliknya yang dilepas, dan shift rekan yang diambil.
   Syarat: `work_date` kedua shift berada di minggu ISO yang sama.
3. Status pengajuan: `Pending`.
4. Rekan B menerima notifikasi, memilih Terima (`Accepted by Employee`)
   atau Tolak (`Rejected by Employee`).
5. Bila diterima, Admin menyetujui (`Approved`) atau menolak
   (`Rejected by Admin`).
6. Jadwal hanya berubah setelah status `Approved`. Perubahan: kedua shift
   bertukar `user_id`.

### 5.4 Keuangan

- Pemasukan berasal dari order (otomatis) dan catatan manual (jarang).
- Pengeluaran hanya manual, hanya Admin.
- Filter periode: harian, mingguan, bulanan, tahunan, rentang bebas.
- Ekspor PDF berisi rentang, ringkasan pemasukan/pengeluaran/netto, dan
  daftar transaksi.

---

## 6. Aturan bisnis

| Kode | Aturan |
|---|---|
| BR-01 | Satu order wajib memakai tepat 1 mesin cuci dan 1 mesin pengering, dan keduanya berbeda tipe |
| BR-02 | Mesin yang dipakai order harus berstatus `Tersedia` saat order dibuat |
| BR-03 | Order tidak boleh dibuat kalau salah satu mesin sudah terpakai order lain yang masih berjalan |
| BR-04 | Kode order unik, format `ORD-YYYYMMDD-NNNN` |
| BR-05 | `duration_minutes` layanan minimal 1. Kalau nol, tolak dengan pesan yang jelas |
| BR-06 | `grand_total` dihitung server, tidak pernah dipercaya dari klien |
| BR-07 | Mesin berubah `Digunakan` saat order dibuat, `Tersedia` saat order selesai atau dibatalkan |
| BR-08 | Harga layanan dan add-on disalin ke baris order. Mengubah harga tidak mengubah order lama |
| BR-09 | Tukar shift hanya dalam minggu ISO yang sama |
| BR-10 | Jadwal baru berlaku hanya setelah admin menyetujui |
| BR-11 | Mesin `Maintenance` tidak boleh muncul di pilihan order |
| BR-12 | Karyawan tidak boleh menghapus order. Hanya Admin |
| BR-13 | Karyawan tidak boleh melihat menu keuangan sama sekali |
| BR-14 | Satu karyawan tidak boleh punya dua shift di jam yang sama |

---

## 7. Non-fungsional

| Aspek | Target |
|---|---|
| Platform | Vercel (frontend + server actions), Supabase (Postgres + Auth) |
| Performa | Halaman data selesai render < 1.5 detik pada koneksi 4G; tidak ada query N+1 |
| Responsif | 320px sampai 1920px, tanpa geser horizontal, target sentuh >= 44px |
| Aksesibilitas | WCAG 2.1 AA: kontras >= 4.5:1, navigasi keyboard penuh, fokus terlihat, modal tutup dengan Escape |
| Keamanan | RLS aktif di semua tabel. Service role key hanya di server. Password ditangani Supabase Auth. Tidak ada rahasia di klien |
| Bahasa | Seluruh teks UI Bahasa Indonesia |
| Zona waktu | Asia/Jakarta untuk seluruh perhitungan tanggal dan jam |
| Keadaan UI | Setiap layar data punya keadaan kosong, memuat, dan gagal |
| Kode | TypeScript strict, satu bahasa, MVC, tidak ada `any` yang tidak beralasan |

---

## 8. Metrik keberhasilan

1. `npm run build` selesai tanpa error dan tanpa peringatan tipe.
2. Semua 15 item ruang lingkup ada dan bisa dipakai.
3. Data dari v2.1 bisa dimigrasikan tanpa kehilangan order, transaksi, atau
   jadwal shift.
4. Karyawan bisa menyelesaikan satu order penuh dari HP tanpa geser horizontal.
5. Karyawan tidak bisa membuka data keuangan, dibuktikan di level database
   (RLS), bukan hanya disembunyikan dari menu.

---

## 9. Risiko migrasi

| Risiko | Dampak | Penanganan |
|---|---|---|
| Hash password bcrypt lama tidak kompatibel dengan Supabase Auth | Karyawan tidak bisa login dengan password lama | Buat ulang akun dengan password sementara, minta ganti saat login pertama |
| Login lama pakai username, Supabase Auth butuh email | Alur login berubah | Username dipetakan ke email sintetis `username@joyops.local`, form tetap minta username |
| ID lama berupa integer naik ke `auth.users` yang UUID | Relasi tabel putus | Tabel `profiles` menyimpan `legacy_id` dan `username` untuk pemetaan |
| Zona waktu server Vercel UTC, toko di WIB | Tanggal transaksi meleset | Semua perhitungan tanggal lewat helper yang memaksa `Asia/Jakarta` |
| Data dummy lama (dummy_data_*.sql) ikut terbawa ke produksi | Laporan keuangan kotor | Seed dipisah: `01_schema.sql`, `02_seed.sql` (isi dasar saja), data dummy tidak dibawa |
