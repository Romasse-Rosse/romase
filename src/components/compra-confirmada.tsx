'use client'

import { useEffect, useRef } from 'react'
import { useCart } from '@/lib/cart'
import { purchase, type ItemAnalytics } from '@/lib/analytics'

/**
 * Cierre de la compra, en el navegador.
 *
 * Hace las dos cosas que solo se pueden hacer con el pago ya confirmado:
 * anunciar `purchase` a la analítica y vaciar el carrito.
 *
 * El carrito no se vacía al salir hacia Webpay a propósito: si el pago se
 * rechaza, el comprador tiene que poder reintentar sin volver a armar el pedido.
 */

/** Compras ya anunciadas, para no contarlas de nuevo si se recarga el comprobante. */
const CLAVE_ANUNCIADAS = 'romase:compras-anunciadas'

function anunciadas(): string[] {
  try {
    const previas: unknown = JSON.parse(localStorage.getItem(CLAVE_ANUNCIADAS) ?? '[]')
    return Array.isArray(previas) ? previas.filter((x): x is string => typeof x === 'string') : []
  } catch {
    // Modo privado o dato corrupto: se trata como si no hubiera historial.
    return []
  }
}

function anotarAnunciada(id: string) {
  try {
    // Se guardan las últimas: no hace falta el historial completo.
    localStorage.setItem(CLAVE_ANUNCIADAS, JSON.stringify([...anunciadas(), id].slice(-20)))
  } catch {
    // Sin almacenamiento, como mucho se cuenta dos veces si además recarga.
  }
}

export function CompraConfirmada({
  transactionId,
  items,
}: {
  transactionId: string
  items: ItemAnalytics[]
}) {
  const { clear, ready } = useCart()
  const hecho = useRef(false)

  useEffect(() => {
    /**
     * Se espera a que el carrito termine de leer el localStorage.
     *
     * React ejecuta los efectos de hijo a padre, así que este corre **antes**
     * que el del proveedor del carrito. Vaciar acá sin esperar no hacía nada: el
     * carrito todavía estaba vacío, y un instante después el proveedor lo
     * repuebla desde el almacenamiento. El comprador terminaba de pagar y
     * seguía viendo los productos en el carrito.
     */
    if (!ready || hecho.current) return
    hecho.current = true

    // Recargar el comprobante no es una compra nueva.
    if (!anunciadas().includes(transactionId)) {
      purchase(items, { transactionId })
      anotarAnunciada(transactionId)
    }

    clear()
  }, [ready, clear, items, transactionId])

  return null
}
