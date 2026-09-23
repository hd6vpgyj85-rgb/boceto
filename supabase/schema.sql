-- ============================================================================
-- Boceto — schema.sql
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
  hero_title text not null default 'Todo lo que buscas, en un solo lugar',
  announcement text not null default 'Envíos a todo el país · Pago seguro · Atención personalizada por WhatsApp',
  currency text not null default 'MXN',
  updated_at timestamptz not null default now()
);
alter table site_settings add column if not exists store_photo_url text;
alter table site_settings add column if not exists hero_title text not null default 'Todo lo que buscas, en un solo lugar';
alter table site_settings add column if not exists announcement text not null default 'Envíos a todo el país · Pago seguro · Atención personalizada por WhatsApp';
alter table site_settings add column if not exists currency text not null default 'MXN';

-- levels: niveles/colecciones (todo editable desde el admin).
create table if not exists levels (
  slug text primary key,
  label text not null,
  image_url text,
  tagline text,
  display_order int not null default 0
);

-- categories: categorías de producto (todo editable desde el admin).
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
-- 6. MIGRACIÓN DEL CONTENIDO DE EJEMPLO ANTERIOR
-- Versiones previas de esta plantilla traían una demo de perfumería. Estos
-- bloques la reemplazan por la demo genérica de tienda, pero SOLO donde el
-- contenido sigue intacto: nada que hayas editado desde el admin se toca.
-- ============================================================================

update site_settings set
  business_name = 'Boceto',
  tagline = 'Tu tienda en línea, lista para vender desde el primer día',
  whatsapp = '525512345678',
  phone = '+52 55 1234 5678',
  email = 'hola@boceto.shop',
  address = 'Av. Reforma 222, Col. Juárez',
  city = 'Ciudad de México, México',
  instagram_url = 'https://instagram.com/boceto.shop',
  facebook_url = 'https://facebook.com/boceto.shop',
  tiktok_url = 'https://tiktok.com/@boceto.shop',
  map_url = 'https://maps.google.com/?q=Av.+Reforma+222+Ciudad+de+Mexico',
  footer_note = 'Hecho con cariño para que vendas más. © 2026 Boceto.'
where business_name = 'NOIRE Perfumería';

do $$
begin
  if exists (select 1 from categories where slug = 'perfumes') and not exists (select 1 from categories where slug = 'coleccion') then
    update categories set slug = 'coleccion' where slug = 'perfumes';
  end if;
  if exists (select 1 from categories where slug = 'splash-corporal') and not exists (select 1 from categories where slug = 'novedades') then
    update categories set slug = 'novedades' where slug = 'splash-corporal';
  end if;
  if exists (select 1 from categories where slug = 'difusores') and not exists (select 1 from categories where slug = 'esenciales') then
    update categories set slug = 'esenciales' where slug = 'difusores';
  end if;

  if exists (select 1 from levels where slug = 'arabe') and not exists (select 1 from levels where slug = 'basico') then
    update levels set slug = 'basico' where slug = 'arabe';
    update products set levels = array_replace(levels, 'arabe', 'basico');
  end if;
  if exists (select 1 from levels where slug = 'disenador') and not exists (select 1 from levels where slug = 'premium') then
    update levels set slug = 'premium' where slug = 'disenador';
    update products set levels = array_replace(levels, 'disenador', 'premium');
  end if;
  if exists (select 1 from levels where slug = 'nicho') and not exists (select 1 from levels where slug = 'exclusivo') then
    update levels set slug = 'exclusivo' where slug = 'nicho';
    update products set levels = array_replace(levels, 'nicho', 'exclusivo');
  end if;
end $$;

update categories set name = 'Colección', tagline = 'Nuestros productos de siempre, elegidos con cuidado'
where slug = 'coleccion' and name = 'Perfumes';
update categories set name = 'Novedades', tagline = 'Lo último que llegó a la tienda'
where slug = 'novedades' and name = 'Splash Corporal';
update categories set name = 'Esenciales', tagline = 'Básicos que nunca fallan'
where slug = 'esenciales' and name = 'Difusores de Hogar';

update levels set label = 'Básico', tagline = 'Lo esencial, a buen precio'
where slug = 'basico' and label = 'Esencias Árabes';
update levels set label = 'Premium', tagline = 'Calidad superior para el día a día'
where slug = 'premium' and label = 'Inspirados Diseñador';
update levels set label = 'Exclusivo', tagline = 'Ediciones limitadas y piezas únicas'
where slug = 'exclusivo' and label = 'Alta Perfumería Nicho';

update loyalty_tiers set reward_description = '10% de descuento en tu próximo producto'
where reward_description = '10% de descuento en tu próxima fragancia';
update loyalty_tiers set reward_description = 'Regalo sorpresa + 30% en toda tu compra'
where reward_description = 'Fragancia de regalo sorpresa + 30% en toda tu compra';

-- Productos y reseñas de la demo anterior: se identifican por sus fotos de
-- ejemplo. Si ya reemplazaste la foto, el registro se considera tuyo y se queda.
delete from products where images[1] like 'https://picsum.photos/seed/noire-p%';
delete from reviews where image_url like 'https://picsum.photos/seed/noire-review-%';

-- ============================================================================
-- 7. DATOS DE EJEMPLO (solo se insertan si las tablas están vacías)
-- ============================================================================

insert into site_settings (id, business_name, tagline, logo_url, whatsapp, phone, email, address, city, hours, instagram_url, facebook_url, tiktok_url, map_url, footer_note, store_photo_url, hero_title, announcement, currency)
select
  true,
  'Boceto',
  'Tu tienda en línea, lista para vender desde el primer día',
  null,
  '525512345678',
  '+52 55 1234 5678',
  'hola@boceto.shop',
  'Av. Reforma 222, Col. Juárez',
  'Ciudad de México, México',
  E'Lunes a viernes: 10:00 a. m. – 8:00 p. m.\nSábados: 10:00 a. m. – 6:00 p. m.\nDomingos: 12:00 p. m. – 5:00 p. m.',
  'https://instagram.com/boceto.shop',
  'https://facebook.com/boceto.shop',
  'https://tiktok.com/@boceto.shop',
  'https://maps.google.com/?q=Av.+Reforma+222+Ciudad+de+Mexico',
  'Hecho con cariño para que vendas más. © 2026 Boceto.',
  'https://picsum.photos/seed/boceto-store/1600/900',
  'Todo lo que buscas, en un solo lugar',
  'Envíos a todo el país · Pago seguro · Atención personalizada por WhatsApp',
  'MXN'
where not exists (select 1 from site_settings);

insert into levels (slug, label, image_url, tagline, display_order)
select * from (values
  ('basico', 'Básico', 'https://picsum.photos/seed/boceto-level-1/500/500', 'Lo esencial, a buen precio', 1),
  ('premium', 'Premium', 'https://picsum.photos/seed/boceto-level-2/500/500', 'Calidad superior para el día a día', 2),
  ('exclusivo', 'Exclusivo', 'https://picsum.photos/seed/boceto-level-3/500/500', 'Ediciones limitadas y piezas únicas', 3)
) as v(slug, label, image_url, tagline, display_order)
where not exists (select 1 from levels);

insert into categories (slug, name, tagline, banner_image_url, display_order)
select * from (values
  ('coleccion', 'Colección', 'Nuestros productos de siempre, elegidos con cuidado', 'https://picsum.photos/seed/boceto-cat-1/1600/500', 1),
  ('novedades', 'Novedades', 'Lo último que llegó a la tienda', 'https://picsum.photos/seed/boceto-cat-2/1600/500', 2),
  ('esenciales', 'Esenciales', 'Básicos que nunca fallan', 'https://picsum.photos/seed/boceto-cat-3/1600/500', 3)
) as v(slug, name, tagline, banner_image_url, display_order)
where not exists (select 1 from categories);

insert into home_banner (id, images)
select true, array[
  'https://picsum.photos/seed/boceto-banner-1/1600/700',
  'https://picsum.photos/seed/boceto-banner-2/1600/700',
  'https://picsum.photos/seed/boceto-banner-3/1600/700'
]
where not exists (select 1 from home_banner);

insert into coupons (code, discount_type, discount_value, scope, usage_limit, used_count, active)
select 'BIENVENIDA10', 'percentage', 10, 'cart', 200, 0, true
where not exists (select 1 from coupons);

insert into loyalty_tiers (required_purchases, reward_description, discount_percent, coupon_scope, display_order)
select * from (values
  (2, '10% de descuento en tu próximo producto', 10::numeric, 'single_product', 1),
  (5, '20% de descuento en toda tu compra', 20::numeric, 'cart', 2),
  (10, 'Regalo sorpresa + 30% en toda tu compra', 30::numeric, 'cart', 3)
) as v(required_purchases, reward_description, discount_percent, coupon_scope, display_order)
where not exists (select 1 from loyalty_tiers);

insert into products (name, price, sale_price, on_sale, levels, category, brand, stock, vendor, sizes, description, images, cover_fit, featured)
select * from (values
  ('Kit de Inicio', 899, 749, true, array['basico'], 'coleccion', 'Boceto Studio', 30, 'Proveedor Central', array[]::text[], 'Todo lo necesario para empezar en una sola caja. Nuestra forma favorita de dar la bienvenida a clientes nuevos.', array['https://picsum.photos/seed/boceto-p1-a/800/1000','https://picsum.photos/seed/boceto-p1-b/800/1000'], 'cover', true),
  ('Caja Sorpresa', 1299, null, false, array['premium'], 'novedades', 'Boceto Studio', 18, 'Proveedor Central', array['Chica','Grande'], 'Una selección curada que cambia cada mes. Ideal para regalar o para darte un gusto.', array['https://picsum.photos/seed/boceto-p2-a/800/1000','https://picsum.photos/seed/boceto-p2-b/800/1000'], 'cover', true),
  ('Paquete Premium', 2490, 2190, true, array['premium'], 'coleccion', 'Casa Norte', 12, 'Casa Norte', array[]::text[], 'Nuestros productos mejor calificados reunidos en un paquete con precio especial.', array['https://picsum.photos/seed/boceto-p3-a/800/1000'], 'cover', true),
  ('Edición Limitada 01', 3200, null, false, array['exclusivo'], 'novedades', 'Taller Once', 5, 'Taller Once', array[]::text[], 'Producción corta y numerada. Cuando se acaba, no vuelve.', array['https://picsum.photos/seed/boceto-p4-a/800/1000','https://picsum.photos/seed/boceto-p4-b/800/1000'], 'cover', true),
  ('Set Esencial', 650, null, false, array['basico'], 'esenciales', 'Casa Norte', 40, 'Casa Norte', array[]::text[], 'Lo básico que todos necesitan, con la calidad de siempre.', array['https://picsum.photos/seed/boceto-p5-a/800/1000'], 'cover', false),
  ('Artículo Clásico', 480, null, false, array['basico'], 'coleccion', 'Estudio Sur', 35, 'Estudio Sur', array['Chico','Mediano','Grande'], 'El favorito de nuestros clientes desde el primer día. Disponible en tres tamaños.', array['https://picsum.photos/seed/boceto-p6-a/800/1000'], 'cover', false),
  ('Artículo Clásico Plus', 720, null, false, array['premium'], 'coleccion', 'Estudio Sur', 22, 'Estudio Sur', array['Mediano','Grande'], 'La versión mejorada del clásico, con materiales superiores y mejor acabado.', array['https://picsum.photos/seed/boceto-p7-a/800/1000'], 'cover', false),
  ('Pack Dúo', 1150, 990, true, array['premium'], 'esenciales', 'Boceto Studio', 16, 'Proveedor Central', array[]::text[], 'Dos de nuestros más vendidos juntos, con ahorro incluido.', array['https://picsum.photos/seed/boceto-p8-a/800/1000'], 'cover', false),
  ('Pieza de Colección', 4500, null, false, array['exclusivo'], 'coleccion', 'Taller Once', 3, 'Taller Once', array[]::text[], 'Hecha a mano, pieza por pieza. Para quienes buscan algo verdaderamente único.', array['https://picsum.photos/seed/boceto-p9-a/800/1000','https://picsum.photos/seed/boceto-p9-b/800/1000'], 'cover', true),
  ('Novedad de Temporada', 1050, null, false, array['premium'], 'novedades', 'Taller Once', 20, 'Taller Once', array[]::text[], 'Lo más nuevo de la temporada, recién llegado a la tienda.', array['https://picsum.photos/seed/boceto-p10-a/800/1000'], 'cover', true),
  ('Básico del Día', 299, null, false, array['basico'], 'esenciales', 'Casa Norte', 60, 'Casa Norte', array[]::text[], 'Precio accesible, calidad confiable. Perfecto para el uso diario.', array['https://picsum.photos/seed/boceto-p11-a/800/1000'], 'cover', false),
  ('Combo Familiar', 1890, 1590, true, array['basico'], 'esenciales', 'Boceto Studio', 14, 'Proveedor Central', array[]::text[], 'Pensado para compartir: más cantidad, mejor precio por unidad.', array['https://picsum.photos/seed/boceto-p12-a/800/1000'], 'cover', false),
  ('Edición Aniversario', 2800, null, false, array['exclusivo'], 'novedades', 'Taller Once', 8, 'Taller Once', array[]::text[], 'Celebramos un año más con una edición especial que solo estará disponible por tiempo limitado.', array['https://picsum.photos/seed/boceto-p13-a/800/1000'], 'cover', false),
  ('Complemento Práctico', 350, null, false, array['basico'], 'esenciales', 'Estudio Sur', 45, 'Estudio Sur', array[]::text[], 'El detalle que completa cualquier compra. Pequeño, útil y bien hecho.', array['https://picsum.photos/seed/boceto-p14-a/800/1000'], 'cover', false),
  ('Suscripción Mensual', 990, null, false, array['premium'], 'novedades', 'Boceto Studio', 99, 'Proveedor Central', array['1 mes','3 meses','6 meses'], 'Recibe cada mes una selección nueva en la puerta de tu casa. Cancela cuando quieras.', array['https://picsum.photos/seed/boceto-p15-a/800/1000'], 'cover', false),
  ('Tarjeta de Regalo', 500, null, false, array['basico'], 'coleccion', 'Boceto', 999, 'Boceto', array[]::text[], 'El regalo que nunca falla: quien la recibe elige lo que más le guste de la tienda.', array['https://picsum.photos/seed/boceto-p16-a/800/1000'], 'contain', false)
) as v(name, price, sale_price, on_sale, levels, category, brand, stock, vendor, sizes, description, images, cover_fit, featured)
where not exists (select 1 from products);

insert into reviews (name, rating, quote, image_url, status)
select * from (values
  ('Camila Herrera', 5, 'Mi pedido llegó en dos días y perfectamente empacado. Se nota el cuidado en cada detalle.', 'https://picsum.photos/seed/boceto-review-1/200/200', 'approved'),
  ('Juan Pablo Gómez', 5, 'Comprar fue facilísimo: elegí, confirmé por WhatsApp y listo. Súper recomendado.', 'https://picsum.photos/seed/boceto-review-2/200/200', 'approved'),
  ('Valentina Ríos', 4, 'Excelente atención, resolvieron todas mis dudas antes de comprar.', 'https://picsum.photos/seed/boceto-review-3/200/200', 'approved'),
  ('Andrés Torres', 5, 'La calidad superó lo que esperaba por el precio. Ya hice mi segundo pedido.', 'https://picsum.photos/seed/boceto-review-4/200/200', 'approved'),
  ('Mariana López', 5, 'Me encanta poder pagar al recibir. Todo muy confiable y rápido.', 'https://picsum.photos/seed/boceto-review-5/200/200', 'approved'),
  ('Santiago Martínez', 4, 'Buenos precios y mucha variedad. El seguimiento de mi pedido fue impecable.', 'https://picsum.photos/seed/boceto-review-6/200/200', 'approved'),
  ('Isabella Cruz', 5, 'El programa de recompensas es genial, ya reclamé mi primer descuento.', 'https://picsum.photos/seed/boceto-review-7/200/200', 'approved')
) as v(name, rating, quote, image_url, status)
where not exists (select 1 from reviews);
