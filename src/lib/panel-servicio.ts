import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente con la llave secreta. **La única excepción a la regla del panel.**
 *
 * ------------------------------------------------------------------
 * Por qué existe
 * ------------------------------------------------------------------
 * El panel escribe con la llave pública y la sesión de quien entró, para que
 * cada operación la autorice Postgres fila por fila. Eso vale para todo el
 * contenido: productos, fotos, pedidos.
 *
 * Hay una cosa que no se puede hacer así: administrar cuentas. `auth.users` no
 * está expuesta por la API pública —y está bien que no lo esté—, así que crear
 * una cuenta o listar las que existen requiere la API de administración, que
 * solo funciona con la llave secreta.
 *
 * ------------------------------------------------------------------
 * Qué la mantiene segura
 * ------------------------------------------------------------------
 * 1. `server-only`: si algún día alguien la importa desde un componente de
 *    cliente, la compilación falla en vez de mandar la llave al navegador.
 * 2. Todas las funciones que la usan empiezan comprobando que quien pide sea
 *    `owner`. Esa comprobación no la hace la base —con esta llave, Postgres
 *    autoriza todo— así que es responsabilidad del código y no puede omitirse.
 * 3. No se usa para nada que se pueda hacer con la llave pública.
 *
 * El punto 2 es la parte delicada: acá las políticas de RLS no protegen nada.
 * Cualquier función nueva en este archivo tiene que empezar con `exigirOwner()`.
 */

const URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const LLAVE_SECRETA = process.env.SUPABASE_SERVICE_ROLE_KEY

export const servicioDisponible = Boolean(URL && LLAVE_SECRETA)

export function clienteDeServicio(): SupabaseClient {
  if (!URL || !LLAVE_SECRETA) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor: sin ella no se pueden administrar cuentas.',
    )
  }
  return createClient(URL, LLAVE_SECRETA, { auth: { persistSession: false } })
}
