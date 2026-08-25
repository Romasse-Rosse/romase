import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Headset, ShieldCheck, Truck } from 'lucide-react'
import { getCategoryTree, getFeaturedProducts, queryProducts } from '@/lib/catalog'
import { site, trustPoints, whatsappUrl } from '@/lib/site'
import { ButtonLink, Container, SectionHeading, TextLink } from '@/components/ui'
import { ProductGrid } from '@/components/product-card'
import { CategoryCard } from '@/components/category-card'
import { FeaturedTabs, type FeaturedGroup } from '@/components/featured-tabs'
import { SearchBox } from '@/components/search-box'
import { Faqs, homeFaqs } from '@/components/faqs'

// El catálogo cambia poco: se regenera una vez por hora.
export const revalidate = 3600

const trustIcons = [BadgeCheck, Truck, Headset, ShieldCheck]

export default async function HomePage() {
  const categories = await getCategoryTree()
  const destacadas = categories.slice(0, 6)

  const [featured, novedades, ...porCategoria] = await Promise.all([
    getFeaturedProducts(3),
    queryProducts({ sort: 'novedades', perPage: 4 }),
    ...destacadas.map((c) => queryProducts({ categorySlug: c.slug, perPage: 4 })),
  ])

  const grupos: FeaturedGroup[] = destacadas.map((c, index) => ({
    slug: c.slug,
    name: c.name,
    products: porCategoria[index].items,
  }))

  const totalProductos = categories.reduce((sum, c) => sum + c.productCount, 0)
  const [heroPrincipal, ...heroSecundarios] = featured

  return (
    <>
      {/* ---------------------------------------------------------------
          Portada
      --------------------------------------------------------------- */}
      <section className="border-b border-ink-200 bg-ink-50">
        <Container>
          <div className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
            <div>
              <p className="mb-6 text-[11px] font-medium tracking-[0.2em] text-brand-600 uppercase">
                Desde 2001 en {site.contact.city}
              </p>

              <h1 className="text-[38px] leading-[1.08] font-medium text-ink-950 sm:text-[52px] lg:text-[58px]">
                Equipos que sostienen la producción de cada día.
              </h1>

              <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-600">
                Maquinaria para panadería, pastelería y gastronomía. {totalProductos} productos con
                despacho a todo Chile, repuestos en stock y asesoría antes de que compres.
              </p>

              <div className="mt-9 max-w-lg">
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
                  className="inline-flex h-13 items-center justify-center rounded-sm border border-ink-300 px-8 text-[15px] font-medium text-ink-900 transition-colors hover:border-ink-950 hover:bg-ink-950 hover:text-white"
                >
                  Pedir cotización
                </a>
              </div>
            </div>

            {/* La composición se arma con el propio catálogo: no hay fotos
                de ambiente, y una portada con producto real es más honesta
                que una imagen de banco. */}
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {heroPrincipal?.images[0] && (
                <Link
                  href={`/productos/${heroPrincipal.slug}`}
                  className="group relative col-span-2 aspect-16/10 overflow-hidden border border-ink-200 bg-white"
                >
                  <Image
                    src={heroPrincipal.images[0].src}
                    alt={heroPrincipal.name}
                    fill
                    priority
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-contain p-10 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </Link>
              )}

              {heroSecundarios.slice(0, 2).map(
                (producto) =>
                  producto.images[0] && (
                    <Link
                      key={producto.id}
                      href={`/productos/${producto.slug}`}
                      className="group relative aspect-square overflow-hidden border border-ink-200 bg-white"
                    >
                      <Image
                        src={producto.images[0].src}
                        alt={producto.name}
                        fill
                        sizes="(min-width: 1024px) 22vw, 45vw"
                        className="object-contain p-7 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    </Link>
                  ),
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Motivos para comprar acá
      --------------------------------------------------------------- */}
      <section className="border-b border-ink-200">
        <Container>
          <ul className="grid sm:grid-cols-2 sm:divide-x sm:divide-ink-200 lg:grid-cols-4">
            {trustPoints.map((point, index) => {
              const Icon = trustIcons[index]
              return (
                <li
                  key={point.title}
                  className="flex gap-3.5 border-b border-ink-200 py-7 sm:border-b-0 sm:px-7 sm:first:pl-0 sm:last:pr-0"
                >
                  <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-500" />
                  <div>
                    <p className="text-sm font-medium text-ink-950">{point.title}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{point.detail}</p>
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
      <section className="py-20">
        <Container>
          <SectionHeading
            eyebrow="Catálogo"
            title="Compra por categoría"
            description="Todo el equipamiento organizado por rubro, para llegar rápido a lo que necesitas."
            action={<TextLink href="/productos">Ver todo el catálogo</TextLink>}
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Destacados, agrupados por categoría
      --------------------------------------------------------------- */}
      <section className="border-y border-ink-200 bg-ink-50 py-20">
        <Container>
          <SectionHeading
            eyebrow="Lo más pedido"
            title="Productos destacados"
            description="Los equipos que más nos consultan panaderías, cafeterías y restaurantes."
          />
          <FeaturedTabs groups={grupos} />
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Asesoría
      --------------------------------------------------------------- */}
      <section className="bg-ink-950 py-20 text-white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="mb-6 text-[11px] font-medium tracking-[0.2em] text-brand-400 uppercase">
                Asesoría técnica
              </p>
              <h2 className="text-[30px] leading-[1.15] font-medium sm:text-[40px]">
                El equipo correcto no es el más caro. Es el que rinde para tu producción.
              </h2>
              <p className="mt-6 max-w-xl leading-relaxed text-ink-300">
                Dinos cuántos kilos o cubiertos produces por día, qué espacio tienes y con qué
                instalación cuentas. Con eso armamos una propuesta concreta, no un listado de
                precios.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a
                href={whatsappUrl('Hola ROMASE, quiero asesoría para equipar mi local.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 items-center justify-center rounded-sm bg-brand-500 px-8 text-[15px] font-medium text-white transition-colors hover:bg-brand-600"
              >
                Hablar por WhatsApp
              </a>
              <Link
                href="/contacto"
                className="inline-flex h-13 items-center justify-center rounded-sm border border-white/25 px-8 text-[15px] font-medium transition-colors hover:bg-white hover:text-ink-950"
              >
                Enviar un mensaje
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Novedades
      --------------------------------------------------------------- */}
      {novedades.items.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading
              eyebrow="Recién llegados"
              title="Últimas incorporaciones"
              action={<TextLink href="/productos?orden=novedades">Ver novedades</TextLink>}
            />
            <ProductGrid products={novedades.items} />
          </Container>
        </section>
      )}

      {/* ---------------------------------------------------------------
          Contenido para posicionamiento
      --------------------------------------------------------------- */}
      <section className="border-t border-ink-200 py-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr]">
            <div className="rich-text max-w-3xl">
              <h2 className="!mt-0 text-[26px] leading-[1.15] font-medium text-ink-950 sm:text-[34px]">
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
                Si estás armando un local desde cero o ampliando el que tienes, conviene que
                hablemos antes de que compres. Necesitamos saber tres cosas: cuántos kilos o
                cubiertos produces por día, qué superficie y qué instalación eléctrica y de gas
                tienes disponible, y en qué plazo necesitas estar operando. Con eso te armamos una
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
    </>
  )
}
