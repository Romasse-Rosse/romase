import { Star } from 'lucide-react'
import { Container, SectionHeading } from '@/components/ui'
import { RESENAS, PERFIL_DE_GOOGLE } from '@/content/resenas'

/**
 * Lo que dicen los clientes, transcrito desde Google.
 *
 * Son reseñas copiadas a mano, no un widget. La diferencia importa: un widget
 * de terceros carga después de la página, mueve el contenido cuando aparece y
 * deja el diseño en manos de otro. Acá el texto llega con el HTML, se ve
 * instantáneo y combina con el resto del sitio.
 *
 * El costo es que hay que actualizarlas a mano. Para un negocio que recibe
 * unas pocas reseñas al año es un cambio de diez minutos cada tanto.
 *
 * El enlace al perfil de Google no es decorativo: estas reseñas están
 * transcritas por nosotros, así que quien quiera verificarlas tiene que poder
 * ir a la fuente en un clic. Sin ese enlace, un testimonio en un sitio propio
 * no vale nada.
 */
export function Resenas() {
  if (RESENAS.length === 0) return null

  const promedio = RESENAS.reduce((n, r) => n + r.estrellas, 0) / RESENAS.length

  return (
    <section className="border-t border-ink-200 bg-ink-50 py-16 lg:py-20">
      <Container>
        <SectionHeading
          eyebrow="Lo que dicen"
          title="Clientes que ya compraron"
          description="Reseñas publicadas en Google por quienes trabajaron con nosotros."
          action={
            <a
              href={PERFIL_DE_GOOGLE}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-sm border border-ink-300 px-5 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
            >
              <LogoDeGoogle />
              Ver todas en Google
            </a>
          }
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RESENAS.map((r, i) => (
            <figure
              key={i}
              className="flex flex-col border border-ink-200 bg-white p-5 sm:p-6"
            >
              <Estrellas cantidad={r.estrellas} />

              <blockquote className="mt-4 flex-1 leading-relaxed text-ink-700">
                {r.texto}
              </blockquote>

              <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                  {r.autor.trim().charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-950">
                    {r.autor}
                  </span>
                  <span className="block text-xs text-ink-500">{r.cuando}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-ink-500 sm:justify-start">
          <LogoDeGoogle />
          <span>
            <strong className="font-semibold text-ink-900">
              {promedio.toFixed(1).replace('.', ',')}
            </strong>{' '}
            de 5 en Google · {RESENAS.length} reseñas publicadas
          </span>
        </p>
      </Container>
    </section>
  )
}

function Estrellas({ cantidad }: { cantidad: number }) {
  return (
    <p className="flex gap-0.5" aria-label={`${cantidad} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={
            'size-4 ' +
            (n <= cantidad ? 'fill-amber-400 text-amber-400' : 'fill-ink-100 text-ink-200')
          }
        />
      ))}
    </p>
  )
}

/** La G de Google, en sus colores. Es la atribución mínima que corresponde. */
function LogoDeGoogle() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.64v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.9z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09A11.995 11.995 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.26a12 12 0 0 0 0 10.74l4.01-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.18 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.63l4.01 3.09c.95-2.85 3.6-4.97 6.73-4.97z"
      />
    </svg>
  )
}
