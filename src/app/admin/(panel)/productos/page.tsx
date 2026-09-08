import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, ImageOff, Plus, Search, Star } from 'lucide-react'
import { clienteDelPanel, sesionDelPanel } from '@/lib/panel'
import { imagenServida } from '@/lib/catalog'
import { formatPrice, titleCase } from '@/lib/format'
import { cn } from '@/lib/cn'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Productos' }

const POR_PAGINA = 25

type Busqueda = Promise<{ q?: string; pagina?: string; estado?: string }>

/**
 * Listado de productos.
 *
 * Pagina en el servidor en vez de traer los 214 y filtrar en el navegador. Con
 * este catálogo las dos cosas funcionarían, pero el panel es la herramienta que
 * el cliente va a usar cuando el catálogo crezca, y una lista que carga todo
 * deja de servir justo cuando más productos hay.
 */
export default async function ProductosPanel({ searchParams }: { searchParams: Busqueda }) {
  const { q = '', pagina = '1', estado = 'todos' } = await searchParams
  const termino = q.trim()
  const nroPagina = Math.max(1, Number(pagina) || 1)
  const desde = (nroPagina - 1) * POR_PAGINA

  const sesion = await sesionDelPanel()
  const db = await clienteDelPanel()

  let consulta = db
    .from('products')
    .select('id, name, slug, sku, price, in_stock, featured, updated_at', { count: 'exact' })

  if (termino) {
    // Busca por nombre o por SKU: el cliente conoce sus productos por los dos.
    const patron = `%${termino}%`
    consulta = consulta.or(`name.ilike.${patron},sku.ilike.${patron}`)
  }
  if (estado === 'sin-stock') consulta = consulta.eq('in_stock', false)
  if (estado === 'destacados') consulta = consulta.eq('featured', true)

  const { data, count, error } = await consulta
    .order('name', { ascending: true })
    .range(desde, desde + POR_PAGINA - 1)

  const productos = data ?? []
  const total = count ?? 0
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  // Las fotos van en otra tabla: se piden solo las de esta página.
  const fotos = new Map<number, { src: string; alt: string }>()
  if (productos.length > 0) {
    const { data: imagenes } = await db
      .from('product_images')
      .select('product_id, src, alt, position')
      .in(
        'product_id',
        productos.map((p) => p.id),
      )
      .order('position')

    for (const img of imagenes ?? []) {
      if (!fotos.has(img.product_id)) {
        fotos.set(img.product_id, { src: imagenServida(img.src), alt: img.alt ?? '' })
      }
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Productos</h1>
          <p className="mt-1 text-sm text-ink-500">
            {total} {total === 1 ? 'producto' : 'productos'}
            {termino && ` que coinciden con «${termino}»`}
          </p>
        </div>

        {sesion?.puedeEscribir && (
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-sm bg-brand-500 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-600 sm:h-10 sm:w-auto"
          >
            <Plus aria-hidden="true" className="size-4" />
            Producto nuevo
          </Link>
        )}
      </div>

      {/* Formulario con GET: la búsqueda queda en la URL y se puede compartir
          o volver a ella con el historial del navegador. */}
      <form method="get" className="mt-6 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <div className="sm:min-w-56 sm:flex-1">
          <label htmlFor="q" className="mb-1.5 block text-xs font-medium text-ink-600">
            Buscar por nombre o SKU
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
            />
            <input
              id="q"
              name="q"
              defaultValue={termino}
              placeholder="amasadora, 19690…"
              className="h-11 w-full rounded-sm border border-ink-200 bg-white pr-3 pl-9 text-sm text-ink-900 focus:border-ink-950 focus:outline-none sm:h-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="estado" className="mb-1.5 block text-xs font-medium text-ink-600">
            Mostrar
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={estado}
            className="h-11 w-full rounded-sm border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-ink-950 focus:outline-none sm:h-10 sm:w-auto"
          >
            <option value="todos">Todos</option>
            <option value="sin-stock">Sin stock</option>
            <option value="destacados">Destacados</option>
          </select>
        </div>

        <button
          type="submit"
          className="h-11 rounded-sm bg-ink-950 px-4 text-sm font-medium text-white transition-colors hover:bg-ink-800 sm:h-10"
        >
          Filtrar
        </button>

        {(termino || estado !== 'todos') && (
          <Link href="/admin/productos" className="h-10 px-2 text-sm leading-10 text-ink-500 hover:text-ink-900">
            Limpiar
          </Link>
        )}
      </form>

      {error && (
        <p
          role="alert"
          className="mt-6 flex gap-2 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          No se pudieron leer los productos: {error.message}
        </p>
      )}

      {!error && productos.length === 0 && (
        <p className="mt-8 border border-dashed border-ink-300 p-10 text-center text-sm text-ink-500">
          {termino || estado !== 'todos'
            ? 'Ningún producto coincide con eso.'
            : 'Todavía no hay productos cargados.'}
        </p>
      )}

      {/*
        Dos presentaciones de la misma lista.

        En un teléfono de 390 px la tabla mide 672: se desplazaba en horizontal
        y dejaba fuera de la vista el precio, el stock y el destacado —o sea, lo
        que uno viene a mirar—. Medido en el panel desplegado, no supuesto.

        En móvil van tarjetas con todo a la vista. Desde 'sm' vuelve la tabla,
        que en una pantalla ancha se recorre mejor.
      */}
      {productos.length > 0 && (
        <>
          <ul className="mt-6 divide-y divide-ink-100 border border-ink-200 bg-white sm:hidden">
            {productos.map((p) => {
              const foto = fotos.get(p.id)
              return (
                <li key={p.id}>
                  <Link href={`/admin/productos/${p.id}`} className="flex gap-3 p-3 active:bg-ink-50">
                    <span className="flex size-14 shrink-0 items-center justify-center border border-ink-100 bg-ink-50">
                      {foto ? (
                        <Image
                          src={foto.src}
                          alt={foto.alt || titleCase(p.name)}
                          width={56}
                          height={56}
                          className="size-14 object-contain"
                        />
                      ) : (
                        <ImageOff aria-hidden="true" className="size-5 text-ink-300" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-ink-900">
                          {titleCase(p.name)}
                        </span>
                        {p.featured && (
                          <Star
                            aria-label="Destacado"
                            className="mt-0.5 size-4 shrink-0 fill-brand-500 text-brand-500"
                          />
                        )}
                      </span>

                      <span className="mt-0.5 block text-xs text-ink-500">
                        {p.sku ? `SKU ${p.sku}` : 'Sin SKU'}
                      </span>

                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink-950">
                          {p.price ? formatPrice(Number(p.price)) : 'Sin precio'}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs',
                            p.in_stock
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-ink-100 text-ink-600',
                          )}
                        >
                          {p.in_stock ? 'Disponible' : 'Sin stock'}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="mt-6 hidden overflow-x-auto border border-ink-200 bg-white sm:block">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-xs tracking-wide text-ink-500 uppercase">
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Destacado</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const foto = fotos.get(p.id)
                  return (
                    <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/productos/${p.id}`} className="flex items-center gap-3">
                          <span className="flex size-11 shrink-0 items-center justify-center border border-ink-100 bg-ink-50">
                            {foto ? (
                              <Image
                                src={foto.src}
                                alt={foto.alt || titleCase(p.name)}
                                width={44}
                                height={44}
                                className="size-11 object-contain"
                              />
                            ) : (
                              <ImageOff aria-hidden="true" className="size-4 text-ink-300" />
                            )}
                          </span>
                          <span className="font-medium text-ink-900 hover:text-brand-700">
                            {titleCase(p.name)}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-500">{p.sku || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink-900">
                        {p.price ? formatPrice(Number(p.price)) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs',
                            p.in_stock
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-ink-100 text-ink-600',
                          )}
                        >
                          {p.in_stock ? 'Disponible' : 'Sin stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.featured ? (
                          <Star aria-hidden="true" className="size-4 fill-brand-500 text-brand-500" />
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {paginas > 1 && (
        <nav aria-label="Páginas" className="mt-6 flex items-center justify-between text-sm">
          <Paginacion
            hacia={nroPagina - 1}
            activo={nroPagina > 1}
            q={termino}
            estado={estado}
            etiqueta="← Anteriores"
          />
          <span className="text-ink-500">
            Página {nroPagina} de {paginas}
          </span>
          <Paginacion
            hacia={nroPagina + 1}
            activo={nroPagina < paginas}
            q={termino}
            estado={estado}
            etiqueta="Siguientes →"
          />
        </nav>
      )}
    </div>
  )
}

function Paginacion({
  hacia,
  activo,
  q,
  estado,
  etiqueta,
}: {
  hacia: number
  activo: boolean
  q: string
  estado: string
  etiqueta: string
}) {
  if (!activo) return <span className="text-ink-300">{etiqueta}</span>

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (estado !== 'todos') params.set('estado', estado)
  if (hacia > 1) params.set('pagina', String(hacia))

  return (
    <Link
      href={`/admin/productos${params.toString() ? `?${params}` : ''}`}
      className="text-brand-700 hover:underline"
    >
      {etiqueta}
    </Link>
  )
}
