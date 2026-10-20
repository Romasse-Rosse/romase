-- ============================================================
-- ROMASE · stock por cantidad
--
--   Correr en el SQL Editor de Supabase.
--   Volver a correrlo no rompe nada.
-- ============================================================
--
-- Hasta ahora el stock era un sí o no (`in_stock`). Esto agrega la cantidad y
-- hace que se descuente sola con cada compra pagada.

-- ------------------------------------------------------------
-- La cantidad
--
-- Admite NULL a propósito, y NULL no es lo mismo que cero:
--
--   NULL → no se lleva control de unidades. El producto se vende mientras
--          «Disponible para comprar» esté marcado. Es como funcionaba todo
--          hasta ahora, así que los 295 productos que ya existen siguen
--          comportándose igual sin tocar ninguno.
--   0    → se agotó. No se puede comprar.
--   N    → quedan N unidades.
--
-- Si la columna no admitiera NULL habría que inventar una cantidad para cada
-- producto existente, y un número inventado en un campo de stock es peor que
-- no tener el campo.
-- ------------------------------------------------------------
alter table products
  add column if not exists stock_quantity integer
  check (stock_quantity is null or stock_quantity >= 0);

comment on column products.stock_quantity is
  'Unidades disponibles. NULL = no se controla el stock de este producto.';

-- ------------------------------------------------------------
-- Marca de que a un pedido ya se le descontó el stock
--
-- Sin esto, recargar la página de retorno de Webpay descontaría otra vez.
-- ------------------------------------------------------------
alter table orders
  add column if not exists stock_descontado boolean not null default false;

-- ------------------------------------------------------------
-- Descontar
--
-- Todo adentro de una función para que sea una sola operación atómica: dos
-- compras simultáneas del último horno no pueden dejar el stock en -1.
--
-- La idempotencia sale del propio UPDATE: la fila se marca como descontada
-- solo si todavía no lo estaba, y si no se marcó ninguna fila es porque otra
-- llamada llegó primero, así que esta se va sin hacer nada.
-- ------------------------------------------------------------
create or replace function descontar_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
     set stock_descontado = true
   where id = p_order_id
     and stock_descontado = false;

  -- Otra llamada ya lo hizo.
  if not found then
    return;
  end if;

  -- greatest(...,0) por si el stock quedó desfasado por una carga manual:
  -- preferimos un cero a un número negativo, que no significa nada.
  update products p
     set stock_quantity = greatest(0, p.stock_quantity - oi.quantity),
         updated_at = now()
    from order_items oi
   where oi.order_id = p_order_id
     and oi.product_id = p.id
     and p.stock_quantity is not null;

  -- Lo que llegó a cero deja de venderse. Es lo que espera quien atiende la
  -- tienda: se acabó, no se ofrece. Vuelve solo al cargar unidades.
  update products p
     set in_stock = false,
         updated_at = now()
    from order_items oi
   where oi.order_id = p_order_id
     and oi.product_id = p.id
     and p.stock_quantity = 0
     and p.in_stock = true;
end;
$$;

revoke all on function descontar_stock(uuid) from public;
grant execute on function descontar_stock(uuid) to service_role;

-- ------------------------------------------------------------
-- Para mirar de un vistazo qué se está por acabar
-- ------------------------------------------------------------
create index if not exists products_stock_quantity
  on products (stock_quantity)
  where stock_quantity is not null;
