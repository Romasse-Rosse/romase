/**
 * Capa de datos para analítica.
 *
 * Empuja los eventos de e-commerce de GA4 al `dataLayer`, con los nombres y la
 * forma que espera Google Tag Manager, para que Analytics arme el embudo sin
 * configuración a medida:
 *
 *   view_item_list → select_item → view_item → add_to_cart
 *   view_cart → begin_checkout → add_shipping_info → add_payment_info → purchase
 *   remove_from_cart en cualquier punto
 *
 * No incluye el contenedor de GTM: eso se carga con NEXT_PUBLIC_GTM_ID. Si no
 * hay contenedor, los eventos se acumulan igual en window.dataLayer y no se
 * pierde nada cuando se conecte.
 */

export const MONEDA = 'CLP'

export type ItemAnalytics = {
  item_id: string
  item_name: string
  price: number
  item_brand?: string
  item_category?: string
  item_list_id?: string
  item_list_name?: string
  index?: number
  quantity?: number
}

type Evento = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: Evento[]
  }
}

/**
 * Empuja un evento. Se limpia `ecommerce` antes de cada uno porque GTM
 * conserva el objeto entre eventos y, si no, se mezclan los items de dos
 * eventos distintos.
 */
function push(evento: string, ecommerce: Evento) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({ event: evento, ecommerce: { currency: MONEDA, ...ecommerce } })
}

const valorDe = (items: ItemAnalytics[]) =>
  Math.round(items.reduce((total, i) => total + i.price * (i.quantity ?? 1), 0))

/** Una lista de productos entró en pantalla (carrusel, categoría, resultados). */
export function viewItemList(items: ItemAnalytics[], listId: string, listName: string) {
  if (items.length === 0) return
  push('view_item_list', {
    item_list_id: listId,
    item_list_name: listName,
    items: items.map((i, index) => ({ ...i, index, item_list_id: listId, item_list_name: listName })),
  })
}

/** Alguien hizo clic en un producto dentro de una lista. */
export function selectItem(item: ItemAnalytics, listId?: string, listName?: string) {
  push('select_item', {
    item_list_id: listId,
    item_list_name: listName,
    items: [{ ...item, item_list_id: listId, item_list_name: listName }],
  })
}

/** Se abrió la ficha de un producto. */
export function viewItem(item: ItemAnalytics) {
  push('view_item', { value: valorDe([item]), items: [item] })
}

export function addToCart(items: ItemAnalytics[]) {
  push('add_to_cart', { value: valorDe(items), items })
}

export function removeFromCart(items: ItemAnalytics[]) {
  push('remove_from_cart', { value: valorDe(items), items })
}

export function viewCart(items: ItemAnalytics[]) {
  push('view_cart', { value: valorDe(items), items })
}

export function beginCheckout(items: ItemAnalytics[]) {
  push('begin_checkout', { value: valorDe(items), items })
}

/** Se eligió el tipo de entrega. */
export function addShippingInfo(items: ItemAnalytics[], shippingTier: string) {
  push('add_shipping_info', { value: valorDe(items), shipping_tier: shippingTier, items })
}

/** Se eligió la forma de pago. */
export function addPaymentInfo(items: ItemAnalytics[], paymentType: string) {
  push('add_payment_info', { value: valorDe(items), payment_type: paymentType, items })
}

/** Pedido confirmado. */
export function purchase(
  items: ItemAnalytics[],
  datos: { transactionId: string; shipping?: number; tax?: number },
) {
  push('purchase', {
    transaction_id: datos.transactionId,
    value: valorDe(items),
    shipping: datos.shipping ?? 0,
    tax: datos.tax ?? 0,
    items,
  })
}

/** También se registra la búsqueda del sitio, que GA4 usa como evento propio. */
export function search(termino: string) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event: 'search', search_term: termino })
}
