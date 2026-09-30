'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FolderTree,
  Home,
  LogOut,
  Menu,
  Package,
  Percent,
  Plug,
  Receipt,
  Store,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
const SECCIONES: { href: string; etiqueta: string; icono: LucideIcon; soloOwner?: boolean }[] = [
  { href: '/admin', etiqueta: 'Inicio', icono: Home },
  { href: '/admin/pedidos', etiqueta: 'Pedidos', icono: Receipt },
  { href: '/admin/productos', etiqueta: 'Productos', icono: Package },
  { href: '/admin/categorias', etiqueta: 'Categorías', icono: FolderTree },
  { href: '/admin/promociones', etiqueta: 'Promociones', icono: Percent },
  { href: '/admin/integraciones', etiqueta: 'Integraciones', icono: Plug },
  { href: '/admin/usuarios', etiqueta: 'Usuarios', icono: Users, soloOwner: true },
  { href: '/admin/cuenta', etiqueta: 'Mi cuenta', icono: UserCog },
]

/** /admin coincide con todo: exacta para el inicio, por prefijo para el resto. */
function esActiva(href: string, ruta: string) {
  return href === '/admin' ? ruta === '/admin' : ruta.startsWith(href)
}

/**
 * La columna de secciones, en escritorio.
 *
 * Era una fila arriba. Con ocho secciones dejó de entrar cómoda: los nombres
 * se apretaban contra el nombre del usuario y cada sección nueva empeoraba el
 * problema. En vertical el ancho no es escaso, los nombres se leen completos,
 * el orden se sigue de arriba abajo y agregar una novena no rompe nada.
 *
 * Lleva iconos porque una lista vertical de ocho palabras sueltas se escanea
 * peor que una con una forma reconocible al costado.
 */
export function BarraLateral({ esOwner }: { esOwner: boolean }) {
  const ruta = usePathname()
  const secciones = SECCIONES.filter((s) => esOwner || !s.soloOwner)

  return (
    <nav aria-label="Secciones" className="space-y-0.5">
      {secciones.map((s) => {
        const activa = esActiva(s.href, ruta)
        const Icono = s.icono
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={activa ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors',
              activa
                ? 'bg-brand-50 font-medium text-brand-800'
                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950',
            )}
          >
            <Icono
              aria-hidden="true"
              className={cn('size-4 shrink-0', activa ? 'text-brand-600' : 'text-ink-400')}
            />
            {s.etiqueta}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * El menú de móvil.
 *
 * ------------------------------------------------------------------
 * Por qué es un cajón y no la misma columna
 * ------------------------------------------------------------------
 * Con las secciones en línea, en un teléfono de 390 px la barra se cortaba:
 * «Usuarios», «Mi cuenta» y el botón de salir quedaban fuera de la pantalla sin
 * ninguna señal de que estaban ahí. Medido en el panel desplegado, no supuesto.
 *
 * Una columna fija tampoco sirve en un teléfono: se comería la mitad del ancho.
 * Así que acá hay un panel que se abre, con todo adentro y cada cosa a 44 px de
 * alto —el mínimo para tocar con el dedo sin errarle—. Entra desde la derecha,
 * igual que el menú de la tienda: es el mismo gesto en las dos partes del sitio.
 */
export function MenuMovil({
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
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir el menú"
        aria-expanded={abierto}
        className="ml-auto inline-flex size-11 items-center justify-center rounded-sm text-ink-700 transition-colors hover:bg-ink-100"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      {abierto && (
        <div role="dialog" aria-modal="true" aria-label="Menú" className="fixed inset-0 z-50">
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
              {secciones.map((s) => {
                const Icono = s.icono
                const activa = esActiva(s.href, ruta)
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    aria-current={activa ? 'page' : undefined}
                    className={cn(
                      'flex min-h-12 items-center gap-2.5 border-l-2 px-4 text-sm',
                      activa
                        ? 'border-brand-500 bg-brand-50 font-medium text-brand-800'
                        : 'border-transparent text-ink-700',
                    )}
                  >
                    <Icono
                      aria-hidden="true"
                      className={cn('size-4 shrink-0', activa ? 'text-brand-600' : 'text-ink-400')}
                    />
                    {s.etiqueta}
                  </Link>
                )
              })}
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
