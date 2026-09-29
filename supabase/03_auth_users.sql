-- ============================================================================
-- JoyOps v3 : Akun Karyawan Lewat SQL  (JALUR CADANGAN)
-- ============================================================================
--
-- BACA DULU SEBELUM MENJALANKAN
--
--   Jalur utama pembuatan akun adalah `scripts/seed-auth-users.mjs`, yang
--   memakai API resmi Supabase Auth (auth.admin.createUser). Berkas ini hanya
--   dipakai kalau kamu memang mau memasukkan akun langsung dari SQL Editor.
--
--   Risiko jalur ini: berkas menulis langsung ke tabel `auth.users` dan
--   `auth.identities`, yang bentuk kolomnya bisa berubah antar versi Supabase.
--   Kalau muncul galat kolom tidak dikenal, hapus baris kolom itu, atau
--   pakai script tersebut di atas.
--
--   SANDI SEMENTARA di bawah ini hanya contoh. Wajib diganti setelah login
--   pertama. Jangan pernah menyimpan sandi asli di berkas yang masuk git.
--
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Akun
--    Trigger handle_new_user() akan otomatis membuat baris `profiles`
--    dari metadata di bawah.
-- ---------------------------------------------------------------------------
with akun(email, username, nama, peran, sandi) as (
  values
    ('admin@joyops.local',     'admin',     'Administrator', 'Admin',    'JoyOps#2026'),
    ('operator1@joyops.local', 'operator1', 'Operator Satu', 'Karyawan', 'JoyOps#2026'),
    ('operator2@joyops.local', 'operator2', 'Operator Dua',  'Karyawan', 'JoyOps#2026')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token,
  reauthentication_token, is_sso_user, is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  a.email,
  extensions.crypt(a.sandi, extensions.gen_salt('bf')),
  now(), now(), now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object('username', a.username, 'full_name', a.nama, 'role', a.peran),
  '', '', '', '', '', '', '', '',
  false, false
from akun a
where not exists (select 1 from auth.users u where u.email = a.email);

-- ---------------------------------------------------------------------------
-- 2. Identitas login (wajib, tanpa ini login gagal walau user ada)
-- ---------------------------------------------------------------------------
insert into auth.identities (
  user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  u.id,
  u.email,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(), now(), now()
from auth.users u
where u.email like '%@joyops.local'
  and not exists (select 1 from auth.identities i where i.user_id = u.id);

-- ---------------------------------------------------------------------------
-- 3. Pastikan profil dan peran sesuai
-- ---------------------------------------------------------------------------
insert into public.profiles (id, username, full_name, role)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'username', ''), split_part(u.email, '@', 1)),
  coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), initcap(split_part(u.email, '@', 1))),
  coalesce(nullif(u.raw_user_meta_data->>'role', ''), 'Karyawan')
from auth.users u
where u.email like '%@joyops.local'
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Laporan
-- ---------------------------------------------------------------------------
do $$
declare
  v_akun int;
  v_admin int;
begin
  select count(*) into v_akun from public.profiles;
  select count(*) into v_admin from public.profiles where role = 'Admin';

  raise notice 'Akun: %, Admin: %', v_akun, v_admin;

  if v_admin = 0 then
    raise warning 'Tidak ada Admin. Tanpa Admin, menu keuangan dan data karyawan tidak bisa dibuka siapa pun.';
  end if;
end $$;
