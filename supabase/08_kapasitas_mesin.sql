-- 08_kapasitas_mesin.sql
-- Tujuan: satu muatan cucian harus lolos KEDUA mesin (cuci lalu pengering),
-- jadi batas jumlah cucian adalah kapasitas TERKECIL dari kedua mesin,
-- bukan jumlah kapasitas keduanya.
--
-- Jalankan sekali di Supabase SQL Editor. Aman diulang.

alter table public.machines
  add column if not exists capacity_kg  numeric(6,2) not null default 10,
  add column if not exists capacity_pcs int         not null default 20;

-- Kapasitas lama yang tidak masuk akal dinormalkan ke batas yang sah.
update public.machines
set capacity_kg = 10
where capacity_kg < 5 or capacity_kg > 30;

update public.machines
set capacity_pcs = 20
where capacity_pcs < 5 or capacity_pcs > 50;

comment on column public.machines.capacity_kg  is 'Kapasitas mesin dalam kilogram. Batas jumlah cucian = nilai terkecil antara mesin cuci dan mesin pengering.';
comment on column public.machines.capacity_pcs is 'Kapasitas mesin dalam potongan. Dipakai untuk layanan bersatuan pcs.';
