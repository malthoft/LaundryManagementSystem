-- 07_akun_developer.sql
--
-- Tabel kredensial halaman /developer.
--
-- Sebelumnya pintu /developer hanya memakai satu kunci rahasia dari berkas
-- lingkungan. Sekarang developer masuk memakai email dan sandi, dan sandinya
-- bisa diganti sendiri lewat surel. Sandi tidak pernah disimpan sebagai teks
-- biasa: yang tersimpan hanya hash scrypt beserta salt-nya.
--
-- Isinya cukup satu baris (id = 1). Tabel ini sengaja tidak diberi policy RLS
-- sama sekali: hanya kunci service role yang boleh menyentuhnya, sehingga
-- tidak ada satu pun sesi pengguna biasa yang bisa membaca hash sandinya.
--
-- Jalankan berkas ini di Supabase SQL Editor. Aman dijalankan berulang kali.

create table if not exists public.developer_akun (
  id                smallint primary key default 1,
  email             text not null,
  sandi_hash        text not null,
  sandi_salt        text not null,
  token_hash        text,
  token_hangus_pada timestamptz,
  diperbarui_pada   timestamptz not null default now(),
  constraint developer_akun_satu_baris check (id = 1)
);

alter table public.developer_akun enable row level security;

revoke all on public.developer_akun from anon, authenticated;
grant all on public.developer_akun to service_role;
