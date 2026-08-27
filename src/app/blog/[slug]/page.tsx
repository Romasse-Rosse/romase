import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import {
  BLOG_VISIBLE,
  articuloPorSlug,
  articulos,
  articulosPublicados,
  fechaLarga,
  minutosDeLectura,
} from '@/content/blog'
import manifiestoBanner from '../../../../public/banner/manifiesto.json'
import { getCarouselProducts, getProductBySlug } from '@/lib/catalog'
import { site } from '@/lib/site'
import { titleCase } from '@/lib/format'
import { Breadcrumbs, Container, SectionHeading } from '@/components/ui'
import { ProductCarousel } from '@/components/product-carousel'
import { ViewItemList } from '@/components/analytics'

// Los destacados salen del catálogo: se refrescan con el resto del sitio.
export const revalidate = 3600

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return articulos.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const articulo = articuloPorSlug(slug)
  if (!articulo) return { title: 'Artículo no encontrado' }

  return {
    title: { absolute: articulo.metaTitulo },
    description: articulo.metaDescripcion,
    // Mientras el blog esté oculto no se ofrece al índice. Ver src/content/blog.ts.
    robots: BLOG_VISIBLE ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { canonical: `/blog/${articulo.slug}` },
    openGraph: {
      type: 'article',
      title: articulo.metaTitulo,
      description: articulo.metaDescripcion,
      publishedTime: articulo.fecha,
    },
  }
}

export default async function ArticuloPage({ params }: { params: Params }) {
  const { slug } = await params
  const articulo = articuloPorSlug(slug)
  if (!articulo) notFound()

  const portadas = manifiestoBanner as Record<string, string>
  const archivo = articulo.portada ? portadas[articulo.portada] : null
  const minutos = minutosDeLectura(articulo.cuerpo)
  const otros = articulosPublicados().filter((a) => a.slug !== articulo.slug)
  const masVendidos = await getCarouselProducts(12)

  // Segunda imagen de la nota: la foto de un producto del catálogo. Cumple el
  // mínimo de dos imágenes y da un enlace interno que no se siente pegado.
  const enContenido = articulo.imagenProducto
    ? await getProductBySlug(articulo.imagenProducto.slug)
    : null

  // El último párrafo del cuerpo es el CTA. Se separa para que la foto del
  // producto entre antes y el enlace quede cerrando la nota, que es su lugar.
  const corte = articulo.cuerpo.lastIndexOf('<p><a href=')
  const cuerpo = corte > 0 ? articulo.cuerpo.slice(0, corte) : articulo.cuerpo
  const cierre = corte > 0 ? articulo.cuerpo.slice(corte) : ''

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articulo.titulo,
    description: articulo.metaDescripcion,
    datePublished: articulo.fecha,
    author: { '@type': 'Organization', name: site.name },
    publisher: { '@type': 'Organization', name: site.name },
    mainEntityOfPage: `${site.url}/blog/${articulo.slug}`,
  }

  return (
    <>
      <Container className="py-8 lg:py-12">
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: articulo.titulo },
          ]}
        />

        {/* Una sola columna, angosta: es texto para leer, no para escanear. */}
        <article className="mx-auto mt-6 max-w-2xl">
          <header>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-600 uppercase">
              {articulo.tema}
            </p>

            <h1 className="mt-3 text-[30px] leading-[1.14] font-semibold tracking-tight text-ink-950 sm:text-[38px]">
              {articulo.titulo}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-ink-600">{articulo.bajada}</p>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-4 text-xs text-ink-500">
              <span>{articulo.autor}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={articulo.fecha}>{fechaLarga(articulo.fecha)}</time>
              <span aria-hidden="true">·</span>
              <span>{minutos} min de lectura</span>
            </div>
          </header>

          {archivo && (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden border border-ink-200">
              <Image
                src={`/banner/${archivo}`}
                alt={articulo.portadaAlt}
                fill
                priority
                sizes="(min-width: 768px) 42rem, 92vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="rich-text mt-9" dangerouslySetInnerHTML={{ __html: cuerpo }} />

          {enContenido && articulo.imagenProducto && enContenido.images[0] && (
            <figure className="mt-10 border border-ink-200 bg-white">
              <Link
                href={`/productos/${enContenido.slug}`}
                className="relative block aspect-[4/3] overflow-hidden"
              >
                <Image
                  src={enContenido.images[0].src}
                  alt={articulo.imagenProducto.alt}
                  fill
                  sizes="(min-width: 768px) 42rem, 92vw"
                  className="object-contain p-8"
                />
              </Link>
              <figcaption className="border-t border-ink-100 px-5 py-3.5 text-sm text-ink-600">
                {articulo.imagenProducto.pie}{' '}
                <Link href={`/productos/${enContenido.slug}`} className="text-brand-700 underline">
                  {titleCase(enContenido.name)}
                </Link>
              </figcaption>
            </figure>
          )}

          {/* El CTA cierra la nota, después de la foto. */}
          {cierre && (
            <div className="rich-text mt-10" dangerouslySetInnerHTML={{ __html: cierre }} />
          )}
        </article>
      </Container>

      {/* Producto al cerrar el artículo: quien terminó de leer sobre cómo
          elegir un equipo es quien está por comprarlo. */}
      {masVendidos.length > 0 && (
        <section className="mt-10 border-t border-brand-100 bg-brand-50 py-12 sm:mt-14 sm:py-16">
          <Container>
            <SectionHeading
              eyebrow="Lo más vendido"
              title="Productos destacados"
              description="Los equipos que más nos consultan panaderías, cafeterías y restaurantes."
            />
            <ViewItemList
              products={masVendidos}
              listId="blog-articulo"
              listName={`Destacados en: ${articulo.titulo}`}
            />
            <ProductCarousel
              products={masVendidos}
              listId="blog-articulo"
              listName={`Destacados en: ${articulo.titulo}`}
            />
          </Container>
        </section>
      )}

      {otros.length > 0 && (
        <section className="border-t border-ink-200 py-12 sm:py-14">
          <Container>
            <h2 className="mb-6 text-sm font-semibold tracking-[0.02em] text-ink-600 uppercase">
              Seguir leyendo
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {otros.map((otro) => (
                <li key={otro.slug}>
                  <Link
                    href={`/blog/${otro.slug}`}
                    className="group flex h-full flex-col justify-between gap-4 border border-ink-200 bg-white p-5 transition-colors hover:border-brand-500"
                  >
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-600 uppercase">
                        {otro.tema}
                      </p>
                      <p className="mt-2 leading-snug font-semibold text-ink-950">
                        {otro.titulo}
                      </p>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  )
}
