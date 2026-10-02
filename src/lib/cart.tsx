'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { addToCart, removeFromCart, type ItemAnalytics } from './analytics'
import { site } from './site'

/**
 * Carrito en el navegador.
 *
 * Guarda una copia mínima del producto para poder dibujar el carrito sin
 * volver al servidor. Los precios que viajan acá son solo para mostrar: al
 * confirmar el pedido se vuelven a leer del catálogo en el servidor, porque
 * nada que venga del navegador se puede dar por cierto.
 */

const CLAVE = 'romase-carrito-v1'

export type CartItem = {
  id: number
  slug: string
  name: string
  price: number
  image: string | null
  sku: string | null
  quantity: number
}

type CartContexto = {
  items: CartItem[]
  /** Unidades totales, para el contador del encabezado. */
  count: number
  subtotal: number
  /** false hasta que se leyó localStorage: evita el desajuste con el HTML del servidor. */
  ready: boolean
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  remove: (id: number) => void
  setQuantity: (id: number, quantity: number) => void
  clear: () => void
  /** Panel lateral del carrito. */
  open: boolean
  setOpen: (open: boolean) => void
}

const Contexto = createContext<CartContexto | null>(null)

const MAX_POR_LINEA = 99

/** Del carrito al formato que espera GA4. */
export function aItemDeCarrito(
  item: CartItem | Omit<CartItem, 'quantity'>,
  quantity = 1,
): ItemAnalytics {
  return {
    /**
     * El id del producto, no el SKU.
     *
     * Tiene que coincidir con el `g:id` del feed de Merchant Center, que usa
     * `products.id`. Mandando el SKU acá, GA4 y Merchant hablaban de productos
     * distintos y Google no podía cruzar una venta con el anuncio que la trajo.
     */
    item_id: String(item.id),
    item_name: item.name,
    price: item.price,
    item_brand: site.name,
    quantity,
  }
}

function leerAlmacenado(): CartItem[] {
  try {
    const bruto = localStorage.getItem(CLAVE)
    if (!bruto) return []
    const datos = JSON.parse(bruto)
    if (!Array.isArray(datos)) return []
    // Se filtra lo que no tenga forma válida: el localStorage puede venir de
    // una versión anterior del sitio.
    return datos.filter(
      (i): i is CartItem =>
        typeof i?.id === 'number' &&
        typeof i?.slug === 'string' &&
        typeof i?.price === 'number' &&
        typeof i?.quantity === 'number' &&
        i.quantity > 0,
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)

  // Espejo del estado para poder leerlo desde los callbacks. Los eventos de
  // analítica se disparan fuera de los actualizadores de estado: React puede
  // ejecutarlos dos veces y se contarían doble.
  const actuales = useRef<CartItem[]>([])
  useEffect(() => {
    actuales.current = items
  }, [items])

  /**
   * Vaciado explícito, para que la hidratación no lo deshaga.
   *
   * React ejecuta los efectos de hijo a padre, así que un componente de más
   * abajo puede llamar a `clear()` **antes** de que este proveedor lea el
   * almacenamiento. Sin esta marca, esa lectura repone lo que se acababa de
   * vaciar: es lo que pasaba en el comprobante de Webpay, donde el comprador
   * terminaba de pagar y seguía viendo los productos en el carrito.
   *
   * Un vaciado pedido a mano gana sobre lo que haya guardado, siempre.
   */
  const vaciadoExplicito = useRef(false)

  useEffect(() => {
    if (!vaciadoExplicito.current) setItems(leerAlmacenado())
    setReady(true)
  }, [])

  // Se persiste recién después de la primera lectura, para no pisar con un
  // array vacío lo que había guardado.
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items))
    } catch {
      // Modo privado o almacenamiento lleno: el carrito sigue en memoria.
    }
  }, [items, ready])

  const add = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    addToCart([aItemDeCarrito(item, quantity)])

    setItems((lista) => {
      const existente = lista.find((i) => i.id === item.id)
      if (existente) {
        return lista.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(MAX_POR_LINEA, i.quantity + quantity) }
            : i,
        )
      }
      return [...lista, { ...item, quantity: Math.min(MAX_POR_LINEA, quantity) }]
    })
    setOpen(true)
  }, [])

  const remove = useCallback((id: number) => {
    const fuera = actuales.current.find((i) => i.id === id)
    if (fuera) removeFromCart([aItemDeCarrito(fuera, fuera.quantity)])
    setItems((lista) => lista.filter((i) => i.id !== id))
  }, [])

  const setQuantity = useCallback(
    (id: number, quantity: number) => {
      if (quantity < 1) {
        remove(id)
        return
      }

      const destino = Math.min(MAX_POR_LINEA, Math.floor(quantity))
      const actual = actuales.current.find((i) => i.id === id)

      // Subir o bajar la cantidad también cuenta en el embudo.
      if (actual) {
        const diferencia = destino - actual.quantity
        if (diferencia > 0) addToCart([aItemDeCarrito(actual, diferencia)])
        else if (diferencia < 0) removeFromCart([aItemDeCarrito(actual, -diferencia)])
      }

      setItems((lista) => lista.map((i) => (i.id === id ? { ...i, quantity: destino } : i)))
    },
    [remove],
  )

  const clear = useCallback(() => {
    vaciadoExplicito.current = true
    setItems([])
  }, [])

  const valor = useMemo<CartContexto>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      ready,
      add,
      remove,
      setQuantity,
      clear,
      open,
      setOpen,
    }),
    [items, ready, add, remove, setQuantity, clear, open],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useCart(): CartContexto {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useCart tiene que usarse dentro de <CartProvider>')
  return contexto
}
