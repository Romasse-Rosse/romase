import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PackageSearch } from 'lucide-react'
import { getCategoryBySlug, getCategoryTree, queryProducts, type SortKey } from '@/lib/catalog'
import { titleCase } from '@/lib/format'
import { Breadcrumbs, ButtonLink, Container } from '@/components/ui'
import { ProductGrid } from '@/components/product-card'
import { CatalogFilters, SortSelect } from '@/components/catalog-controls'
import { Pagination } from '@/components/pagination'

export const revalidate = 3600

const PER_PAGE = 24
const SORTS: SortKey[] = ['relevancia', 'precio-asc', 'precio-desc', 'nombre', 'novedades']

type SearchParams = Promise<Record<string, string | undefined>>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const params = await searchParams

  if (params.q) {
    return {
      title: `Búsqueda: ${params.q}`,
      // Las páginas de resultados no aportan nada al índice de Google.
      robots: { index: false, follow: true },
    }
  }

  if (params.categoria) {
    const category = await getCategoryBySlug(params.categoria)
    if (category) {
      return {
        title: `${titleCase(category.name)} · Catálogo`,
        description: `Equipamiento de ${category.name.toLowerCase()} disponible en ROMASE. Despacho a todo Chile.`,
        alternates: { canonical: `/categorias/${category.slug}` },
      }
    }
  }

  return {
    title: 'Catálogo completo de maquinaria y equipamiento',
    description:
      'Explora todo el catálogo ROMASE: maquinaria para panadería y pastelería, línea de frío y ' +
      'calor, vitrinas, acero inoxidable, equipos complementarios y repuestos.',
    alternates: { canonical: '/productos' },
  }
}

export default async function ProductosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  const search = params.q?.trim() || undefined
  const categorySlug = params.categoria || undefined
  const sort = (SORTS.includes(params.orden as SortKey) ? params.orden : 'relevancia') as SortKey
  const page = Math.max(1, Number(params.pagina) || 1)
  const onlyInStock = params.stock === '1'
  const minPrice = params.min ? Number(params.min) : undefined
  const maxPrice = params.max ? Number(params.max) : undefined

  const [categories, results, activeCategory] = await Promise.all([
    getCategoryTree(),
    queryProducts({
      search,
      categorySlug,
      sort,
      page,
      perPage: PER_PAGE,
      onlyInStock,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    }),
    categorySlug ? getCategoryBySlug(categorySlug) : Promise.resolve(null),
  ])

  const title = search
    ? `Resultados para «${search}»`
    : activeCategory
      ? titleCase(activeCategory.name)
      : 'Todo el catálogo'

  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Productos', href: activeCategory || search ? '/productos' : undefined },
          ...(activeCategory ? [{ label: titleCase(activeCategory.name) }] : []),
          ...(search ? [{ label: `«${search}»` }] : []),
        ]}
      />

      <div className="mt-4 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950">{title}</h1>
        <p className="mt-2 text-ink-600">
          {results.total === 0
            ? 'Sin resultados'
            : `${results.total} ${results.total === 1 ? 'producto' : 'productos'}`}
          {results.totalPages > 1 && ` · página ${results.page} de ${results.totalPages}`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <Suspense fallback={<div className="hidden lg:block" />}>
          <CatalogFilters
            categories={categories}
            activeCategory={categorySlug ?? null}
            onlyInStock={onlyInStock}
            priceRange={results.priceRange}
            activeMin={Number.isFinite(minPrice) ? minPrice! : null}
            activeMax={Number.isFinite(maxPrice) ? maxPrice! : null}
          />
        </Suspense>

        <div className="min-w-0">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Suspense fallback={null}>
              <div className="lg:hidden">
                <CatalogFilters
                  categories={categories}
                  activeCategory={categorySlug ?? null}
                  onlyInStock={onlyInStock}
                  priceRange={results.priceRange}
                  activeMin={Number.isFinite(minPrice) ? minPrice! : null}
                  activeMax={Number.isFinite(maxPrice) ? maxPrice! : null}
                />
              </div>
            </Suspense>
            <div className="ml-auto">
              <Suspense fallback={null}>
                <SortSelect value={sort} />
              </Suspense>
            </div>
          </div>

          {results.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-300 px-6 py-16 text-center">
              <PackageSearch aria-hidden="true" className="mx-auto size-10 text-ink-300" />
              <h2 className="mt-4 text-lg font-medium text-ink-900">
                No encontramos productos con esos filtros
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
                Puede que lo tengamos sin publicar. Escríbenos y te confirmamos disponibilidad y
                precio el mismo día.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/productos" variant="outline">
                  Ver todo el catálogo
                </ButtonLink>
                <ButtonLink href="/contacto">Consultar disponibilidad</ButtonLink>
              </div>
            </div>
          ) : (
            <>
              <ProductGrid products={results.items} />
              <Pagination
                page={results.page}
                totalPages={results.totalPages}
                basePath="/productos"
                searchParams={params}
              />
            </>
          )}
        </div>
      </div>
    </Container>
  )
}
