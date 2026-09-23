'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { guardarCategoria, type EstadoCategoria } from '../acciones'
import {
  EXPLICACION,
  motivoParaRechazarElPadre,
  type CategoriaCruda,
} from '@/lib/categorias-panel'
import { titleCase } from '@/lib/format'

const inicial: EstadoCategoria = {}

export type CategoriaEditable = {
  id: number
  nombre: string
  slug: string
  padreId: number | null
  descripcion: string
}

export function DatosDeLaCategoria({
  categoria,
  categorias,
  cuantasHijas,
  puedeEscribir,
}: {
  categoria: CategoriaEditable
  categorias: CategoriaCruda[]
  cuantasHijas: number
  puedeEscribir: boolean
}) {
  const [estado, accion] = useActionState(guardarCategoria, inicial)
  const [padre, setPadre] = useState(categoria.padreId === null ? 'raiz' : String(categoria.padreId))

  const padreId = padre === 'raiz' ? null : Number(padre)

  /**
   * La misma comprobación que hace el servidor, acá para avisar antes.
   *
   * No reemplaza a la del servidor —esta se puede saltear— pero evita que
   * alguien elija una opción imposible y se entere recién al guardar.
   */
  const motivo = motivoParaRechazarElPadre(categoria.id, padreId, categorias)

  // Solo las raíces pueden ser madres, y ninguna de las propias descendientes.
  const posiblesMadres = categorias.filter(
    (c) => c.padreId === null && c.id !== categoria.id,
  )

  const eraPrincipal = categoria.padreId === null

  return (
    <form action={accion} className="border border-ink-200 bg-white p-4 sm:p-6">
      <input type="hidden" name="id" value={categoria.id} />

      <h2 className="text-sm font-semibold text-ink-950">Datos</h2>

      {estado.error && (
        <p
          role="alert"
          className="mt-4 flex gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p className="mt-4 flex gap-2 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {estado.ok}
        </p>
      )}

      <div className="mt-5">
        <Campo etiqueta="Nombre" id="nombre">
          <input
            id="nombre"
            name="nombre"
            defaultValue={categoria.nombre}
            required
            minLength={3}
            disabled={!puedeEscribir}
            className={entrada}
          />
        </Campo>

        <Campo etiqueta="Dirección en la web" id="slug-visible">
          <input
            id="slug-visible"
            value={`/categorias/${categoria.slug}`}
            disabled
            readOnly
            className={entrada}
          />
          {/*
            No se edita, igual que en productos: cambiarla deja la URL anterior
            en 404 y se pierde el posicionamiento que esa página haya juntado,
            que en una categoría suele ser más que en una ficha suelta.
          */}
          <p className="mt-1.5 text-xs text-ink-500">
            No se edita: cambiarla rompe los enlaces y el posicionamiento de esa página.
          </p>
        </Campo>

        <Campo etiqueta="¿Dónde va?" id="padre">
          <select
            id="padre"
            name="padre"
            value={padre}
            onChange={(e) => setPadre(e.target.value)}
            disabled={!puedeEscribir}
            className={entrada}
          >
            <option value="raiz">Categoría principal (menú del sitio)</option>
            {posiblesMadres.map((c) => (
              <option key={c.id} value={c.id}>
                Subcategoría de {titleCase(c.nombre)}
              </option>
            ))}
          </select>

          {motivo && (
            <p className="mt-1.5 flex gap-2 text-xs text-red-700">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              {EXPLICACION[motivo]}
            </p>
          )}

          {!motivo && cuantasHijas > 0 && (
            <p className="mt-1.5 text-xs text-ink-500">
              Tiene {cuantasHijas} {cuantasHijas === 1 ? 'subcategoría' : 'subcategorías'}, así que
              solo puede ser principal: el sitio muestra dos niveles.
            </p>
          )}

          {!motivo && !eraPrincipal && padreId === null && (
            <p className="mt-1.5 flex gap-2 text-xs text-ink-600">
              <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ink-400" />
              Al pasarla a principal va a aparecer en el menú del sitio.
            </p>
          )}
        </Campo>

        <Campo etiqueta="Descripción" id="descripcion">
          <textarea
            id="descripcion"
            name="descripcion"
            rows={4}
            defaultValue={categoria.descripcion}
            disabled={!puedeEscribir}
            className={entrada}
          />
          <p className="mt-1.5 text-xs text-ink-500">
            Es lo que Google muestra debajo del título cuando esta categoría aparece en los
            resultados. Una frase de unos 150 caracteres.
          </p>
        </Campo>

        {puedeEscribir && <Boton bloqueado={Boolean(motivo)} />}
      </div>
    </form>
  )
}

const entrada =
  'w-full rounded-sm border border-ink-200 bg-white px-3 py-3 text-sm text-ink-900 focus:border-ink-950 focus:outline-none disabled:bg-ink-50 disabled:text-ink-500 sm:py-2'

function Campo({
  etiqueta,
  id,
  children,
}: {
  etiqueta: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">
        {etiqueta}
      </label>
      {children}
    </div>
  )
}

function Boton({ bloqueado }: { bloqueado: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || bloqueado}
      className="h-11 rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </button>
  )
}
