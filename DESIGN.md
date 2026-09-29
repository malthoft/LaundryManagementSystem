# DESIGN.md: JoyOps

Arah desain dan sistem token JoyOps. Dokumen ini sumber arahnya. `antislop.md`
dipakai sebagai filter di atasnya, bukan sebagai pengganti arah.

## Mode permukaan

**Operate.** Seluruh halaman adalah alat kerja. Pemakai datang untuk
menyelesaikan tugas (buat order, ubah status mesin, catat pengeluaran, setujui
tukar shift), bukan untuk melihat pameran. Scanability, konsistensi antar
halaman, dan kecepatan baca mengalahkan ekspresi visual.

Konsekuensinya, sebagian besar aturan "landing page" di skill desain tidak
relevan di sini (hero, logo bar, pricing, testimonial). Yang relevan dan wajib:
hierarki, keadaan UI lengkap, kontras, keyboard, dan disiplin mikrointeraksi.

## Design Read

> Dibaca sebagai: aplikasi operasional untuk pemilik dan karyawan laundry, dengan
> bahasa visual utilitarian-teknis yang tenang, dial ENERGY 1 / RHYTHM 2 / MOTION 2.

## Dial

```
ENERGY 1 / RHYTHM 2 / MOTION 2
```

- **ENERGY 1**: halaman tenang. Tidak ada gradien dekoratif, tidak ada glow,
  tidak ada orb blur. Warna dipakai untuk status, bukan hiasan.
- **RHYTHM 2**: satu pola section yang konsisten (judul + aksi + isi), dengan
  pemisah jelas. Variasi datang dari lebar kolom, bukan dari gonta-ganti gaya.
- **MOTION 2**: transisi antar state saja (hover, buka/tutup modal, toast,
  angka berubah). Tidak ada animasi masuk beruntun di tiap section.

## Audiens dan pekerjaan

| Peran | Yang dia kerjakan | Yang dia butuh di layar |
|---|---|---|
| Admin (pemilik/manajer) | Awasi uang, mesin, orang | Angka hari ini, status mesin, antrean persetujuan |
| Karyawan (kasir/operator) | Layani pelanggan, jalankan mesin | Buat order cepat, timer, mesin mana yang kosong |

Konsekuensi: **angka dan status mesin adalah focal point tiap layar**, bukan
judul halaman. Judul halaman kecil dan tenang; angka besar dan jelas.

## Warna

Palet dipertahankan dari JoyOps lama supaya identitasnya tidak hilang, tapi
dirapikan: satu warna aksi, satu warna tiap status, sisanya netral.

| Peran | Token | Nilai | Alasan |
|---|---|---|---|
| Aksi utama | `--color-primary` | `oklch(0.42 0.072 197)` (setara `#00666e`) | Warna merek JoyOps. Dipakai untuk aksi utama, item navigasi aktif, tautan |
| Aksi utama hover | `--color-primary-600` | `oklch(0.37 0.075 197)` | Satu langkah lebih gelap, cukup terlihat tanpa goyang |
| Latar halaman | `--color-paper` | `oklch(0.976 0.002 197)` (`#f5f7f8`) | Latar lembut, bikin kartu putih terbaca sebagai permukaan |
| Permukaan | `--color-surface` | `oklch(1 0 0)` | Kartu, tabel, modal |
| Teks utama | `--color-ink` | `oklch(0.24 0.006 197)` | Kontras tinggi di atas permukaan dan latar |
| Teks pendukung | `--color-ink-muted` | `oklch(0.47 0.008 197)` | Label, metadata. Masih lolos WCAG AA di atas permukaan |
| Garis | `--color-line` | `oklch(0.9 0.004 197)` | Pemisah struktural: baris tabel, tepi kartu |
| Status: tersedia | `--color-ok` | `oklch(0.52 0.11 155)` | Mesin siap dipakai |
| Status: dipakai | `--color-busy` | `oklch(0.72 0.14 85)` | Sedang berjalan. Amber, bukan merah, karena bukan error |
| Status: rusak | `--color-danger` | `oklch(0.5 0.19 25)` | Maintenance, gagal, hapus |
| Status: info | `--color-accent` | `oklch(0.78 0.09 222)` (`#92dcf8`) | Sorotan ringan: baris terpilih, latar ikon, chip |

Kenapa tidak biru-ungu atau neon: itu default AI dan tidak punya alasan di
aplikasi laundry. Teal sudah jadi identitas JoyOps, dan aman untuk kontras.

Tema: **terang sebagai default**. Alasan: dipakai di kasir toko dengan cahaya
terang, dan laporan keuangan dicetak. Mode gelap disediakan sebagai pilihan
(toggle bekerja penuh di kedua mode), bukan dipaksa.

## Tipografi

| Peran | Token | Font | Alasan |
|---|---|---|---|
| Judul & angka | `--font-display` | Manrope 600/700/800 | Sudah dipakai JoyOps; angka Manrope tegas dan tidak licin |
| Badan teks | `--font-body` | Inter 400/500/600 | Netral, enak dibaca di ukuran kecil pada tabel |
| Angka transaksional | `--font-numeric` | Inter + `tabular-nums` | Digit lebar tetap supaya nominal tidak goyang saat refresh |
| Ikon | Material Symbols Outlined | via `<link>` | Nama ikonnya semantik (`local_laundry_service`, `point_of_sale`), jadi relevan dengan isinya |

Tidak pakai monospace besar sebagai gaya. Tidak pakai label ALL-CAPS bertabur
sebagai hiasan; label kecil hanya untuk nama kolom tabel dan eyebrow sidebar.

## Layout

- Grid utama: sidebar tetap 15rem di layar >= 768px, konten di sebelahnya.
- Di bawah 768px sidebar jadi sheet yang bisa dibuka, tanpa geser horizontal.
- Lebar baca konten dibatasi `max-width: 80rem`, di tengah.
- Skala jarak 4pt dengan nama semantik (`--space-1` s/d `--space-12`).
- Sudut: `--radius-sm` 6px (input, tombol kecil), `--radius-md` 10px (kartu),
  `--radius-lg` 16px (modal, panel besar). Radius bersarang dihitung
  `luar = dalam + padding`. Tidak ada pil untuk semuanya.
- Elevasi: bayangan tipis hanya untuk elemen yang memang mengambang (modal,
  dropdown, toast). Kartu di grid pakai garis, bukan bayangan.

### Navigasi dan hierarki dashboard

- Sidebar dibagi dua kelompok, berlabel: **Operasional** (dashboard, order,
  mesin, absensi, shift) dan **Kendali** (layanan, keuangan, karyawan).
  Staf lapangan tidak perlu menggulir melewati menu manajerial untuk
  mencapai absensi. Definisi tunggal ada di `KELOMPOK_MENU` dan `navUntuk()`
  pada `src/lib/constants.ts`.
- **"Order baru" hanya ada di dashboard**, sebagai Quick Action Card yang
  mengisi lebar di atas metrik, dan tidak lagi di sidebar. Satu tempat,
  satu aksi, tanpa redundansi. Tautannya ke `/orders?aksi=baru` supaya
  dashboard tidak perlu menarik data mesin, layanan, dan add-on hanya untuk
  menyiapkan modal yang belum tentu dibuka.
- Kartu **"Alur hari ini"** (Diterima / Dicuci / Selesai / Transaksi)
  mengikuti urutan kerja kasir, dibaca dari kiri ke kanan. Anganya dihitung
  di server dan diteruskan apa adanya.
- Pemisahan kelompok ini berlaku untuk Admin dan Karyawan; item berlabel
  `hanya` disaring sesuai peran seperti sebelumnya.

## Motion

Primitif gerak (dokumentasi mengikuti kode, bukan sebaliknya):
`gerak-muncul` untuk kehadiran umum; `panel-masuk`/`panel-keluar` untuk
modal; `menu-masuk`/`menu-keluar` untuk dropdown; `toast-masuk`/`toast-keluar`
untuk banner notifikasi. Durasi: masuk 260ms (`--dur-panel`), keluar 160ms
(`--dur-keluar`). Kurvanya mengendur (masuk `cubic-bezier(0.16, 1, 0.3, 1)`,
keluar `cubic-bezier(0.4, 0, 0.6, 1)`), bukan linear.
`prefers-reduced-motion: reduce` mematikan semuanya. Transisi pakai
`transform` dan `opacity`, tidak pernah `transition: all`.

Tombol dan tautan interaktif memakai kelas `joyops-aksi`: `cursor: pointer`,
hover `scale(1.02)`, tekan `scale(0.96)` dengan durasi 60ms supaya terasa
responsif, dan `cursor: not-allowed` saat nonaktif. Hanya `transform` yang
berubah, jadi tidak ada layout shift.

## Keadaan UI yang wajib ada di tiap layar data

Kosong (dengan ajakan aksi, bukan ilustrasi), memuat (skeleton seukuran isi),
gagal (pesan + tombol coba lagi), dan sukses (umpan balik tanpa toast
meriah). Semua aksi punya keadaan `pending` di tombolnya.

## Aksesibilitas

Kontras minimal 4.5:1 untuk teks normal. Semua kontrol bisa dijangkau Tab
dengan urutan visual, `:focus-visible` selalu terlihat (ring 2px, kontras >= 3:1)
dan tidak pernah dianimasikan. Modal bisa ditutup dengan `Escape` dan fokus
kembali ke pemicunya. Target sentuh minimal 44px di mobile.

## Mengapa ikon ini dan bukan yang lain

Ikon diambil dari Material Symbols karena namanya semantik dan sudah menyebut
fungsinya: `local_laundry_service` untuk mesin, `point_of_sale` untuk kasir,
`event_note` untuk jadwal, `badge` untuk absensi, `leaderboard` untuk keuangan.
Ikon generik seperti percikan, bintang, atau robot tidak dipakai karena tidak
berhubungan dengan pekerjaan laundry.

Label kecil seperti "Aturan", "Masalah", dan "Catatan" dipakai untuk menandai
jenis isi, bukan hiasan, dan hanya muncul di halaman Panduan serta catatan kaki
tabel. Semuanya memakai huruf besar-kecil biasa. Huruf besar semua hanya
tersisa di kepala tabel, karena itu konvensi yang sudah dipahami pembaca tabel.

Panah (`chevron_right`, `arrow_right`) hanya muncul di dua tempat: penanda arah
pada baris daftar yang memang bisa dibuka, dan penomoran langkah di halaman
Panduan. Keduanya menunjukkan arah, bukan hiasan. Tidak ada tombol yang diberi
panah hanya supaya terlihat ramai.

## Bagaimana kontras dijaga

Semua pasangan warna teks terhadap latarnya diperiksa mesin, bukan hanya
diperkirakan: `npm run cek:kontras`. Skrip itu membaca token langsung dari
`src/app/globals.css` untuk mode terang dan gelap, lalu menghitung rasio
kontras. Ambangnya WCAG AA, 4.5:1 untuk teks normal dan 3:1 untuk cincin fokus.
Skrip keluar dengan kode 1 bila ada yang gagal, jadi bisa dipakai sebagai
pemeriksaan sebelum kirim.

## Yang dilarang di JoyOps

- Gradien dekoratif, glow, orb blur di latar.
- Em dash di teks UI maupun dokumen.
- Angka statistik karangan. Kalau data belum ada, tampilkan `0`, bukan angka hiasan.
- Tombol yang tidak melakukan apa pun.
- Ikon hiasan yang tidak berhubungan dengan fiturnya.
- Bayangan di setiap komponen sampai halaman terasa mengambang.
- Animasi masuk berulang di setiap section.
