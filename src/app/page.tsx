import Link from 'next/link'
import { ArrowRight, BadgeCheck, Headset, ShieldCheck, Truck } from 'lucide-react'
import {
  getCategoryTree,
  getFeaturedProducts,
  queryProducts,
} from '@/lib/catalog'
import { site, trustPoints, whatsappUrl } from '@/lib/site'
import { Container, SectionHeading, ButtonLink } from '@/components/ui'
import { ProductGrid } from '@/components/product-card'
import { CategoryCard } from '@/components/category-card'
import { SearchBox } from '@/components/search-box'
import { Faqs, homeFaqs } from '@/components/faqs'

// El catálogo cambia poco: se regenera una vez por hora.
export const revalidate = 3600

const trustIcons = [BadgeCheck, Truck, Headset, ShieldCheck]

export default async function HomePage() {
  const [categories, featured, novedades] = await Promise.all([
    getCategoryTree(),
    getFeaturedProducts(8),
    queryProducts({ sort: 'novedades', perPage: 4 }),
  ])

  const totalProductos = categories.reduce((sum, c) => sum + c.productCount, 0)

  return (
    <>
      {/* ---------------------------------------------------------------
          Portada
      --------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_15%_-10%,rgba(221,83,48,0.35),transparent)]"
        />
        <Container className="relative">
          <div className="grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide">
                <span className="size-1.5 rounded-full bg-brand-500" />
                {site.yearsInBusiness} años equipando cocinas en el sur de Chile
              </p>

              <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Maquinaria para <span className="text-brand-400">panadería</span>, pastelería y{' '}
                <span className="text-brand-400">gastronomía</span>
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-200">
                Hornos, amasadoras, vitrinas, mobiliario en acero inoxidable y repuestos.
                {totalProductos} productos con despacho a todo Chile y asesoría técnica
                antes de que compres.
              </p>

              <div className="mt-8 max-w-xl">
                <SearchBox placeholder="¿Qué equipo estás buscando?" />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/productos" size="lg">
                  Ver el catálogo
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <a
                  href={whatsappUrl('Hola ROMASE, necesito una cotización.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-lg border border-white/20 px-7 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                  Pedir cotización
                </a>
              </div>
            </div>

            {/* Accesos directos a las categorías más grandes */}
            <div className="grid grid-cols-2 gap-3">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/categorias/${category.slug}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-brand-500/60 hover:bg-white/10"
                >
                  <p className="text-sm font-medium capitalize">{category.name.toLowerCase()}</p>
                  <p className="mt-1 text-xs text-ink-300">{category.productCount} productos</p>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Motivos para comprar acá
      --------------------------------------------------------------- */}
      <section className="border-b border-ink-200 bg-ink-50">
        <Container>
          <ul className="grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point, index) => {
              const Icon = trustIcons[index]
              return (
                <li key={point.title} className="flex gap-3">
                  <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                  <div>
                    <p className="text-sm font-semibold text-ink-950">{point.title}</p>
                    <p className="mt-1 text-sm text-ink-600">{point.detail}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Categorías
      --------------------------------------------------------------- */}
      <section className="py-16">
        <Container>
          <SectionHeading
            eyebrow="Catálogo"
            title="Compra por categoría"
            description="Todo el equipamiento organizado por rubro, para que llegues rápido a lo que necesitas."
            action={
              <Link
                href="/productos"
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Ver todo el catálogo →
              </Link>
            }
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Destacados
      --------------------------------------------------------------- */}
      <section className="bg-ink-50 py-16">
        <Container>
          <SectionHeading
            eyebrow="Lo más pedido"
            title="Productos destacados"
            description="Los equipos que más nos consultan panaderías, cafeterías y restaurantes."
            action={
              <Link href="/productos" className="text-sm font-medium text-brand-600 hover:underline">
                Ver más →
              </Link>
            }
          />
          <ProductGrid products={featured} />
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Novedades
      --------------------------------------------------------------- */}
      {novedades.items.length > 0 && (
        <section className="py-16">
          <Container>
            <SectionHeading
              eyebrow="Recién llegados"
              title="Últimas incorporaciones"
              description="Lo más nuevo que sumamos al catálogo."
              action={
                <Link
                  href="/productos?orden=novedades"
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  Ver novedades →
                </Link>
              }
            />
            <ProductGrid products={novedades.items} />
          </Container>
        </section>
      )}

      {/* ---------------------------------------------------------------
          Contenido para posicionamiento
      --------------------------------------------------------------- */}
      <section className="border-t border-ink-200 py-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
            <div className="rich-text max-w-3xl">
              <h2 className="!mt-0 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
                Equipamiento gastronómico e industrial para panaderías y cocinas profesionales
              </h2>

              <p>
                En <strong>ROMASE</strong> llevamos más de {site.yearsInBusiness} años vendiendo
                maquinaria y equipamiento para <strong>panaderías, pastelerías, hoteles,
                restaurantes, casinos y supermercados</strong>. Trabajamos desde{' '}
                {site.contact.city}, en la Región de {site.contact.region}, y despachamos a todo
                Chile. En ese tiempo aprendimos algo que no siempre se dice: el equipo más caro no
                es necesariamente el que te conviene. Lo que te conviene es el que rinde para tu
                volumen de producción real, entra en el espacio que tienes y se puede reparar sin
                esperar tres meses un repuesto importado.
              </p>

              <h3>Qué vas a encontrar en el catálogo</h3>

              <p>
                Nuestra línea de <Link href="/categorias/panaderia">panadería</Link> cubre el
                proceso completo: amasadoras y sobadoras para el trabajo de masa, estiradoras,
                divisoras y cortadoras para la porción, y todo el equipamiento de horneado. A eso se
                suman los <Link href="/categorias/articulos-de-pasteleria">artículos de
                pastelería</Link> —moldes de bizcocho, moldes de kuchen, moldes de teflón,
                bandejas enlozadas— que son el día a día de cualquier obrador.
              </p>

              <p>
                En <Link href="/categorias/calor">línea de calor</Link> tenemos los equipos de
                cocción para cocinas profesionales, y en{' '}
                <Link href="/categorias/frio-2">línea de frío</Link> la conservación:
                freezers, frigobares y refrigeración comercial. Las{' '}
                <Link href="/categorias/vitrinas">vitrinas</Link> —frías y calientes— son
                lo que decide si tu producto se vende o se queda: una buena exhibición vende
                sola.
              </p>

              <p>
                La categoría de <Link href="/categorias/acero">acero inoxidable</Link> reúne el
                mobiliario y los utensilios que sostienen la operación: mesones, carros, bandejas,
                depósitos gastronómicos, fondos, sartenes, coladores y poruñas. El acero inoxidable
                no es un lujo en una cocina profesional, es lo que hace que la limpieza sea posible
                y que la autoridad sanitaria no te ponga problemas.
              </p>

              <p>
                En <Link href="/categorias/complementarios">equipos complementarios</Link> está
                todo lo que suma a la carta sin cambiar la cocina entera: balanzas, licuadoras,
                hervidores, waffleras, creperas, máquinas de café, exprimidores de cítricos,
                selladoras al vacío, moledoras de carne, embutidoras, cortadoras de cecinas,
                procesadores de alimentos y de vegetales. Son máquinas que se pagan solas cuando
                habilitan un producto nuevo.
              </p>

              <h3>Repuestos y servicio postventa</h3>

              <p>
                Mantenemos una línea de <Link href="/categorias/repuestos">repuestos</Link> para los
                equipos que vendemos. Esto es deliberado: una máquina detenida en plena producción
                cuesta mucho más que el repuesto. Preferimos tener el stock y resolverte en días en
                vez de dejarte esperando. Si tienes un equipo comprado con nosotros y necesitas una
                pieza, escríbenos con el modelo y el número de serie y lo buscamos.
              </p>

              <h3>Asesoría antes de comprar</h3>

              <p>
                Si estás armando un local desde cero o ampliando el que tienes, conviene que hablemos
                antes de que compres. Necesitamos saber tres cosas: cuántos kilos o cubiertos
                produces por día, qué superficie y qué instalación eléctrica y de gas tienes
                disponible, y en qué plazo necesitas estar operando. Con eso te armamos una
                propuesta concreta, no un listado de precios.
              </p>

              <p>
                Puedes escribirnos por{' '}
                <a
                  href={whatsappUrl('Hola ROMASE, quiero asesoría para equipar mi local.')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
                , llamarnos al {site.contact.phone} o pasar por nuestro local en{' '}
                {site.contact.address}, {site.contact.city}. Atendemos de lunes a viernes de 9:00 a
                18:30 y los sábados de 10:00 a 14:00.
              </p>

              <h3>Despacho a todo Chile</h3>

              <p>
                Coordinamos envíos a regiones con empresas de transporte para equipos grandes y
                encomienda para artículos menores. En {site.contact.city} entregamos sin costo. El
                costo del flete depende del volumen y del destino, así que lo confirmamos al momento
                de cotizar: preferimos decirte el número real antes y no sorprenderte después.
              </p>
            </div>

            <div>
              <Faqs items={homeFaqs} />
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Cierre
      --------------------------------------------------------------- */}
      <section className="bg-brand-700 py-14 text-white">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                ¿No encuentras lo que buscas?
              </h2>
              <p className="mt-2 text-brand-100">
                Tenemos acceso a más equipos de los que están publicados. Cuéntanos qué necesitas y
                te cotizamos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/contacto" variant="outline" size="lg" className="border-white/30 bg-white text-brand-700 hover:bg-brand-50">
                Escríbenos
              </ButtonLink>
              <a
                href={whatsappUrl('Hola ROMASE, estoy buscando un equipo que no vi en la web.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 items-center justify-center rounded-lg border border-white/40 px-7 text-base font-medium hover:bg-white/10"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
