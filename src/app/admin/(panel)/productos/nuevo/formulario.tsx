'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle } from 'lucide-react'
import { crearProducto, type EstadoNuevo } from './acciones'
import { formatPrice } from '@/lib/format'

const inicial: EstadoNuevo = {}

export type OpcionCategoria = { id: number; etiqueta: string; esRaiz: boolean }

export function FormularioNuevo({ categorias }: { categorias: OpcionCategoria[] }) {
  const [estado, accion] = useActionState(crearProducto, inicial)
  const [precio, setPrecio] = useState('')

  return (
    <form action={accion} className="border border-ink-200 bg-white p-6">
      {estado.error && (
        <p
          role="alert"
          className="mb-5 flex gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {estado.error}
        </p>
      )}

      <Campo etiqueta="Nombre" id="name">
        <input id="name" name="name" required minLength={3} className={entrada} autoFocus />
        <p className="mt-1.5 text-xs text-ink-500">
          La dirección web se genera de acá y después no se puede cambiar sin romper enlaces, así
          que conviene escribirlo completo desde el principio.
        </p>
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Precio" id="price">
          <input
            id="price"
            name="price"
            inputMode="numeric"
            required
            value={precio}
            onChange={(e) => setPrecio(e.target.value.replace(/[^\d]/g, ''))}
            className={entrada}
          />
          <p className="mt-1.5 text-xs font-medium text-ink-700">
            {precio ? formatPrice(Number(precio)) : '—'}
          </p>
        </Campo>

        <Campo etiqueta="SKU (opcional)" id="sku">
          <input id="sku" name="sku" className={entrada} />
          <p className="mt-1.5 text-xs text-ink-500">El código con el que lo identifican.</p>
        </Campo>
      </div>

      <Campo etiqueta="Categoría" id="categoria">
        <select id="categoria" name="categoria" required defaultValue="" className={entrada}>
          <option value="" disabled>
            Elegir una…
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.etiqueta}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-ink-500">
          Es obligatoria: sin categoría el producto no aparece en ningún listado y solo se llega
          por su dirección directa. Conviene la subcategoría más específica, no el rubro.
        </p>
      </Campo>

      <Campo etiqueta="Descripción corta (opcional)" id="short_description">
        <textarea id="short_description" name="short_description" rows={3} className={entrada} />
        <p className="mt-1.5 text-xs text-ink-500">
          Lo primero que se lee en la ficha. Se puede completar después.
        </p>
      </Campo>

      <label className="mb-6 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="in_stock"
          defaultChecked
          className="mt-0.5 size-4 rounded-sm border-ink-300 accent-brand-500"
        />
        <span>
          <span className="block text-sm font-medium text-ink-900">Disponible para comprar</span>
          <span className="block text-xs text-ink-500">
            Si lo dejás sin marcar, la ficha se ve pero no se puede agregar al carrito.
          </span>
        </span>
      </label>

      <Boton />

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Al crearlo te lleva a la ficha para cargar las fotos. Hasta que tenga al menos una, en los
        listados sale con un recuadro vacío.
      </p>
    </form>
  )
}

const entrada =
  'w-full rounded-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-ink-950 focus:outline-none'

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

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
    >
      {pending ? 'Creando…' : 'Crear y cargar las fotos'}
    </button>
  )
}
