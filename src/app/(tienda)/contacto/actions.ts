'use server'

import { createClient } from '@supabase/supabase-js'
import { sendLeadNotification, type Lead } from '@/lib/email'
import { site } from '@/lib/site'

export type ContactState = {
  status: 'idle' | 'ok' | 'error'
  message?: string
  /** Errores por campo, para marcarlos en el formulario. */
  fieldErrors?: Record<string, string>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitContact(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Campo trampa: los bots lo completan, las personas no lo ven.
  if (formData.get('website')) return { status: 'ok' }

  const value = (key: string) => String(formData.get(key) ?? '').trim()

  const name = value('name')
  const email = value('email')
  const phone = value('phone')
  const company = value('company')
  const message = value('message')
  const productRef = value('productRef')

  const fieldErrors: Record<string, string> = {}
  if (name.length < 2) fieldErrors.name = 'Escribe tu nombre.'
  if (!EMAIL_RE.test(email)) fieldErrors.email = 'Revisa el correo electrónico.'
  if (message.length < 10) fieldErrors.message = 'Cuéntanos un poco más qué necesitas.'

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', message: 'Faltan datos por completar.', fieldErrors }
  }

  const lead = {
    name,
    email,
    phone: phone || undefined,
    company: company || undefined,
    message,
    productRef: productRef || undefined,
  }

  // Dos destinos con roles distintos: Supabase es el registro durable y el
  // correo es el aviso para que alguien lo lea el mismo día. Se intentan los
  // dos y basta con que uno funcione para no perder la consulta.
  const [guardado, enviado] = await Promise.all([
    guardarEnSupabase(lead),
    sendLeadNotification(lead),
  ])

  if (guardado.ok || enviado.sent) {
    if (!guardado.ok) {
      console.warn('[contacto] no se pudo guardar en Supabase:', guardado.reason)
    }
    if (!enviado.sent) {
      console.warn('[contacto] no se pudo enviar el aviso por correo:', enviado.reason)
    }
    return {
      status: 'ok',
      message: 'Recibimos tu consulta. Te respondemos dentro del día hábil.',
    }
  }

  // Falló todo. Se dice claramente en vez de simular que se envió: un
  // formulario que pierde consultas en silencio es peor que no tener
  // formulario.
  console.error('[contacto] la consulta no se pudo registrar por ningún canal', {
    supabase: guardado.reason,
    correo: enviado.reason,
  })

  return {
    status: 'error',
    message:
      `No pudimos registrar tu consulta en este momento. Llámanos al ${site.contact.phone} o ` +
      `escríbenos a ${site.contact.email} y te respondemos igual de rápido.`,
  }
}

async function guardarEnSupabase(lead: Lead): Promise<{ ok: boolean; reason?: string }> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return { ok: false, reason: 'Supabase no configurado' }

  try {
    const db = createClient(url, key, { auth: { persistSession: false } })
    const { error } = await db.from('leads').insert({
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? null,
      company: lead.company ?? null,
      message: lead.message,
      product_ref: lead.productRef ?? null,
      source: lead.productRef ? 'consulta-producto' : 'formulario-contacto',
    })

    if (error) return { ok: false, reason: error.message }
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: (error as Error).message }
  }
}
