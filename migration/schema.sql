-- ============================================================
-- ROMASE · Esquema de catálogo en Supabase
-- Migrado desde WooCommerce (romase.cl). Ejecutar en el SQL Editor.
-- ============================================================

create extension if not exists unaccent;

-- ------------------------------------------------------------
-- Configuración de búsqueda en español que además ignora tildes,
-- para que "panaderia" encuentre "PANADERÍA".
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_ts_config where cfgname = 'es_unaccent') then
    create text search configuration es_unaccent (copy = spanish);
    alter text search configuration es_unaccent
      alter mapping for hword, hword_part, word with unaccent, spanish_stem;
  end if;
end $$;

-- ------------------------------------------------------------
-- Categorías
-- ------------------------------------------------------------
create table if not exists categories (
  id            bigint primary key,           -- id original de WooCommerce (trazabilidad)
  name          text   not null,
  slug          text   not null unique,
  parent_id     bigint references categories (id) on delete set null,
  description   text,
  seo_content   text,                         -- contenido largo (600+ palabras) para posicionamiento
  faqs          jsonb  not null default '[]', -- [{ pregunta, respuesta }]
  image_url     text,
  product_count integer not null default 0,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists categories_parent_idx on categories (parent_id);

-- ------------------------------------------------------------
-- Productos
-- ------------------------------------------------------------
create table if not exists products (
  id                bigint primary key,       -- id original de WooCommerce
  name              text    not null,
  slug              text    not null unique,
  sku               text,
  description       text,
  short_description text,
  price             numeric(12, 2) not null default 0,
  regular_price     numeric(12, 2),
  sale_price        numeric(12, 2),
  currency          text    not null default 'CLP',
  in_stock          boolean not null default true,
  featured          boolean not null default false,
  legacy_permalink  text,                     -- URL antigua, para los redirects 301
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Vector de búsqueda: el nombre pesa más que el SKU, y el SKU más que la descripción.
alter table products drop column if exists search_vector;
alter table products add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('es_unaccent', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('es_unaccent', coalesce(sku, '')), 'B') ||
    setweight(to_tsvector('es_unaccent', coalesce(short_description, '')), 'C') ||
    setweight(to_tsvector('es_unaccent', coalesce(description, '')), 'D')
  ) stored;

create index if not exists products_search_idx   on products using gin (search_vector);
create index if not exists products_featured_idx on products (featured) where featured;
create index if not exists products_stock_idx    on products (in_stock);

-- ------------------------------------------------------------
-- Imágenes
-- ------------------------------------------------------------
create table if not exists product_images (
  id         bigserial primary key,
  product_id bigint  not null references products (id) on delete cascade,
  src        text    not null,
  alt        text,
  position   integer not null default 0
);

create index if not exists product_images_product_idx on product_images (product_id, position);

-- ------------------------------------------------------------
-- Relación producto ↔ categoría
-- ------------------------------------------------------------
create table if not exists product_categories (
  product_id  bigint not null references products (id)   on delete cascade,
  category_id bigint not null references categories (id) on delete cascade,
  primary key (product_id, category_id)
);

create index if not exists product_categories_category_idx on product_categories (category_id);

-- ------------------------------------------------------------
-- Pedidos · preparado para la fase 2 (Transbank Webpay Plus)
-- ------------------------------------------------------------
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     bigserial unique,
  status           text not null default 'pendiente'
                   check (status in ('pendiente', 'pagado', 'rechazado', 'preparando', 'enviado', 'entregado', 'anulado')),
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text,
  customer_rut     text,
  shipping_address jsonb,
  subtotal         numeric(12, 2) not null default 0,
  shipping_cost    numeric(12, 2) not null default 0,
  total            numeric(12, 2) not null default 0,
  currency         text not null default 'CLP',
  -- Datos que devuelve Webpay Plus REST
  webpay_token     text,
  webpay_buy_order text,
  webpay_response  jsonb,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists order_items (
  id           bigserial primary key,
  order_id     uuid   not null references orders (id) on delete cascade,
  product_id   bigint references products (id) on delete set null,
  product_name text   not null,   -- congelado al momento de la compra
  sku          text,
  unit_price   numeric(12, 2) not null,
  quantity     integer not null check (quantity > 0),
  line_total   numeric(12, 2) not null
);

create index if not exists order_items_order_idx on order_items (order_id);

-- ------------------------------------------------------------
-- Consultas y cotizaciones que llegan por el formulario del sitio
-- ------------------------------------------------------------
create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  company     text,
  message     text not null,
  product_ref text,                       -- producto desde el que se consultó, si aplica
  source      text not null default 'formulario-contacto',
  status      text not null default 'nuevo'
              check (status in ('nuevo', 'contactado', 'cotizado', 'ganado', 'perdido')),
  created_at  timestamptz not null default now()
);

create index if not exists leads_created_idx on leads (created_at desc);
create index if not exists leads_status_idx  on leads (status);

-- ------------------------------------------------------------
-- Búsqueda de productos con ranking
-- ------------------------------------------------------------
create or replace function search_products(termino text, limite integer default 24)
returns setof products
language sql
stable
as $fn$
  select p.*
  from products p
  where p.search_vector @@ websearch_to_tsquery('es_unaccent', termino)
  order by ts_rank(p.search_vector, websearch_to_tsquery('es_unaccent', termino)) desc,
           p.in_stock desc,
           p.name asc
  limit limite;
$fn$;

-- ------------------------------------------------------------
-- RLS · el catálogo es público de solo lectura.
-- La escritura pasa siempre por la service_role key (scripts y panel).
-- ------------------------------------------------------------
alter table categories         enable row level security;
alter table products           enable row level security;
alter table product_images     enable row level security;
alter table product_categories enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table leads              enable row level security;

do $$
declare t text;
begin
  foreach t in array array['categories', 'products', 'product_images', 'product_categories']
  loop
    execute format('drop policy if exists "lectura publica" on %I', t);
    execute format('create policy "lectura publica" on %I for select using (true)', t);
  end loop;
end $$;

-- Los pedidos y las consultas quedan sin política de lectura pública a
-- propósito: solo la service_role puede tocarlos. El formulario del sitio
-- escribe a través del servidor, nunca desde el navegador.
