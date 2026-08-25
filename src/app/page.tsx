import Link from 'next/link'
import { BadgeCheck, Headset, ShieldCheck, Truck } from 'lucide-react'
import { getCarouselProducts, getCategoryTree, queryProducts } from '@/lib/catalog'
import { site, trustPoints, whatsappUrl } from '@/lib/site'
import { titleCase } from '@/lib/format'
import { Container, SectionHeading, TextLink } from '@/components/ui'
import { HeroCarousel, type HeroSlide } from '@/components/hero-carousel'
import { bannerSlides } from '@/content/banner'
import { ProductCarousel } from '@/components/product-carousel'
import { Accordion } from '@/components/accordion'
import { Faqs, homeFaqs } from '@/components/faqs'

// El catálogo cambia poco: se regenera una vez por hora.
export const revalidate = 3600

const trustIcons = [BadgeCheck, Truck, Headset, ShieldCheck]

export default async function HomePage() {
  const categories = await getCategoryTree()

  const [destacados, novedades] = await Promise.all([
    getCarouselProducts(12),
    queryProducts({ sort: 'novedades', perPage: 12 }),
  ])

  // El banner muestra las secciones del catálogo, con foto de ambiente. El
  // nombre, el enlace y el conteo salen del catálogo; el texto, de
  // content/banner.ts.
  const porSlug = new Map(categories.map((c) => [c.slug, c]))
  const slides: HeroSlide[] = bannerSlides.flatMap((s) => {
    const categoria = porSlug.get(s.slug)
    if (!categoria) return []
    return [
      {
        slug: s.slug,
        imagen: s.imagen,
        categoria: titleCase(categoria.name),
        titular: s.titular,
        bajada: s.bajada,
        productos: categoria.productCount,
      },
    ]
  })

  return (
    <>
      {/* Un H1 real para posicionamiento; el banner rota productos, así que
          su título va como H2 en cada diapositiva. */}
      <h1 className="sr-only">
        Maquinaria y equipamiento para panadería, pastelería y gastronomía en Chile
      </h1>

      <HeroCarousel slides={slides} />

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
          Destacados
      --------------------------------------------------------------- */}
      <section className="py-16 lg:py-20">
        <Container>
          <SectionHeading
            eyebrow="Lo más pedido"
            title="Productos destacados"
            description="Los equipos que más nos consultan panaderías, cafeterías y restaurantes."
            action={<TextLink href="/productos">Ver el catálogo completo</TextLink>}
          />
          <ProductCarousel products={destacados} />
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Novedades
      --------------------------------------------------------------- */}
      {novedades.items.length > 0 && (
        <section className="border-y border-ink-200 bg-ink-50 py-16 lg:py-20">
          <Container>
            <SectionHeading
              eyebrow="Recién llegados"
              title="Últimas incorporaciones"
              description="Lo último que sumamos al catálogo."
              action={<TextLink href="/productos?orden=novedades">Ver novedades</TextLink>}
            />
            <ProductCarousel products={novedades.items} />
          </Container>
        </section>
      )}

      {/* ---------------------------------------------------------------
          Asesoría
      --------------------------------------------------------------- */}
      <section className="bg-ink-950 py-16 text-white lg:py-20">
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
          Contenido en desplegables.
          El texto de posicionamiento sigue completo en el HTML —Google lo
          indexa igual con el <details> cerrado—, pero la página no arranca
          con un muro de texto.
      --------------------------------------------------------------- */}
      <section className="py-16 lg:py-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <SectionHeading
                eyebrow="Antes de comprar"
                title="Asesoría para elegir bien"
                description="Lo que conviene revisar antes de decidir, según el rubro."
              />

              <Accordion
                abrirPrimero
                items={[
                  {
                    titulo: 'Cómo dimensionar el equipo para tu producción',
                    html: `
                      <p>Antes de decidir, revisa cuatro cosas. La <strong>producción diaria
                      real</strong>, no la que te gustaría tener: dimensionar para hoy con algo de
                      holgura es más sano que comprar para un escenario hipotético. La
                      <strong>instalación eléctrica</strong>: mucha maquinaria de panadería es
                      trifásica, y si tu local es monofásico el costo de adecuar la instalación
                      puede superar al del equipo. El <strong>espacio y la circulación</strong>:
                      una máquina que entra pero bloquea el paso al horno complica la operación
                      todos los días. Y el <strong>respaldo de repuestos</strong>: preguntá siempre
                      si hay piezas en Chile, porque un equipo detenido esperando una importación
                      deja de ser un ahorro.</p>

                      <p>Si nos escribes con esos cuatro datos, te decimos qué modelo corresponde y
                      qué no te conviene, aunque sea más caro.</p>
                    `,
                  },
                  {
                    titulo: 'Qué vas a encontrar en el catálogo',
                    html: `
                      <p>La línea de <a href="/categorias/panaderia">panadería</a> cubre el proceso
                      completo: amasadoras y sobadoras para el trabajo de masa, estiradoras,
                      divisoras y cortadoras para la porción. A eso se suman los
                      <a href="/categorias/articulos-de-pasteleria">artículos de pastelería</a>
                      —moldes de bizcocho, moldes de kuchen, moldes de teflón, bandejas
                      enlozadas—, el día a día de cualquier obrador.</p>

                      <p>En <a href="/categorias/calor">línea de calor</a> están los equipos de
                      cocción, y en <a href="/categorias/frio-2">línea de frío</a> la conservación:
                      freezers, frigobares y refrigeración comercial. Las
                      <a href="/categorias/vitrinas">vitrinas</a> —frías y calientes— deciden si tu
                      producto se vende o se queda: una buena exhibición vende sola.</p>

                      <p>La categoría de <a href="/categorias/acero">acero inoxidable</a> reúne el
                      mobiliario y los utensilios que sostienen la operación: mesones, carros,
                      bandejas, depósitos gastronómicos, fondos, sartenes, coladores y poruñas. En
                      una cocina profesional el acero no es un lujo: es lo que hace posible la
                      limpieza y lo que evita problemas con la autoridad sanitaria.</p>

                      <p>En <a href="/categorias/complementarios">equipos complementarios</a> está
                      todo lo que suma a la carta sin cambiar la cocina entera: balanzas,
                      licuadoras, hervidores, waffleras, creperas, máquinas de café, exprimidores
                      de cítricos, selladoras al vacío, moledoras de carne, embutidoras, cortadoras
                      de cecinas y procesadores de alimentos y de vegetales. Son máquinas que se
                      pagan solas cuando habilitan un producto nuevo.</p>
                    `,
                  },
                  {
                    titulo: 'Repuestos y servicio postventa',
                    html: `
                      <p>Mantenemos una línea de <a href="/categorias/repuestos">repuestos</a> para
                      los equipos que vendemos. Es deliberado: una máquina detenida en plena
                      producción cuesta mucho más que el repuesto. Preferimos tener el stock y
                      resolverte en días en vez de dejarte esperando.</p>

                      <p>Si tienes un equipo comprado con nosotros y necesitas una pieza, escríbenos
                      con el modelo y el número de serie —está en la placa trasera o inferior— y,
                      si puedes, una foto de la pieza. Con eso confirmamos disponibilidad y precio
                      el mismo día.</p>

                      <p>Los componentes de desgaste son los que más se piden: correas y
                      rodamientos en equipos con transmisión, resistencias y termostatos en línea
                      de calor, gomas de puerta y componentes de refrigeración en línea de frío,
                      cuchillas y discos en equipos de corte. No son fallas: son piezas que se
                      reemplazan según horas de uso, y conviene tener las de tus equipos críticos
                      en bodega.</p>
                    `,
                  },
                  {
                    titulo: 'Despacho y entrega',
                    html: `
                      <p>Despachamos a todo Chile. En ${site.contact.city} la entrega es sin costo.
                      A regiones coordinamos con BLUExpress, Chilexpress o Cruz del Sur según lo
                      que prefieras, y el flete se cotiza por volumen y destino: preferimos decirte
                      el número real antes y no sorprenderte después.</p>

                      <p>También puedes retirar en el local, en ${site.contact.address},
                      ${site.contact.city}, de lunes a viernes de 9:00 a 18:30 y sábados de 10:00 a
                      14:00. Si vas por un equipo puntual, avísanos antes para asegurarnos de
                      tenerlo disponible.</p>
                    `,
                  },
                  {
                    titulo: `Sobre ROMASE`,
                    html: `
                      <p>Llevamos más de ${site.yearsInBusiness} años vendiendo maquinaria y
                      equipamiento para <strong>panaderías, pastelerías, hoteles, restaurantes,
                      casinos y supermercados</strong>. Trabajamos desde ${site.contact.city}, en la
                      Región de ${site.contact.region}, y despachamos a todo el país.</p>

                      <p>En ese tiempo aprendimos algo que no siempre se dice: el equipo más caro no
                      es necesariamente el que te conviene. Lo que te conviene es el que rinde para
                      tu volumen de producción real, entra en el espacio que tienes y se puede
                      reparar sin esperar tres meses un repuesto importado.</p>

                      <p>Conocemos el territorio: sabemos cómo se comporta un equipo en el clima del
                      sur, qué implica despachar a zonas apartadas y qué exige la fiscalización
                      sanitaria en la práctica.</p>
                    `,
                  },
                ]}
              />
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
