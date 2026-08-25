import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import {
  getAllCategorySlugs,
  getCategoryBySlug,
  getCategoryPath,
  getCategoryTree,
  queryProducts,
} from '@/lib/catalog'
import { dividirContenido, getCategoryContent } from '@/content/categorias'
import { site, whatsappUrl } from '@/lib/site'
import { stripHtml, titleCase, truncate } from '@/lib/format'
import { Breadcrumbs, ButtonLink, Container } from '@/components/ui'
import { ProductGrid } from '@/components/product-card'
import { Faqs } from '@/components/faqs'
import { Accordion } from '@/components/accordion'

export const revalidate = 3600

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Categoría no encontrada' }

  const path = await getCategoryPath(slug)
  const parentSlug = path.length > 1 ? path[path.length - 2].slug : null
  const content = getCategoryContent(slug, parentSlug)

  const name = titleCase(category.name)
  const description =
    content?.intro ||
    stripHtml(category.description) ||
    `${name} para panaderías, pastelerías y cocinas profesionales. Despacho a todo Chile desde ${site.contact.city}.`

  return {
    title: `${name} · Equipamiento profesional`,
    description: truncate(description, 155),
    alternates: { canonical: `/categorias/${slug}` },
    openGraph: { type: 'website', title: `${name} · ${site.name}`, description: truncate(description, 155) },
  }
}

export default async function CategoriaPage({ params }: { params: Params }) {
  const { slug } = await params

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  // La página se mantiene estática a propósito: es el activo SEO de la
  // categoría. Por eso lista el catálogo completo en vez de paginar, así
  // todos los productos quedan enlazados desde una sola URL indexable.
  // El orden y los filtros viven en /productos?categoria=slug.
  const [path, tree, results] = await Promise.all([
    getCategoryPath(slug),
    getCategoryTree(),
    queryProducts({ categorySlug: slug, sort: 'relevancia', perPage: Number.MAX_SAFE_INTEGER }),
  ])

  const parentSlug = path.length > 1 ? path[path.length - 2].slug : null
  const content = getCategoryContent(slug, parentSlug)

  // Subcategorías directas, buscando el nodo en el árbol.
  const findNode = (nodes: typeof tree): (typeof tree)[number] | null => {
    for (const node of nodes) {
      if (node.slug === slug) return node
      const found = findNode(node.children)
      if (found) return found
    }
    return null
  }
  const node = findNode(tree)
  const subcategories = node?.children ?? []

  const name = titleCase(category.name)

  // El contenido largo se parte en bajada + secciones desplegables.
  const { lead, secciones } = content
    ? dividirContenido(content.seoHtml)
    : { lead: '', secciones: [] as { titulo: string; html: string }[] }

  return (
    <>
      <Container className="py-8 lg:py-12">
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Productos', href: '/productos' },
            ...path.slice(0, -1).map((c) => ({
              label: titleCase(c.name),
              href: `/categorias/${c.slug}`,
            })),
            { label: name },
          ]}
        />

        <header className="mt-4 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">{name}</h1>
          {content?.intro && <p className="mt-4 text-lg text-ink-600">{content.intro}</p>}
          <p className="mt-3 text-sm text-ink-500">
            {results.total} {results.total === 1 ? 'producto disponible' : 'productos disponibles'}
          </p>
        </header>

        {subcategories.length > 0 && (
          <nav aria-label="Subcategorías" className="mt-7">
            <ul className="flex flex-wrap gap-2">
              {subcategories.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/categorias/${child.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm text-ink-700 hover:border-brand-400 hover:text-brand-700"
                  >
                    {titleCase(child.name)}
                    <span className="text-xs text-ink-400">{child.productCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mt-8 mb-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-5">
          <Link
            href={`/productos?categoria=${slug}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 hover:border-ink-400"
          >
            <SlidersHorizontal className="size-4" />
            Filtrar por precio y stock
          </Link>
          <p className="text-sm text-ink-500">Mostrando el catálogo completo de la categoría</p>
        </div>

        {results.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-300 px-6 py-14 text-center">
            <h2 className="text-lg font-medium text-ink-900">
              Todavía no hay productos publicados en esta categoría
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              Igual podemos conseguirlo. Cuéntanos qué necesitas y te cotizamos.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/productos" variant="outline">
                Ver todo el catálogo
              </ButtonLink>
              <ButtonLink href="/contacto">Consultar</ButtonLink>
            </div>
          </div>
        ) : (
          <ProductGrid products={results.items} />
        )}
      </Container>

      {/* Contenido editorial: es lo que le da a la categoría posibilidad
          real de posicionar, más allá del listado de productos. */}
      {content && (
        <section className="mt-16 border-t border-ink-200 bg-ink-50 py-14">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
              {/* El texto largo va en desplegables: la página queda liviana y
                  el contenido sigue en el HTML para que Google lo lea. */}
              <div>
                <h2 className="mb-5 text-[26px] leading-[1.15] font-medium text-ink-950 sm:text-[32px]">
                  {name}: qué mirar antes de comprar
                </h2>

                {lead && (
                  <div
                    className="rich-text mb-8 max-w-3xl"
                    dangerouslySetInnerHTML={{ __html: lead }}
                  />
                )}

                <Accordion items={secciones.map((s) => ({ titulo: s.titulo, html: s.html }))} />
              </div>

              <div className="space-y-6">
                <Faqs items={content.faqs} title={`Preguntas frecuentes sobre ${name.toLowerCase()}`} />

                <div className="rounded-xl border border-ink-200 bg-white p-6">
                  <h2 className="text-base font-semibold text-ink-950">
                    ¿Necesitas ayuda para elegir?
                  </h2>
                  <p className="mt-2 text-sm text-ink-600">
                    Cuéntanos tu volumen de producción y el espacio disponible, y te recomendamos el
                    equipo que corresponde.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <a
                      href={whatsappUrl(`Hola ROMASE, quiero asesoría sobre ${name}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-[#25D366] px-5 text-sm font-medium text-white hover:bg-[#1eb855]"
                    >
                      Consultar por WhatsApp
                    </a>
                    <ButtonLink href="/contacto" variant="outline">
                      Enviar un mensaje
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
