import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Sesión del panel de administración.
 *
 * ------------------------------------------------------------------
 * Por qué en el servidor
 * ------------------------------------------------------------------
 * El panel de Groner —del que se copió el modelo de roles— comprueba el acceso
 * en el navegador: descarga la aplicación completa y después decide qué
 * mostrar. Funciona porque la seguridad real está en las políticas de Postgres,
 * no en la interfaz, pero significa que el código del panel es público y que
 * las reglas de sesión se pueden saltear con las herramientas del navegador.
 *
 * Acá el sitio es Next con App Router, así que se puede hacer mejor: las
 * páginas de /admin se renderizan en el servidor y quien no tiene permiso es
 * redirigido **antes de que se le mande una sola línea de HTML del panel**. Las
 * escrituras pasan por server actions que vuelven a comprobar el rol.
 *
 * Eso no reemplaza a las políticas de la base: son dos capas y las dos hacen
 * falta. El servidor evita mostrar lo que no corresponde; Postgres impide
 * escribir lo que no corresponde, incluso si alguien llama a la API por su
 * cuenta con la llave pública.
 *
 * ------------------------------------------------------------------
 * Qué llave se usa
 * ------------------------------------------------------------------
 * La **pública**, con la sesión del usuario en la cookie. Nunca la secreta: si
 * el panel escribiera con la llave secreta, todas las políticas de la base
 * quedarían de adorno y cualquier error de la interfaz podría tocar lo que
 * quisiera. Con la llave pública, el permiso lo decide Postgres para cada fila.
 */

export type RolDelPanel = 'owner' | 'admin' | 'editor' | 'viewer'

/** Quién puede escribir. `viewer` mira y no toca. */
const ROLES_QUE_ESCRIBEN: RolDelPanel[] = ['owner', 'admin', 'editor']

export type SesionDelPanel = {
  userId: string
  email: string
  nombre: string | null
  rol: RolDelPanel
  puedeEscribir: boolean
  puedeBorrar: boolean
  administraUsuarios: boolean
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const LLAVE_PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** ¿Está el panel en condiciones de funcionar? */
export const panelConfigurado = Boolean(URL && LLAVE_PUBLICA)

/**
 * Cliente de Supabase atado a las cookies de la petición.
 *
 * En un Server Component las cookies son de solo lectura: Next no permite
 * escribirlas mientras se renderiza. Por eso `setAll` traga el error en vez de
 * fallar. La renovación del token la hacen las server actions y el middleware,
 * que sí pueden escribir.
 */
export async function clienteDelPanel(): Promise<SupabaseClient> {
  if (!URL || !LLAVE_PUBLICA) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY: sin ellas el panel no ' +
        'puede autenticar a nadie.',
    )
  }

  const almacen = await cookies()

  return createServerClient(URL, LLAVE_PUBLICA, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (nuevas) => {
        try {
          for (const { name, value, options } of nuevas) almacen.set(name, value, options)
        } catch {
          // Renderizando un Server Component no se pueden escribir cookies.
          // No es un error: la sesión se refresca en las acciones.
        }
      },
    },
  })
}

/**
 * Quién entró, y con qué rol.
 *
 * Devuelve `null` si no hay sesión o si el usuario no está en `admin_profiles`
 * y activo. Tener cuenta en Supabase Auth no alcanza a propósito: dar de baja a
 * alguien es cambiar una fila, no borrar su cuenta.
 */
export async function sesionDelPanel(): Promise<SesionDelPanel | null> {
  if (!panelConfigurado) return null

  const db = await clienteDelPanel()

  // getUser() valida el token contra Supabase. getSession() solo lee la cookie,
  // que el navegador puede tener modificada: para decidir permisos no sirve.
  const { data: auth } = await db.auth.getUser()
  if (!auth.user) return null

  const { data: perfil } = await db
    .from('admin_profiles')
    .select('user_id, email, nombre, role, is_active')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (!perfil || !perfil.is_active) return null

  const rol = perfil.role as RolDelPanel

  return {
    userId: perfil.user_id,
    email: perfil.email ?? auth.user.email ?? '',
    nombre: perfil.nombre ?? null,
    rol,
    puedeEscribir: ROLES_QUE_ESCRIBEN.includes(rol),
    puedeBorrar: rol === 'owner' || rol === 'admin',
    administraUsuarios: rol === 'owner',
  }
}

/**
 * Para las server actions: exige sesión con permiso de escritura.
 *
 * Lanza si no la hay. Que sea una excepción y no un valor de retorno es
 * deliberado: una acción que se olvide de mirar el resultado falla ruidosamente
 * en vez de escribir sin permiso.
 */
export async function exigirEscritura(): Promise<SesionDelPanel> {
  const sesion = await sesionDelPanel()
  if (!sesion) throw new Error('Sin sesión en el panel.')
  if (!sesion.puedeEscribir) {
    throw new Error(`El rol ${sesion.rol} no puede modificar contenido.`)
  }
  return sesion
}
