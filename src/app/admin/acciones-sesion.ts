'use server'

import { redirect } from 'next/navigation'
import { clienteDelPanel, panelConfigurado, sesionDelPanel } from '@/lib/panel'

export type EstadoIngreso = { error?: string }

/**
 * Entrar al panel.
 *
 * ------------------------------------------------------------------
 * Los mensajes de error son deliberadamente vagos
 * ------------------------------------------------------------------
 * Nunca se distingue entre «ese correo no existe» y «la contraseña está mal».
 * Un formulario que las diferencia sirve para averiguar quién administra la
 * tienda probando correos, y esa lista es el primer paso de cualquier intento
 * serio. El costo es que alguien que se equivocó de correo tarda un poco más en
 * darse cuenta; vale la pena.
 *
 * Los intentos fallidos los limita Supabase Auth por su cuenta. Acá no se lleva
 * cuenta propia: un contador en el servidor de la aplicación se reinicia con
 * cada despliegue y no sirve de nada.
 */
export async function ingresar(
  _previo: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  if (!panelConfigurado) {
    return { error: 'El panel todavía no está configurado en el servidor.' }
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Completa el correo y la contraseña.' }

  const db = await clienteDelPanel()
  const { error } = await db.auth.signInWithPassword({ email, password })

  if (error) {
    console.warn('[panel] intento de ingreso fallido:', error.message)
    return { error: 'No pudimos entrar con esos datos. Revísalos e intenta de nuevo.' }
  }

  /**
   * Tener cuenta no es tener acceso.
   *
   * Si el usuario existe en Supabase Auth pero no está en `admin_profiles` y
   * activo, se cierra la sesión que se acaba de abrir. Si no, quedaría con una
   * cookie válida dando vueltas: no podría escribir nada —lo impide la base—
   * pero es una sesión abierta que nadie pidió.
   */
  const sesion = await sesionDelPanel()
  if (!sesion) {
    await db.auth.signOut()
    return { error: 'Esta cuenta no tiene acceso al panel.' }
  }

  // redirect() lanza para interrumpir el render: va fuera de cualquier try.
  redirect('/admin')
}

/** Salir. Cierra la sesión de este navegador. */
export async function salir(): Promise<void> {
  if (panelConfigurado) {
    const db = await clienteDelPanel()
    await db.auth.signOut()
  }
  redirect('/admin/login')
}
