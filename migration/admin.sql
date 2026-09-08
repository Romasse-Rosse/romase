-- ============================================================
-- ROMASE · Panel de administración: roles, permisos y almacenamiento
--
-- Se corre una vez en el SQL Editor de Supabase, después de schema.sql.
-- Es idempotente: se puede volver a correr sin romper nada.
--
-- ------------------------------------------------------------
-- Qué resuelve
-- ------------------------------------------------------------
-- El catálogo ya tiene lectura pública y la escritura pasaba únicamente por la
-- llave secreta, desde los scripts de migración. Para que el cliente administre
-- su tienda hace falta un tercer actor: una persona autenticada con permiso
-- para escribir, sin darle la llave secreta.
--
-- La decisión de fondo: **quién puede qué se define en la base, no en el
-- navegador.** Un panel es código que se descarga; cualquiera puede leerlo y
-- llamar a la API con la llave pública. Si el permiso viviera solo en la
-- interfaz, esconder un botón sería toda la seguridad. Acá cada tabla dice
-- quién puede escribirla, y el panel se limita a no ofrecer lo que la base va a
-- rechazar de todos modos.
--
-- Está tomado del panel de Groner, que ya resolvió esto mismo. Lo que cambia es
-- el esquema del catálogo, que en ROMASE viene del WooCommerce con ids enteros.
-- ============================================================

begin;

create schema if not exists app_private;

-- ------------------------------------------------------------
-- Quién administra
--
-- Ser usuario de Supabase Auth no alcanza: hace falta estar en esta tabla y
-- activo. Así, dar de baja a alguien es una fila, no borrar una cuenta.
-- ------------------------------------------------------------
create table if not exists public.admin_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  nombre     text,
  role       text not null default 'editor'
             check (role in ('owner', 'admin', 'editor', 'viewer')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_profiles is
  'Personas con acceso al panel. owner administra usuarios; admin y editor '
  'administran contenido; viewer solo mira.';

-- ------------------------------------------------------------
-- La función que usan todas las políticas
--
-- security definer para que pueda leer admin_profiles sin que el usuario tenga
-- permiso directo sobre esa tabla, y search_path fijo para que no se le pueda
-- colar un esquema propio delante.
-- ------------------------------------------------------------
create or replace function app_private.has_admin_role(
  required_roles text[] default array['owner', 'admin', 'editor']
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles perfil
    where perfil.user_id = auth.uid()
      and perfil.is_active = true
      and perfil.role = any(required_roles)
  );
$$;

revoke all on function app_private.has_admin_role(text[]) from public;
grant usage on schema app_private to anon, authenticated, service_role;
grant execute on function app_private.has_admin_role(text[]) to anon, authenticated, service_role;

-- Mantiene updated_at sin depender de que la aplicación se acuerde.
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.tocar_updated_at() from public;

drop trigger if exists admin_profiles_updated_at on public.admin_profiles;
create trigger admin_profiles_updated_at
  before update on public.admin_profiles
  for each row execute function public.tocar_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.tocar_updated_at();

-- ------------------------------------------------------------
-- Permisos sobre admin_profiles
--
-- Cada uno ve su propia fila —el panel necesita saber qué rol tiene quien entró
-- — y solo owner puede tocar la de los demás. Sin esto, un editor podría
-- ascenderse a owner con una sola llamada a la API.
-- ------------------------------------------------------------
alter table public.admin_profiles enable row level security;

drop policy if exists "perfil propio o de owner" on public.admin_profiles;
create policy "perfil propio o de owner" on public.admin_profiles
  for select using (
    user_id = (select auth.uid())
    or app_private.has_admin_role(array['owner', 'admin'])
  );

drop policy if exists "solo owner administra perfiles" on public.admin_profiles;
create policy "solo owner administra perfiles" on public.admin_profiles
  for all using (app_private.has_admin_role(array['owner']))
  with check (app_private.has_admin_role(array['owner']));

-- ------------------------------------------------------------
-- Escritura del catálogo
--
-- La lectura pública ya está en schema.sql y no se toca. Se agrega la escritura
-- para quien administra. viewer queda afuera a propósito: es el rol para
-- mostrarle la tienda a alguien sin riesgo de que la modifique.
--
-- Se declara una política por acción en vez de un for all: así se puede quitar
-- el borrado sin tocar el resto, y borrar es lo único irreversible.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['categories', 'products', 'product_images', 'product_categories']
  loop
    execute format('drop policy if exists "panel inserta" on public.%I', t);
    execute format(
      'create policy "panel inserta" on public.%I for insert '
      'with check (app_private.has_admin_role())', t);

    execute format('drop policy if exists "panel edita" on public.%I', t);
    execute format(
      'create policy "panel edita" on public.%I for update '
      'using (app_private.has_admin_role()) '
      'with check (app_private.has_admin_role())', t);

    -- Borrar queda en owner y admin. Un editor puede despublicar un producto,
    -- que es reversible; borrarlo se lleva las líneas de pedidos históricas.
    execute format('drop policy if exists "panel borra" on public.%I', t);
    execute format(
      'create policy "panel borra" on public.%I for delete '
      'using (app_private.has_admin_role(array[''owner'', ''admin'']))', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Pedidos y consultas
--
-- Estas tablas no tienen lectura pública y así se quedan: son datos de
-- compradores. Se abren solo para quien administra.
--
-- Nadie puede borrar un pedido desde el panel, ni owner. Un pedido es un
-- registro contable y su línea es el respaldo de lo que se cobró; si sobra, se
-- anula cambiándole el estado. Borrar se hace por SQL, a mano y a propósito.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['orders', 'order_items', 'leads']
  loop
    execute format('drop policy if exists "panel lee" on public.%I', t);
    execute format(
      'create policy "panel lee" on public.%I for select '
      'using (app_private.has_admin_role(array[''owner'', ''admin'', ''editor'', ''viewer'']))', t);

    execute format('drop policy if exists "panel edita" on public.%I', t);
    execute format(
      'create policy "panel edita" on public.%I for update '
      'using (app_private.has_admin_role()) '
      'with check (app_private.has_admin_role())', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Imágenes: bucket público de solo lectura
--
-- Las fotos de producto son públicas por definición: se muestran en la tienda.
-- Lo que se protege es quién las sube, reemplaza y borra.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('romase-publico', 'romase-publico', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "romase lectura publica de imagenes" on storage.objects;
create policy "romase lectura publica de imagenes" on storage.objects
  for select using (bucket_id = 'romase-publico');

drop policy if exists "romase panel sube imagenes" on storage.objects;
create policy "romase panel sube imagenes" on storage.objects
  for insert with check (bucket_id = 'romase-publico' and app_private.has_admin_role());

drop policy if exists "romase panel reemplaza imagenes" on storage.objects;
create policy "romase panel reemplaza imagenes" on storage.objects
  for update
  using (bucket_id = 'romase-publico' and app_private.has_admin_role())
  with check (bucket_id = 'romase-publico' and app_private.has_admin_role());

drop policy if exists "romase panel borra imagenes" on storage.objects;
create policy "romase panel borra imagenes" on storage.objects
  for delete
  using (bucket_id = 'romase-publico' and app_private.has_admin_role(array['owner', 'admin']));

commit;

-- ============================================================
-- Después de correr esto
-- ============================================================
--
-- 1. Crear el usuario en el panel de Supabase:
--    Authentication → Users → Add user → con correo y contraseña.
--
-- 2. Darle el rol de owner, reemplazando el correo:
--
--      insert into public.admin_profiles (user_id, email, nombre, role)
--      select id, email, 'Nombre Apellido', 'owner'
--      from auth.users
--      where email = 'correo@ejemplo.cl'
--      on conflict (user_id) do update set role = 'owner', is_active = true;
--
-- 3. Comprobar que quedó:
--
--      select email, role, is_active from public.admin_profiles;
--
-- El primer usuario tiene que crearse así, desde el panel de Supabase: no hay
-- registro abierto en la web a propósito. Una tienda no necesita que cualquiera
-- pueda pedir una cuenta de administrador.
