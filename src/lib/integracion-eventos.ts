import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * El historial de sincronización.
 *
 * Registra cada vez que se arma el feed de Merchant Center, con los números
 * del momento. Sin esto no hay forma de responder «¿desde cuándo Google ve
 * menos productos?», que es la pregunta que aparece cuando algo se cae.
 *
 * Es deliberadamente silencioso: si la tabla no existe —porque falta correr
 * migration/admin-integraciones.sql— o si Supabase no responde, no pasa nada.
 * Un registro de diagnóstico no puede ser el motivo por el que el feed deje de
 * publicarse.
 */

export type EventoDeIntegracion = {
  id: number
  plataforma: string
  tipo: string
  estado: 'ok' | 'error'
  detalle: Record<string, unknown>
  agente: string | null
  mensaje: string | null
  creado_en: string
}

function clienteDeServicio() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !llave) return null
  return createClient(url, llave, { auth: { persistSession: false } })
}

export async function registrarEvento(evento: {
  plataforma: string
  tipo: string
  estado?: 'ok' | 'error'
  detalle?: Record<string, unknown>
  agente?: string | null
  mensaje?: string | null
}): Promise<void> {
  const db = clienteDeServicio()
  if (!db) return

  try {
    await db.from('integracion_eventos').insert({
      plataforma: evento.plataforma,
      tipo: evento.tipo,
      estado: evento.estado ?? 'ok',
      detalle: evento.detalle ?? {},
      agente: evento.agente ?? null,
      mensaje: evento.mensaje ?? null,
    })
  } catch {
    // A propósito: ver arriba.
  }
}

/**
 * Los últimos eventos de una plataforma.
 *
 * Devuelve `null` —y no una lista vacía— cuando la tabla todavía no existe,
 * para que la pantalla pueda distinguir «nunca se sincronizó» de «falta
 * correr la migración». Son dos cosas distintas y llevan a acciones distintas.
 */
export async function ultimosEventos(
  db: { from: (t: string) => any },
  plataforma: string,
  cuantos = 20,
): Promise<{ eventos: EventoDeIntegracion[] } | { faltaLaTabla: true } | { error: string }> {
  const { data, error } = await db
    .from('integracion_eventos')
    .select('id, plataforma, tipo, estado, detalle, agente, mensaje, creado_en')
    .eq('plataforma', plataforma)
    .order('creado_en', { ascending: false })
    .limit(cuantos)

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return { faltaLaTabla: true }
    return { error: error.message }
  }

  return { eventos: (data ?? []) as EventoDeIntegracion[] }
}
