'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Container } from './ui'

export type HeroSlide = {
  slug: string
  imagen: string
  categoria: string
  titular: string
  bajada: string
  productos: number
}

const INTERVALO = 5500

/**
 * Banner de portada: fotografía a todo el ancho, una sección del catálogo por
 * diapositiva.
 *
 * Las diapositivas se cruzan por opacidad y la foto activa hace un zoom muy
 * lento. Es lo que hace que se lea como carrusel de verdad y no como una
 * imagen fija: en la referencia acordada el banner es una franja fotográfica,
 * no un producto recortado sobre fondo blanco.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [actual, setActual] = useState(0)
  const [pausado, setPausado] = useState(false)

  const ir = useCallback(
    (i: number) => setActual((i + slides.length) % slides.length),
    [slides.length],
  )

  useEffect(() => {
    if (pausado || slides.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => ir(actual + 1), INTERVALO)
    return () => clearTimeout(t)
  }, [actual, pausado, ir, slides.length])

  if (slides.length === 0) return null

  const flecha =
    'absolute top-1/2 z-30 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-ink-950/30 text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white hover:text-ink-950 sm:flex'

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Secciones del catálogo"
      className="relative isolate overflow-hidden bg-ink-950"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      {/* Las fotos se apilan y se cruzan por opacidad. */}
      {slides.map((slide, i) => (
        <div
          key={slide.slug}
          aria-hidden={i !== actual}
          className={cn(
            'absolute inset-0 transition-opacity duration-700 ease-out',
            i === actual ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Image
            src={`/banner/${slide.imagen}.webp`}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={cn(
              'object-cover transition-transform duration-[7000ms] ease-out motion-reduce:transform-none',
              i === actual ? 'scale-105' : 'scale-100',
            )}
          />
        </div>
      ))}

      {/* Velo para que el texto se lea sobre cualquier foto. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/70 to-ink-950/25"
      />

      <Container className="relative z-20">
        <div className="flex min-h-[26rem] flex-col justify-center py-16 sm:min-h-[30rem] lg:min-h-[34rem]">
          <div className="max-w-xl">
            <p className="mb-4 text-[11px] font-medium tracking-[0.2em] text-brand-400 uppercase">
              {slides[actual].categoria} · {slides[actual].productos} productos
            </p>

            <h2 className="text-[32px] leading-[1.08] font-medium text-white sm:text-[44px] lg:text-[52px]">
              {slides[actual].titular}
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-ink-200">{slides[actual].bajada}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/categorias/${slides[actual].slug}`}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-sm bg-brand-500 px-8 text-[15px] font-medium text-white transition-colors hover:bg-brand-600"
              >
                Ver {slides[actual].categoria.toLowerCase()}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/productos"
                className="inline-flex h-13 items-center justify-center rounded-sm border border-white/30 px-8 text-[15px] font-medium text-white transition-colors hover:bg-white hover:text-ink-950"
              >
                Todo el catálogo
              </Link>
            </div>
          </div>

          {slides.length > 1 && (
            <div className="mt-12 flex items-center gap-2.5" role="tablist" aria-label="Secciones">
              {slides.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  role="tab"
                  aria-selected={i === actual}
                  aria-label={s.categoria}
                  onClick={() => ir(i)}
                  className={cn(
                    'h-1 rounded-full transition-all',
                    i === actual ? 'w-12 bg-brand-500' : 'w-6 bg-white/35 hover:bg-white/60',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </Container>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => ir(actual - 1)}
            aria-label="Sección anterior"
            className={cn(flecha, 'left-4')}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => ir(actual + 1)}
            aria-label="Sección siguiente"
            className={cn(flecha, 'right-4')}
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </section>
  )
}
