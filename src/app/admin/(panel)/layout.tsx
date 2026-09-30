import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut, Package, Store } from 'lucide-react'
import { panelConfigurado, sesionDelPanel } from '@/lib/panel'
import { site } from '@/lib/site'
import { salir } from '../acciones-sesion'
import { BarraLateral, MenuMovil } from './navegacion'

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
 *
 * ------------------------------------------------------------------
 * La forma: columna al costado en escritorio, cajón en móvil
 * ------------------------------------------------------------------
 * Las secciones estaban en una fila arriba. Con ocho dejaron de entrar cómodas
 * y cada una nueva empeoraba el apretujón. En vertical el ancho no es escaso,
 * los nombres se leen enteros y la lista puede crecer.
 *
 * En un teléfono una columna fija se comería la mitad de la pantalla, así que
 * ahí sigue el cajón que se abre desde la derecha.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!panelConfigurado) redirect('/admin/login')

  const sesion = await sesionDelPanel()
  if (!sesion) redirect('/admin/login')

  const nombre = sesion.nombre ?? sesion.email

  return (
    <div className="min-h-screen lg:flex">
      {/* ============================================================
          Escritorio: la columna
          ============================================================ */}
      <div className="hidden w-60 shrink-0 border-r border-ink-200 bg-white lg:block">
        {/* Se queda a la vista mientras el contenido baja: en una tabla larga
            de pedidos, tener que subir hasta arriba para cambiar de sección es
            una fricción que se nota. */}
        <div className="sticky top-0 flex h-screen flex-col">
          <Link
            href="/admin"
            className="flex h-14 shrink-0 items-center gap-2 border-b border-ink-200 px-4 text-sm font-semibold text-ink-950"
          >
            <Package aria-hidden="true" className="size-4 text-brand-500" />
            {site.name}
          </Link>

          <div className="flex-1 overflow-y-auto p-3">
            <BarraLateral esOwner={sesion.administraUsuarios} />
          </div>

          <div className="shrink-0 border-t border-ink-200 p-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
            >
              <Store aria-hidden="true" className="size-4 shrink-0 text-ink-400" />
              Ver la tienda
            </Link>

            <div className="mt-2 flex items-center gap-2 border-t border-ink-100 px-3 pt-3">
              <span className="min-w-0 flex-1 text-xs leading-tight">
                <span className="block truncate text-ink-700">{nombre}</span>
                <span className="block text-ink-400">{sesion.rol}</span>
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
        </div>
      </div>

      {/* ============================================================
          El contenido
          ============================================================ */}
      <div className="min-w-0 flex-1">
        {/* Móvil: la barra de arriba con el cajón. */}
        <header className="border-b border-ink-200 bg-white lg:hidden">
          <div className="flex h-14 items-center gap-4 px-4">
            <Link
              href="/admin"
              className="flex shrink-0 items-center gap-2 py-2 text-sm font-semibold text-ink-950"
            >
              <Package aria-hidden="true" className="size-4 text-brand-500" />
              {site.name}
            </Link>

            <MenuMovil
              esOwner={sesion.administraUsuarios}
              nombre={nombre}
              rol={sesion.rol}
            />
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

        <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
