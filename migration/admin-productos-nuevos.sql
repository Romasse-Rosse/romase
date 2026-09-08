-- ============================================================
-- ROMASE · Permitir crear productos desde el panel
--
-- Se corre una vez en el SQL Editor de Supabase, después de admin.sql.
-- Es idempotente.
--
-- ------------------------------------------------------------
-- Por qué hace falta
-- ------------------------------------------------------------
-- `products.id` es `bigint` sin valor por defecto: los ids son los originales
-- de WooCommerce, y se conservaron para poder volver a correr la migración del
-- catálogo sin duplicar nada. Eso significa que un insert nuevo tiene que
-- traer su propio id, y el panel no tiene de dónde sacarlo.
--
-- ------------------------------------------------------------
-- Por qué la secuencia arranca en 100000
-- ------------------------------------------------------------
-- El id más alto que vino de WooCommerce es 1542. Si la secuencia empezara
-- ahí cerca, un producto creado en el panel podría quedar con un id que
-- WooCommerce también use, y `yarn catalog:seed` —que hace upsert por id— lo
-- sobrescribiría en la próxima corrida. Con 100000 no hay forma de que se
-- pisen, y de paso el id dice de dónde salió el producto: menor a 100000 vino
-- de la migración, mayor se creó acá.
-- ============================================================

begin;

create sequence if not exists public.products_panel_id_seq
  as bigint
  start with 100000
  owned by public.products.id;

-- `if not exists` hace que volver a correr esto no reinicie la secuencia. Eso
-- importa: retrocederla generaría ids repetidos.
alter table public.products
  alter column id set default nextval('public.products_panel_id_seq');

commit;

-- Comprobación:
--
--   insert into products (name, slug, price) values ('Prueba', 'prueba-borrar', 1000)
--   returning id;   -- tiene que devolver 100000 o más
--
--   delete from products where slug = 'prueba-borrar';
