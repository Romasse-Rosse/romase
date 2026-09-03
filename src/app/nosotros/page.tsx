import type { Metadata } from 'next'
import { getCategoryTree } from '@/lib/catalog'
import { site, trustPoints } from '@/lib/site'
import { titleCase } from '@/lib/format'
import { Breadcrumbs, ButtonLink, Container } from '@/components/ui'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Sobre nosotros',
  description:
    `Más de ${site.yearsInBusiness} años entregando maquinaria y equipamiento gastronómico desde ` +
    `${site.contact.city} a la Región de Los Lagos y al sur. Conoce a ROMASE.`,
  alternates: { canonical: '/nosotros' },
}

export default async function NosotrosPage() {
  const categories = await getCategoryTree()

  return (
    <>
      <Container className="py-8 lg:py-12">
        <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Sobre nosotros' }]} />

        <header className="mt-4 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            {site.yearsInBusiness} años equipando cocinas en el sur de Chile
          </h1>
          <p className="mt-4 text-lg text-ink-600">
            ROMASE es una empresa familiar de {site.contact.city} dedicada a la venta de maquinaria y
            equipamiento para panaderías, pastelerías, hoteles, restaurantes y supermercados.
          </p>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div className="rich-text max-w-3xl">
            <h2>Cómo trabajamos</h2>

            <p>
              Empezamos hace más de dos décadas atendiendo panaderías de la Región de{' '}
              {site.contact.region}. En ese tiempo el negocio cambió mucho, pero una cosa se mantuvo:
              seguimos vendiendo de la misma manera, entendiendo primero qué necesita cada cliente y
              recién después mostrando equipos.
            </p>

            <p>
              La mayoría de nuestros clientes son negocios que trabajan todos los días con márgenes
              ajustados. Un equipo mal elegido no es solo un gasto: es producción detenida, merma y
              tiempo perdido. Por eso preferimos hacer preguntas incómodas antes de vender —cuánto
              produces realmente, qué instalación tienes, en qué plazo necesitas operar— en vez de
              cerrar rápido una venta que después trae problemas.
            </p>

            <h2>Qué nos diferencia</h2>

            <p>
              Mantenemos stock de repuestos para los equipos que comercializamos. Es una decisión
              deliberada y cuesta plata inmovilizada, pero es lo que permite que un cliente con una
              máquina detenida vuelva a producir en días y no en meses. En un rubro donde muchos
              venden y desaparecen, el respaldo postventa es lo que sostiene una relación de años.
            </p>

            <p>
              También conocemos el territorio. Sabemos cómo se comporta un equipo en el clima del
              sur, qué implica despachar a zonas apartadas y qué exige la fiscalización sanitaria en
              la práctica. Esa experiencia local no aparece en ningún catálogo.
            </p>

            <h2>A quiénes atendemos</h2>

            <p>
              Trabajamos con panaderías y pastelerías, cafeterías, restaurantes, hoteles, casinos
              institucionales, supermercados y almacenes. Desde el emprendimiento que está montando
              su primer local hasta operaciones con varios puntos de venta. Atendemos por igual una
              compra de un molde y el equipamiento completo de una cocina.
            </p>

            <h2>Dónde estamos</h2>

            <p>
              Nuestro local está en {site.contact.address}, {site.contact.city}. Atendemos de lunes a
              viernes de 9:00 a 18:30 y sábados de 10:00 a 14:00. Si vienes por un equipo puntual,
              avísanos antes para asegurarnos de tenerlo disponible para que lo veas.
            </p>

            <p>
              Despachamos desde {site.contact.city} a la Región de Los Lagos, Aysén y Magallanes, con
              la empresa de transporte que elijas: Cruz del Sur, Starken, Chilexpress o Blue
              Express. El envío va por pagar, así que el flete lo pagas al recibir, según el
              volumen del equipo y el destino. También puedes retirar en el local.
            </p>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-ink-200 bg-ink-50 p-6">
              <h2 className="text-base font-semibold text-ink-950">En resumen</h2>
              <ul className="mt-4 space-y-4">
                {trustPoints.map((point) => (
                  <li key={point.title}>
                    <p className="text-sm font-medium text-ink-900">{point.title}</p>
                    <p className="mt-0.5 text-sm text-ink-600">{point.detail}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-ink-200 p-6">
              <h2 className="text-base font-semibold text-ink-950">Qué vendemos</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {categories.map((category) => (
                  <li key={category.id}>
                    <a
                      href={`/categorias/${category.slug}`}
                      className="block text-ink-600 hover:text-brand-600"
                    >
                      {titleCase(category.name)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Container>

      <section className="mt-16 bg-brand-700 py-14 text-white">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                ¿Estás equipando un local?
              </h2>
              <p className="mt-2 text-brand-100">
                Cuéntanos tu proyecto y te acompañamos desde el primer equipo hasta la puesta en
                marcha.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href="/contacto"
                size="lg"
                className="bg-white text-brand-700 hover:bg-brand-50"
              >
                Hablemos
              </ButtonLink>
              <ButtonLink
                href="/#categorias"
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10"
              >
                Ver las categorías
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
