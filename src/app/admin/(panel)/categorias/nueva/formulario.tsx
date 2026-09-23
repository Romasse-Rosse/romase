'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, Info } from 'lucide-react'
import { crearCategoria, type EstadoCategoria } from '../acciones'
import { aSlug } from '@/lib/categorias-panel'

const inicial: EstadoCategoria = {}

export type Raiz = { id: number; etiqueta: string }

export function FormularioNuevaCategoria({ raices }: { raices: Raiz[] }) {
  const [estado, accion] = useActionState(crearCategoria, inicial)
  const [nombre, setNombre] = useState('')
  const [padre, setPadre] = useState('raiz')

  const esPrincipal = padre === 'raiz'

  return (
    <form action={accion} className="border border-ink-200 bg-white p-4 sm:p-6">
      {estado.error && (
        <p
          role="alert"
          className="mb-5 flex gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {estado.error}
        </p>
      )}

      <Campo etiqueta="Nombre" id="nombre">
        <input
          id="nombre"
          name="nombre"
          required
          minLength={3}
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={entrada}
        />
        {/*
          La dirección se muestra mientras se escribe porque después no se puede
          cambiar sin romper enlaces, igual que en productos.
        */}
        <p className="mt-1.5 text-xs text-ink-500">
          Dirección en la web: <code className="text-ink-700">/categorias/{aSlug(nombre)}</code>. Se
          genera del nombre y después no se puede cambiar sin romper los enlaces.
        </p>
      </Campo>

      <Campo etiqueta="¿Dónde va?" id="padre">
        <select
          id="padre"
          name="padre"
          value={padre}
          onChange={(e) => setPadre(e.target.value)}
          className={entrada}
        >
          <option value="raiz">Categoría principal (aparece en el menú)</option>
          {raices.map((r) => (
            <option key={r.id} value={r.id}>
              Subcategoría de {r.etiqueta}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-ink-500">
          El sitio muestra dos niveles: rubro y subcategoría. Una subcategoría no puede tener
          subcategorías propias.
        </p>
      </Campo>

      {esPrincipal && (
        <p className="mb-4 flex gap-2 border border-ink-200 bg-ink-50 p-3 text-xs leading-relaxed text-ink-600">
          <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ink-400" />
          <span>
            Una categoría principal <strong>va al menú del sitio</strong>, pero recién cuando tenga
            productos: las vacías no se muestran. El menú ya tiene nueve rubros y está justo de
            espacio, así que conviene pensar si esto es un rubro nuevo o una subcategoría de uno
            existente.
          </span>
        </p>
      )}

      <Campo etiqueta="Descripción (opcional)" id="descripcion">
        <textarea id="descripcion" name="descripcion" rows={3} className={entrada} />
        <p className="mt-1.5 text-xs text-ink-500">
          Es lo que Google muestra debajo del título cuando aparece esta categoría en los
          resultados. Conviene que sea una frase, de unos 150 caracteres.
        </p>
      </Campo>

      <Boton />

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Hasta que tenga al menos un producto no va a aparecer en la tienda. Eso es a propósito: así
        se puede preparar sin que se vea a medias.
      </p>
    </form>
  )
}

const entrada =
  'w-full rounded-sm border border-ink-200 bg-white px-3 py-3 text-sm text-ink-900 focus:border-ink-950 focus:outline-none sm:py-2'

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
      {pending ? 'Creando…' : 'Crear y agregar productos'}
    </button>
  )
}
