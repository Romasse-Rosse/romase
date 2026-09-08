'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart, type CartItem } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'

type Producto = Omit<CartItem, 'quantity'>

/** Botón compacto, para las tarjetas de la grilla. */
export function AddToCartCompact({
  product,
  className,
}: {
  product: Producto
  className?: string
}) {
  const { add } = useCart()
  const [agregado, setAgregado] = useState(false)

  return (
    <button
      type="button"
      onClick={(event) => {
        // La tarjeta entera es un enlace: hay que impedir que navegue.
        event.preventDefault()
        event.stopPropagation()
        add(product)
        setAgregado(true)
        setTimeout(() => setAgregado(false), 1600)
      }}
      aria-label={`Agregar ${product.name} al carrito`}
      className={cn(
        'relative z-10 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-sm border text-[13px] font-medium transition-colors',
        agregado
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-brand-500 bg-brand-500 text-white hover:border-brand-600 hover:bg-brand-600',
        className,
      )}
    >
      {agregado ? (
        <>
          <Check aria-hidden="true" className="size-4" />
          Agregado
        </>
      ) : (
        <>
          <ShoppingBag aria-hidden="true" className="size-4" />
          Agregar
        </>
      )}
    </button>
  )
}

/** Selector de cantidad + botón grande, para la ficha de producto. */
export function AddToCartFull({ product, inStock }: { product: Producto; inStock: boolean }) {
  const { add } = useCart()
  const [cantidad, setCantidad] = useState(1)

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/*
        En móvil ocupa el ancho completo con el − y el + en los extremos, que es
        donde llega el pulgar. Antes la caja se estiraba igual pero los tres
        controles quedaban apretados a la izquierda, con media caja vacía.
      */}
      <div className="flex h-13 items-stretch border border-ink-300 sm:shrink-0">
        <button
          type="button"
          onClick={() => setCantidad((n) => Math.max(1, n - 1))}
          disabled={cantidad <= 1}
          aria-label="Quitar una unidad"
          className="flex w-16 items-center justify-center text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 disabled:opacity-40 disabled:hover:bg-transparent sm:w-11"
        >
          <Minus className="size-4" />
        </button>

        <input
          type="number"
          min={1}
          max={99}
          value={cantidad}
          onChange={(event) => {
            const n = Number(event.target.value)
            setCantidad(Number.isFinite(n) ? Math.min(99, Math.max(1, Math.floor(n))) : 1)
          }}
          aria-label="Cantidad"
          className="min-w-0 flex-1 border-x border-ink-200 text-center text-base font-medium text-ink-950 focus:outline-none sm:w-12 sm:flex-none sm:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          onClick={() => setCantidad((n) => Math.min(99, n + 1))}
          disabled={cantidad >= 99}
          aria-label="Agregar una unidad"
          className="flex w-16 items-center justify-center text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 disabled:opacity-40 disabled:hover:bg-transparent sm:w-11"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => add(product, cantidad)}
        // flex-1 solo desde sm.
                //
                // El contenedor es una columna en móvil, y en una columna flex-1
                // aplica al ALTO: con flex-basis en 0 el h-13 quedaba anulado y el
                // botón se colapsaba a 23 px, la altura del texto. El botón principal
                // de la tienda medía la mitad de los secundarios.
                className="inline-flex h-13 items-center justify-center gap-2 rounded-sm bg-brand-500 px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-600 sm:flex-1"
      >
        <ShoppingBag aria-hidden="true" className="size-4.5" />
        {inStock ? 'Agregar al carrito' : 'Agregar (bajo pedido)'}
      </button>
    </div>
  )
}

/**
 * Barra de compra fija, solo en móvil.
 *
 * En un teléfono la foto del producto ocupa la pantalla entera, así que el
 * precio y el botón quedan siempre por debajo del pliegue: hay que recordar
 * volver a subir para comprar. La barra aparece cuando el botón principal sale
 * de vista y se retira al llegar al pie, para no taparlo.
 */
export function AddToCartSticky({
  product,
  inStock,
  /** Id del bloque que contiene el botón principal. */
  ancla,
}: {
  product: Producto
  inStock: boolean
  ancla: string
}) {
  const { add } = useCart()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const cta = document.getElementById(ancla)
    if (!cta) return

    // Se mide la posición en vez de observar intersecciones.
    // IntersectionObserver solo avisa cuando se cruza el umbral, y de la parte
    // de arriba de la página a muy abajo el botón pasa de «no visible» a «no
    // visible» sin cruzar nada: con un salto de scroll —un ancla, la posición
    // restaurada al volver atrás— la barra no aparecía nunca.
    let pendiente = false
    const medir = () => {
      pendiente = false
      const b = cta.getBoundingClientRect()
      const pie = document.querySelector('footer')?.getBoundingClientRect()
      const ctaArriba = b.bottom < 0
      const pieALaVista = pie ? pie.top < window.innerHeight : false
      setVisible(ctaArriba && !pieALaVista)
    }
    const alDesplazar = () => {
      if (pendiente) return
      pendiente = true
      requestAnimationFrame(medir)
    }

    medir()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    window.addEventListener('resize', alDesplazar)
    return () => {
      window.removeEventListener('scroll', alDesplazar)
      window.removeEventListener('resize', alDesplazar)
    }
  }, [ancla])

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur-sm transition-transform duration-200 lg:hidden',
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-ink-500">{product.name}</p>
          <p className="text-lg font-semibold text-ink-950">{formatPrice(product.price)}</p>
        </div>
        <button
          type="button"
          onClick={() => add(product)}
          tabIndex={visible ? 0 : -1}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <ShoppingBag aria-hidden="true" className="size-4.5" />
          {inStock ? 'Agregar' : 'Agregar (bajo pedido)'}
        </button>
      </div>
    </div>
  )
}
