'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { aItemDeCarrito, useCart } from '@/lib/cart'
import { viewCart } from '@/lib/analytics'
import { formatPrice } from '@/lib/format'
import { site } from '@/lib/site'
import { Breadcrumbs, Container } from '@/components/ui'
import { useEffect, useRef } from 'react'

export default function CarritoPage() {
  const { items, subtotal, count, ready, remove, setQuantity } = useCart()

  // view_cart se manda una sola vez, cuando ya se leyó el almacenamiento.
  const enviado = useRef(false)
  const lista = useRef(items)
  lista.current = items
  useEffect(() => {
    if (!ready || enviado.current || lista.current.length === 0) return
    enviado.current = true
    viewCart(lista.current.map((i) => aItemDeCarrito(i, i.quantity)))
  }, [ready])

  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Carrito' }]} />

      <h1 className="mt-4 text-3xl font-medium tracking-tight text-ink-950 sm:text-4xl">
        Tu carrito
      </h1>

      {/* Mientras se lee el almacenamiento no se muestra "vacío": sería un
          parpadeo molesto para quien sí tiene productos guardados. */}
      {!ready ? (
        <div className="mt-10 h-64 animate-pulse rounded-sm bg-ink-50" />
      ) : items.length === 0 ? (
        <div className="mt-10 border border-dashed border-ink-300 px-6 py-16 text-center">
          <ShoppingBag aria-hidden="true" className="mx-auto size-10 text-ink-300" />
          <h2 className="mt-4 text-lg font-medium text-ink-900">Todavía no agregaste nada</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
            Entra por una categoría y suma los equipos que necesitas. Si no encuentras algo,
            escríbenos y lo cotizamos.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/#categorias"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              Ver las categorías
            </Link>
            <Link
              href="/contacto"
              className="inline-flex h-11 items-center justify-center rounded-sm border border-ink-300 px-6 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
            >
              Consultar
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
          <div>
            <p className="mb-4 text-sm text-ink-500">
              {count} {count === 1 ? 'producto' : 'productos'}
            </p>

            <ul className="divide-y divide-ink-200 border-y border-ink-200">
              {items.map((item) => (
                <li key={item.id} className="flex gap-5 py-5">
                  <Link
                    href={`/productos/${item.slug}`}
                    className="relative size-24 shrink-0 border border-ink-200 bg-white sm:size-28"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="112px"
                        className="object-contain p-2"
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/productos/${item.slug}`}
                          className="text-sm leading-snug text-ink-900 hover:text-brand-600"
                        >
                          {item.name}
                        </Link>
                        {item.sku && (
                          <p className="mt-1 text-xs text-ink-400">SKU {item.sku}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm font-medium text-ink-950">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-stretch border border-ink-300">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          aria-label={`Quitar una unidad de ${item.name}`}
                          className="flex size-9 items-center justify-center text-ink-600 transition-colors hover:bg-ink-100"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.id, Number(e.target.value))}
                          aria-label={`Cantidad de ${item.name}`}
                          className="w-11 border-x border-ink-200 text-center text-sm font-medium focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          aria-label={`Agregar una unidad de ${item.name}`}
                          className="flex size-9 items-center justify-center text-ink-600 transition-colors hover:bg-ink-100"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-5">
                        <p className="text-sm font-semibold text-ink-950">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          aria-label={`Quitar ${item.name} del carrito`}
                          className="p-1 text-ink-400 transition-colors hover:text-brand-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/#categorias"
              className="mt-6 inline-flex items-center gap-2 text-sm text-ink-600 transition-colors hover:text-brand-600"
            >
              <ArrowLeft className="size-4" />
              Seguir comprando
            </Link>
          </div>

          <aside className="lg:sticky lg:top-40 lg:self-start">
            <div className="border border-ink-200 p-6">
              <h2 className="text-base font-medium text-ink-950">Resumen</h2>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-600">Subtotal</dt>
                  <dd className="font-medium text-ink-950">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-600">Despacho</dt>
                  <dd className="text-ink-500">Se calcula al finalizar</dd>
                </div>
              </dl>

              <div className="mt-5 flex items-baseline justify-between border-t border-ink-200 pt-5">
                <span className="font-medium text-ink-950">Total</span>
                <span className="text-2xl font-semibold text-ink-950">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-500">IVA incluido</p>

              <Link
                href="/checkout"
                className="mt-6 flex h-12 items-center justify-center rounded-sm bg-brand-500 text-sm font-medium text-white transition-colors hover:bg-brand-600"
              >
                Finalizar pedido
              </Link>

              <p className="mt-4 flex gap-2.5 text-xs leading-relaxed text-ink-500">
                <Truck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-500" />
                Entrega sin costo en {site.contact.city}. A regiones cotizamos el flete según
                volumen y destino.
              </p>
            </div>
          </aside>
        </div>
      )}
    </Container>
  )
}
