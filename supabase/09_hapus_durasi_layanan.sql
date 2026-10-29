-- 09_hapus_durasi_layanan.sql
-- Durasi pengerjaan dipindah dari layanan ke order.
-- Dijalankan di Supabase SQL Editor setelah kode sudah di-push.

-- 1. Hapus kolom duration_minutes dari services
alter table public.services
  drop column if exists duration_minutes;

-- 2. Hapus fungsi lama (signature tanpa p_duration_minutes)
drop function if exists public.buat_order(
  bigint, bigint, bigint, text, numeric,
  bigint[], text, text
);

-- 3. Buat fungsi baru dengan parameter durasi dari order
create function public.buat_order(
  p_washer_id       bigint,
  p_dryer_id        bigint,
  p_service_id      bigint,
  p_customer_name   text,
  p_qty             numeric,
  p_duration_minutes int,        -- baru: durasi dari form order
  p_addon_ids       bigint[],
  p_payment_method  text,
  p_notes           text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wm    public.machines;
  v_dm    public.machines;
  v_layanan public.services;
  v_saya  uuid := auth.uid();
  v_qty   numeric;
  v_durasi int;
  v_svc_total numeric;
  v_kode  text;
  v_order public.orders;
  v_add_total numeric;
begin
  -- Validasi dasar
  if p_washer_id is null or p_dryer_id is null or p_service_id is null then
    raise exception 'Mesin dan layanan wajib diisi' using errcode = '23514';
  end if;

  if p_washer_id = p_dryer_id then
    raise exception 'Mesin cuci dan pengering harus berbeda' using errcode = '23514';
  end if;

  if p_qty is null or p_qty <= 0 then
    raise exception 'Qty harus lebih dari 0' using errcode = '23514';
  end if;

  if p_duration_minutes is null or p_duration_minutes < 1 or p_duration_minutes > 180 then
    raise exception 'Durasi harus antara 1 sampai 180 menit' using errcode = '23514';
  end if;

  if p_payment_method not in ('Cash','QRIS') then
    raise exception 'Metode pembayaran tidak dikenal' using errcode = '23514';
  end if;

  -- Kunci kedua mesin
  select * into v_wm from public.machines where id = p_washer_id for update;
  if not found then
    raise exception 'Mesin cuci tidak ditemukan' using errcode = '22023';
  end if;

  select * into v_dm from public.machines where id = p_dryer_id for update;
  if not found then
    raise exception 'Mesin pengering tidak ditemukan' using errcode = '22023';
  end if;

  if v_wm.id = v_dm.id then
    raise exception 'Mesin cuci dan pengering harus berbeda' using errcode = '22023';
  end if;

  if v_wm.machine_code not like 'WM-%' then
    raise exception 'Mesin % bukan mesin cuci', v_wm.machine_code using errcode = '22023';
  end if;

  if v_dm.machine_code not like 'DM-%' then
    raise exception 'Mesin % bukan mesin pengering', v_dm.machine_code using errcode = '22023';
  end if;

  if v_wm.status <> 'Tersedia' then
    raise exception 'Mesin % sedang tidak tersedia', v_wm.machine_code using errcode = '22023';
  end if;

  if v_dm.status <> 'Tersedia' then
    raise exception 'Mesin % sedang tidak tersedia', v_dm.machine_code using errcode = '22023';
  end if;

  -- Cek layanan aktif
  select * into v_layanan from public.services where id = p_service_id and is_active;
  if not found then
    raise exception 'Layanan tidak ditemukan atau tidak aktif' using errcode = '22023';
  end if;

  -- Cek akun aktif
  if not exists (select 1 from public.profiles where id = v_saya and is_active) then
    raise exception 'Akun tidak aktif' using errcode = '28000';
  end if;

  v_qty := round(coalesce(p_qty, 0), 2);
  if v_qty <= 0 then
    raise exception 'Qty harus lebih dari 0' using errcode = '22023';
  end if;

  -- Durasi dari form order, bukan dari layanan
  v_durasi := p_duration_minutes;

  v_svc_total := round(v_layanan.price * v_qty, 2);

  -- Kode order
  v_kode := 'ORD-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD') || '-' ||
            lpad((
              select coalesce(count(*), 0) + 1
                from public.orders o
               where (o.created_at at time zone 'Asia/Jakarta')::date
                     = (now() at time zone 'Asia/Jakarta')::date
            )::text, 4, '0');

  insert into public.orders (
    order_code, washer_machine_id, dryer_machine_id, service_id,
    customer_name, qty, service_price, addon_total, grand_total,
    duration_minutes, start_time, end_time, status, payment_method, notes, created_by
  ) values (
    v_kode, v_wm.id, v_dm.id, v_layanan.id,
    coalesce(nullif(btrim(p_customer_name, ''), ''), 'Walk-in'), v_qty, v_svc_total, 0, v_svc_total,
    v_durasi, now(), now() + make_interval(mins => v_durasi),
    'Berjalan', p_payment_method, nullif(btrim(coalesce(p_notes, '')), ''), v_saya
  )
  returning * into v_order;

  -- Add-on
  if p_addon_ids is not null and array_length(p_addon_ids, 1) > 0 then
    insert into public.order_addons (order_id, addon_id, addon_name, qty, price, subtotal)
    select v_order.id, a.id, a.addon_name, 1, a.price, round(a.price * 1, 2)
      from public.addons a
     where a.id = any(p_addon_ids)
       and a.is_active;
  end if;

  -- Total akhir
  select coalesce(sum(oa.subtotal), 0) into v_add_total
    from public.order_addons oa
   where oa.order_id = v_order.id;

  update public.orders
     set addon_total = v_add_total,
         grand_total = round(v_svc_total + v_add_total, 2)
   where id = v_order.id
  returning * into v_order;

  -- Kunci mesin
  update public.machines
     set status = 'Digunakan',
         available_at = null
   where id in (v_wm.id, v_dm.id);

  return v_order;
end;
$$;

comment on function public.buat_order is 'Buat order baru. Durasi pengerjaan diberikan dari form order (p_duration_minutes), bukan dari layanan.';
