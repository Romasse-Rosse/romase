'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { AlertCircle, CheckCircle2, ImageOff, Plus, Search, X } from 'lucide-react'
import { agregarProductos, quitarProducto, type EstadoCategoria } from '../acciones'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'

export type FilaDeProducto = {
  id: number
  nombre: string
  sku: string
  precio: number
  enStock: boolean
  foto: string | null
  cuantasCategorias: number
}

export function ProductosDeLaCategoria({
  categoriaId,
  dentro,
  candidatos,
  termino,
  puedeEscribir,
}: {
  categoriaId: number
  dentro: FilaDeProducto[]
  candidatos: FilaDeProducto[]
  termino: string
  puedeEscribir: boolean
}) {
  const router = useRouter()
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null)
  const [elegidos, setElegidos] = useState<Set<number>>(new Set())
  const [pendiente, transicion] = useTransition()

  const correr = (accion: () => Promise<EstadoCategoria>) => {
    transicion(async () => {
      const r = await accion()
      if (r.error) setAviso({ texto: r.error, error: true })
      else if (r.ok) setAviso({ texto: r.ok })
      router.refresh()
    })
  }

  const alternar = (id: number) => {
    setElegidos((previos) => {
      const copia = new Set(previos)
      if (copia.has(id)) copia.delete(id)
      else copia.add(id)
      return copia
    })
  }

  const agregar = () => {
    const ids = [...elegidos]
    if (ids.length === 0) return
    setElegidos(new Set())
    correr(() => agregarProductos(categoriaId, ids))
  }

  return (
    <div className="border border-ink-200 bg-white p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink-950">
        Productos <span className="font-normal text-ink-500">({dentro.length})</span>
      </h2>

      {aviso && (
        <p
          role="alert"
          className={cn(
            'mt-4 flex gap-2 border p-3 text-xs leading-relaxed',
            aviso.error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          )}
        >
          {aviso.error ? (
            <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          )}
          {aviso.texto}
        </p>
      )}

      {puedeEscribir && (
        <>
          {/*
            Buscador con GET: los resultados los calcula el servidor con la
            misma búsqueda tolerante a faltas que usa la tienda, y la consulta
            queda en la URL. Quien administra también escribe «amazadora».
          */}
          <form method="get" className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
              />
              <label htmlFor="buscar" className="sr-only">
                Buscar productos para agregar
              </label>
              <input
                id="buscar"
                name="buscar"
                defaultValue={termino}
                placeholder="Buscar productos para agregar…"
                className="h-11 w-full rounded-sm border border-ink-200 bg-white pr-3 pl-9 text-sm text-ink-900 focus:border-ink-950 focus:outline-none sm:h-10"
              />
            </div>
            <button
              type="submit"
              className="h-11 shrink-0 rounded-sm bg-ink-950 px-4 text-sm font-medium text-white transition-colors hover:bg-ink-800 sm:h-10"
            >
              Buscar
            </button>
          </form>

          {termino && (
            <div className="mt-4 border border-ink-200">
              <p className="border-b border-ink-100 bg-ink-50 px-3 py-2 text-xs text-ink-600">
                {candidatos.length === 0
                  ? `Ningún producto fuera de esta categoría coincide con «${termino}».`
                  : `${candidatos.length} ${candidatos.length === 1 ? 'producto' : 'productos'} para agregar`}
              </p>

              {candidatos.length > 0 && (
                <>
                  <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
                    {candidatos.map((p) => (
                      <li key={p.id}>
                        <label className="flex cursor-pointer items-center gap-3 p-2.5 hover:bg-ink-50">
                          <input
                            type="checkbox"
                            checked={elegidos.has(p.id)}
                            onChange={() => alternar(p.id)}
                            className="size-4 shrink-0 rounded-sm border-ink-300 accent-brand-500"
                          />
                          <Miniatura foto={p.foto} nombre={p.nombre} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-medium text-ink-900">
                              {p.nombre}
                            </span>
                            <span className="block text-[11px] text-ink-500">
                              {p.sku ? `SKU ${p.sku} · ` : ''}
                              {formatPrice(p.precio)}
                              {p.cuantasCategorias === 0 && ' · sin categoría'}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-ink-100 p-2.5">
                    <button
                      type="button"
                      onClick={agregar}
                      disabled={elegidos.size === 0 || pendiente}
                      className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-sm bg-brand-500 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                    >
                      <Plus aria-hidden="true" className="size-4" />
                      {elegidos.size === 0
                        ? 'Elige productos para agregar'
                        : `Agregar ${elegidos.size} ${elegidos.size === 1 ? 'producto' : 'productos'}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {dentro.length === 0 ? (
        <p className="mt-5 border border-dashed border-ink-300 p-8 text-center text-xs text-ink-500">
          Todavía no tiene productos. Mientras no tenga al menos uno, la categoría no aparece en la
          tienda.
        </p>
      ) : (
        <ul className="mt-5 max-h-[32rem] divide-y divide-ink-100 overflow-y-auto border border-ink-100">
          {dentro.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-2.5">
              <Miniatura foto={p.foto} nombre={p.nombre} />

              <Link href={`/admin/productos/${p.id}`} className="min-w-0 flex-1 hover:underline">
                <span className="block text-xs font-medium text-ink-900">{p.nombre}</span>
                <span className="block text-[11px] text-ink-500">
                  {p.sku ? `SKU ${p.sku} · ` : ''}
                  {formatPrice(p.precio)}
                  {!p.enStock && ' · sin stock'}
                  {/* Avisa antes de quitarlo, no después: si es su única
                      categoría, el producto se queda sin ningún listado. */}
                  {p.cuantasCategorias <= 1 && ' · única categoría'}
                </span>
              </Link>

              {puedeEscribir && (
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() => correr(() => quitarProducto(categoriaId, p.id))}
                  aria-label={`Quitar ${p.nombre} de esta categoría`}
                  title="Quitar de esta categoría"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-400 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-40 sm:size-8"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs leading-relaxed text-ink-500">
        Un producto puede estar en varias categorías. Agregarlo acá no lo saca de las otras, y
        quitarlo de acá tampoco.
      </p>
    </div>
  )
}

function Miniatura({ foto, nombre }: { foto: string | null; nombre: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center border border-ink-100 bg-ink-50">
      {foto ? (
        <Image src={foto} alt={nombre} width={40} height={40} className="size-10 object-contain" />
      ) : (
        <ImageOff aria-hidden="true" className="size-4 text-ink-300" />
      )}
    </span>
  )
}
