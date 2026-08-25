'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

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

  useEffect(() => {
    setItems(leerAlmacenado())
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
    setItems((actuales) => {
      const existente = actuales.find((i) => i.id === item.id)
      if (existente) {
        return actuales.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(MAX_POR_LINEA, i.quantity + quantity) }
            : i,
        )
      }
      return [...actuales, { ...item, quantity: Math.min(MAX_POR_LINEA, quantity) }]
    })
    setOpen(true)
  }, [])

  const remove = useCallback((id: number) => {
    setItems((actuales) => actuales.filter((i) => i.id !== id))
  }, [])

  const setQuantity = useCallback((id: number, quantity: number) => {
    if (quantity < 1) {
      setItems((actuales) => actuales.filter((i) => i.id !== id))
      return
    }
    setItems((actuales) =>
      actuales.map((i) =>
        i.id === id ? { ...i, quantity: Math.min(MAX_POR_LINEA, Math.floor(quantity)) } : i,
      ),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

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
