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
import { site } from '@/lib/site'
import { truncate } from '@/lib/format'
import { Breadcrumbs, ButtonLink, Container } from '@/components/ui'

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return articulos.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const articulo = articuloPorSlug(slug)
  if (!articulo) return { title: 'Artículo no encontrado' }

  return {
    title: articulo.titulo,
    description: truncate(articulo.bajada, 155),
    // Mientras el blog esté oculto no se ofrece al índice. Ver src/content/blog.ts.
    robots: BLOG_VISIBLE ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { canonical: `/blog/${articulo.slug}` },
    openGraph: {
      type: 'article',
      title: articulo.titulo,
      description: truncate(articulo.bajada, 155),
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

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articulo.titulo,
    description: articulo.bajada,
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

          <div
            className="rich-text mt-9"
            dangerouslySetInnerHTML={{ __html: articulo.cuerpo }}
          />

          <div className="mt-12 border border-brand-100 bg-brand-50 p-6">
            <h2 className="text-base font-semibold text-ink-950">
              ¿Necesitas ayuda para elegir?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Cuéntanos tu volumen de producción y el espacio que tienes, y te decimos qué
              equipo corresponde.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href="/contacto" size="sm">
                Escribirnos
              </ButtonLink>
              <ButtonLink href="/#categorias" size="sm" variant="outline">
                Ver el catálogo por categoría
              </ButtonLink>
            </div>
          </div>
        </article>
      </Container>

      {otros.length > 0 && (
        <section className="mt-10 border-t border-ink-200 py-12 sm:mt-16 sm:py-14">
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
