import { redirect } from 'next/navigation'
import { clienteDelPanel, sesionDelPanel } from '@/lib/panel'
import { AgregarPersona, ListaDePersonas } from './cliente'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Usuarios' }

/** Qué puede hacer cada rol. Se muestra en pantalla para no tener que explicarlo. */
const QUE_PUEDE = {
  owner: 'Todo, incluido administrar estas cuentas.',
  admin: 'Editar la tienda y borrar productos y fotos.',
  editor: 'Editar la tienda. No puede borrar ni administrar cuentas.',
  viewer: 'Solo mirar. No guarda ningún cambio.',
} as const

export default async function UsuariosPanel() {
  const sesion = await sesionDelPanel()

  // Solo owner. La página no existe para los demás: mostrarla vacía o con los
  // botones desactivados sería enseñar una puerta que no se puede abrir.
  if (!sesion?.administraUsuarios) redirect('/admin')

  const db = await clienteDelPanel()
  const { data, error } = await db
    .from('admin_profiles')
    .select('user_id, email, nombre, role, is_active, created_at')
    .order('created_at')

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Usuarios</h1>
      <p className="mt-1 text-sm text-ink-500">
        Quién puede entrar al panel y con qué permisos.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-10">
        <ListaDePersonas
          personas={(data ?? []).map((p) => ({
            userId: p.user_id as string,
            email: p.email as string,
            nombre: (p.nombre as string | null) ?? '',
            rol: p.role as string,
            activo: Boolean(p.is_active),
          }))}
          yo={sesion.userId}
          error={error?.message}
          quePuede={QUE_PUEDE}
        />

        <AgregarPersona quePuede={QUE_PUEDE} />
      </div>
    </div>
  )
}
