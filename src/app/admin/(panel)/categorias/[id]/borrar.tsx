'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { AlertCircle, Trash2 } from 'lucide-react'
import { borrarCategoria } from '../acciones'

/**
 * Borrar la categoría.
 *
 * Tiene dos consecuencias que no se ven desde el botón y que hay que decir
 * antes, no después:
 *
 *   · las subcategorías **no se borran con ella**: `parent_id` está declarado
 *     `on delete set null`, así que pasan a ser categorías principales y
 *     aparecen en el menú del sitio. Por eso directamente no se permite mientras
 *     tenga hijas;
 *   · los productos tampoco se borran, pero salen de esta categoría, y los que
 *     no tengan otra dejan de aparecer en todo listado de la tienda.
 */
export function BorrarCategoria({
  categoriaId,
  nombre,
  cuantosProductos,
  cuantasHijas,
  quedarianSinCategoria,
  puedeBorrar,
}: {
  categoriaId: number
  nombre: string
  cuantosProductos: number
  cuantasHijas: number
  quedarianSinCategoria: number
  puedeBorrar: boolean
}) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, transicion] = useTransition()

  if (!puedeBorrar) {
    return (
      <p className="mt-10 text-xs leading-relaxed text-ink-500">
        Para borrar una categoría hace falta el rol <strong>owner</strong> o{' '}
        <strong>admin</strong>.
      </p>
    )
  }

  const bloqueada = cuantasHijas > 0

  const borrar = () => {
    setError(null)
    transicion(async () => {
      const r = await borrarCategoria(categoriaId)
      if (r.error) {
        setError(r.error)
        setConfirmando(false)
        return
      }
      router.push('/admin/categorias')
    })
  }

  return (
    <section className="mt-10 border border-red-200 bg-red-50/40 p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink-950">Borrar esta categoría</h2>

      {bloqueada ? (
        <p className="mt-3 flex gap-2 border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-ink-700">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            No se puede mientras tenga {cuantasHijas}{' '}
            {cuantasHijas === 1 ? 'subcategoría' : 'subcategorías'}. Si se borrara,{' '}
            <strong>no se borrarían con ella</strong>: pasarían a ser categorías principales y
            aparecerían en el menú del sitio. Muévelas a otro rubro o bórralas primero.
          </span>
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs leading-relaxed text-ink-600">
            Los productos no se borran: salen de esta categoría y siguen existiendo. No se puede
            deshacer.
          </p>

          {quedarianSinCategoria > 0 && (
            <p className="mt-3 flex gap-2 border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-ink-700">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <strong>{quedarianSinCategoria}</strong> de los {cuantosProductos} productos
                quedarían <strong>sin ninguna categoría</strong>. Esos dejan de aparecer en todo
                listado de la tienda: solo se llega a ellos por el buscador o por su dirección.
                Conviene asignarlos a otra categoría antes.
              </span>
            </p>
          )}

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
              Borrar la categoría
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
                  {pendiente ? 'Borrando…' : 'Sí, borrarla'}
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
        </>
      )}
    </section>
  )
}
