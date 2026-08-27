import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  BLOG_VISIBLE,
  articulosPublicados,
  fechaLarga,
  minutosDeLectura,
} from '@/content/blog'
import manifiestoBanner from '../../../public/banner/manifiesto.json'
import { Breadcrumbs, Container, SectionHeading } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guías prácticas para equipar una panadería, una pastelería o una cocina profesional.',
  // Mientras el blog esté oculto no se ofrece al índice. Ver src/content/blog.ts.
  robots: BLOG_VISIBLE ? { index: true, follow: true } : { index: false, follow: false },
  alternates: { canonical: '/blog' },
}

export default function BlogPage() {
  const entradas = articulosPublicados()
  const portadas = manifiestoBanner as Record<string, string>

  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Blog' }]} />

      <div className="mt-4">
        <SectionHeading
          eyebrow="Guías"
          title="Cómo equipar sin equivocarse"
          description="Lo que preguntan quienes están armando un local, respondido con los números que importan."
        />
      </div>

      {entradas.length === 0 ? (
        <div className="border border-dashed border-ink-300 px-6 py-16 text-center">
          <h2 className="text-lg font-medium text-ink-900">Todavía no hay artículos</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
            Estamos preparando las primeras guías. Mientras tanto, cada categoría del catálogo
            tiene sus propias recomendaciones para elegir.
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

      <div className="mt-14 border-t border-ink-200 pt-8">
        <p className="text-ink-600">
          ¿Buscas algo puntual?{' '}
          <Link href="/#categorias" className="text-brand-700 underline">
            Entra por categoría
          </Link>{' '}
          o{' '}
          <Link href="/contacto" className="text-brand-700 underline">
            escríbenos
          </Link>
          : cada categoría tiene sus propias recomendaciones para elegir.
        </p>
      </div>

      {!BLOG_VISIBLE && (
        <p className="mt-10 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong className="font-semibold">Sección en preparación.</strong> El blog está
          construido pero todavía no publicado: no se enlaza desde el sitio ni se ofrece a
          Google. Los artículos son de ejemplo, para poder revisar el diseño. Cómo publicarlo
          está anotado en <code className="font-mono">src/content/blog.ts</code>.
        </p>
      )}
    </Container>
  )
}
