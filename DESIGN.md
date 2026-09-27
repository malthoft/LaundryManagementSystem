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

## Motion

Tiga primitif saja: `fade-in` untuk kemunculan panel, `slide-up-sm` untuk
modal dan toast, `count-pop` sekali saat nominal order berubah. Durasi 120-220ms,
easing `--ease-out` untuk masuk dan `--ease-in-out` untuk perubahan state.
`prefers-reduced-motion: reduce` mematikan ketiganya. Transisi pakai
`transform` dan `opacity`, tidak pernah `transition: all`.

## Keadaan UI yang wajib ada di tiap layar data

Kosong (dengan ajakan aksi, bukan ilustrasi), memuat (skeleton seukuran isi),
gagal (pesan + tombol coba lagi), dan sukses (umpan balik tanpa toast
meriah). Semua aksi punya keadaan `pending` di tombolnya.

## Aksesibilitas

Kontras minimal 4.5:1 untuk teks normal. Semua kontrol bisa dijangkau Tab
dengan urutan visual, `:focus-visible` selalu terlihat (ring 2px, kontras >= 3:1)
dan tidak pernah dianimasikan. Modal bisa ditutup dengan `Escape` dan fokus
kembali ke pemicunya. Target sentuh minimal 44px di mobile.

## Yang dilarang di JoyOps

- Gradien dekoratif, glow, orb blur di latar.
- Em dash di teks UI maupun dokumen.
- Angka statistik karangan. Kalau data belum ada, tampilkan `0`, bukan angka hiasan.
- Tombol yang tidak melakukan apa pun.
- Ikon hiasan yang tidak berhubungan dengan fiturnya.
- Bayangan di setiap komponen sampai halaman terasa mengambang.
- Animasi masuk berulang di setiap section.
