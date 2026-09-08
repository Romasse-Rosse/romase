import type { Metadata } from 'next'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { site } from '@/lib/site'
import { Breadcrumbs, Container } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    `Política de privacidad y protección de datos personales de ${site.name}, conforme a la ` +
    'Ley N°21.719 de Chile.',
  alternates: { canonical: '/politica-de-privacidad' },
}

export default async function PoliticaPrivacidadPage() {
  // Texto legal migrado tal cual desde el sitio anterior: no se reescribe.
  const contenido = await readFile(
    path.join(process.cwd(), 'src', 'content', 'politica-privacidad.html'),
    'utf8',
  )

  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs
        items={[{ label: 'Inicio', href: '/' }, { label: 'Política de privacidad' }]}
      />

      <article className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950">
          Política de privacidad
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          Protección de datos personales conforme a la Ley N°21.719 de Chile.
        </p>

        <div
          className="rich-text mt-8"
          dangerouslySetInnerHTML={{ __html: contenido }}
        />

        <p className="mt-10 border-t border-ink-200 pt-6 text-sm text-ink-600">
          Ante cualquier consulta sobre el tratamiento de tus datos, escríbenos a{' '}
          <a
            href={`mailto:${site.contact.email}`}
            className="text-brand-700 underline underline-offset-2"
          >
            {site.contact.email}
          </a>
          .
        </p>
      </article>
    </Container>
  )
}
