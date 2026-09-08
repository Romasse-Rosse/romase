import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut, Package, Store } from 'lucide-react'
import { panelConfigurado, sesionDelPanel } from '@/lib/panel'
import { site } from '@/lib/site'
import { salir } from '../acciones-sesion'
import { Navegacion } from './navegacion'

/**
 * Guardia del panel.
 *
 * Todo lo que está dentro de `(panel)` exige haber entrado y estar en
 * `admin_profiles`. La comprobación es en el servidor: quien no tiene permiso se
 * va redirigido **antes de recibir una sola línea de HTML del panel**.
 *
 * Eso no reemplaza a las políticas de la base. Son dos capas y las dos hacen
 * falta: acá se decide qué se muestra, y en Postgres qué se puede escribir,
 * incluso si alguien llamara a la API por su cuenta salteándose la interfaz.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!panelConfigurado) redirect('/admin/login')

  const sesion = await sesionDelPanel()
  if (!sesion) redirect('/admin/login')

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold text-ink-950">
            <Package aria-hidden="true" className="size-4 text-brand-500" />
            {site.name}
          </Link>

          <Navegacion esOwner={sesion.administraUsuarios} />

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 text-xs text-ink-500 transition-colors hover:text-ink-900 sm:flex"
            >
              <Store aria-hidden="true" className="size-3.5" />
              Ver la tienda
            </Link>

            <span className="hidden text-right text-xs leading-tight text-ink-500 md:block">
              {sesion.nombre ?? sesion.email}
              <br />
              <span className="text-ink-400">{sesion.rol}</span>
            </span>

            <form action={salir}>
              <button
                type="submit"
                className="inline-flex size-9 items-center justify-center rounded-sm text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
                aria-label="Salir"
                title="Salir"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Un viewer puede mirar todo y no puede guardar nada. Conviene que lo
          sepa antes de escribir, no al apretar el botón. */}
      {!sesion.puedeEscribir && (
        <p className="border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-xs text-ink-700">
          Tu cuenta es de <strong>solo lectura</strong>: puedes revisar la tienda pero no guardar
          cambios.
        </p>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
