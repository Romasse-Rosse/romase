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
 * rechaza, el comprador tiene que poder reintentar sin volver a armar el
 * pedido.
 */
export function CompraConfirmada({
  transactionId,
  items,
}: {
  transactionId: string
  items: ItemAnalytics[]
}) {
  const { clear } = useCart()
  const hecho = useRef(false)

  useEffect(() => {
    if (hecho.current) return
    hecho.current = true
    purchase(items, { transactionId })
    clear()
  }, [clear, items, transactionId])

  return null
}
