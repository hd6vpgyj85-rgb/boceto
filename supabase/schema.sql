-- beautylat — esquema completo de Supabase (Postgres)
-- Ejecutar completo en el SQL Editor de un proyecto nuevo de Supabase.

create extension if not exists pgcrypto;

-- =========================================================
-- PRODUCTOS
-- =========================================================
create table products (
  id text primary key,
  name text not null,
  price numeric not null,
  compare_at_price numeric,
  on_sale boolean not null default false,
  levels text[],
  category text not null,
  brand text not null,
  stock integer not null default 0,
  vendor text,
  sizes text[],
  description text,
  images text[],
  home_image_fit text not null default 'cover',
  created_at timestamptz not null default now()
);

alter table products enable row level security;

create policy "products_select_public" on products
  for select to anon, authenticated using (true);

create policy "products_insert_admin" on products
  for insert to authenticated with check (true);

create policy "products_update_admin" on products
  for update to authenticated using (true) with check (true);

create policy "products_delete_admin" on products
  for delete to authenticated using (true);

-- =========================================================
-- ESTADÍSTICAS DE PRODUCTO
-- =========================================================
create table product_stats (
  product_id text primary key references products(id) on delete cascade,
  views integer not null default 0,
  cart_adds integer not null default 0,
  purchases integer not null default 0
);

alter table product_stats enable row level security;

create policy "product_stats_select_admin" on product_stats
  for select to authenticated using (true);

create or replace function increment_product_stat(p_product_id text, p_field text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_field not in ('views', 'cart_adds', 'purchases') then
    raise exception 'CAMPO_INVALIDO';
  end if;

  insert into product_stats (product_id, views, cart_adds, purchases)
  values (
    p_product_id,
    case when p_field = 'views' then 1 else 0 end,
    case when p_field = 'cart_adds' then 1 else 0 end,
    case when p_field = 'purchases' then 1 else 0 end
  )
  on conflict (product_id) do update set
    views = product_stats.views + case when p_field = 'views' then 1 else 0 end,
    cart_adds = product_stats.cart_adds + case when p_field = 'cart_adds' then 1 else 0 end,
    purchases = product_stats.purchases + case when p_field = 'purchases' then 1 else 0 end;
end;
$$;

grant execute on function increment_product_stat(text, text) to anon, authenticated;

-- =========================================================
-- PEDIDOS
-- =========================================================
create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pendiente',
  customer jsonb not null,
  address jsonb not null,
  payment_method text not null,
  notes text,
  items jsonb not null,
  total numeric not null,
  archived_at timestamptz
);

alter table orders enable row level security;

create policy "orders_insert_public" on orders
  for insert to anon, authenticated with check (true);

create policy "orders_select_admin" on orders
  for select to authenticated using (true);

create policy "orders_update_admin" on orders
  for update to authenticated using (true) with check (true);

create policy "orders_delete_admin" on orders
  for delete to authenticated using (true);

-- =========================================================
-- RESEÑAS
-- =========================================================
create table reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating integer not null check (rating between 1 and 5),
  quote text not null,
  image text,
  status text not null default 'pendiente',
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

create policy "reviews_insert_public" on reviews
  for insert to anon, authenticated with check (true);

create policy "reviews_select_approved_public" on reviews
  for select to anon using (status = 'aprobada');

create policy "reviews_select_admin" on reviews
  for select to authenticated using (true);

create policy "reviews_update_admin" on reviews
  for update to authenticated using (true) with check (true);

create policy "reviews_delete_admin" on reviews
  for delete to authenticated using (true);

-- =========================================================
-- CUPONES
-- =========================================================
create table coupons (
  code text primary key,
  discount_type text not null,
  discount_value numeric not null,
  usage_limit integer not null,
  times_used integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table coupons enable row level security;

create policy "coupons_select_admin" on coupons
  for select to authenticated using (true);

create policy "coupons_insert_admin" on coupons
  for insert to authenticated with check (true);

create policy "coupons_update_admin" on coupons
  for update to authenticated using (true) with check (true);

create policy "coupons_delete_admin" on coupons
  for delete to authenticated using (true);

create or replace function redeem_coupon(p_code text)
returns table(discount_type text, discount_value numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon coupons%rowtype;
begin
  select * into v_coupon from coupons where code = upper(p_code) and active = true;

  if not found then
    raise exception 'CUPON_INVALIDO';
  end if;

  if v_coupon.times_used >= v_coupon.usage_limit then
    raise exception 'CUPON_AGOTADO';
  end if;

  update coupons set times_used = times_used + 1 where code = v_coupon.code;

  return query select v_coupon.discount_type, v_coupon.discount_value;
end;
$$;

grant execute on function redeem_coupon(text) to anon, authenticated;

-- =========================================================
-- CLIENTES (FIDELIDAD)
-- =========================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  purchases_count integer not null default 0 check (purchases_count >= 0),
  notes text,
  created_at timestamptz not null default now()
);

alter table customers enable row level security;

create policy "customers_all_admin" on customers
  for all to authenticated using (true) with check (true);

create table loyalty_tiers (
  id uuid primary key default gen_random_uuid(),
  purchases_required integer not null,
  reward_description text not null,
  discount_percent integer,
  created_at timestamptz not null default now()
);

alter table loyalty_tiers enable row level security;

create policy "loyalty_tiers_select_public" on loyalty_tiers
  for select to anon, authenticated using (true);

create policy "loyalty_tiers_insert_admin" on loyalty_tiers
  for insert to authenticated with check (true);

create policy "loyalty_tiers_update_admin" on loyalty_tiers
  for update to authenticated using (true) with check (true);

create policy "loyalty_tiers_delete_admin" on loyalty_tiers
  for delete to authenticated using (true);

create table loyalty_claims (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  tier_id uuid not null references loyalty_tiers(id) on delete cascade,
  requested_at timestamptz not null default now(),
  claimed boolean not null default false,
  claimed_at timestamptz,
  coupon_id text references coupons(code),
  unique (customer_id, tier_id)
);

alter table loyalty_claims enable row level security;

create policy "loyalty_claims_select_admin" on loyalty_claims
  for select to authenticated using (true);

-- =========================================================
-- FUNCIONES DE FIDELIDAD (security definer)
-- =========================================================

create or replace function get_customer_by_token(p_token text)
returns table(id uuid, name text, purchases_count integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select c.id, c.name, c.purchases_count
    from customers c
    where c.token = p_token;
end;
$$;

grant execute on function get_customer_by_token(text) to anon, authenticated;

create or replace function get_or_create_customer_for_checkout(p_name text, p_phone text)
returns table(id uuid, token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_digits text := right(regexp_replace(p_phone, '\D', '', 'g'), 10);
  v_id uuid;
  v_token text;
begin
  select c.id, c.token into v_id, v_token
  from customers c
  where right(regexp_replace(c.phone, '\D', '', 'g'), 10) = v_digits
  limit 1;

  if found then
    return query select v_id, v_token;
    return;
  end if;

  insert into customers (name, phone, purchases_count)
  values (p_name, p_phone, 0)
  returning customers.id, customers.token into v_id, v_token;

  return query select v_id, v_token;
end;
$$;

grant execute on function get_or_create_customer_for_checkout(text, text) to anon, authenticated;

create or replace function request_loyalty_claim(p_token text, p_tier_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  select id into v_customer_id from customers where token = p_token;

  if v_customer_id is null then
    raise exception 'CLIENTE_NO_ENCONTRADO';
  end if;

  insert into loyalty_claims (customer_id, tier_id)
  values (v_customer_id, p_tier_id)
  on conflict (customer_id, tier_id) do nothing;
end;
$$;

grant execute on function request_loyalty_claim(text, uuid) to anon, authenticated;

create or replace function get_loyalty_claims_by_token(p_token text)
returns table(tier_id uuid, requested_at timestamptz, claimed boolean, claimed_at timestamptz, coupon_code text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select lc.tier_id, lc.requested_at, lc.claimed, lc.claimed_at, lc.coupon_id
    from loyalty_claims lc
    join customers c on c.id = lc.customer_id
    where c.token = p_token;
end;
$$;

grant execute on function get_loyalty_claims_by_token(text) to anon, authenticated;

create or replace function confirm_loyalty_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim loyalty_claims%rowtype;
  v_tier loyalty_tiers%rowtype;
  v_code text;
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_tries integer := 0;
begin
  select * into v_claim from loyalty_claims where id = p_claim_id;
  if not found then
    raise exception 'RECLAMO_NO_ENCONTRADO';
  end if;

  select * into v_tier from loyalty_tiers where id = v_claim.tier_id;

  if v_tier.discount_percent is not null and v_claim.coupon_id is null then
    loop
      v_tries := v_tries + 1;
      v_code := 'PREMIO-';
      for i in 1..6 loop
        v_code := v_code || substr(v_alphabet, floor(random() * length(v_alphabet) + 1)::int, 1);
      end loop;

      begin
        insert into coupons (code, discount_type, discount_value, usage_limit, active)
        values (v_code, 'percentage', v_tier.discount_percent, 1, true);
        exit;
      exception when unique_violation then
        if v_tries > 20 then
          raise exception 'NO_SE_PUDO_GENERAR_CUPON';
        end if;
      end;
    end loop;

    update loyalty_claims set coupon_id = v_code where id = p_claim_id;
  end if;

  update loyalty_claims
  set claimed = true, claimed_at = now()
  where id = p_claim_id;
end;
$$;

grant execute on function confirm_loyalty_claim(uuid) to authenticated;

create or replace function revert_loyalty_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim loyalty_claims%rowtype;
begin
  select * into v_claim from loyalty_claims where id = p_claim_id;
  if not found then
    raise exception 'RECLAMO_NO_ENCONTRADO';
  end if;

  if v_claim.coupon_id is not null then
    update coupons set active = false where code = v_claim.coupon_id;
  end if;

  update loyalty_claims
  set claimed = false, claimed_at = null
  where id = p_claim_id;
end;
$$;

grant execute on function revert_loyalty_claim(uuid) to authenticated;

-- =========================================================
-- SEED — niveles de fidelidad de ejemplo
-- =========================================================
insert into loyalty_tiers (purchases_required, reward_description, discount_percent) values
  (3, '10% de descuento en tu próxima compra', 10),
  (6, '15% de descuento en tu próxima compra', 15),
  (10, '20% de descuento + envío gratis', 20);

-- =========================================================
-- ÍNDICES
-- =========================================================
create index idx_products_category on products (category);
create index idx_orders_status on orders (status);
create index idx_reviews_status on reviews (status);
create index idx_loyalty_claims_customer on loyalty_claims (customer_id);
