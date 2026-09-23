'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { AlertCircle, CheckCircle2, ImageOff, Plus } from 'lucide-react'
import { agregarProductos, type EstadoCategoria } from '../acciones'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'

export type Huerfano = {
  id: number
  nombre: string
  sku: string
  precio: number
  enStock: boolean
  foto: string | null
}

export function AsignarSinCategoria({
  productos,
  categorias,
}: {
  productos: Huerfano[]
  categorias: { id: number; etiqueta: string }[]
}) {
  const router = useRouter()
  const [elegidos, setElegidos] = useState<Set<number>>(new Set())
  const [categoria, setCategoria] = useState('')
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null)
  const [pendiente, transicion] = useTransition()

  const alternar = (id: number) =>
    setElegidos((previos) => {
      const copia = new Set(previos)
      if (copia.has(id)) copia.delete(id)
      else copia.add(id)
      return copia
    })

  const todos = () =>
    setElegidos((previos) =>
      previos.size === productos.length ? new Set() : new Set(productos.map((p) => p.id)),
    )

  const asignar = () => {
    const ids = [...elegidos]
    const destino = Number(categoria)
    if (ids.length === 0 || !Number.isFinite(destino) || destino <= 0) return

    transicion(async () => {
      const r: EstadoCategoria = await agregarProductos(destino, ids)
      if (r.error) setAviso({ texto: r.error, error: true })
      else {
        setAviso({
          texto: `${ids.length} ${ids.length === 1 ? 'producto asignado' : 'productos asignados'}. Ya aparecen en la tienda.`,
        })
        setElegidos(new Set())
      }
      router.refresh()
    })
  }

  const listo = elegidos.size > 0 && categoria !== ''

  return (
    <div className="mt-6">
      <p className="flex gap-2 border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-ink-700">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          Estos productos tienen ficha y se pueden comprar, pero{' '}
          <strong>no aparecen en ningún listado</strong>: ni en el menú, ni en la portada, ni en
          una categoría. Solo se llega a ellos por el buscador o escribiendo su dirección.
        </span>
      </p>

      {aviso && (
        <p
          role="alert"
          className={cn(
            'mt-4 flex gap-2 border p-3 text-sm',
            aviso.error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          )}
        >
          {aviso.error ? (
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )}
          {aviso.texto}
        </p>
      )}

      <ul className="mt-6 divide-y divide-ink-100 border border-ink-200 bg-white">
        <li className="flex items-center gap-3 bg-ink-50 p-3">
          <input
            type="checkbox"
            checked={elegidos.size === productos.length && productos.length > 0}
            onChange={todos}
            aria-label="Elegir todos"
            className="size-4 shrink-0 rounded-sm border-ink-300 accent-brand-500"
          />
          <span className="text-xs text-ink-600">
            {elegidos.size === 0
              ? 'Elegir todos'
              : `${elegidos.size} de ${productos.length} elegidos`}
          </span>
        </li>

        {productos.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-ink-50">
              <input
                type="checkbox"
                checked={elegidos.has(p.id)}
                onChange={() => alternar(p.id)}
                className="size-4 shrink-0 rounded-sm border-ink-300 accent-brand-500"
              />

              <span className="flex size-11 shrink-0 items-center justify-center border border-ink-100 bg-ink-50">
                {p.foto ? (
                  <Image
                    src={p.foto}
                    alt={p.nombre}
                    width={44}
                    height={44}
                    className="size-11 object-contain"
                  />
                ) : (
                  <ImageOff aria-hidden="true" className="size-4 text-ink-300" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink-900">{p.nombre}</span>
                <span className="block text-xs text-ink-500">
                  {p.sku ? `SKU ${p.sku} · ` : ''}
                  {formatPrice(p.precio)}
                  {!p.enStock && ' · sin stock'}
                </span>
              </span>

              <Link
                href={`/admin/productos/${p.id}`}
                className="hidden shrink-0 text-xs text-brand-700 hover:underline sm:block"
                onClick={(e) => e.stopPropagation()}
              >
                Ver ficha
              </Link>
            </label>
          </li>
        ))}
      </ul>

      {/* Se queda pegado abajo: con doce productos la lista se desplaza y el
          control tiene que estar a mano sin volver arriba. */}
      <div className="sticky bottom-0 mt-4 border border-ink-200 bg-white p-3 shadow-lift sm:static sm:shadow-none">
        <div className="grid gap-2 sm:flex sm:items-center">
          <label htmlFor="destino" className="sr-only">
            Categoría de destino
          </label>
          <select
            id="destino"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="h-11 w-full rounded-sm border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-ink-950 focus:outline-none sm:h-10 sm:flex-1"
          >
            <option value="">Elegir la categoría…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.etiqueta}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={asignar}
            disabled={!listo || pendiente}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-sm bg-brand-500 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50 sm:h-10"
          >
            <Plus aria-hidden="true" className="size-4" />
            {pendiente
              ? 'Asignando…'
              : elegidos.size === 0
                ? 'Elige productos'
                : `Asignar ${elegidos.size}`}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-500">
        Un producto puede estar en varias categorías. Esto lo agrega a la elegida; después podés
        agregarlo a otras desde su ficha de categoría.
      </p>
    </div>
  )
}
