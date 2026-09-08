'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

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

export function Navegacion({ esOwner }: { esOwner: boolean }) {
  const ruta = usePathname()

  return (
    <nav aria-label="Secciones" className="flex items-center gap-1">
      {SECCIONES.filter((s) => esOwner || !s.soloOwner).map((s) => {
        // /admin coincide con todo, así que la comparación es exacta para el
        // inicio y por prefijo para el resto.
        const activa = s.href === '/admin' ? ruta === '/admin' : ruta.startsWith(s.href)

        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={activa ? 'page' : undefined}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm transition-colors',
              activa ? 'bg-ink-100 font-medium text-ink-950' : 'text-ink-600 hover:text-ink-950',
            )}
          >
            {s.etiqueta}
          </Link>
        )
      })}
    </nav>
  )
}
