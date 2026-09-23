-- ============================================================================
-- NOIRE Perfumería — schema.sql
-- Plantilla de tienda en línea. Este script es idempotente: se puede correr
-- las veces que hagan falta sobre el mismo proyecto de Supabase sin romper
-- datos existentes ni duplicar contenido de ejemplo.
--
-- Cómo usarlo: Supabase Dashboard → SQL Editor → pegar todo el archivo → Run.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. TABLAS
-- ============================================================================

-- site_settings: singleton con toda la identidad del negocio.
create table if not exists site_settings (
  id boolean primary key default true check (id),
  business_name text not null default '',
  tagline text not null default '',
  logo_url text,
  whatsapp text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  city text not null default '',
  hours text not null default '',
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  map_url text,
  footer_note text not null default '',
  store_photo_url text,
  updated_at timestamptz not null default now()
);
alter table site_settings add column if not exists store_photo_url text;

-- levels: niveles/colecciones (slug fijo en código, resto editable).
create table if not exists levels (
  slug text primary key,
  label text not null,
  image_url text,
  tagline text,
  display_order int not null default 0
);

-- categories: categorías de producto (slug fijo en código, resto editable).
create table if not exists categories (
  slug text primary key,
  name text not null,
  tagline text,
  banner_image_url text,
  display_order int not null default 0
);

-- home_banner: singleton con las imágenes del carrusel de inicio.
create table if not exists home_banner (
  id boolean primary key default true check (id),
  images text[] not null default '{}'
);

-- products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12, 2) not null default 0,
  sale_price numeric(12, 2),
  on_sale boolean not null default false,
  levels text[] not null default '{}',
  category text references categories(slug) on update cascade on delete set null,
  brand text not null default '',
  stock int not null default 0,
  vendor text not null default '',
  sizes text[] not null default '{}',
  description text not null default '',
  images text[] not null default '{}',
  cover_fit text not null default 'cover' check (cover_fit in ('cover', 'contain')),
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
alter table products add column if not exists featured boolean not null default false;

create index if not exists idx_products_category on products (category);
create index if not exists idx_products_on_sale on products (on_sale);
create index if not exists idx_products_featured on products (featured);

-- orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled')),
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_email text,
  address text not null default '',
  city text not null default '',
  payment_method text not null default '',
  notes text,
  items jsonb not null default '[]',
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  coupon_code text,
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_orders_status on orders (status);
create index if not exists idx_orders_archived on orders (archived_at);

-- reviews
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating int not null default 5 check (rating between 1 and 5),
  quote text not null default '',
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
alter table reviews drop column if exists level;

create index if not exists idx_reviews_status on reviews (status);

-- product_stats
create table if not exists product_stats (
  product_id uuid primary key references products(id) on delete cascade,
  views int not null default 0,
  cart_adds int not null default 0,
  purchases int not null default 0
);

-- coupons
create table if not exists coupons (
  code text primary key,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12, 2) not null default 0,
  scope text not null default 'cart' check (scope in ('single_product', 'cart')),
  usage_limit int,
  used_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  phone text not null unique,
  token uuid not null default gen_random_uuid() unique,
  access_code text unique,
  purchases int not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- loyalty_tiers
create table if not exists loyalty_tiers (
  id uuid primary key default gen_random_uuid(),
  required_purchases int not null default 0,
  reward_description text not null default '',
  discount_percent numeric(5, 2),
  coupon_scope text not null default 'cart' check (coupon_scope in ('single_product', 'cart')),
  display_order int not null default 0
);

-- loyalty_claims
create table if not exists loyalty_claims (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  tier_id uuid not null references loyalty_tiers(id) on delete cascade,
  claimed boolean not null default false,
  claimed_at timestamptz,
  coupon_code text references coupons(code) on delete set null,
  created_at timestamptz not null default now(),
  unique (customer_id, tier_id)
);

-- ============================================================================
-- 2. TRIGGER: generar access_code de 6 caracteres para clientes nuevos
-- ============================================================================

create or replace function generate_customer_access_code()
returns trigger
language plpgsql
as $$
declare
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_exists boolean;
begin
  if new.access_code is null then
    loop
      v_code := '';
      for i in 1..6 loop
        v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
      end loop;
      select exists(select 1 from customers where access_code = v_code) into v_exists;
      exit when not v_exists;
    end loop;
    new.access_code := v_code;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_customers_access_code on customers;
create trigger trg_customers_access_code
  before insert on customers
  for each row
  execute function generate_customer_access_code();

-- ============================================================================
-- 3. FUNCIONES DE NEGOCIO (security definer)
-- ============================================================================

-- Estadísticas de producto (vistas / agregados al carrito / compras)
drop function if exists increment_product_stat(uuid, text);
create or replace function increment_product_stat(p_product_id uuid, p_field text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into product_stats (product_id) values (p_product_id)
  on conflict (product_id) do nothing;

  if p_field = 'views' then
    update product_stats set views = views + 1 where product_id = p_product_id;
  elsif p_field = 'cart_adds' then
    update product_stats set cart_adds = cart_adds + 1 where product_id = p_product_id;
  elsif p_field = 'purchases' then
    update product_stats set purchases = purchases + 1 where product_id = p_product_id;
  end if;
end;
$$;

-- Validar y canjear un cupón de forma atómica
drop function if exists redeem_coupon(text, int);
create or replace function redeem_coupon(p_code text, p_item_count int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon coupons%rowtype;
begin
  select * into v_coupon from coupons where code = upper(trim(p_code));

  if not found then
    return jsonb_build_object('success', false, 'error', 'Cupón no encontrado');
  end if;
  if not v_coupon.active then
    return jsonb_build_object('success', false, 'error', 'Este cupón ya no está activo');
  end if;
  if v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit then
    return jsonb_build_object('success', false, 'error', 'Este cupón alcanzó su límite de usos');
  end if;
  if v_coupon.scope = 'single_product' and p_item_count <> 1 then
    return jsonb_build_object('success', false, 'error', 'Este cupón solo aplica cuando llevas un único producto en el carrito');
  end if;

  update coupons set used_count = used_count + 1 where code = v_coupon.code;

  return jsonb_build_object(
    'success', true,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'scope', v_coupon.scope
  );
end;
$$;

-- Login dual: autenticar cliente de fidelidad por WhatsApp + código de acceso
drop function if exists authenticate_customer_by_code(text, text);
create or replace function authenticate_customer_by_code(p_phone text, p_code text)
returns table (id uuid, name text, token uuid)
language sql
security definer
set search_path = public
as $$
  select id, name, token
  from customers
  where phone = p_phone and access_code = upper(trim(p_code));
$$;

-- Obtener datos públicos de un cliente por su token (tarjeta de fidelidad)
drop function if exists get_customer_by_token(uuid);
create or replace function get_customer_by_token(p_token uuid)
returns table (id uuid, name text, phone text, purchases int, access_code text, token uuid, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select id, name, phone, purchases, access_code, token, created_at
  from customers
  where token = p_token;
$$;

-- Crear o reutilizar un cliente de fidelidad durante el checkout
drop function if exists get_or_create_customer_for_checkout(text, text);
create or replace function get_or_create_customer_for_checkout(p_name text, p_phone text)
returns table (id uuid, name text, phone text, purchases int, access_code text, token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select customers.id into v_id from customers where customers.phone = p_phone;

  if v_id is null then
    insert into customers (name, phone) values (p_name, p_phone) returning customers.id into v_id;
  elsif p_name is not null and length(trim(p_name)) > 0 then
    update customers set name = p_name where customers.id = v_id;
  end if;

  return query
    select customers.id, customers.name, customers.phone, customers.purchases, customers.access_code, customers.token
    from customers
    where customers.id = v_id;
end;
$$;

-- Solicitar (crear si no existe) el reclamo de una recompensa ya desbloqueada
drop function if exists request_loyalty_claim(uuid, uuid);
create or replace function request_loyalty_claim(p_token uuid, p_tier_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_purchases int;
  v_required int;
  v_claim_id uuid;
begin
  select id, purchases into v_customer_id, v_purchases from customers where token = p_token;
  if v_customer_id is null then
    return jsonb_build_object('success', false, 'error', 'Cliente no encontrado');
  end if;

  select required_purchases into v_required from loyalty_tiers where id = p_tier_id;
  if v_required is null then
    return jsonb_build_object('success', false, 'error', 'Nivel no encontrado');
  end if;

  if v_purchases < v_required then
    return jsonb_build_object('success', false, 'error', 'Aún no alcanzas este nivel');
  end if;

  select id into v_claim_id from loyalty_claims where customer_id = v_customer_id and tier_id = p_tier_id;
  if v_claim_id is null then
    insert into loyalty_claims (customer_id, tier_id) values (v_customer_id, p_tier_id) returning id into v_claim_id;
  end if;

  return jsonb_build_object('success', true, 'claim_id', v_claim_id);
end;
$$;

-- Listar los reclamos de fidelidad de un cliente por su token
drop function if exists get_loyalty_claims_by_token(uuid);
create or replace function get_loyalty_claims_by_token(p_token uuid)
returns table (tier_id uuid, claimed boolean, claimed_at timestamptz, coupon_code text)
language sql
security definer
set search_path = public
as $$
  select lc.tier_id, lc.claimed, lc.claimed_at, lc.coupon_code
  from loyalty_claims lc
  join customers c on c.id = lc.customer_id
  where c.token = p_token;
$$;

-- Admin: confirmar un reclamo y generar su cupón de recompensa
drop function if exists confirm_loyalty_claim(uuid);
create or replace function confirm_loyalty_claim(p_claim_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier loyalty_tiers%rowtype;
  v_code text;
begin
  select lt.* into v_tier
  from loyalty_claims lc
  join loyalty_tiers lt on lt.id = lc.tier_id
  where lc.id = p_claim_id;

  if v_tier.id is null then
    return jsonb_build_object('success', false, 'error', 'Reclamo no encontrado');
  end if;

  v_code := 'PREMIO-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  insert into coupons (code, discount_type, discount_value, scope, usage_limit, active)
  values (v_code, 'percentage', coalesce(v_tier.discount_percent, 0), v_tier.coupon_scope, 1, true);

  update loyalty_claims
  set claimed = true, claimed_at = now(), coupon_code = v_code
  where id = p_claim_id;

  return jsonb_build_object('success', true, 'coupon_code', v_code);
end;
$$;

-- Admin: revertir un reclamo confirmado por error
drop function if exists revert_loyalty_claim(uuid);
create or replace function revert_loyalty_claim(p_claim_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  select coupon_code into v_code from loyalty_claims where id = p_claim_id;

  update loyalty_claims
  set claimed = false, claimed_at = null, coupon_code = null
  where id = p_claim_id;

  if v_code is not null then
    update coupons set active = false where code = v_code;
  end if;

  return jsonb_build_object('success', true);
end;
$$;

-- Permisos de ejecución: funciones públicas (front público las invoca sin sesión)
grant execute on function increment_product_stat(uuid, text) to anon, authenticated;
grant execute on function redeem_coupon(text, int) to anon, authenticated;
grant execute on function authenticate_customer_by_code(text, text) to anon, authenticated;
grant execute on function get_customer_by_token(uuid) to anon, authenticated;
grant execute on function get_or_create_customer_for_checkout(text, text) to anon, authenticated;
grant execute on function request_loyalty_claim(uuid, uuid) to anon, authenticated;
grant execute on function get_loyalty_claims_by_token(uuid) to anon, authenticated;

-- Funciones solo-admin: revocar de anon, dejar solo para sesiones autenticadas
revoke execute on function confirm_loyalty_claim(uuid) from public;
revoke execute on function revert_loyalty_claim(uuid) from public;
grant execute on function confirm_loyalty_claim(uuid) to authenticated;
grant execute on function revert_loyalty_claim(uuid) to authenticated;

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

alter table site_settings enable row level security;
alter table levels enable row level security;
alter table categories enable row level security;
alter table home_banner enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;
alter table product_stats enable row level security;
alter table coupons enable row level security;
alter table customers enable row level security;
alter table loyalty_tiers enable row level security;
alter table loyalty_claims enable row level security;

-- site_settings: lectura pública, escritura solo admin
drop policy if exists "site_settings_public_read" on site_settings;
create policy "site_settings_public_read" on site_settings for select using (true);
drop policy if exists "site_settings_admin_write" on site_settings;
create policy "site_settings_admin_write" on site_settings for all to authenticated using (true) with check (true);

-- levels
drop policy if exists "levels_public_read" on levels;
create policy "levels_public_read" on levels for select using (true);
drop policy if exists "levels_admin_write" on levels;
create policy "levels_admin_write" on levels for all to authenticated using (true) with check (true);

-- categories
drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories for select using (true);
drop policy if exists "categories_admin_write" on categories;
create policy "categories_admin_write" on categories for all to authenticated using (true) with check (true);

-- home_banner
drop policy if exists "home_banner_public_read" on home_banner;
create policy "home_banner_public_read" on home_banner for select using (true);
drop policy if exists "home_banner_admin_write" on home_banner;
create policy "home_banner_admin_write" on home_banner for all to authenticated using (true) with check (true);

-- products
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products for select using (true);
drop policy if exists "products_admin_write" on products;
create policy "products_admin_write" on products for all to authenticated using (true) with check (true);

-- orders: cualquiera puede crear un pedido desde el checkout; solo admin lee/edita
drop policy if exists "orders_public_insert" on orders;
create policy "orders_public_insert" on orders for insert to anon, authenticated with check (true);
drop policy if exists "orders_admin_read" on orders;
create policy "orders_admin_read" on orders for select to authenticated using (true);
drop policy if exists "orders_admin_update" on orders;
create policy "orders_admin_update" on orders for update to authenticated using (true) with check (true);
drop policy if exists "orders_admin_delete" on orders;
create policy "orders_admin_delete" on orders for delete to authenticated using (true);

-- reviews: lectura pública solo de aprobadas; cualquiera puede dejar una reseña pendiente
drop policy if exists "reviews_public_read_approved" on reviews;
create policy "reviews_public_read_approved" on reviews for select using (status = 'approved');
drop policy if exists "reviews_admin_read_all" on reviews;
create policy "reviews_admin_read_all" on reviews for select to authenticated using (true);
drop policy if exists "reviews_public_insert_pending" on reviews;
create policy "reviews_public_insert_pending" on reviews for insert to anon, authenticated with check (status = 'pending');
drop policy if exists "reviews_admin_update" on reviews;
create policy "reviews_admin_update" on reviews for update to authenticated using (true) with check (true);
drop policy if exists "reviews_admin_delete" on reviews;
create policy "reviews_admin_delete" on reviews for delete to authenticated using (true);

-- product_stats: sin escritura directa (solo vía función security definer); lectura solo admin
drop policy if exists "product_stats_admin_read" on product_stats;
create policy "product_stats_admin_read" on product_stats for select to authenticated using (true);

-- coupons: solo admin lee/edita directamente (el público valida vía redeem_coupon)
drop policy if exists "coupons_admin_all" on coupons;
create policy "coupons_admin_all" on coupons for all to authenticated using (true) with check (true);

-- customers: sin acceso directo público (todo vía funciones security definer); admin full
drop policy if exists "customers_admin_all" on customers;
create policy "customers_admin_all" on customers for all to authenticated using (true) with check (true);

-- loyalty_tiers: lectura pública (se muestran en checkout y tarjeta de fidelidad)
drop policy if exists "loyalty_tiers_public_read" on loyalty_tiers;
create policy "loyalty_tiers_public_read" on loyalty_tiers for select using (true);
drop policy if exists "loyalty_tiers_admin_write" on loyalty_tiers;
create policy "loyalty_tiers_admin_write" on loyalty_tiers for all to authenticated using (true) with check (true);

-- loyalty_claims: sin acceso directo público (todo vía funciones); admin full
drop policy if exists "loyalty_claims_admin_all" on loyalty_claims;
create policy "loyalty_claims_admin_all" on loyalty_claims for all to authenticated using (true) with check (true);

-- ============================================================================
-- 5. STORAGE: bucket público "product-images"
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

-- Un cliente anónimo puede subir SOLO la foto de su propia reseña en el checkout,
-- siempre dentro de la carpeta "reviews/".
drop policy if exists "product_images_public_review_upload" on storage.objects;
create policy "product_images_public_review_upload" on storage.objects
  for insert to anon
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = 'reviews');

-- ============================================================================
-- 6. DATOS DE EJEMPLO (solo se insertan si las tablas están vacías)
-- ============================================================================

insert into site_settings (id, business_name, tagline, logo_url, whatsapp, phone, email, address, city, hours, instagram_url, facebook_url, tiktok_url, map_url, footer_note, store_photo_url)
select
  true,
  'NOIRE Perfumería',
  'Perfumería de autor en el corazón de Medellín',
  null,
  '573004567890',
  '+57 300 456 7890',
  'hola@noireperfumeria.com',
  'Cra. 43A #10-25, El Poblado',
  'Medellín, Colombia',
  E'Lunes a viernes: 10:00 a. m. – 8:00 p. m.\nSábados: 10:00 a. m. – 6:00 p. m.\nDomingos: 12:00 p. m. – 5:00 p. m.',
  'https://instagram.com/noire.perfumeria',
  'https://facebook.com/noireperfumeria',
  'https://tiktok.com/@noire.perfumeria',
  'https://maps.google.com/?q=Cra+43A+%2310-25+El+Poblado+Medellin',
  'Hecho con pasión por el arte de perfumar. © 2025 NOIRE Perfumería.',
  'https://picsum.photos/seed/noire-store/1600/900'
where not exists (select 1 from site_settings);

insert into levels (slug, label, image_url, tagline, display_order)
select * from (values
  ('arabe', 'Esencias Árabes', 'https://picsum.photos/seed/noire-level-arabe/500/500', 'Attars y oils de larga duración', 1),
  ('disenador', 'Inspirados Diseñador', 'https://picsum.photos/seed/noire-level-disenador/500/500', 'Los aromas icónicos, reinventados', 2),
  ('nicho', 'Alta Perfumería Nicho', 'https://picsum.photos/seed/noire-level-nicho/500/500', 'Ediciones exclusivas y raras', 3)
) as v(slug, label, image_url, tagline, display_order)
where not exists (select 1 from levels);

insert into categories (slug, name, tagline, banner_image_url, display_order)
select * from (values
  ('perfumes', 'Perfumes', 'Fragancias de larga duración para cada ocasión', 'https://picsum.photos/seed/noire-cat-perfumes/1600/500', 1),
  ('splash-corporal', 'Splash Corporal', 'Hidratación perfumada para el día a día', 'https://picsum.photos/seed/noire-cat-splash/1600/500', 2),
  ('difusores', 'Difusores de Hogar', 'Aromatiza tus espacios favoritos', 'https://picsum.photos/seed/noire-cat-difusores/1600/500', 3)
) as v(slug, name, tagline, banner_image_url, display_order)
where not exists (select 1 from categories);

insert into home_banner (id, images)
select true, array[
  'https://picsum.photos/seed/noire-banner-1/1600/700',
  'https://picsum.photos/seed/noire-banner-2/1600/700',
  'https://picsum.photos/seed/noire-banner-3/1600/700'
]
where not exists (select 1 from home_banner);

insert into coupons (code, discount_type, discount_value, scope, usage_limit, used_count, active)
select 'BIENVENIDA10', 'percentage', 10, 'cart', 200, 0, true
where not exists (select 1 from coupons);

insert into loyalty_tiers (required_purchases, reward_description, discount_percent, coupon_scope, display_order)
select * from (values
  (2, '10% de descuento en tu próxima fragancia', 10::numeric, 'single_product', 1),
  (5, '20% de descuento en toda tu compra', 20::numeric, 'cart', 2),
  (10, 'Fragancia de regalo sorpresa + 30% en toda tu compra', 30::numeric, 'cart', 3)
) as v(required_purchases, reward_description, discount_percent, coupon_scope, display_order)
where not exists (select 1 from loyalty_tiers);

insert into products (name, price, sale_price, on_sale, levels, category, brand, stock, vendor, sizes, description, images, cover_fit, featured)
select * from (values
  ('Oud Al Layl', 145000, 119000, true, array['arabe'], 'perfumes', 'Bayt Al Oud', 24, 'Distribuidora Oriental', array['30ml','50ml'], 'Un oud profundo y ahumado con fondo de ámbar, pensado para noches largas. Su estela dura más de 12 horas.', array['https://picsum.photos/seed/noire-p1-a/800/1000','https://picsum.photos/seed/noire-p1-b/800/1000'], 'cover', true),
  ('Ámbar Real', 98000, null, false, array['arabe'], 'perfumes', 'Bayt Al Oud', 31, 'Distribuidora Oriental', array['30ml','50ml'], 'Ámbar cálido con toques de vainilla y resina, ideal para climas fríos y ocasiones especiales.', array['https://picsum.photos/seed/noire-p2-a/800/1000','https://picsum.photos/seed/noire-p2-b/800/1000'], 'cover', false),
  ('Rosa de Taif', 132000, null, false, array['arabe'], 'perfumes', 'Dunas Collection', 18, 'Distribuidora Oriental', array['50ml'], 'La legendaria rosa de Taif combinada con azafrán y madera de oud. Elegante y persistente.', array['https://picsum.photos/seed/noire-p3-a/800/1000'], 'cover', true),
  ('Almizcle Blanco', 87000, null, false, array['arabe'], 'perfumes', 'Dunas Collection', 40, 'Distribuidora Oriental', array['30ml','50ml'], 'Almizcle limpio y suave, perfecto para uso diario en la oficina o la universidad.', array['https://picsum.photos/seed/noire-p4-a/800/1000'], 'cover', false),
  ('Oud Imperial', 79000, null, false, array['arabe'], 'perfumes', 'Bayt Al Oud', 15, 'Distribuidora Oriental', array['15ml'], 'Aceite concentrado de oud imperial, sin alcohol, de aplicación directa sobre la piel.', array['https://picsum.photos/seed/noire-p5-a/800/1000'], 'cover', false),
  ('Musgo Noir', 165000, 139000, true, array['disenador'], 'perfumes', 'Essence House', 22, 'Essence House Labs', array['50ml','100ml'], 'Inspirado en los grandes clásicos de musgo de roble y bergamota. Elegancia atemporal para el hombre moderno.', array['https://picsum.photos/seed/noire-p6-a/800/1000','https://picsum.photos/seed/noire-p6-b/800/1000'], 'cover', true),
  ('Vainilla Sport', 158000, null, false, array['disenador'], 'perfumes', 'Essence House', 27, 'Essence House Labs', array['100ml'], 'Fresco, dulce y deportivo. Vainilla suave sobre una base cítrica energizante.', array['https://picsum.photos/seed/noire-p7-a/800/1000'], 'cover', false),
  ('Flor de Azahar', 149000, null, false, array['disenador'], 'perfumes', 'Essence House', 19, 'Essence House Labs', array['90ml'], 'Un ramo floral luminoso de azahar y jazmín con fondo almizclado.', array['https://picsum.photos/seed/noire-p8-a/800/1000'], 'cover', false),
  ('Cuero Especiado', 172000, null, false, array['disenador'], 'perfumes', 'Essence House', 12, 'Essence House Labs', array['100ml'], 'Cuero curtido con especias cálidas: canela, cardamomo y pimienta negra.', array['https://picsum.photos/seed/noire-p9-a/800/1000'], 'cover', false),
  ('Bergamota Real', 168000, null, false, array['disenador'], 'perfumes', 'Nocturne Paris', 16, 'Nocturne Import', array['100ml'], 'Cítrico y sofisticado, con bergamota de Calabria y toques amaderados.', array['https://picsum.photos/seed/noire-p10-a/800/1000'], 'cover', false),
  ('Sal Marina & Cedro', 210000, null, false, array['nicho'], 'perfumes', 'Essence Rare', 9, 'Essence Rare Import', array['50ml','100ml'], 'Acuático mineral con cedro seco. Una fragancia de nicho para quienes buscan algo distinto.', array['https://picsum.photos/seed/noire-p11-a/800/1000'], 'cover', true),
  ('Incienso Sagrado', 235000, 199000, true, array['nicho'], 'perfumes', 'Essence Rare', 7, 'Essence Rare Import', array['50ml'], 'Incienso denso y resinoso con mirra, en edición limitada.', array['https://picsum.photos/seed/noire-p12-a/800/1000'], 'cover', true),
  ('Tabaco Dorado', 245000, null, false, array['nicho'], 'perfumes', 'Casa Noire', 6, 'Casa Noire Atelier', array['50ml','100ml'], 'Tabaco dulce con ron añejo y haba tonka. Nuestra fragancia insignia de alta perfumería.', array['https://picsum.photos/seed/noire-p13-a/800/1000'], 'cover', true),
  ('Splash Vainilla & Coco', 45000, null, false, array['disenador'], 'splash-corporal', 'Essence House', 50, 'Essence House Labs', array['250ml'], 'Body splash tropical de vainilla y coco, hidrata y perfuma la piel al instante.', array['https://picsum.photos/seed/noire-p14-a/800/1000'], 'cover', false),
  ('Splash Flor de Cerezo', 45000, 36000, true, array['disenador'], 'splash-corporal', 'Essence House', 44, 'Essence House Labs', array['250ml'], 'Flor de cerezo japonesa en una bruma corporal fresca y delicada.', array['https://picsum.photos/seed/noire-p15-a/800/1000'], 'cover', false),
  ('Splash Almizcle Blanco', 42000, null, false, array['arabe'], 'splash-corporal', 'Dunas Collection', 38, 'Distribuidora Oriental', array['250ml'], 'La versión corporal de nuestro almizcle más vendido, para llevar la fragancia todo el día.', array['https://picsum.photos/seed/noire-p16-a/800/1000'], 'cover', false),
  ('Difusor Oud & Rosa', 89000, null, false, array['nicho'], 'difusores', 'Casa Noire', 20, 'Casa Noire Atelier', array['200ml'], 'Difusor de varillas con oud y rosa que perfuma cualquier ambiente por semanas.', array['https://picsum.photos/seed/noire-p17-a/800/1000'], 'cover', false),
  ('Difusor Cedro & Vainilla', 79000, null, false, array['disenador'], 'difusores', 'Essence House', 25, 'Essence House Labs', array['200ml'], 'Cálido y acogedor, ideal para salas y habitaciones.', array['https://picsum.photos/seed/noire-p18-a/800/1000'], 'cover', false),
  ('Difusor Ámbar & Sándalo', 82000, 68000, true, array['arabe'], 'difusores', 'Dunas Collection', 17, 'Distribuidora Oriental', array['200ml'], 'Ámbar y sándalo en un difusor de larga duración, nuestro más vendido para el hogar.', array['https://picsum.photos/seed/noire-p19-a/800/1000'], 'cover', true)
) as v(name, price, sale_price, on_sale, levels, category, brand, stock, vendor, sizes, description, images, cover_fit, featured)
where not exists (select 1 from products);

insert into reviews (name, rating, quote, image_url, status)
select * from (values
  ('Camila Restrepo', 5, 'El Oud Al Layl dura toda la noche, huele carísimo. Ya es mi fragancia de firma.', 'https://picsum.photos/seed/noire-review-1/200/200', 'approved'),
  ('Juan Pablo Gómez', 5, 'Pedí el Musgo Noir y llegó súper rápido, huele igual de elegante que los originales.', 'https://picsum.photos/seed/noire-review-2/200/200', 'approved'),
  ('Valentina Ríos', 4, 'Excelente atención por WhatsApp, me asesoraron bien para elegir mi fragancia de nicho.', 'https://picsum.photos/seed/noire-review-3/200/200', 'approved'),
  ('Andrés Felipe Torres', 5, 'El difusor de Oud & Rosa dejó mi sala oliendo delicioso por semanas enteras.', 'https://picsum.photos/seed/noire-review-4/200/200', 'approved'),
  ('Mariana Londoño', 5, 'Mi fragancia favorita es el Ámbar Real, ya voy en el tercer frasco este año.', 'https://picsum.photos/seed/noire-review-5/200/200', 'approved'),
  ('Santiago Herrera', 4, 'Buenos precios comparado con otras perfumerías de Medellín, y llegó bien empacado.', 'https://picsum.photos/seed/noire-review-6/200/200', 'approved'),
  ('Isabella Cardona', 5, 'Me encantó el programa de fidelidad, ya reclamé mi primer premio y fue muy fácil.', 'https://picsum.photos/seed/noire-review-7/200/200', 'approved')
) as v(name, rating, quote, image_url, status)
where not exists (select 1 from reviews);
