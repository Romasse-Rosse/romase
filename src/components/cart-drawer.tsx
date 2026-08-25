'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

/** Icono del encabezado con el contador de unidades. */
export function CartButton() {
  const { count, ready, setOpen } = useCart()

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count > 0 ? `Carrito, ${count} productos` : 'Carrito vacío'}
      className="relative inline-flex size-10 items-center justify-center rounded-sm text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950"
    >
      <ShoppingBag className="size-5" />
      {/* El contador aparece recién cuando se leyó el almacenamiento, para
          que el servidor y el navegador rendericen lo mismo. */}
      {ready && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}

export function CartDrawer() {
  const { items, subtotal, count, open, setOpen, remove, setQuantity } = useCart()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const alEscape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', alEscape)
    return () => document.removeEventListener('keydown', alEscape)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrito">
      <div className="absolute inset-0 bg-ink-950/50" onClick={() => setOpen(false)} />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200 px-5">
          <h2 className="text-sm font-semibold tracking-wide text-ink-950">
            Tu carrito
            {count > 0 && <span className="ml-2 font-normal text-ink-500">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar carrito"
            className="rounded-sm p-2 text-ink-600 transition-colors hover:bg-ink-100"
          >
            <X className="size-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <ShoppingBag aria-hidden="true" className="size-10 text-ink-300" />
            <p className="mt-4 font-medium text-ink-900">Tu carrito está vacío</p>
            <p className="mt-1.5 text-sm text-ink-500">
              Agrega equipos desde el catálogo y aparecen acá.
            </p>
            <Link
              href="/productos"
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              Ver el catálogo
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink-100 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <Link
                    href={`/productos/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="relative size-20 shrink-0 border border-ink-200 bg-white"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-contain p-1.5"
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/productos/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="text-[13px] leading-snug text-ink-900 hover:text-brand-600"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-[13px] font-medium text-ink-950">
                      {formatPrice(item.price)}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-stretch border border-ink-200">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          aria-label={`Quitar una unidad de ${item.name}`}
                          className="flex size-8 items-center justify-center text-ink-600 transition-colors hover:bg-ink-100"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="flex w-9 items-center justify-center border-x border-ink-200 text-[13px] font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          aria-label={`Agregar una unidad de ${item.name}`}
                          className="flex size-8 items-center justify-center text-ink-600 transition-colors hover:bg-ink-100"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Quitar ${item.name} del carrito`}
                        className="p-1.5 text-ink-400 transition-colors hover:text-brand-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="shrink-0 border-t border-ink-200 px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-600">Subtotal</span>
                <span className="text-xl font-semibold text-ink-950">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                El despacho se calcula en el paso siguiente.
              </p>

              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="mt-4 flex h-12 items-center justify-center rounded-sm bg-brand-500 text-sm font-medium text-white transition-colors hover:bg-brand-600"
              >
                Finalizar pedido
              </Link>
              <Link
                href="/carrito"
                onClick={() => setOpen(false)}
                className="mt-2 flex h-11 items-center justify-center rounded-sm border border-ink-300 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
              >
                Ver el carrito
              </Link>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
