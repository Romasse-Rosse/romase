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
import { ProductGallery } from '@/components/product-gallery'
import { ProductGrid } from '@/components/product-card'
import { WhatsAppIcon } from '@/components/site-header'
import { AddToCartFull } from '@/components/add-to-cart'

export const revalidate = 3600

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
    `${name} disponible en ROMASE. Despacho a todo Chile.`

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
  const discount =
    product.onSale && product.regularPrice && product.regularPrice > product.price
      ? Math.round((1 - product.price / product.regularPrice) * 100)
      : 0

  const consulta = whatsappUrl(
    `Hola ROMASE, quiero consultar por: ${name}` +
      (product.sku ? ` (SKU ${product.sku})` : '') +
      `\n${site.url}/productos/${product.slug}`,
  )

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    sku: product.sku ?? undefined,
    description: truncate(stripHtml(description), 300),
    image: product.images.map((i) => i.src),
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
            { label: 'Productos', href: '/productos' },
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

            <div className="mt-7">
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
            </div>

            {/* WhatsApp sigue disponible como canal secundario: buena parte de
                las ventas todavía entra por ahí. */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <a
                href={consulta}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-sm border border-ink-300 px-5 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
              >
                <WhatsAppIcon className="size-4" />
                Consultar por WhatsApp
              </a>
              <a
                href={site.contact.phoneHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-ink-300 px-5 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
              >
                <Phone aria-hidden="true" className="size-4" />
                Llamar
              </a>
            </div>

            <a
              href={`mailto:${site.contact.email}?subject=${encodeURIComponent(`Consulta: ${name}`)}`}
              className="mt-4 inline-flex items-center gap-2 text-sm text-ink-600 transition-colors hover:text-brand-600"
            >
              <Mail aria-hidden="true" className="size-4" />
              O escríbenos a {site.contact.email}
            </a>

            <ul className="mt-8 space-y-3 rounded-xl border border-ink-200 bg-ink-50 p-5 text-sm">
              <li className="flex gap-3">
                <Truck aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-brand-600" />
                <span className="text-ink-700">
                  <strong className="font-medium text-ink-900">Despacho a todo Chile.</strong>{' '}
                  Entrega sin costo en {site.contact.city}; a regiones cotizamos el flete según
                  volumen y destino.
                </span>
              </li>
              <li className="flex gap-3">
                <Wrench aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-brand-600" />
                <span className="text-ink-700">
                  <strong className="font-medium text-ink-900">Garantía y repuestos.</strong>{' '}
                  Equipo con garantía del fabricante y respaldo de repuestos.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {description && (
          <section className="mt-14 max-w-3xl">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink-950">
              Descripción del producto
            </h2>
            <div className="rich-text" dangerouslySetInnerHTML={{ __html: description }} />
          </section>
        )}

        {own.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-3 text-sm font-semibold text-ink-950">Categorías</h2>
            <ul className="flex flex-wrap gap-2">
              {own.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categorias/${category.slug}`}
                    className="inline-flex rounded-full border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:border-brand-400 hover:text-brand-700"
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
        <section className="mt-16 bg-ink-50 py-14">
          <Container>
            <SectionHeading title="También te puede servir" />
            <ProductGrid products={related} />
          </Container>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
    </>
  )
}
