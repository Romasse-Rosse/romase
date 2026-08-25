'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { useCart } from '@/lib/cart'
import { cn } from '@/lib/cn'
import { Container } from './ui'

export type HeroSlide = {
  id: number
  slug: string
  name: string
  category: string | null
  price: number
  image: string | null
  sku: string | null
  summary: string
}

const INTERVALO = 5000

/**
 * Banner de portada con productos concretos, no categorías: es lo que se
 * acordó, para que se vea qué se vende y a qué precio desde el primer
 * segundo.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const { add } = useCart()
  const [actual, setActual] = useState(0)
  const [pausado, setPausado] = useState(false)

  const ir = useCallback(
    (i: number) => setActual((i + slides.length) % slides.length),
    [slides.length],
  )

  // Avance automático. Se detiene al pasar el mouse o al enfocar con teclado,
  // para no mover el contenido bajo el cursor de quien está leyendo.
  useEffect(() => {
    if (pausado || slides.length < 2) return
    const t = setTimeout(() => ir(actual + 1), INTERVALO)
    return () => clearTimeout(t)
  }, [actual, pausado, ir, slides.length])

  if (slides.length === 0) return null
  const slide = slides[actual]

  const flecha =
    'absolute top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white/95 text-ink-800 shadow-lift transition-colors hover:border-ink-950 hover:bg-ink-950 hover:text-white'

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
      className="relative border-b border-ink-200 bg-ink-50"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      <Container>
        <div className="grid items-center gap-8 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
          <div>
            {slide.category && (
              <p className="mb-4 text-[11px] font-medium tracking-[0.2em] text-brand-600 uppercase">
                {slide.category}
              </p>
            )}

            {/* El nombre del producto es el protagonista, con su nombre
                técnico y no una descripción genérica del rubro. */}
            <h2 className="text-[30px] leading-[1.1] font-medium text-ink-950 sm:text-[40px] lg:text-[46px]">
              <Link href={`/productos/${slide.slug}`} className="hover:text-brand-700">
                {slide.name}
              </Link>
            </h2>

            {slide.summary && (
              <p className="mt-5 max-w-lg leading-relaxed text-ink-600">{slide.summary}</p>
            )}

            <p className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-ink-950">
                {formatPrice(slide.price)}
              </span>
              <span className="text-sm text-ink-500">IVA incluido</span>
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  add({
                    id: slide.id,
                    slug: slide.slug,
                    name: slide.name,
                    price: slide.price,
                    image: slide.image,
                    sku: slide.sku,
                  })
                }
                className="inline-flex h-13 items-center justify-center gap-2 rounded-sm bg-brand-500 px-7 text-[15px] font-medium text-white transition-colors hover:bg-brand-600"
              >
                <ShoppingBag aria-hidden="true" className="size-4.5" />
                Agregar al carrito
              </button>
              <Link
                href={`/productos/${slide.slug}`}
                className="inline-flex h-13 items-center justify-center rounded-sm border border-ink-300 px-7 text-[15px] font-medium text-ink-900 transition-colors hover:border-ink-950 hover:bg-ink-950 hover:text-white"
              >
                Ver detalle
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-4/3 overflow-hidden border border-ink-200 bg-white">
              {slide.image && (
                <Image
                  key={slide.id}
                  src={slide.image}
                  alt={slide.name}
                  fill
                  priority={actual === 0}
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-contain p-8"
                />
              )}
            </div>

            {slides.length > 1 && (
              <>
                {/* Flechas sobre la imagen: así se lee como carrusel. */}
                <button
                  type="button"
                  onClick={() => ir(actual - 1)}
                  aria-label="Producto anterior"
                  className={cn(flecha, 'left-3')}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => ir(actual + 1)}
                  aria-label="Producto siguiente"
                  className={cn(flecha, 'right-3')}
                >
                  <ChevronRight className="size-5" />
                </button>

                <div
                  className="mt-5 flex items-center justify-center gap-2"
                  role="tablist"
                  aria-label="Elegir producto"
                >
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={i === actual}
                      aria-label={s.name}
                      onClick={() => ir(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === actual ? 'w-8 bg-brand-500' : 'w-1.5 bg-ink-300 hover:bg-ink-400',
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
