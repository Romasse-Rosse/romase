-- ============================================================
-- ROMASE · registro de sincronización de las integraciones
--
--   Correr en el SQL Editor de Supabase.
--   Volver a correrlo no rompe nada.
-- ============================================================
--
-- Una sola tabla, a propósito.
--
-- El módulo equivalente de otro cliente (groner) tiene tres: ajustes por
-- plataforma, vínculo producto↔id externo, y eventos entrantes y salientes.
-- Eso tiene sentido cuando la integración es por API y bidireccional, como
-- AnyMarket: hay algo que empujar, ids que mantener y webhooks que recibir.
--
-- Acá no. Merchant Center es de arrastre: publicamos /merchant.xml y Google
-- lo va a buscar solo. No hay ids externos que guardar ni nada que empujar, y
-- la configuración de cada integración vive en variables de entorno, no en la
-- base. Tablas para eso quedarían vacías y darían la impresión de que el
-- sistema hace cosas que no hace.
--
-- Lo que sí falta es memoria: qué se publicó, cuándo y con cuántos productos.
-- Eso es esta tabla.

create table if not exists integracion_eventos (
  id           bigserial primary key,

  -- 'merchant-center' hoy; queda abierto para las que vengan.
  plataforma   text not null,

  -- Qué pasó. 'feed-generado' es el único por ahora.
  tipo         text not null,

  estado       text not null default 'ok' check (estado in ('ok', 'error')),

  -- Los números del momento: cuántos productos entraron, cuántos quedaron
  -- afuera y por qué. Guardarlos permite ver la evolución sin recalcular
  -- sobre un catálogo que ya cambió.
  detalle      jsonb not null default '{}'::jsonb,

  -- Quién lo pidió. Sirve para distinguir una visita de Google de una
  -- recarga hecha a mano desde el panel.
  agente       text,

  mensaje      text,

  creado_en    timestamptz not null default now()
);

create index if not exists integracion_eventos_plataforma_fecha
  on integracion_eventos (plataforma, creado_en desc);

-- El histórico crece solo y nadie lo mira más allá de unas semanas.
create index if not exists integracion_eventos_creado_en
  on integracion_eventos (creado_en desc);

alter table integracion_eventos enable row level security;

-- ------------------------------------------------------------
-- Quién puede ver y escribir
--
-- Leer: cualquiera del panel. Es información de diagnóstico, no datos de
-- clientes.
--
-- Escribir: solo el servidor con la llave secreta, porque quien escribe es la
-- ruta del feed, no una persona.
-- ------------------------------------------------------------
drop policy if exists "panel lee eventos" on integracion_eventos;
create policy "panel lee eventos"
  on integracion_eventos for select
  using (app_private.has_admin_role());

-- No hay política de escritura a propósito: quien inserta es la ruta del feed,
-- con la llave secreta, y el service_role no pasa por RLS. Sin política, nadie
-- con una sesión del panel puede falsear el historial.

-- ------------------------------------------------------------
-- Limpieza
--
-- Sin esto la tabla crece para siempre. Un feed por hora son ~8.760 filas al
-- año: no es un problema de tamaño, pero sí de ruido al mirar el historial.
-- Se borra lo de más de 90 días cada vez que se inserta algo, que es barato y
-- no necesita un cron.
-- ------------------------------------------------------------
create or replace function limpiar_integracion_eventos()
returns trigger
language plpgsql
as $$
begin
  delete from integracion_eventos
  where creado_en < now() - interval '90 days';
  return null;
end;
$$;

drop trigger if exists integracion_eventos_limpieza on integracion_eventos;
create trigger integracion_eventos_limpieza
  after insert on integracion_eventos
  for each statement
  execute function limpiar_integracion_eventos();
