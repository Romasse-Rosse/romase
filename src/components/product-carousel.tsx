'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product } from '@/lib/catalog'
import { ProductCard } from './product-card'
import { cn } from '@/lib/cn'

const AUTOPLAY = 5000

/**
 * Carrusel de productos.
 *
 * Avanza solo, vuelve al principio al llegar al final y lleva las flechas
 * sobre la pista, para que se lea como carrusel y no como una grilla que se
 * desborda.
 *
 * El desplazamiento es el nativo con anclaje: así el gesto táctil, la rueda y
 * el teclado funcionan sin reimplementarlos, y el avance automático es un
 * scrollTo sobre la misma pista.
 */
export function ProductCarousel({
  products,
  listId,
  listName,
}: {
  products: Product[]
  /** Lista a la que pertenece el carrusel, para select_item. */
  listId?: string
  listName?: string
}) {
  const pista = useRef<HTMLUListElement>(null)
  const [pagina, setPagina] = useState(0)
  const [paginas, setPaginas] = useState(1)
  const [pausado, setPausado] = useState(false)

  const medir = useCallback(() => {
    const el = pista.current
    if (!el) return
    const total = Math.max(1, Math.round(el.scrollWidth / el.clientWidth))
    setPaginas(total)
    setPagina(Math.round(el.scrollLeft / el.clientWidth))
  }, [])

  useEffect(() => {
    medir()
    const el = pista.current
    if (!el) return
    el.addEventListener('scroll', medir, { passive: true })
    window.addEventListener('resize', medir)
    return () => {
      el.removeEventListener('scroll', medir)
      window.removeEventListener('resize', medir)
    }
  }, [medir, products.length])

  const irA = useCallback((indice: number) => {
    const el = pista.current
    if (!el) return
    const total = Math.max(1, Math.round(el.scrollWidth / el.clientWidth))
    // Vuelve al principio en vez de frenarse: el recorrido no tiene final.
    const destino = ((indice % total) + total) % total
    el.scrollTo({ left: destino * el.clientWidth, behavior: 'smooth' })
  }, [])

  // Avance automático, como el del sitio de referencia. Se detiene al pasar
  // el mouse, al enfocar con teclado y si el sistema pide menos movimiento.
  useEffect(() => {
    if (pausado || paginas < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => irA(pagina + 1), AUTOPLAY)
    return () => clearTimeout(t)
  }, [pagina, paginas, pausado, irA])

  if (products.length === 0) return null

  const flecha =
    'absolute top-[38%] z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-800 shadow-lift transition-colors hover:border-ink-950 hover:bg-ink-950 hover:text-white sm:flex'

  return (
    <div
      className="relative"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
    >
      <ul
        ref={pista}
        /* Sin sangrado lateral: la pista arranca donde arranca el contenido.
           Con el botón en naranja, el borde de la tarjeta anterior asomando en
           el margen se leía como una astilla de color, no como "hay más". La
           pista igual corta la tarjeta siguiente a la derecha, que es la señal
           que importa. */
        className="flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto pb-2 no-scrollbar sm:gap-6"
      >
        {products.map((product) => (
          <li
            key={product.id}
            /* Una tarjeta y media en móvil: el recorte del borde avisa que hay más. */
            className="flex w-[68%] shrink-0 snap-start sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]"
          >
            <ProductCard product={product} listId={listId} listName={listName} />
          </li>
        ))}
      </ul>

      {paginas > 1 && (
        <>
          <button
            type="button"
            onClick={() => irA(pagina - 1)}
            aria-label="Ver productos anteriores"
            className={cn(flecha, '-left-5')}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => irA(pagina + 1)}
            aria-label="Ver más productos"
            className={cn(flecha, '-right-5')}
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="mt-7 flex items-center justify-center gap-2">
            {Array.from({ length: paginas }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ir al grupo ${i + 1} de ${paginas}`}
                aria-current={i === pagina}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === pagina ? 'w-7 bg-brand-500' : 'w-1.5 bg-ink-300 hover:bg-ink-400',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
