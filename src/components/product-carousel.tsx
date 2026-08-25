'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product } from '@/lib/catalog'
import { ProductCard } from './product-card'
import { cn } from '@/lib/cn'

/**
 * Carrusel horizontal de productos.
 *
 * Usa el desplazamiento nativo con anclaje, así funciona con gesto táctil,
 * con rueda y con teclado sin reimplementar nada. Las flechas mueven de a una
 * pantalla y se desactivan en los extremos.
 */
export function ProductCarousel({ products }: { products: Product[] }) {
  const pista = useRef<HTMLUListElement>(null)
  const [alInicio, setAlInicio] = useState(true)
  const [alFinal, setAlFinal] = useState(false)

  const revisarBordes = () => {
    const el = pista.current
    if (!el) return
    setAlInicio(el.scrollLeft <= 4)
    setAlFinal(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }

  useEffect(() => {
    revisarBordes()
    const el = pista.current
    if (!el) return
    el.addEventListener('scroll', revisarBordes, { passive: true })
    window.addEventListener('resize', revisarBordes)
    return () => {
      el.removeEventListener('scroll', revisarBordes)
      window.removeEventListener('resize', revisarBordes)
    }
  }, [products.length])

  const mover = (direccion: 1 | -1) => {
    const el = pista.current
    if (!el) return
    el.scrollBy({ left: direccion * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  if (products.length === 0) return null

  const flecha =
    'flex size-10 items-center justify-center rounded-sm border border-ink-300 text-ink-700 transition-colors hover:border-ink-950 hover:bg-ink-950 hover:text-white disabled:pointer-events-none disabled:opacity-30'

  return (
    <div className="relative">
      <ul
        ref={pista}
        className="-mx-4 flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto px-4 pb-2 no-scrollbar sm:gap-6"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="flex w-[calc(50%-0.625rem)] shrink-0 snap-start sm:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)]"
          >
            <ProductCard product={product} />
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-ink-500">
          {products.length} productos · desplaza para ver más
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => mover(-1)}
            disabled={alInicio}
            aria-label="Ver productos anteriores"
            className={cn(flecha)}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={alFinal}
            aria-label="Ver más productos"
            className={cn(flecha)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
