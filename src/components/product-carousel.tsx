'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product } from '@/lib/catalog'
import { ProductCard } from './product-card'
import { cn } from '@/lib/cn'

const AUTOPLAY = 4000

/** Cuántos productos se muestran en la grilla de móvil. */
const VISIBLES_EN_MOVIL = 6

/**
 * Cuántas tarjetas se clonan al final de la pista.
 *
 * Son las que se ven mientras la pista vuelve al principio: tienen que alcanzar
 * para llenar la ventana más ancha, que muestra cuatro.
 */
const CLONES = 4

/**
 * Carrusel de productos.
 *
 * En móvil es una grilla de dos columnas; desde sm en adelante es carrusel:
 * avanza de a una tarjeta, de derecha a izquierda, y no tiene final.
 *
 * El desplazamiento es el nativo con anclaje —así el gesto táctil, la rueda y el
 * teclado funcionan sin reimplementarlos— y el bucle se hace clonando las
 * primeras tarjetas al final: cuando el recorrido llega a los clones, se
 * teletransporta al principio, que muestra exactamente los mismos píxeles. No se
 * ve el salto y no hace falta reemplazar el scroll por transformaciones, que es
 * lo que rompería el gesto.
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
  const [indice, setIndice] = useState(0)
  const [esCarrusel, setEsCarrusel] = useState(false)
  const [pausado, setPausado] = useState(false)

  /** Distancia entre el inicio de una tarjeta y el de la siguiente. */
  const medirPaso = useCallback(() => {
    const el = pista.current
    if (!el || el.children.length < 2) return 0
    const [a, b] = [el.children[0] as HTMLElement, el.children[1] as HTMLElement]
    return b.offsetLeft - a.offsetLeft
  }, [])

  // En grilla no hay carrusel: ni controles, ni avance automático, ni clones
  // visibles. Se pregunta al navegador en vez de suponer el ancho.
  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 640px)')
    const revisar = () => setEsCarrusel(consulta.matches)
    revisar()
    consulta.addEventListener('change', revisar)
    return () => consulta.removeEventListener('change', revisar)
  }, [])

  // Posición actual y vuelta al principio. Se espera a que el desplazamiento se
  // detenga: teletransportar en medio de una animación la cortaría.
  useEffect(() => {
    const el = pista.current
    if (!el || !esCarrusel) return

    let reposo: ReturnType<typeof setTimeout>

    const alDesplazar = () => {
      const paso = medirPaso()
      if (!paso) return
      setIndice(Math.round(el.scrollLeft / paso))

      clearTimeout(reposo)
      reposo = setTimeout(() => {
        const vuelta = products.length * paso
        if (el.scrollLeft < vuelta - 1) return
        // Sin animación: los clones y las primeras tarjetas son iguales, así
        // que el corte es invisible.
        el.style.scrollBehavior = 'auto'
        el.scrollLeft -= vuelta
        el.style.scrollBehavior = ''
        setIndice(Math.round(el.scrollLeft / paso))
      }, 140)
    }

    el.addEventListener('scroll', alDesplazar, { passive: true })
    window.addEventListener('resize', alDesplazar)
    return () => {
      clearTimeout(reposo)
      el.removeEventListener('scroll', alDesplazar)
      window.removeEventListener('resize', alDesplazar)
    }
  }, [esCarrusel, medirPaso, products.length])

  const irA = useCallback(
    (destino: number) => {
      const el = pista.current
      const paso = medirPaso()
      if (!el || !paso) return
      // Hacia atrás desde la primera: se salta al final de la tanda real y se
      // sigue desde ahí, así tampoco hay tope por la izquierda.
      if (destino < 0) {
        el.style.scrollBehavior = 'auto'
        el.scrollLeft += products.length * paso
        el.style.scrollBehavior = ''
        destino += products.length
      }
      el.scrollTo({ left: destino * paso, behavior: 'smooth' })
    },
    [medirPaso, products.length],
  )

  // Avance automático. Se detiene al pasar el mouse, al enfocar con teclado, al
  // tocar la pantalla y si el sistema pide menos movimiento.
  useEffect(() => {
    if (!esCarrusel || pausado || products.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => irA(indice + 1), AUTOPLAY)
    return () => clearTimeout(t)
  }, [esCarrusel, indice, pausado, irA, products.length])

  if (products.length === 0) return null

  const enPista = [
    ...products.map((p) => ({ producto: p, clave: String(p.id), clon: false })),
    ...products
      .slice(0, CLONES)
      .map((p) => ({ producto: p, clave: `${p.id}-clon`, clon: true })),
  ]

  const posicion = indice % products.length

  // Las flechas acompañan a las viñetas, abajo. Acá no roban espacio ni pueden
  // chocar con un título de dos líneas.
  const flecha =
    'flex size-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-800 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white'

  return (
    <div
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
    >
      {/* En móvil no hay carrusel: es una grilla de dos columnas que se
          desplaza hacia abajo. La tarjeta cortada al borde de la pantalla se
          veía como un error, y el gesto lateral competía con el scroll de la
          página. */}
      <ul
        ref={pista}
        className="grid grid-cols-2 gap-4 sm:flex sm:snap-x sm:snap-mandatory sm:items-stretch sm:gap-6 sm:overflow-x-auto sm:pb-2 sm:no-scrollbar"
      >
        {enPista.map(({ producto, clave, clon }, i) => (
          <li
            key={clave}
            /* Los clones existen solo para tapar la vuelta al principio: no
               son contenido nuevo, así que se sacan del recorrido. */
            {...(clon ? { inert: true, 'aria-hidden': true } : {})}
            className={cn(
              'flex',
              // En móvil, seis productos y ningún clon: la sección tiene que
              // terminar en algún momento y desde ahí se sigue por categoría.
              i >= VISIBLES_EN_MOVIL && 'hidden sm:flex',
              'sm:w-[calc(50%-0.75rem)] sm:shrink-0 sm:snap-start lg:w-[calc(25%-1.125rem)]',
            )}
          >
            <ProductCard product={producto} listId={listId} listName={listName} />
          </li>
        ))}
      </ul>

      {esCarrusel && products.length > 1 && (
        <div className="mt-7 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => irA(indice - 1)}
            aria-label="Ver el producto anterior"
            className={flecha}
          >
            <ChevronLeft className="size-4.5" />
          </button>

          <div className="flex items-center gap-1.5">
            {products.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ir al producto ${i + 1} de ${products.length}`}
                aria-current={i === posicion}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === posicion ? 'w-6 bg-brand-500' : 'w-1.5 bg-ink-300 hover:bg-ink-400',
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => irA(indice + 1)}
            aria-label="Ver el producto siguiente"
            className={flecha}
          >
            <ChevronRight className="size-4.5" />
          </button>
        </div>
      )}
    </div>
  )
}
