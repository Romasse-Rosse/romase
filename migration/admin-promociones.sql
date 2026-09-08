-- ============================================================
-- ROMASE · Promociones con vigencia
--
-- Se corre una vez en el SQL Editor de Supabase, después de admin.sql.
-- Es idempotente.
--
-- ------------------------------------------------------------
-- Por qué una tabla y no un precio nuevo en el producto
-- ------------------------------------------------------------
-- Un descuento con fecha de término no se puede guardar escribiendo
-- `sale_price` en cada producto: alguien tendría que entrar a apagarlo el día
-- que vence, y si se olvida, la tienda sigue vendiendo con descuento sin que
-- nadie lo haya decidido. Tampoco serviría para «Panadería con 20 %», porque
-- habría que reescribir decenas de filas y después revertirlas una por una,
-- perdiendo el precio original de las que ya tenían oferta propia.
--
-- Acá el descuento es una **regla con vigencia** y el precio se calcula al
-- leerlo. Vencer es no aplicarse más: no hace falta que nadie haga nada.
--
-- ------------------------------------------------------------
-- Cómo se resuelve cuando hay más de una
-- ------------------------------------------------------------
-- Gana la más específica: una promoción sobre un producto le pisa a la de su
-- categoría. Eso permite justamente lo que se necesita —«Panadería al 20 %,
-- pero esta amasadora al 5 %»— sin excepciones ni listas negras.
--
-- Entre dos del mismo alcance gana la de mayor descuento.
-- ============================================================

begin;

create table if not exists public.promotions (
  id          bigserial primary key,

  -- Qué abarca. Una de las dos referencias va llena y la otra nula.
  scope       text not null check (scope in ('producto', 'categoria')),
  product_id  bigint references public.products (id)   on delete cascade,
  category_id bigint references public.categories (id) on delete cascade,

  -- Porcentaje entero. Se descuenta sobre el precio normal (regular_price),
  -- no sobre el vigente: si no, aplicar dos veces una promoción compondría el
  -- descuento y el precio se iría al piso sin que nadie lo pidiera.
  percent     integer not null check (percent between 1 and 90),

  label       text,

  starts_at   timestamptz not null default now(),
  -- Nulo significa «hasta que se apague a mano». Se permite, pero el panel
  -- pide fecha de término por defecto.
  ends_at     timestamptz,

  is_active   boolean not null default true,

  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- El alcance y la referencia tienen que ser coherentes. Sin esto se puede
  -- guardar una promoción de alcance 'producto' sin producto, que no se
  -- aplicaría a nada y aparecería activa en el panel.
  constraint promocion_con_referencia_coherente check (
    (scope = 'producto'  and product_id is not null and category_id is null) or
    (scope = 'categoria' and category_id is not null and product_id is null)
  ),

  constraint promocion_termina_despues_de_empezar check (
    ends_at is null or ends_at > starts_at
  )
);

comment on table public.promotions is
  'Descuentos con vigencia. El precio se calcula al leer el catálogo: vencer es '
  'dejar de aplicarse, no hace falta apagar nada.';

drop trigger if exists promotions_updated_at on public.promotions;
create trigger promotions_updated_at
  before update on public.promotions
  for each row execute function public.tocar_updated_at();

-- Las consultas del catálogo piden siempre las vigentes.
create index if not exists promotions_vigencia_idx
  on public.promotions (is_active, starts_at, ends_at);

-- ------------------------------------------------------------
-- Permisos
--
-- Lectura pública: la tienda las necesita para calcular el precio, y el
-- descuento es información que se muestra en la web de todos modos.
--
-- Escritura solo para quien administra. Borrar queda en owner y admin: un
-- editor puede desactivar una promoción, que es reversible y deja el registro
-- de que existió.
-- ------------------------------------------------------------
alter table public.promotions enable row level security;

drop policy if exists "lectura publica" on public.promotions;
create policy "lectura publica" on public.promotions
  for select using (true);

drop policy if exists "panel inserta" on public.promotions;
create policy "panel inserta" on public.promotions
  for insert with check (app_private.has_admin_role());

drop policy if exists "panel edita" on public.promotions;
create policy "panel edita" on public.promotions
  for update using (app_private.has_admin_role())
  with check (app_private.has_admin_role());

drop policy if exists "panel borra" on public.promotions;
create policy "panel borra" on public.promotions
  for delete using (app_private.has_admin_role(array['owner', 'admin']));

commit;
