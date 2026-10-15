-- 06_perbaikan_notifikasi.sql
--
-- Perbaikan kebijakan RLS pada tabel public.notifications.
--
-- Gejala yang diperbaiki:
--   Tombol "Bersihkan" dan "Tandai dibaca" pada lonceng notifikasi terlihat
--   berhasil, tetapi begitu halaman disegarkan notifikasinya muncul kembali.
--
-- Sebabnya:
--   PostgREST tidak melempar galat ketika RLS menolak sebuah baris. Baris yang
--   tidak lolos policy hanya "tidak tersentuh", sehingga aplikasi menerima
--   balasan sukses dengan nol baris terhapus/terubah. Tabel notifications
--   hanya punya policy SELECT dan UPDATE, dan sama sekali tidak punya policy
--   DELETE — jadi penghapusan selalu nol baris tanpa pesan kesalahan apa pun.
--
-- Jalankan berkas ini di Supabase SQL Editor. Aman dijalankan berulang kali.

-- Baca: hanya baris milik sendiri.
drop policy if exists notif_baca on public.notifications;
create policy notif_baca on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

-- Ubah: hanya baris milik sendiri, dan hasil ubahannya tetap harus milik sendiri.
drop policy if exists notif_tandai on public.notifications;
create policy notif_tandai on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Hapus: hanya baris milik sendiri. Policy inilah yang selama ini hilang.
drop policy if exists notif_hapus on public.notifications;
create policy notif_hapus on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());
