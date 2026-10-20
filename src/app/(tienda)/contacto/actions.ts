'use server'

import { createClient } from '@supabase/supabase-js'
import { sendLeadNotification, type Lead } from '@/lib/email'
import { site } from '@/lib/site'
import { evaluar } from '@/lib/antispam'

export type ContactState = {
  status: 'idle' | 'ok' | 'error'
  message?: string
  /** Errores por campo, para marcarlos en el formulario. */
  fieldErrors?: Record<string, string>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Lo que se responde cuando la consulta entró.
 *
 * Es una constante y no dos literales porque al correo basura se le contesta
 * exactamente lo mismo: decirle a un bot que lo detectaron solo sirve para
 * que el siguiente venga mejor preparado. Dos textos separados se despegan
 * con el tiempo y delatan el filtro.
 */
const CONFIRMACION = 'Recibimos tu consulta. Te respondemos dentro del día hábil.'

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

  /**
   * ¿Es correo basura?
   *
   * Lo que se marca como basura **igual se guarda**, con estado 'spam', y lo
   * único que no pasa es que suene el aviso por correo. Si el filtro se
   * equivoca, la consulta sigue en la base y alguien puede encontrarla. Un
   * filtro que descarta en silencio es peor que no tener filtro: un cliente
   * perdido cuesta mucho más que un correo de más.
   *
   * Ver src/lib/antispam.ts.
   */
  const abiertoEn = Number(formData.get('abiertoEn'))
  const veredicto = evaluar({
    nombre: name,
    email,
    mensaje: message,
    empresa: company || undefined,
    demoraEnEnviar: Number.isFinite(abiertoEn) && abiertoEn > 0 ? Date.now() - abiertoEn : undefined,
  })

  if (veredicto.esBasura) {
    console.warn(
      '[contacto] marcado como basura (' + veredicto.puntos + ' pts): ' + veredicto.motivos.join(' · '),
    )
    await guardarEnSupabase(lead, 'spam')
    // Se responde lo mismo que a una consulta buena: decirle a un bot que lo
    // detectaron solo sirve para que el siguiente venga mejor preparado.
    return { status: 'ok', message: CONFIRMACION }
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
    return { status: 'ok', message: CONFIRMACION }
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

async function guardarEnSupabase(
  lead: Lead,
  estado: 'nuevo' | 'spam' = 'nuevo',
): Promise<{ ok: boolean; reason?: string }> {
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
      status: estado,
    })

    if (error) return { ok: false, reason: error.message }
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: (error as Error).message }
  }
}
