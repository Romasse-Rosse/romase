import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getAllCategorySlugs,
  getCategoryBySlug,
  getCategoryPath,
  getCategoryTree,
  queryProducts,
} from '@/lib/catalog'
import { dividirContenido, getCategoryContent, recortarLead } from '@/content/categorias'
import { site } from '@/lib/site'
import { stripHtml, titleCase, truncate } from '@/lib/format'
import { Breadcrumbs, ButtonLink, Container } from '@/components/ui'
import { ProductGrid } from '@/components/product-card'
import { ViewItemList } from '@/components/analytics'
import { Faqs } from '@/components/faqs'
import { Accordion } from '@/components/accordion'

// Cinco minutos, no una hora: esta página muestra precios y una promoción
// puede empezar o vencer en cualquier momento. El cobro respeta la
// promoción bastante más tiempo que esto (GRACIA_COBRO), justamente para
// que una página vieja no muestre un descuento que el checkout ya no
// aplique. Ver src/lib/promociones.ts.
export const revalidate = 300

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
    `${name} para panaderías, pastelerías y cocinas profesionales. Despacho desde ${site.contact.city} a la Región de Los Lagos y al sur.`

  return {
    title: `${name} · Equipamiento profesional`,
    description: truncate(description, 155),
    alternates: { canonical: `/categorias/${slug}` },
    openGraph: { type: 'website', title: `${name} · ${site.name}`, description: truncate(description, 155) },
  }
}

export default async function CategoriaPage({ params }: { params: Params }) {
  const { slug } = await params

  // Categoría creada durante pruebas de catálogo. No tiene productos ni una
  // intención de búsqueda válida, por lo que no debe responder como página
  // indexable aunque todavía exista en la base de datos.
  if (slug === 'test-categoria') notFound()

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  // La página se mantiene estática a propósito: es el activo SEO de la
  // categoría. Por eso lista el catálogo completo en vez de paginar, así
  // todos los productos quedan enlazados desde una sola URL indexable.
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

  // Solo el primer párrafo queda como texto libre: el resto baja a los
  // desplegables junto con las demás secciones.
  const { visible: bajada, resto } = recortarLead(lead)
  const desplegables = resto
    ? [{ titulo: `Qué incluye ${name.toLowerCase()}`, html: resto }, ...secciones]
    : secciones

  return (
    <>
      <Container className="py-8 lg:py-12">
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
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
        </header>

        {subcategories.length > 0 && (
          <nav aria-label="Subcategorías" className="mt-7">
            <ul className="flex flex-wrap gap-2">
              {subcategories.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/categorias/${child.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm text-brand-800 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                  >
                    {titleCase(child.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mt-8 mb-8 border-t border-ink-200" />

        {results.items.length === 0 ? (
          <div className="border border-dashed border-ink-300 px-6 py-14 text-center">
            <h2 className="text-lg font-medium text-ink-900">
              Todavía no hay productos publicados en esta categoría
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              Igual podemos conseguirlo. Cuéntanos qué necesitas y te cotizamos.
            </p>
            <div className="mt-6 flex justify-center">
              <ButtonLink href="/contacto">Consultar por este equipo</ButtonLink>
            </div>
          </div>
        ) : (
          <>
            <ViewItemList products={results.items} listId={slug} listName={name} />
            <ProductGrid products={results.items} listId={slug} listName={name} />
          </>
        )}
      </Container>

      {/* Contenido editorial: es lo que le da a la categoría posibilidad
          real de posicionar, más allá del listado de productos. */}
      {content && (
        <section className="mt-10 border-t border-brand-100 bg-brand-50 py-10 sm:mt-16 sm:py-14">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
              {/* El texto largo va en desplegables: la página queda liviana y
                  el contenido sigue en el HTML para que Google lo lea. */}
              <div>
                <h2 className="mb-5 text-[26px] leading-[1.15] font-medium text-ink-950 sm:text-[32px]">
                  {name}: qué mirar antes de comprar
                </h2>

                {bajada && (
                  <div
                    className="rich-text mb-8 max-w-3xl"
                    dangerouslySetInnerHTML={{ __html: bajada }}
                  />
                )}

                <Accordion items={desplegables} />
              </div>

              <div className="space-y-6">
                <Faqs items={content.faqs} title={`Preguntas frecuentes sobre ${name.toLowerCase()}`} />

                <div className="border border-ink-200 bg-white p-6">
                  <h2 className="text-base font-semibold text-ink-950">
                    ¿Necesitas ayuda para elegir?
                  </h2>
                  <p className="mt-2 text-sm text-ink-600">
                    Cuéntanos tu volumen de producción y el espacio disponible, y te recomendamos el
                    equipo que corresponde.
                  </p>
                  <div className="mt-4">
                    <ButtonLink href="/contacto" variant="outline" className="w-full">
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
