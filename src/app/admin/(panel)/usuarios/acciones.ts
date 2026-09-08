'use server'

import { revalidatePath } from 'next/cache'
import { clienteDelPanel, sesionDelPanel, type RolDelPanel } from '@/lib/panel'
import { clienteDeServicio, servicioDisponible } from '@/lib/panel-servicio'

export type EstadoUsuarios = { ok?: string; error?: string; claveTemporal?: string }

const ROLES: RolDelPanel[] = ['owner', 'admin', 'editor', 'viewer']

/**
 * Solo `owner` administra cuentas.
 *
 * Esta comprobación es la única que hay: las funciones de este archivo usan la
 * llave secreta, y con esa llave Postgres autoriza todo. Si falta, un editor
 * podría ascenderse. Va primero en cada acción, sin excepción.
 */
async function exigirOwner() {
  const sesion = await sesionDelPanel()
  if (!sesion) throw new Error('Sin sesión en el panel.')
  if (!sesion.administraUsuarios) {
    throw new Error('Solo el rol owner puede administrar cuentas.')
  }
  if (!servicioDisponible) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.')
  }
  return sesion
}

function esRol(valor: unknown): valor is RolDelPanel {
  return typeof valor === 'string' && (ROLES as string[]).includes(valor)
}

/**
 * Crea la cuenta y le da el rol, en un solo paso.
 *
 * Antes esto eran dos: crear el usuario en el panel de Supabase y después
 * correr un insert a mano en el SQL Editor. Escribir SQL en producción para
 * dar de alta a un compañero es la clase de tarea donde un error se paga caro,
 * y ya pasó una vez que el insert quedó sin correr y el acceso no funcionaba
 * sin que el mensaje dijera por qué.
 *
 * La contraseña la elige quien invita y se muestra una vez. No se manda por
 * correo: eso dependería de la entrega de correos de Supabase, que no está
 * configurada, y un correo que no llega es peor que una clave que se pasa a
 * mano. Quien entra la cambia desde «Mi cuenta».
 */
export async function crearPersona(
  _previo: EstadoUsuarios,
  formData: FormData,
): Promise<EstadoUsuarios> {
  try {
    await exigirOwner()

    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase()
    const nombre = String(formData.get('nombre') ?? '').trim()
    const rol = String(formData.get('rol') ?? 'editor')
    const clave = String(formData.get('clave') ?? '')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Revisa el correo.' }
    if (!nombre) return { error: 'Escribe el nombre de la persona.' }
    if (!esRol(rol)) return { error: 'Ese rol no existe.' }
    if (clave.length < 10) {
      return { error: 'La contraseña tiene que tener al menos 10 caracteres.' }
    }

    const servicio = clienteDeServicio()

    const { data: creado, error: errorAuth } = await servicio.auth.admin.createUser({
      email,
      password: clave,
      // Sin confirmación por correo: la cuenta la crea alguien de confianza y
      // no hay entrega de correos configurada en Supabase.
      email_confirm: true,
    })

    if (errorAuth || !creado.user) {
      const yaExiste = /already|registered|exists/i.test(errorAuth?.message ?? '')
      return {
        error: yaExiste
          ? 'Ya hay una cuenta con ese correo. Si es de alguien que administró antes, dale el ' +
            'rol desde la lista en vez de crearla otra vez.'
          : `No se pudo crear la cuenta: ${errorAuth?.message}`,
      }
    }

    const { error: errorPerfil } = await servicio.from('admin_profiles').upsert(
      { user_id: creado.user.id, email, nombre, role: rol, is_active: true },
      { onConflict: 'user_id' },
    )

    if (errorPerfil) {
      /**
       * Si el perfil falla, la cuenta se borra.
       *
       * Una cuenta de Supabase Auth sin perfil no sirve para nada —el panel la
       * rechaza— pero queda ocupando el correo, y el siguiente intento de
       * crearla falla con «ya existe». Es peor que no haber empezado.
       */
      await servicio.auth.admin.deleteUser(creado.user.id)
      return { error: `No se pudo asignar el rol, la cuenta no se creó: ${errorPerfil.message}` }
    }

    revalidatePath('/admin/usuarios')
    return {
      ok: `${nombre} ya puede entrar con ${email}.`,
      claveTemporal: clave,
    }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/** Cambia el rol de alguien que ya tiene cuenta. */
export async function cambiarRol(userId: string, rol: string): Promise<EstadoUsuarios> {
  try {
    const sesion = await exigirOwner()

    if (!esRol(rol)) return { error: 'Ese rol no existe.' }

    /**
     * Nadie se quita a sí mismo el rol de owner.
     *
     * Si el único owner se baja a editor, ya no queda quien administre cuentas
     * y recuperarlo exige volver al SQL Editor. Es un candado contra un clic
     * distraído, no contra un ataque.
     */
    if (userId === sesion.userId && rol !== 'owner') {
      return {
        error:
          'No puedes quitarte a ti misma el rol de owner. Dale owner a otra persona primero.',
      }
    }

    const servicio = clienteDeServicio()
    const { error } = await servicio.from('admin_profiles').update({ role: rol }).eq('user_id', userId)
    if (error) return { error: error.message }

    revalidatePath('/admin/usuarios')
    return { ok: 'Rol actualizado.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/**
 * Da de baja o vuelve a habilitar a alguien.
 *
 * No se borra la cuenta: se desactiva. Así el historial de quién administró
 * queda, y volver a habilitarla es un clic. Borrar de verdad se hace desde
 * Supabase, a propósito.
 */
export async function cambiarEstado(userId: string, activo: boolean): Promise<EstadoUsuarios> {
  try {
    const sesion = await exigirOwner()

    if (userId === sesion.userId && !activo) {
      return { error: 'No puedes desactivar tu propia cuenta: te quedarías afuera.' }
    }

    const servicio = clienteDeServicio()
    const { error } = await servicio
      .from('admin_profiles')
      .update({ is_active: activo })
      .eq('user_id', userId)
    if (error) return { error: error.message }

    revalidatePath('/admin/usuarios')
    return { ok: activo ? 'Cuenta habilitada.' : 'Cuenta dada de baja.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

export type EstadoClave = { ok?: string; error?: string }

/**
 * Cambiar mi propia contraseña.
 *
 * Va con la sesión de quien entró, no con la llave secreta: cada uno cambia la
 * suya y nadie cambia la de otro. Hace falta porque la contraseña inicial la
 * elige quien invita, y quien la recibe tiene que poder reemplazarla.
 */
export async function cambiarMiClave(
  _previo: EstadoClave,
  formData: FormData,
): Promise<EstadoClave> {
  const sesion = await sesionDelPanel()
  if (!sesion) return { error: 'Sin sesión en el panel.' }

  const nueva = String(formData.get('nueva') ?? '')
  const repetida = String(formData.get('repetida') ?? '')

  if (nueva.length < 10) return { error: 'La contraseña tiene que tener al menos 10 caracteres.' }
  if (nueva !== repetida) return { error: 'Las dos contraseñas no coinciden.' }

  const db = await clienteDelPanel()
  const { error } = await db.auth.updateUser({ password: nueva })
  if (error) return { error: `No se pudo cambiar: ${error.message}` }

  return { ok: 'Contraseña cambiada.' }
}
