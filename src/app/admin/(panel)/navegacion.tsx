'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, Menu, Store, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { salir } from '../acciones-sesion'

/**
 * Secciones del panel.
 *
 * Solo se listan las que existen: un menú que ofrece una sección todavía sin
 * construir manda al cliente a un 404 y le hace dudar de todo lo demás.
 *
 * «Usuarios» aparece solo para owner. No se muestra desactivada para el resto:
 * enseñar una puerta que no se puede abrir invita a preguntar por qué.
 */
const SECCIONES = [
  { href: '/admin', etiqueta: 'Inicio' },
  { href: '/admin/productos', etiqueta: 'Productos' },
  { href: '/admin/promociones', etiqueta: 'Promociones' },
  { href: '/admin/usuarios', etiqueta: 'Usuarios', soloOwner: true },
  { href: '/admin/cuenta', etiqueta: 'Mi cuenta' },
]

/** /admin coincide con todo: exacta para el inicio, por prefijo para el resto. */
function esActiva(href: string, ruta: string) {
  return href === '/admin' ? ruta === '/admin' : ruta.startsWith(href)
}

/**
 * Navegación del panel.
 *
 * ------------------------------------------------------------------
 * Por qué hay dos versiones
 * ------------------------------------------------------------------
 * Con las cinco secciones en línea, en un teléfono de 390 px la barra se
 * cortaba: «Usuarios», «Mi cuenta» y el botón de salir quedaban fuera de la
 * pantalla, sin ninguna señal de que estaban ahí. Medido en el panel
 * desplegado, no supuesto.
 *
 * Así que en móvil hay un panel que se abre, con todo adentro y cada cosa a
 * 44 px de alto —el mínimo para tocar con el dedo sin errarle—. Entra desde la
 * derecha, igual que el menú de la tienda: es el mismo gesto en las dos partes
 * del sitio.
 */
export function NavegacionPanel({
  esOwner,
  nombre,
  rol,
}: {
  esOwner: boolean
  nombre: string
  rol: string
}) {
  const ruta = usePathname()
  const [abierto, setAbierto] = useState(false)

  const secciones = SECCIONES.filter((s) => esOwner || !s.soloOwner)

  // Cualquier navegación cierra el panel.
  useEffect(() => setAbierto(false), [ruta])

  useEffect(() => {
    if (!abierto) return
    const alEscape = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('keydown', alEscape)
    return () => document.removeEventListener('keydown', alEscape)
  }, [abierto])

  return (
    <>
      {/* Escritorio */}
      <nav aria-label="Secciones" className="hidden items-center gap-1 lg:flex">
        {secciones.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={esActiva(s.href, ruta) ? 'page' : undefined}
            className={cn(
              'rounded-sm px-3 py-2 text-sm transition-colors',
              esActiva(s.href, ruta)
                ? 'bg-ink-100 font-medium text-ink-950'
                : 'text-ink-600 hover:text-ink-950',
            )}
          >
            {s.etiqueta}
          </Link>
        ))}
      </nav>

      {/* Móvil: el botón queda a la derecha, donde está el pulgar. */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir el menú"
        aria-expanded={abierto}
        className="ml-auto inline-flex size-11 items-center justify-center rounded-sm text-ink-700 transition-colors hover:bg-ink-100 lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      {abierto && (
        <div role="dialog" aria-modal="true" aria-label="Menú" className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-[fade-in_200ms_ease-out] bg-ink-950/50"
            onClick={() => setAbierto(false)}
            aria-hidden="true"
          />

          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-xs animate-[slide-in-right_260ms_cubic-bezier(0.22,1,0.36,1)] flex-col bg-white shadow-lift">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-ink-200 px-4">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink-950">{nombre}</span>
                <span className="block text-xs text-ink-500">{rol}</span>
              </span>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar el menú"
                className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-600 transition-colors hover:bg-ink-100"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <nav aria-label="Secciones" className="flex-1 overflow-y-auto py-2">
              {secciones.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  aria-current={esActiva(s.href, ruta) ? 'page' : undefined}
                  className={cn(
                    'flex min-h-12 items-center border-l-2 px-4 text-sm',
                    esActiva(s.href, ruta)
                      ? 'border-brand-500 bg-brand-50 font-medium text-brand-800'
                      : 'border-transparent text-ink-700',
                  )}
                >
                  {s.etiqueta}
                </Link>
              ))}
            </nav>

            <div className="shrink-0 border-t border-ink-200 p-2">
              <Link
                href="/"
                target="_blank"
                className="flex min-h-12 items-center gap-2.5 px-2 text-sm text-ink-700"
              >
                <Store aria-hidden="true" className="size-4 text-ink-400" />
                Ver la tienda
              </Link>

              <form action={salir}>
                <button
                  type="submit"
                  className="flex min-h-12 w-full items-center gap-2.5 px-2 text-sm text-ink-700"
                >
                  <LogOut aria-hidden="true" className="size-4 text-ink-400" />
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
