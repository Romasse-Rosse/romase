import { getCategoryTree } from '@/lib/catalog'
import { titleCase } from '@/lib/format'
import { ButtonLink, Container } from '@/components/ui'
import { SearchBox } from '@/components/search-box'
import Link from 'next/link'

export default async function NotFound() {
  const categories = await getCategoryTree()

  return (
    <Container className="py-20 text-center lg:py-28">
      <p className="text-sm font-semibold tracking-[0.14em] text-brand-600 uppercase">Error 404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
        No encontramos esta página
      </h1>
      <p className="mx-auto mt-4 max-w-md text-ink-600">
        Puede que el enlace haya cambiado con la renovación del sitio. Busca el producto acá abajo o
        entra por una categoría.
      </p>

      <div className="mx-auto mt-8 max-w-lg">
        <SearchBox placeholder="Buscar un producto…" />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/contacto" variant="outline">
          Contactarnos
        </ButtonLink>
      </div>

      <nav aria-label="Categorías" className="mx-auto mt-12 max-w-3xl">
        <h2 className="mb-4 text-sm font-semibold text-ink-950">Categorías</h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/categorias/${category.slug}`}
                className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm text-brand-800 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
              >
                {titleCase(category.name)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  )
}
