import Link from 'next/link'
import { AlertCircle, ArrowRight, ChevronRight, EyeOff, Plus } from 'lucide-react'
import { clienteDelPanel, sesionDelPanel } from '@/lib/panel'
import { titleCase } from '@/lib/format'
import { arbolDelPanel, type NodoDelPanel } from '@/lib/categorias-panel'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Categorías' }

export default async function CategoriasPanel() {
  const sesion = await sesionDelPanel()
  const db = await clienteDelPanel()

  const [categorias, vinculos, productos] = await Promise.all([
    db.from('categories').select('id, name, slug, parent_id').order('name'),
    db.from('product_categories').select('product_id, category_id'),
    db.from('products').select('id', { count: 'exact', head: true }),
  ])

  /**
   * Productos que no están en ninguna categoría.
   *
   * Tienen ficha y se pueden comprar, pero no aparecen en ningún listado: ni en
   * el menú, ni en la portada, ni en una categoría. Es una lista que conviene
   * que esté vacía, y hasta ahora no había forma de saber que no lo estaba.
   */
  const conCategoria = new Set((vinculos.data ?? []).map((v) => v.product_id as number))
  const sinCategoria = Math.max(0, (productos.count ?? 0) - conCategoria.size)

  const faltaTabla = /does not exist|schema cache/i.test(categorias.error?.message ?? '')

  const conteo = new Map<number, number>()
  for (const v of vinculos.data ?? []) {
    const id = v.category_id as number
    conteo.set(id, (conteo.get(id) ?? 0) + 1)
  }

  const arbol = arbolDelPanel(
    (categorias.data ?? []).map((c) => ({
      id: c.id as number,
      nombre: c.name as string,
      slug: c.slug as string,
      padreId: (c.parent_id as number | null) ?? null,
    })),
    conteo,
  )

  const ocultas = contarOcultas(arbol)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Categorías</h1>
          <p className="mt-1 text-sm text-ink-500">
            Cómo se organiza el catálogo. Las principales son las del menú del sitio.
          </p>
        </div>

        {sesion?.puedeEscribir && (
          <Link
            href="/admin/categorias/nueva"
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-sm bg-brand-500 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-600 sm:h-10 sm:w-auto"
          >
            <Plus aria-hidden="true" className="size-4" />
            Categoría nueva
          </Link>
        )}
      </div>

      {categorias.error && (
        <p
          role="alert"
          className="mt-6 flex gap-2 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {faltaTabla
            ? 'No se encontró la tabla de categorías en Supabase.'
            : `No se pudieron leer las categorías: ${categorias.error.message}`}
        </p>
      )}

      {sinCategoria > 0 && sesion?.puedeEscribir && (
        <Link
          href="/admin/categorias/sin-categoria"
          className="mt-6 flex items-start gap-2 border border-amber-300 bg-amber-50 p-4 text-sm text-ink-700 transition-colors hover:border-amber-500"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span className="flex-1">
            <strong>
              {sinCategoria} {sinCategoria === 1 ? 'producto no está' : 'productos no están'} en
              ninguna categoría
            </strong>
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-600">
              No aparecen en ningún listado de la tienda: solo se llega a ellos por el buscador o
              por su dirección.
            </span>
          </span>
          <ArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-400" />
        </Link>
      )}

      {/*
        El panel muestra también las vacías; la tienda no.

        El árbol del catálogo filtra las categorías sin productos, así que una
        recién creada no aparece en el menú hasta que tenga al menos uno. Eso
        está bien —crear una categoría no ensucia el sitio— pero sin decirlo
        parece que no se guardó.
      */}
      {ocultas > 0 && (
        <p className="mt-6 flex gap-2 border border-ink-200 bg-white p-4 text-sm text-ink-600">
          <EyeOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-400" />
          <span>
            {ocultas === 1
              ? 'Hay 1 categoría que todavía no se ve en la tienda'
              : `Hay ${ocultas} categorías que todavía no se ven en la tienda`}{' '}
            porque no tienen productos. Aparecen en cuanto les agregues uno.
          </span>
        </p>
      )}

      {arbol.length > 0 && (
        <ul className="mt-6 divide-y divide-ink-100 border border-ink-200 bg-white">
          {arbol.map((raiz) => (
            <li key={raiz.id}>
              <Fila nodo={raiz} />
              {raiz.hijas.length > 0 && (
                <ul className="border-t border-ink-100 bg-ink-50/50">
                  {raiz.hijas.map((hija) => (
                    <li key={hija.id} className="border-b border-ink-100 last:border-0">
                      <Fila nodo={hija} anidada />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {!categorias.error && arbol.length === 0 && (
        <p className="mt-8 border border-dashed border-ink-300 p-10 text-center text-sm text-ink-500">
          Todavía no hay categorías.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        El orden del menú lo decide la cantidad de productos de cada categoría, de mayor a menor.
        No se puede fijar a mano.
      </p>
    </div>
  )
}

function Fila({ nodo, anidada = false }: { nodo: NodoDelPanel; anidada?: boolean }) {
  return (
    <Link
      href={`/admin/categorias/${nodo.id}`}
      className={
        'flex items-center gap-3 p-4 transition-colors hover:bg-ink-50 ' + (anidada ? 'pl-10' : '')
      }
    >
      {anidada && <ChevronRight aria-hidden="true" className="-ml-5 size-4 shrink-0 text-ink-300" />}

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink-950">{titleCase(nodo.nombre)}</span>
        <span className="mt-0.5 block text-xs text-ink-500">
          /categorias/{nodo.slug}
          {!anidada && nodo.hijas.length > 0 && (
            <> · {nodo.hijas.length} {nodo.hijas.length === 1 ? 'subcategoría' : 'subcategorías'}</>
          )}
        </span>
      </span>

      {!nodo.visibleEnLaTienda && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] text-ink-600">
          <EyeOff aria-hidden="true" className="size-3" />
          sin productos
        </span>
      )}

      <span className="shrink-0 text-right text-xs text-ink-500">
        {nodo.productosEnLaRama}
        <span className="hidden sm:inline">
          {' '}
          {nodo.productosEnLaRama === 1 ? 'producto' : 'productos'}
        </span>
      </span>
    </Link>
  )
}

function contarOcultas(nodos: NodoDelPanel[]): number {
  let total = 0
  for (const n of nodos) {
    if (!n.visibleEnLaTienda) total++
    total += contarOcultas(n.hijas)
  }
  return total
}
