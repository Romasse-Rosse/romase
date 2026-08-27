import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BLOG_VISIBLE, articulosPublicados, fechaLarga, minutosDeLectura } from '@/content/blog'
import manifiestoBanner from '../../../public/banner/manifiesto.json'
import { getCarouselProducts } from '@/lib/catalog'
import { Breadcrumbs, Container, SectionHeading } from '@/components/ui'
import { ProductCarousel } from '@/components/product-carousel'
import { ViewItemList } from '@/components/analytics'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guías prácticas para equipar una panadería, una pastelería o una cocina profesional.',
  // Mientras el blog esté oculto no se ofrece al índice. Ver src/content/blog.ts.
  robots: BLOG_VISIBLE ? { index: true, follow: true } : { index: false, follow: false },
  alternates: { canonical: '/blog' },
}

export default async function BlogPage() {
  const entradas = articulosPublicados()
  const portadas = manifiestoBanner as Record<string, string>
  const masVendidos = await getCarouselProducts(12)

  return (
    <>
      <Container className="py-8 lg:py-12">
        <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Blog' }]} />

        {/* El título de la página va en h1: es el encabezado de nivel más alto
            y antes no había ninguno. Los títulos de cada nota cuelgan de él
            en h2. */}
        <div className="mt-4">
          <SectionHeading
            as="h1"
            eyebrow="Guías"
            title="Cómo equipar sin equivocarse"
            description="Lo que preguntan quienes están armando un local, respondido con los números que importan."
          />
        </div>

        {entradas.length === 0 ? (
          <div className="border border-dashed border-ink-300 px-6 py-16 text-center">
            <h2 className="text-lg font-medium text-ink-900">Todavía no hay artículos</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              Estamos preparando las primeras guías.
            </p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {entradas.map((articulo) => {
              const archivo = articulo.portada ? portadas[articulo.portada] : null

              return (
                <li key={articulo.slug}>
                  <article className="group flex h-full flex-col border border-ink-200 bg-white transition-all duration-200 hover:border-ink-300 hover:shadow-lift">
                    {archivo && (
                      <Link
                        href={`/blog/${articulo.slug}`}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="relative block aspect-[16/10] overflow-hidden border-b border-ink-100"
                      >
                        <Image
                          src={`/banner/${archivo}`}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                      </Link>
                    )}

                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-600 uppercase">
                        {articulo.tema}
                      </p>

                      <h2 className="mt-2.5 text-[17px] leading-snug font-semibold text-ink-950">
                        <Link
                          href={`/blog/${articulo.slug}`}
                          className="transition-colors group-hover:text-brand-600"
                        >
                          {articulo.titulo}
                        </Link>
                      </h2>

                      <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
                        {articulo.bajada}
                      </p>

                      <div className="mt-auto flex items-center gap-2 pt-5 text-xs text-ink-500">
                        <time dateTime={articulo.fecha}>{fechaLarga(articulo.fecha)}</time>
                        <span aria-hidden="true">·</span>
                        <span>{minutosDeLectura(articulo.cuerpo)} min de lectura</span>
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </Container>

      {/* Producto debajo de las notas: quien viene a leer termina viendo qué se
          vende, que es para lo que existe el blog. */}
      {masVendidos.length > 0 && (
        <section className="mt-10 border-t border-brand-100 bg-brand-50 py-12 sm:mt-16 sm:py-16">
          <Container>
            <SectionHeading
              eyebrow="Lo más vendido"
              title="Productos destacados"
              description="Los equipos que más nos consultan panaderías, cafeterías y restaurantes."
            />
            <ViewItemList
              products={masVendidos}
              listId="blog-destacados"
              listName="Destacados en el blog"
            />
            <ProductCarousel
              products={masVendidos}
              listId="blog-destacados"
              listName="Destacados en el blog"
            />
          </Container>
        </section>
      )}
    </>
  )
}
