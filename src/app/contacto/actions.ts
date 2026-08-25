'use server'

import { createClient } from '@supabase/supabase-js'

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

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Sin Supabase configurado no se puede guardar la consulta. Se dice
  // claramente en vez de simular que se envió: un formulario que pierde
  // consultas en silencio es peor que no tener formulario.
  if (!url || !key) {
    return {
      status: 'error',
      message:
        'No pudimos registrar tu consulta en este momento. Escríbenos por WhatsApp o al correo ' +
        'y te respondemos igual de rápido.',
    }
  }

  try {
    const db = createClient(url, key, { auth: { persistSession: false } })
    const { error } = await db.from('leads').insert({
      name,
      email,
      phone: phone || null,
      company: company || null,
      message,
      product_ref: productRef || null,
      source: productRef ? 'consulta-producto' : 'formulario-contacto',
    })

    if (error) throw new Error(error.message)

    return {
      status: 'ok',
      message: 'Recibimos tu consulta. Te respondemos dentro del día hábil.',
    }
  } catch (error) {
    console.error('[contacto] no se pudo guardar la consulta:', error)
    return {
      status: 'error',
      message:
        'Hubo un problema al enviar tu consulta. Escríbenos por WhatsApp y la resolvemos al toque.',
    }
  }
}
