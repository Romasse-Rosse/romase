import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, CircleDashed, Mail, Phone, Truck, Wrench } from 'lucide-react'
import {
  getAllProductSlugs,
  getCatalog,
  getCategoryPath,
  getProductBySlug,
  getRelatedProducts,
} from '@/lib/catalog'
import { formatPrice, stripHtml, titleCase, truncate } from '@/lib/format'
import { site, whatsappUrl } from '@/lib/site'
import { Badge, Breadcrumbs, Container, SectionHeading } from '@/components/ui'
import { Faqs, faqsProducto } from '@/components/faqs'
import { ViewItem, ViewItemList } from '@/components/analytics'
import { ProductGallery } from '@/components/product-gallery'
import { ProductGrid } from '@/components/product-card'
import { WhatsAppIcon } from '@/components/site-header'
import { AddToCartFull, AddToCartSticky } from '@/components/add-to-cart'
import { esBajoPedido } from '@/lib/bajo-pedido'

// Cinco minutos, no una hora: esta página muestra precios y una promoción
// puede empezar o vencer en cualquier momento. El cobro respeta la
// promoción bastante más tiempo que esto (GRACIA_COBRO), justamente para
// que una página vieja no muestre un descuento que el checkout ya no
// aplique. Ver src/lib/promociones.ts.
export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Producto no encontrado' }

  const name = titleCase(product.name)
  const summary =
    truncate(stripHtml(product.shortDescription || product.description), 150) ||
    `${name} disponible en ROMASE. Despacho a la Región de Los Lagos y al sur.`

  return {
    title: name,
    description: summary,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: {
      type: 'website',
      title: name,
      description: summary,
      images: product.images[0] ? [{ url: product.images[0].src }] : undefined,
    },
  }
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const { categories } = await getCatalog()
  const related = await getRelatedProducts(product.id, 4)

  // Para las migas se usa la categoría más específica (la de mayor profundidad).
  const own = categories.filter((c) => product.categoryIds.includes(c.id))
  const deepest = own.reduce<(typeof own)[number] | null>(
    (best, current) => (current.parentId !== null ? current : (best ?? current)),
    null,
  )
  const categoryPath = deepest ? await getCategoryPath(deepest.slug) : []

  const name = titleCase(product.name)
  const description = product.description || product.shortDescription
  // Sin precio publicado no se vende en línea: se cotiza. Ver src/lib/bajo-pedido.ts.
  const bajoPedido = esBajoPedido(product.price)

  const discount =
    product.onSale && product.regularPrice && product.regularPrice > product.price
      ? Math.round((1 - product.price / product.regularPrice) * 100)
      : 0

  // Única cotización por WhatsApp del sitio. El mensaje sale con el nombre
  // del equipo ya escrito, así quien atiende sabe de qué ficha viene.
  const cotizacion = whatsappUrl(
    `Hola ROMASE, quiero cotizar: ${name}` +
      (product.sku ? ` (SKU ${product.sku})` : '') +
      `\n${site.url}/productos/${product.slug}`,
  )

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    sku: product.sku ?? undefined,
    description: truncate(stripHtml(description), 300),
    // Absolutas: Google descarta las rutas relativas en datos
    // estructurados, así que estas fotos no le llegaban a nadie. Se resuelven
    // contra el dominio canónico, que es el mismo que declara el canonical de
    // esta página.
    image: product.images.map((i) =>
      i.src.startsWith('http') ? i.src : `${site.url}${i.src}`,
    ),
    brand: { '@type': 'Brand', name: site.name },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'CLP',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/BackOrder',
      url: `${site.url}/productos/${product.slug}`,
      seller: { '@type': 'Organization', name: site.name },
    },
  }

  return (
    <>
      <Container className="py-8 lg:py-12">
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            ...categoryPath.map((c) => ({
              label: titleCase(c.name),
              href: `/categorias/${c.slug}`,
            })),
            { label: name },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={product.images} name={name} />

          <div>
            {categoryPath.length > 0 && (
              <Link
                href={`/categorias/${categoryPath[categoryPath.length - 1].slug}`}
                className="text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase hover:underline"
              >
                {categoryPath[categoryPath.length - 1].name}
              </Link>
            )}

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-950">{name}</h1>

            {product.sku && (
              <p className="mt-2 text-sm text-ink-500">
                SKU <span className="font-medium text-ink-700">{product.sku}</span>
              </p>
            )}

            {bajoPedido ? (
              <>
                <div className="mt-6">
                  <span className="text-3xl font-semibold text-ink-950">Bajo pedido</span>
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  Este equipo se cotiza según especificación y disponibilidad. Escríbenos y te
                  pasamos el precio y el plazo de entrega.
                </p>
              </>
            ) : (
              <>
            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-semibold text-ink-950">
                {formatPrice(product.price)}
              </span>
              {discount > 0 && product.regularPrice && (
                <>
                  <span className="text-lg text-ink-400 line-through">
                    {formatPrice(product.regularPrice)}
                  </span>
                  <Badge tone="brand">-{discount}%</Badge>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-500">Precio con IVA incluido</p>
              </>
            )}

            {!bajoPedido && (
            <p className="mt-5">
              {product.inStock ? (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <Check aria-hidden="true" className="size-4" />
                  Disponible · despacho en 24 a 72 horas
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
                  <CircleDashed aria-hidden="true" className="size-4" />
                  Bajo pedido · consulta el plazo de entrega
                </span>
              )}
            </p>
            )}

            <div id="comprar" className="mt-7">
              {!bajoPedido && (
              <AddToCartFull
                product={{
                  id: product.id,
                  slug: product.slug,
                  name,
                  price: product.price,
                  image: product.images[0]?.src ?? null,
                  sku: product.sku,
                }}
                inStock={product.inStock}
              />
              )}
            </div>

            {/*
              Tres recuadros idénticos apilados se leen como una lista de cosas
              iguales, y no lo son: comprar es la acción principal, cotizar por
              WhatsApp es el canal por el que este negocio vende, y llamar es la
              salida para quien no quiere escribir.

              Así que WhatsApp va con su verde —la variante estaba en el sistema
              de botones desde el principio y nunca se había usado— y llamar
              queda como borde. Y las alturas se igualan: eran 52 px la
              principal contra 44 px estas dos.
            */}
            <div className="mt-3 grid gap-3 sm:flex sm:flex-row">
              <a
                href={cotizacion}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-[#25D366] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1eb855] sm:flex-1"
              >
                <WhatsAppIcon className="size-4.5" />
                Cotizar por WhatsApp
              </a>
              <a
                href={site.contact.phoneHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-ink-300 px-5 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
              >
                <Phone aria-hidden="true" className="size-4" />
                Llamar
              </a>
            </div>

            <a
              href={`mailto:${site.contact.email}?subject=${encodeURIComponent(`Consulta: ${name}`)}`}
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm break-all text-ink-600 transition-colors hover:text-brand-600 sm:mt-4 sm:min-h-0"
            >
              <Mail aria-hidden="true" className="size-4 shrink-0" />
              O escríbenos a {site.contact.email}
            </a>

            {/* El detalle de despacho y garantía vive en las preguntas
                frecuentes: acá van solo los dos rótulos. */}
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-200 pt-5 text-sm text-ink-700">
              <li className="flex items-center gap-2">
                <Truck aria-hidden="true" className="size-4.5 shrink-0 text-brand-600" />
                Despacho al sur · retiro en local
              </li>
              <li className="flex items-center gap-2">
                <Wrench aria-hidden="true" className="size-4.5 shrink-0 text-brand-600" />
                Garantía y repuestos
              </li>
            </ul>
          </div>
        </div>

        {/* Sin descripción no se arma la grilla: dejaría media página vacía
            al lado de las preguntas. */}
        {description ? (
          <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
            <section>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink-950">
                Descripción del producto
              </h2>
              <div className="rich-text" dangerouslySetInnerHTML={{ __html: description }} />
            </section>

            <Faqs items={faqsProducto(name, product.inStock)} title="Compra, despacho y garantía" />
          </div>
        ) : (
          <div className="mt-10 max-w-2xl sm:mt-14">
            <Faqs items={faqsProducto(name, product.inStock)} title="Compra, despacho y garantía" />
          </div>
        )}

        {own.length > 0 && (
          <section className="mt-10 sm:mt-12">
            <h2 className="mb-3 text-sm font-semibold text-ink-950">Categorías</h2>
            <ul className="flex flex-wrap gap-2">
              {own.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categorias/${category.slug}`}
                    className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm text-brand-800 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                  >
                    {titleCase(category.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>

      {related.length > 0 && (
        <section className="mt-10 border-t border-brand-100 bg-brand-50 py-10 sm:mt-16 sm:py-14">
          <Container>
            <SectionHeading title="También te puede servir" />
            <ViewItemList
              products={related}
              listId="relacionados"
              listName="También te puede servir"
            />
            <ProductGrid
              products={related}
              listId="relacionados"
              listName="También te puede servir"
            />
          </Container>
        </section>
      )}

      {/* En móvil la foto se come la pantalla y el botón queda siempre bajo
          el pliegue: esta barra lo trae de vuelta sin tener que subir. */}
      {!bajoPedido && (
      <AddToCartSticky
        ancla="comprar"
        inStock={product.inStock}
        product={{
          id: product.id,
          slug: product.slug,
          name,
          price: product.price,
          image: product.images[0]?.src ?? null,
          sku: product.sku,
        }}
      />
      )}

      <ViewItem product={product} categoria={deepest ? titleCase(deepest.name) : undefined} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
    </>
  )
}
