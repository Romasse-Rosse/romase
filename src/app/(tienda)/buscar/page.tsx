import type { Metadata } from 'next'
import Link from 'next/link'
import { PackageSearch } from 'lucide-react'
import { getCategoryTree, queryProducts } from '@/lib/catalog'
import { titleCase } from '@/lib/format'
import { Breadcrumbs, Container } from '@/components/ui'
import { ProductGrid } from '@/components/product-card'
import { ViewItemList } from '@/components/analytics'

export const metadata: Metadata = {
  title: 'Buscar productos',
  alternates: { canonical: '/buscar' },
  // Los resultados de búsqueda no aportan nada al índice.
  robots: { index: false, follow: true },
}

type SearchParams = Promise<Record<string, string | undefined>>

/**
 * Resultados de búsqueda.
 *
 * Es la única vista que lista productos de varias categorías a la vez, y solo
 * cuando alguien busca algo. No hay una página de «todo el catálogo»: la
 * navegación es por categoría.
 */
export default async function BuscarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const termino = params.q?.trim() ?? ''

  const [categories, resultados] = await Promise.all([
    getCategoryTree(),
    termino
      ? queryProducts({ search: termino, perPage: 48 })
      : Promise.resolve({ items: [], total: 0 }),
  ])

  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Búsqueda' }]} />

      <header className="mt-4 mb-10">
        <h1 className="text-3xl font-medium tracking-tight text-ink-950">
          {termino ? `Resultados para «${termino}»` : 'Buscar productos'}
        </h1>
        {termino && (
          <p className="mt-2 text-ink-600">
            {resultados.total === 0
              ? 'Sin resultados'
              : `${resultados.total} ${resultados.total === 1 ? 'producto' : 'productos'}`}
          </p>
        )}
      </header>

      {resultados.items.length > 0 ? (
        <>
          <ViewItemList
            products={resultados.items}
            listId="busqueda"
            listName={`Búsqueda: ${termino}`}
          />
          <ProductGrid
            products={resultados.items}
            listId="busqueda"
            listName={`Búsqueda: ${termino}`}
          />
        </>
      ) : (
        <div className="border border-dashed border-ink-300 px-6 py-16 text-center">
          <PackageSearch aria-hidden="true" className="mx-auto size-10 text-ink-300" />
          <h2 className="mt-4 text-lg font-medium text-ink-900">
            {termino ? 'No encontramos productos con ese término' : 'Escribe qué estás buscando'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
            {termino
              ? 'Prueba con el nombre técnico del equipo —amasadora, vitrina, balanza— o entra por una categoría.'
              : 'Usa el buscador del encabezado, o entra por una de las categorías.'}
          </p>

          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="inline-flex rounded-sm border border-brand-200 bg-brand-50 px-3.5 py-2 text-sm text-brand-800 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                >
                  {titleCase(category.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  )
}
