'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useRef, type ReactNode } from 'react'
import type { Product } from '@/lib/catalog'
import { titleCase } from '@/lib/format'
import { site } from '@/lib/site'
import { selectItem, viewItem, viewItemList, type ItemAnalytics } from '@/lib/analytics'

/** Convierte un producto del catálogo al formato que espera GA4. */
export function aItemAnalytics(
  product: Pick<Product, 'id' | 'name' | 'price' | 'sku'>,
  extra: Partial<ItemAnalytics> = {},
): ItemAnalytics {
  return {
    // El id, no el SKU: tiene que coincidir con el g:id del feed de Merchant
    // Center. Ver aItemDeCarrito en src/lib/cart.tsx.
    item_id: String(product.id),
    item_name: titleCase(product.name),
    price: product.price,
    item_brand: site.name,
    ...extra,
  }
}

/**
 * Contenedor de Google Tag Manager.
 *
 * Sin NEXT_PUBLIC_GTM_ID no se carga nada, pero los eventos igual se acumulan
 * en window.dataLayer: el día que se conecte el contenedor no hay que tocar
 * ningún componente.
 */
export function TagManager() {
  const id = process.env.NEXT_PUBLIC_GTM_ID
  if (!id) return null

  return (
    <>
      <Script id="gtm-datalayer" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];`}
      </Script>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`}
      </Script>
    </>
  )
}

/**
 * Dispara view_item_list cuando la lista entra en pantalla, no al cargar la
 * página: en la home hay dos carruseles y uno está bien abajo, así que
 * anunciarlos juntos falsearía el dato.
 */
export function ViewItemList({
  products,
  listId,
  listName,
}: {
  products: Pick<Product, 'id' | 'name' | 'price' | 'sku'>[]
  listId: string
  listName: string
}) {
  const marca = useRef<HTMLDivElement>(null)
  const yaEnviado = useRef(false)

  useEffect(() => {
    const el = marca.current
    if (!el || yaEnviado.current || products.length === 0) return

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas[0].isIntersecting || yaEnviado.current) return
        yaEnviado.current = true
        viewItemList(
          products.map((p) => aItemAnalytics(p)),
          listId,
          listName,
        )
        observador.disconnect()
      },
      { threshold: 0.25 },
    )

    observador.observe(el)
    return () => observador.disconnect()
  }, [products, listId, listName])

  return <div ref={marca} aria-hidden="true" />
}

/**
 * Enlace a una ficha que además anuncia select_item.
 *
 * Es la forma de tener el evento sin volver cliente toda la tarjeta: lo único
 * que necesita JavaScript es el enlace.
 */
export function SelectItemLink({
  product,
  listId,
  listName,
  className,
  children,
}: {
  product: Pick<Product, 'id' | 'name' | 'price' | 'sku' | 'slug'>
  listId?: string
  listName?: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={`/productos/${product.slug}`}
      className={className}
      onClick={() => selectItem(aItemAnalytics(product), listId, listName)}
    >
      {children}
    </Link>
  )
}

/** Dispara view_item al abrir la ficha de un producto. */
export function ViewItem({
  product,
  categoria,
}: {
  product: Pick<Product, 'id' | 'name' | 'price' | 'sku'>
  categoria?: string
}) {
  const yaEnviado = useRef(false)

  useEffect(() => {
    if (yaEnviado.current) return
    yaEnviado.current = true
    viewItem(aItemAnalytics(product, { item_category: categoria }))
  }, [product, categoria])

  return null
}
