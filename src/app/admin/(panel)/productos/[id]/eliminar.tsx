'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { AlertCircle, Trash2 } from 'lucide-react'
import { eliminarProducto } from './acciones'

/**
 * Borrar el producto.
 *
 * ------------------------------------------------------------------
 * Por qué en dos pasos y al final de la página
 * ------------------------------------------------------------------
 * Es la única acción del panel que no se puede deshacer, y está a un dedo de
 * distancia de «guardar cambios» en un teléfono. Un botón directo se aprieta
 * sin querer.
 *
 * Y por qué no lo esconde del todo: cuando alguien carga un producto de prueba
 * —o dos veces el mismo— necesita poder sacarlo, y si el panel no ofrece la
 * acción, la alternativa es pedirle a alguien que corra un DELETE en la base.
 * Eso es peor.
 */
export function EliminarProducto({
  productoId,
  slug,
  nombre,
  enPedidos,
  puedeBorrar,
}: {
  productoId: number
  slug: string
  nombre: string
  enPedidos: number
  puedeBorrar: boolean
}) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, transicion] = useTransition()

  if (!puedeBorrar) {
    return (
      <p className="mt-8 text-xs leading-relaxed text-ink-500">
        Para borrar un producto hace falta el rol <strong>owner</strong> o <strong>admin</strong>.
        Tu cuenta puede despublicarlo quitándole «disponible para comprar», que es reversible.
      </p>
    )
  }

  const borrar = () => {
    setError(null)
    transicion(async () => {
      const r = await eliminarProducto(productoId, slug)
      if (r.error) {
        setError(r.error)
        setConfirmando(false)
        return
      }
      router.push('/admin/productos')
    })
  }

  return (
    <section className="mt-10 border border-red-200 bg-red-50/40 p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink-950">Borrar este producto</h2>

      {/*
        La primera versión decía «se borran también sus fotos y su categoría», y
        se entendía al revés: que desaparecía la categoría entera. Tamara lo
        preguntó y estaba bien preguntado. Lo que se borra es la fila que une
        este producto con su categoría; la categoría queda con todos sus otros
        productos. Comprobado sobre la base: 64 categorías antes y después, y
        COMPLEMENTARIOS conservó sus 47 productos.
      */}
      <p className="mt-2 text-xs leading-relaxed text-ink-600">
        Se borran sus fotos y <strong>sale de su categoría</strong> —la categoría queda como está,
        con el resto de sus productos—. No se puede deshacer.
      </p>

      {enPedidos > 0 && (
        <p className="mt-3 flex gap-2 border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-ink-700">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Este producto se vendió en <strong>{enPedidos}</strong>{' '}
            {enPedidos === 1 ? 'pedido' : 'pedidos'}. Esos pedidos no se borran y conservan el
            nombre, el SKU y el precio con que se compró, porque se guardan al cerrar la venta. Lo
            que se pierde es el vínculo al producto.
          </span>
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-ink-600">
        Si lo que querés es que deje de venderse, conviene destildar{' '}
        <strong>«disponible para comprar»</strong> más arriba: la ficha sigue existiendo, no se
        puede comprar, y se revierte cuando quieras.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 flex gap-2 border border-red-300 bg-white p-3 text-xs text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}

      {!confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm border border-red-300 bg-white px-4 text-sm text-red-700 transition-colors hover:border-red-500 sm:min-h-10"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Borrar el producto
        </button>
      ) : (
        <div className="mt-4">
          <p className="text-sm font-medium text-ink-950">
            ¿Borrar «{nombre}»? No se puede deshacer.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={borrar}
              disabled={pendiente}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 sm:min-h-10"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {pendiente ? 'Borrando…' : 'Sí, borrarlo'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={pendiente}
              className="inline-flex min-h-11 items-center rounded-sm border border-ink-300 bg-white px-4 text-sm text-ink-700 transition-colors hover:border-ink-500 disabled:opacity-60 sm:min-h-10"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
