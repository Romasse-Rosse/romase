import { sesionDelPanel } from '@/lib/panel'
import { FormularioClave } from './formulario'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Mi cuenta' }

export default async function MiCuenta() {
  const sesion = await sesionDelPanel()

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Mi cuenta</h1>

      <dl className="mt-6 border border-ink-200 bg-white text-sm">
        <div className="flex justify-between border-b border-ink-100 px-5 py-3.5">
          <dt className="text-ink-600">Nombre</dt>
          <dd className="font-medium text-ink-950">{sesion?.nombre ?? '—'}</dd>
        </div>
        <div className="flex justify-between border-b border-ink-100 px-5 py-3.5">
          <dt className="text-ink-600">Correo</dt>
          <dd className="font-medium text-ink-950">{sesion?.email}</dd>
        </div>
        <div className="flex justify-between px-5 py-3.5">
          <dt className="text-ink-600">Rol</dt>
          <dd className="font-medium text-ink-950">{sesion?.rol}</dd>
        </div>
      </dl>

      <h2 className="mt-10 text-sm font-semibold text-ink-950">Cambiar la contraseña</h2>
      <p className="mt-1 mb-4 text-xs text-ink-500">
        Si entraste con una contraseña que te pasó otra persona, conviene reemplazarla acá.
      </p>

      <FormularioClave />
    </div>
  )
}
