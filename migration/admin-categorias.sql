-- ============================================================
-- ROMASE · Permitir crear categorías desde el panel
--
-- Se corre una vez en el SQL Editor de Supabase, después de admin.sql.
-- Es idempotente.
--
-- ------------------------------------------------------------
-- Por qué hace falta
-- ------------------------------------------------------------
-- `categories.id` es `bigint` sin valor por defecto, igual que `products.id`:
-- los ids son los originales de WooCommerce y se conservaron para poder volver
-- a correr la migración del catálogo sin duplicar nada. Un insert nuevo tiene
-- que traer su propio id, y el panel no tiene de dónde sacarlo.
--
-- Arranca en 100000 por lo mismo que la de productos: el id más alto que vino
-- de Woo está muy por debajo, así que una categoría creada acá no puede chocar
-- con una que Woo vuelva a mandar, y el id dice de dónde salió.
-- ============================================================

begin;

create sequence if not exists public.categories_panel_id_seq
  as bigint
  start with 100000
  owned by public.categories.id;

-- `if not exists` hace que volver a correr esto no reinicie la secuencia:
-- retrocederla generaría ids repetidos.
alter table public.categories
  alter column id set default nextval('public.categories_panel_id_seq');

commit;

-- ============================================================
-- Nota sobre la jerarquía
-- ============================================================
--
-- `parent_id` es una clave ajena a la misma tabla, y Postgres **acepta ciclos**:
-- nada impide que A cuelgue de B y B de A. El catálogo arma su árbol con una
-- función recursiva, así que un ciclo no rompe una categoría, tumba el sitio
-- entero.
--
-- Quien lo impide es el panel, en src/lib/categorias-panel.ts, con pruebas en
-- `yarn categorias:probar`. Si alguna vez se escriben categorías por fuera del
-- panel, la comprobación hay que hacerla igual.
