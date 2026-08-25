'use client'

import { useState } from 'react'
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart, type CartItem } from '@/lib/cart'
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
      <div className="flex h-13 shrink-0 items-stretch border border-ink-300">
        <button
          type="button"
          onClick={() => setCantidad((n) => Math.max(1, n - 1))}
          disabled={cantidad <= 1}
          aria-label="Quitar una unidad"
          className="flex w-11 items-center justify-center text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 disabled:opacity-40 disabled:hover:bg-transparent"
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
          className="w-12 border-x border-ink-200 text-center text-sm font-medium text-ink-950 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          onClick={() => setCantidad((n) => Math.min(99, n + 1))}
          disabled={cantidad >= 99}
          aria-label="Agregar una unidad"
          className="flex w-11 items-center justify-center text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => add(product, cantidad)}
        className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-sm bg-brand-500 px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-600"
      >
        <ShoppingBag aria-hidden="true" className="size-4.5" />
        {inStock ? 'Agregar al carrito' : 'Agregar (bajo pedido)'}
      </button>
    </div>
  )
}
