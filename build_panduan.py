#!/usr/bin/env python
# Bangun dokumen panduan penjelasan Security dan Performance (JoyOps).

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Cm, RGBColor


TEAL = RGBColor(0x0F, 0x76, 0x6E)
TEAL_MUDA = "DDF2EF"
GELAP = RGBColor(0x1E, 0x29, 0x3B)
ABU = RGBColor(0x4B, 0x55, 0x63)
KODE_LATAR = "F4F6F8"


# ---------- util dasar ----------
def _shade(cell, warna):
    tcpr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), warna)
    tcpr.append(shd)


def kasih_tebal(par):
    runs = list(par.runs)
    if not runs:
        return
    teks_penuh = "".join(r.text for r in runs)
    if "**" not in teks_penuh:
        return
    nama = runs[0].font.name or "Calibri"
    ukuran = runs[0].font.size
    warna = runs[0].font.color.rgb if (runs[0].font.color and runs[0].font.color.rgb) else None
    for r in runs:
        r._element.getparent().remove(r._element)
    for i, potong in enumerate(teks_penuh.split("**")):
        if not potong:
            continue
        r = par.add_run(potong)
        r.font.name = nama
        if ukuran:
            r.font.size = ukuran
        if warna:
            r.font.color.rgb = warna
        r.bold = (i % 2 == 1)


def par_dasar(doc, spasi_sesudah=6, spasi_sebelum=0):
    par = doc.add_paragraph()
    par.paragraph_format.space_after = Pt(spasi_sesudah)
    par.paragraph_format.space_before = Pt(spasi_sebelum)
    par.paragraph_format.line_spacing = 1.15
    return par


def Q(text, spasi_sesudah=6, abu=False, ukuran=10.5):
    par = par_dasar(doc, spasi_sesudah)
    r = par.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(ukuran)
    if abu:
        r.font.color.rgb = ABU
    kasih_tebal(par)
    return par


def bullet(text):
    par = par_dasar(doc, spasi_sesudah=3)
    par.paragraph_format.left_indent = Cm(0.6)
    r = par.add_run("*  ")
    r.font.name = "Calibri"
    r.font.size = Pt(10.5)
    r.font.color.rgb = TEAL
    r2 = par.add_run(text)
    r2.font.name = "Calibri"
    r2.font.size = Pt(10.5)
    kasih_tebal(par)
    return par


def H1(text):
    par = par_dasar(doc, spasi_sesudah=6, spasi_sebelum=16)
    r = par.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = TEAL
    return par


def H2(text):
    par = par_dasar(doc, spasi_sesudah=4, spasi_sebelum=12)
    r = par.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = GELAP
    return par


def kod(baris, bahasa="ts"):
    par = par_dasar(doc, spasi_sesudah=8, spasi_sebelum=2)
    par.paragraph_format.left_indent = Cm(0.35)
    par.paragraph_format.space_after = Pt(8)
    par.paragraph_format.line_spacing = 1.0
    teks = "\n".join(baris)
    r = par.add_run(teks)
    r.font.name = "Consolas"
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(0x1F, 0x2A, 0x37)
    ppr = par._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), KODE_LATAR)
    ppr.append(shd)
    return par


def tabel(header, baris, lebar=None, huruf=9):
    t = doc.add_table(rows=1, cols=len(header))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = True
    hr = t.rows[0].cells
    for i, teks in enumerate(header):
        hr[i].text = ""
        par = hr[i].paragraphs[0]
        par.paragraph_format.space_after = Pt(2)
        par.paragraph_format.space_before = Pt(2)
        r = par.add_run(teks)
        r.font.name = "Calibri"
        r.font.size = Pt(huruf)
        r.font.bold = True
        r.font.color.rgb = TEAL
        _shade(hr[i], TEAL_MUDA)
    for isi in baris:
        cells = t.add_row().cells
        for i, teks in enumerate(isi):
            cells[i].text = ""
            par = cells[i].paragraphs[0]
            par.paragraph_format.space_after = Pt(2)
            par.paragraph_format.space_before = Pt(2)
            par.paragraph_format.line_spacing = 1.05
            for j, potong in enumerate(str(teks).split("\n")):
                if j:
                    par = cells[i].add_paragraph()
                    par.paragraph_format.space_after = Pt(2)
                    par.paragraph_format.line_spacing = 1.05
                r = par.add_run(potong)
                r.font.name = "Calibri"
                r.font.size = Pt(huruf)
                if potong.startswith("*  "):
                    r.font.color.rgb = ABU
            kasih_tebal(par)
    if lebar:
        for row in t.rows:
            for i, w in enumerate(lebar):
                row.cells[i].width = Cm(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return t


def pil_kode(nomor, judul, tag):
    par = par_dasar(doc, spasi_sesudah=2, spasi_sebelum=12)
    r = par.add_run("TEST " + nomor + "  ")
    r.font.name = "Calibri"
    r.font.size = Pt(9)
    r.font.bold = True
    r.font.color.rgb = TEAL
    r2 = par.add_run(tag)
    r2.font.name = "Consolas"
    r2.font.size = Pt(8.5)
    r2.font.color.rgb = ABU
    Q("**" + judul + "**", spasi_sesudah=6)


# ---------- dokumen ----------
doc = Document()
gaya = doc.styles["Normal"]
gaya.font.name = "Calibri"
gaya.font.size = Pt(10.5)

sek = doc.sections[0]
sek.left_margin = Cm(2.2)
sek.right_margin = Cm(2.2)
sek.top_margin = Cm(2.0)
sek.bottom_margin = Cm(2.0)


# ===== JUDUL =====
par = doc.add_paragraph()
par.paragraph_format.space_after = Pt(2)
r = par.add_run("Membuktikan Kriteria Security dan Performance")
r.font.name = "Calibri"
r.font.size = Pt(20)
r.font.bold = True
r.font.color.rgb = TEAL

par = doc.add_paragraph()
par.paragraph_format.space_after = Pt(2)
r = par.add_run("Panduan penjelasan untuk presentasi dan tanya jawab")
r.font.name = "Calibri"
r.font.size = Pt(13)
r.font.color.rgb = GELAP

par = doc.add_paragraph()
par.paragraph_format.space_after = Pt(10)
r = par.add_run("Sistem Manajemen Laundry JoyOps  *  Pengujian Otomatis dengan Vitest")
r.font.name = "Calibri"
r.font.size = Pt(9.5)
r.font.color.rgb = ABU
kasih_tebal(par)

par = par_dasar(doc, spasi_sesudah=14)
ppr = par._p.get_or_add_pPr()
bd = OxmlElement("w:pBdr")
btm = OxmlElement("w:bottom")
btm.set(qn("w:val"), "single")
btm.set(qn("w:sz"), "12")
btm.set(qn("w:color"), "0F766E")
bd.append(btm)
ppr.append(bd)

Q("Dokumen ini memuat empat hal: apa yang diminta lembar inspeksi perangkat lunak, "
  "bagaimana permintaan itu diubah menjadi tiga pengujian otomatis, cara menjalankannya di "
  "depan penguji, serta jawaban siap pakai untuk pertanyaan yang paling sering muncul.", abu=True)


# ===== A =====
H1("A.  Apa yang diminta lembar inspeksi")
Q("Pada lembar Software Inspection terdapat dua kriteria yang harus dibuktikan melalui "
  "pengujian otomatis. Berikut butir lengkapnya persis seperti tertulis di lembar tersebut.")

tabel(
    ["Kriteria", "Butir yang diminta lembar inspeksi"],
    [
        ["**3. Security**",
         "*  Tidak ada kata sandi, token autentikasi, atau kunci rahasia yang tertulis langsung di dalam kode.\n"
         "*  Akses data pengguna dan mutasi basis data dibatasi berdasarkan hak akses peran pengguna.\n"
         "*  Bebas dari injeksi basis data lewat kueri terparameter serta bebas dari Cross-Site Scripting."],
        ["**4. Performance**",
         "*  Tidak ada perulangan bertingkat yang tidak perlu atau alokasi memori yang boros.\n"
         "*  Pengambilan data memanfaatkan eksekusi di sisi server untuk meminimalkan beban di peramban.\n"
         "*  Kueri basis data terindeks dan efisien, tidak menimbulkan masalah N+1 query."],
    ],
    lebar=[3.4, 13.0],
    huruf=9.5,
)

Q("**Alat bantu yang ditetapkan lembar inspeksi:**", spasi_sesudah=2)
bullet("Security memakai Vitest, npm audit, dan Gitleaks.")
bullet("Performance memakai Vitest Benchmark Assertions.")
Q("Ketiga pengujian kita memakai **Vitest**, sehingga selaras dengan alat bantu yang diminta, "
  "sekaligus satu perintah untuk menjalankan semuanya.", spasi_sesudah=4)


# ===== B =====
H1("B.  Mengapa menjadi tiga pengujian")
Q("Lembar inspeksi memuat enam butir, namun tidak semua butir memiliki bukti otomatis yang mudah "
  "diukur. Kita memilih **tiga kondisi yang paling inti dan paling jelas buktinya**, supaya mudah "
  "pula dijelaskan saat presentasi.")

tabel(
    ["ID", "Kriteria", "Butir yang dibuktikan", "Cara pembuktian"],
    [
        ["NFR-001", "Security", "Butir 1, rahasia tidak hardcoded", "Pemindaian statis seluruh kode"],
        ["NFR-002", "Security", "Butir 2, akses dibatasi peran", "Memanggil fungsi sebagai Karyawan, harus ditolak"],
        ["NFR-003", "Performance", "Butir 1 dan 3, komputasi ringan dan kueri efisien", "Ukur waktu eksekusi memakai benchmark"],
    ],
    lebar=[2.0, 2.6, 5.6, 6.2],
    huruf=9,
)

Q("**Kalimat kunci untuk dosen:**", spasi_sesudah=2)
kod([
    "Kami memilih kondisi pengujian yang punya bukti otomatis yang terukur.",
    "Butir lain seperti pencegahan injeksi basis data sudah ditekan lewat desain,",
    "yakni seluruh kueri memakai pembentuk kueri Supabase, bukan SQL yang dirakit",
    "dari string. Hal itu dibuktikan saat pemeriksaan kode.",
], bahasa="text")


# ===== C =====
H1("C.  Penjelasan tiap pengujian")

# --- 1 ---
pil_kode("1", "Tidak ada rahasia yang ditulis langsung di kode", "security.test.ts")
Q("**Yang diuji.** Seluruh 90 berkas sumber pada folder src dipindai satu per satu.")
Q("**Cara kerjanya.** Setiap baris kode dibaca lalu dicocokkan ke beberapa pola bahaya, yaitu "
  "penugasan kata sandi dan bentuk umum kunci API atau token.")
kod([
    "const pola = [",
    "  /(?:password|passwd|sandi)\\s*[:=]\\s*[\"'][^\"']{6,}[\"']/i,",
    "  /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\\s*[:=]\\s*[\"'][^\"']{8,}[\"']/i,",
    "  /sk-[A-Za-z0-9]{20,}/,",
    "];",
    "",
    "expect(temuan).toEqual([]);   // daftar temuan harus kosong",
])
Q("**Hasilnya.** Daftar temuan kosong, berarti tidak ada satu pun kata sandi atau kunci yang "
  "nempel di kode. Semuanya dibaca dari variabel lingkungan lewat berkas .env yang tidak ikut "
  "tersimpan di repositori.")
Q("**Cara menjelaskan ke dosen.**", spasi_sesudah=2)
kod([
    "Kami memindai seluruh 90 berkas TypeScript dan TSX secara statis memakai",
    "ekspresi reguler untuk mencari pola penugasan kata sandi dan kunci API.",
    "Hasil pemindaian kosong, artinya seluruh kredensial dibaca dari variabel",
    "lingkungan. Sifatnya otomatis, jadi bila kelak ada pengembang yang menulis",
    "sandi di dalam kode, pengujian ini langsung gagal.",
], bahasa="text")

# --- 2 ---
pil_kode("2", "Karyawan ditolak saat menyentuh data keuangan", "security.test.ts")
Q("**Yang diuji.** Fungsi simpanTransaksiAction pada finance.controller, yaitu pintu masuk modul keuangan.")
Q("**Cara kerjanya, tiga langkah.**")
bullet("**Atur peran.** Sesi disetel menjadi Karyawan.")
bullet("**Panggil fungsi sungguhan.** Kita memanggil simpanTransaksiAction secara langsung, tanpa lewat tombol di layar.")
bullet("**Harus ditolak.** Sistem wajib mengembalikan kegagalan, bukan berhasil.")
kod([
    "expect(hasil.ok).toBe(false);",
    "expect(hasil.error).toMatch(/Hanya Admin/i);   // pesan penolakan yang diharapkan",
    "",
    "// Penjaga yang bekerja di dalam kode produksi:",
    "if (profil.role !== \"Admin\") {",
    "  return { tolakan: \"Hanya Admin yang boleh mengubah catatan keuangan.\" };",
    "}",
])
Q("**Hasilnya.** Panggilan ditolak dengan pesan \"Hanya Admin yang boleh mengubah catatan "
  "keuangan\". Artinya kendali peran berada di sisi server, bukan sekadar menyembunyikan tombol "
  "di antarmuka.")
Q("**Cara menjelaskan ke dosen.**", spasi_sesudah=2)
kod([
    "Kami memalsukan sesi sebagai Karyawan lalu memanggil server action keuangan",
    "secara langsung, tanpa melalui antarmuka. Sistem mengembalikan penolakan.",
    "Ini penting karena menyembunyikan tombol di layar tidaklah cukup, sebab",
    "orang tetap bisa memanggil API-nya langsung. Di sini terbukti penolakan",
    "terjadi pada lapisan server.",
], bahasa="text")

# --- 3 ---
pil_kode("3", "Menghitung 5000 pesanan di bawah 50 milidetik", "performance.test.ts")
Q("**Yang diuji.** Fungsi ringkasOrderTanggal pada order.model, yaitu yang menjumlahkan total "
  "pesanan untuk ditampilkan di dasbor.")
Q("**Cara kerjanya.**")
bullet("**Siapkan 5.000 data pesanan**, menggambarkan satu bulan yang ramai.")
bullet("**Ukur waktunya** memakai performance.now(), pengukur waktu bawaan peramban dan Node.")
bullet("**Wajib di bawah 50 milidetik**, dan hasil hitungannya pun harus benar 5.000 baris, supaya bukan sekadar cepat tetapi salah.")
kod([
    "const AMBANG_MS  = 50;",
    "const JUMLAH_DATA = 5000;",
    "",
    "const mulai  = performance.now();",
    "const hasil  = await ringkasOrderTanggal(klienTiruan(data), \"2026-09-29\");",
    "const durasi = performance.now() - mulai;",
    "",
    "expect(hasil.jumlah).toBe(JUMLAH_DATA);   // hasilnya harus benar",
    "expect(durasi).toBeLessThan(AMBANG_MS);   // dan harus cepat",
])
Q("**Hasilnya.** Lima ribu pesanan dihitung dalam waktu sekitar tiga milidetik, jauh di bawah "
  "batas 50 milidetik. Batas itu dipilih supaya dasbor terasa langsung muncul dan pengguna tidak "
  "merasa sistem lambat.")
Q("**Cara menjelaskan ke dosen.**", spasi_sesudah=2)
kod([
    "Ini pengujian benchmark seperti pada tabel alat bantu. Kami memberi 5.000",
    "baris data lalu mengukur waktu eksekusi agregasinya dengan performance.now().",
    "Batas toleransi 50 milidetik, hasilnya sekitar 3 milidetik. Sebab agregasinya",
    "memakai satu kueri terindeks, tidak terjadi N+1 query, sehingga sekaligus",
    "membuktikan butir performa soal kueri yang efisien.",
], bahasa="text")


# ===== D =====
H1("D.  Cara memperagakan di depan penguji")
Q("Buka terminal pada folder proyek, lalu jalankan satu perintah ini.")
kod(["npm run test:detail"])
Q("Keluaran yang muncul persis seperti berikut, dan **bagian inilah yang ditangkap layarnya**.")
kod([
    " v  performance.test.ts  Performance  menghitung total 5000 order di bawah 50 ms   13ms",
    " v  security.test.ts     Security     tidak ada kata sandi atau kunci API yang ditulis",
    "                                       langsung di kode                             83ms",
    " v  security.test.ts     Security     Karyawan tidak bisa menyimpan catatan",
    "                                       keuangan (hanya Admin)                      344ms",
    "",
    " Test Files   2 passed (2)",
    "      Tests   3 passed (3)",
], bahasa="text")
Q("**Yang ditunjuk sambil menjelaskan:**")
bullet("Tanda v di awal baris berarti pengujian tersebut **lulus**.")
bullet("Baris **Tests 3 passed (3)** berarti tiga kondisi diuji dan tiga berhasil. Inilah yang dimaksud perbandingan jumlah kondisi dengan yang berhasil.")
bullet("Angka di belakang seperti 13ms atau 83ms adalah **waktu eksekusi** pengujian tersebut.")
Q("Bila ingin diperagakan terpisah sesuai kriteria:")
kod([
    "npm run test:security      // Tests  2 passed (2)   untuk NFR-001 dan NFR-002",
    "npm run test:performance   // Tests  1 passed (1)   untuk NFR-003",
])


# ===== E =====
H1("E.  Pertanyaan yang paling sering muncul dan jawabannya")
tabel(
    ["Pertanyaan penguji", "Jawaban siap pakai"],
    [
        ["Mengapa hanya tiga pengujian, kan kriterianya enam butir?",
         "Kami mengutamakan kondisi yang punya bukti otomatis yang objektif dan mudah diverifikasi. "
         "Butir seperti pencegahan injeksi basis data dibuktikan lewat desain, yakni seluruh kueri "
         "memakai pembentuk kueri Supabase sehingga tidak ada SQL mentah yang dirakit dari string. "
         "Hal itu terlihat saat pemeriksaan kode."],
        ["Itu benar-benar menguji kode asli atau buatan belaka?",
         "Kode asli. Yang dipanggil, yaitu simpanTransaksiAction dan ringkasOrderTanggal, adalah "
         "fungsi produksi yang sama persis dipakai aplikasi. Yang diganti hanya modul luar seperti "
         "Next.js dan koneksi basis data, diganti tiruan supaya bisa berjalan di terminal tanpa "
         "server. Logika intinya tetap asli."],
        ["Mengapa basis datanya diganti tiruan?",
         "Supaya hasilnya konsisten dan cepat. Bila memakai basis data sungguhan, waktu 50 milidetik "
         "itu bisa terpengaruh keadaan jaringan sehingga tidak murni mengukur kemampuan kode. Karena "
         "itu kami mengukur bagian komputasinya, dan itulah titik lemah performa yang paling mungkin "
         "terjadi."],
        ["Apa buktinya tidak ada rahasia di dalam kode?",
         "Pengujian membaca seluruh 90 berkas sumber lalu mencocokkan pola seperti penugasan kata "
         "sandi dan kunci API. Hasilnya kosong. Bahkan bila kelak ada yang menulis sandi di kode, "
         "pengujian ini otomatis gagal setiap kali dijalankan."],
        ["Kalau ada yang gagal, apakah kelihatan?",
         "Kelihatan. Tandanya berubah menjadi silang dan baris Tests berubah menjadi misalnya "
         "2 passed 1 failed. Kami dapat memperagakannya dengan menulis sandi palsu di kode, maka "
         "pengujian langsung berubah merah."],
    ],
    lebar=[5.4, 11.0],
    huruf=9,
)


# ===== F =====
H1("F.  Ringkasan singkat")
par = par_dasar(doc, spasi_sesudah=4, spasi_sebelum=2)
par.paragraph_format.left_indent = Cm(0.35)
ppr = par._p.get_or_add_pPr()
shd = OxmlElement("w:shd")
shd.set(qn("w:val"), "clear")
shd.set(qn("w:fill"), TEAL_MUDA)
ppr.append(shd)
r = par.add_run(
    "Security dibuktikan dengan memindai seluruh kode untuk mencari rahasia, hasilnya nihil, "
    "lalu memanggil fungsi keuangan sebagai Karyawan, hasilnya ditolak. Performance dibuktikan "
    "dengan menghitung 5.000 pesanan yang selesai dalam sekitar tiga milidetik, jauh di bawah "
    "batas 50 milidetik. Ketiganya berjalan otomatis lewat satu perintah npm test, dengan hasil "
    "3 passed dari 3 kondisi."
)
r.font.name = "Calibri"
r.font.size = Pt(10.5)
r.font.color.rgb = GELAP


doc.save("docs/Panduan_Testing_Security_Performance.docx")
print("Selesai: docs/Panduan_Testing_Security_Performance.docx")
