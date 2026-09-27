-- ============================================================================
-- JoyOps v3 : Data Awal
-- Jalankan setelah 01_schema.sql. Aman dijalankan berulang (idempoten).
-- Berisi hanya data dasar toko. Data dummy lama dari v2.1 tidak dibawa.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Layanan
--    qty pada order memakai satuan kolom `unit`.
--    duration_minutes boleh diubah Admin dari menu Layanan.
-- ---------------------------------------------------------------------------
insert into public.services (service_name, price, unit, duration_minutes, icon)
select v.service_name, v.price, v.unit, v.duration_minutes, v.icon
  from (values
    ('Laundry Kiloan', 8000.00::numeric,  'kg',  90, 'local_laundry_service'),
    ('Dry Wash',      25000.00::numeric,  'pcs', 60, 'dry_cleaning'),
    ('Cuci Lipat',    10000.00::numeric,  'kg',  45, 'iron')
  ) as v(service_name, price, unit, duration_minutes, icon)
 where not exists (
   select 1 from public.services s where lower(s.service_name) = lower(v.service_name)
 );

-- ---------------------------------------------------------------------------
-- 2. Add-on
-- ---------------------------------------------------------------------------
insert into public.addons (addon_name, price, icon)
select v.addon_name, v.price, v.icon
  from (values
    ('Deterjen', 3000.00::numeric, 'science'),
    ('Pewangi',  2000.00::numeric, 'spa'),
    ('Pemutih',  4000.00::numeric, 'brightness_7'),
    ('Pelembut', 3500.00::numeric, 'water_drop'),
    ('Pelicin',  3000.00::numeric, 'add_circle'),
    ('Harpic',   2500.00::numeric, 'add_circle')
  ) as v(addon_name, price, icon)
 where not exists (
   select 1 from public.addons a where lower(a.addon_name) = lower(v.addon_name)
 );

-- ---------------------------------------------------------------------------
-- 3. Mesin
--    Awalan WM- = mesin cuci, DM- = mesin pengering. Prefix ini yang dipakai
--    aplikasi untuk memisahkan daftar mesin pada form order.
--    Semua disemai Tersedia. Untuk menandai mesin rusak:
--      update public.machines set status = 'Maintenance' where machine_code = 'WM-03';
-- ---------------------------------------------------------------------------
insert into public.machines (machine_code, machine_type, status)
select v.machine_code, v.machine_type, 'Tersedia'
  from (values
    ('WM-01', 'Washing Machine 15kg'),
    ('WM-02', 'Washing Machine 15kg'),
    ('WM-03', 'Washing Machine 15kg'),
    ('WM-04', 'Washing Machine 15kg'),
    ('WM-05', 'Washing Machine 15kg'),
    ('WM-06', 'Washing Machine 7kg'),
    ('WM-07', 'Washing Machine 7kg'),
    ('DM-01', 'Dryer Machine 15kg'),
    ('DM-02', 'Dryer Machine 15kg'),
    ('DM-03', 'Dryer Machine 15kg'),
    ('DM-04', 'Dryer Machine 15kg'),
    ('DM-05', 'Dryer Machine 15kg')
  ) as v(machine_code, machine_type)
 where not exists (
   select 1 from public.machines m where m.machine_code = v.machine_code
 );

-- ---------------------------------------------------------------------------
-- 4. Laporan singkat
-- ---------------------------------------------------------------------------
do $$
declare
  v_layanan int;
  v_addon   int;
  v_mesin   int;
  v_akun    int;
begin
  select count(*) into v_layanan from public.services;
  select count(*) into v_addon   from public.addons;
  select count(*) into v_mesin   from public.machines;
  select count(*) into v_akun    from public.profiles;

  raise notice 'Layanan: %, Add-on: %, Mesin: %, Akun: %', v_layanan, v_addon, v_mesin, v_akun;

  if v_akun = 0 then
    raise notice 'Belum ada akun. Lanjutkan ke 03_auth_users.sql atau jalankan scripts/seed-auth-users.mjs';
  end if;
end $$;
