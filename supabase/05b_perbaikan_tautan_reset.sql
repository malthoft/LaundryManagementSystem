-- JoyOps 05b: Perbaikan penerbitan tautan reset sandi
--
-- Aman dijalankan berulang di Supabase SQL Editor.
--
-- Dua cacat yang dibetulkan dari versi 05:
--   1. gen_random_bytes() butuh ekstensi pgcrypto yang tidak pernah dipasang.
--      Akibatnya setujui "Lupa Sandi" selalu gagal di baris penerbitan token,
--      sementara "Pendaftaran" lolos karena kembali sebelum baris itu.
--      Diganti gen_random_uuid() yang sudah bawaan PostgreSQL 13+.
--   2. Eksekusi fungsi dicabut dari `public` tetapi tidak pernah diberikan ke
--      `service_role`, sehingga halaman developer bisa saja ditolak mentah.

create or replace function public.putuskan_permintaan(
  p_id      bigint,
  p_setuju  boolean,
  p_catatan text default null
)
returns text          -- token reset, atau null
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req   public.permintaan_akun;
  v_token text;
begin
  select * into v_req from public.permintaan_akun where id = p_id for update;
  if not found then
    raise exception 'Permintaan tidak ditemukan' using errcode = '22023';
  end if;

  if v_req.status <> 'Menunggu' then
    raise exception 'Permintaan sudah diputuskan' using errcode = '22023';
  end if;

  update public.permintaan_akun
     set status          = case when p_setuju then 'Disetujui' else 'Ditolak' end,
         catatan         = nullif(btrim(coalesce(p_catatan, '')), ''),
         diputuskan_pada = now(),
         diputuskan_oleh = 'developer'
   where id = p_id;

  if not p_setuju then
    -- Ditolak: akun tetap tidak aktif, tidak ada yang diterbitkan.
    return null;
  end if;

  if v_req.jenis = 'Pendaftaran' then
    update public.profiles
       set is_active = true
     where username = v_req.username;
    return null;
  end if;

  -- Lupa Sandi: terbitkan tautan sekali pakai, berlaku 30 menit.
  -- Dua UUID v4 digabung jadi 64 karakter acak, tanpa ekstensi tambahan.
  loop
    v_token := replace(gen_random_uuid()::text, '-', '')
             || replace(gen_random_uuid()::text, '-', '');
    exit when not exists (
      select 1 from public.permintaan_akun where token_reset = v_token
    );
  end loop;

  update public.permintaan_akun
     set token_reset       = v_token,
         token_hangus_pada = now() + interval '30 minutes',
         token_terpakai    = false
   where id = p_id;

  return v_token;
end;
$$;

revoke execute on function public.putuskan_permintaan(bigint,boolean,text)
  from anon, authenticated, public;

grant execute on function public.putuskan_permintaan(bigint,boolean,text)
  to service_role;

comment on function public.putuskan_permintaan(bigint,boolean,text)
  is 'Memutus permintaan akun. Dipanggil hanya dari halaman developer dengan service role key.';
