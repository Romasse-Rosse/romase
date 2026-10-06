import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Headset, ShieldCheck, Truck } from 'lucide-react'
import { getCarouselProducts, getCategoryCovers, getCategoryTree, queryProducts } from '@/lib/catalog'
import { site, trustPoints } from '@/lib/site'
import { titleCase } from '@/lib/format'
import { Container, SectionHeading } from '@/components/ui'
import { HeroCarousel, type HeroSlide } from '@/components/hero-carousel'
import { bannerSlides } from '@/content/banner'
import manifiestoBanner from '../../../public/banner/manifiesto.json'
import { ProductCarousel } from '@/components/product-carousel'
import { Accordion } from '@/components/accordion'
import { Faqs, homeFaqs } from '@/components/faqs'
import { ViewItemList } from '@/components/analytics'
import { Resenas } from '@/components/resenas'

// El catálogo cambia poco: se regenera una vez por hora.
// Cinco minutos, no una hora: esta página muestra precios y una promoción
// puede empezar o vencer en cualquier momento. El cobro respeta la
// promoción bastante más tiempo que esto (GRACIA_COBRO), justamente para
// que una página vieja no muestre un descuento que el checkout ya no
// aplique. Ver src/lib/promociones.ts.
export const revalidate = 300

const trustIcons = [BadgeCheck, Truck, Headset, ShieldCheck]

export default async function HomePage() {
  const categories = await getCategoryTree()

  const [destacados, novedades, portadas] = await Promise.all([
    getCarouselProducts(12),
    queryProducts({ sort: 'novedades', perPage: 12 }),
    getCategoryCovers(),
  ])

  const archivosBanner = manifiestoBanner as Record<string, string>

  const porSlug = new Map(categories.map((c) => [c.slug, c]))
  const slides: HeroSlide[] = bannerSlides.flatMap((s) => {
    const categoria = porSlug.get(s.slug)
    const archivo = archivosBanner[s.imagen]
    if (!categoria || !archivo) return []
    return [
      {
        slug: s.slug,
        imagen: `/banner/${archivo}`,
        categoria: titleCase(categoria.name),
        titular: s.titular,
        bajada: s.bajada,
      },
    ]
  })

  return (
    <>
      <h1 className="sr-only">
        Maquinaria y equipamiento para panadería, pastelería y gastronomía en Chile
      </h1>

      {/* ---------------------------------------------------------------
          Banner, beneficios y destacados, en un contenedor flex para poder
          cambiarles el orden por ancho de pantalla.

          En escritorio los beneficios van pegados al banner: hay ancho para
          las cuatro columnas y la banda cierra el bloque de portada.

          En móvil no: el banner es oscuro y la banda también, así que pegados
          se leían como un solo bloque negro y la foto parecía terminar donde
          empezaba la banda. Ahí la banda baja después de los destacados, con
          el blanco de la sección de productos separándola del banner. De paso,
          lo primero que se ve después de la portada es producto con precio, que
          es lo que se quiere empujar.

          Se reordena con `order` en vez de repetir el marcado. La banda no
          tiene nada enfocable —son iconos y texto—, así que el orden visual
          distinto del orden del DOM no altera el recorrido con teclado.
      --------------------------------------------------------------- */}
      <div className="flex flex-col">
        <HeroCarousel slides={slides} />

        {/* En móvil se muestran solo los títulos en dos columnas: con los
            detalles la banda medía cuatro pantallazos. El detalle aparece
            desde lg, donde hay ancho para las cuatro columnas. */}
        <section
          aria-label="Por qué comprar en ROMASE"
          className="order-3 border-y border-ink-800 bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 sm:order-2 sm:border-t-0"
        >
          <Container>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-5 py-7 lg:grid-cols-4">
              {trustPoints.map((point, index) => {
                const Icon = trustIcons[index]
                return (
                  <li
                    key={point.title}
                    className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:gap-3 sm:text-left"
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-4.5 shrink-0 text-brand-400 sm:mt-0.5"
                    />
                    <div>
                      <p className="text-[13px] leading-snug font-medium text-white">
                        {point.title}
                      </p>
                      <p className="mt-1 hidden text-xs leading-relaxed text-ink-300 lg:block">
                        {point.detail}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Container>
        </section>

        <section className="order-2 py-14 sm:order-3 sm:py-16 lg:py-20">
          <Container>
            <SectionHeading
              eyebrow="Lo más vendido"
              title="Productos destacados"
              description="Los equipos que más nos consultan panaderías, cafeterías y restaurantes."
            />
            <ViewItemList
              products={destacados}
              listId="destacados"
              listName="Productos destacados"
            />
            <ProductCarousel
              products={destacados}
              listId="destacados"
              listName="Productos destacados"
            />
          </Container>
        </section>
      </div>

      {/* ---------------------------------------------------------------
          Categorías
      --------------------------------------------------------------- */}
      <section id="categorias" className="border-y border-brand-100 bg-brand-50 py-16 lg:py-20">
        <Container>
          <SectionHeading title="Encuentra el producto que necesitas para tu negocio" />

          {/* Cada tarjeta muestra un producto real de la categoría, no un
              icono: lo que se vende es el catálogo. La foto viene recortada
              sobre blanco, así que la tarjeta también es blanca y el objeto
              queda flotando. */}
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => {
              const portada = portadas[category.slug]

              return (
                <li key={category.id}>
                  <Link
                    href={`/categorias/${category.slug}`}
                    className="group flex h-full flex-col border border-brand-100 bg-white transition-colors hover:border-brand-500"
                  >
                    <span className="relative block aspect-square overflow-hidden">
                      {portada ? (
                        <Image
                          src={portada.src}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
                          className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-ink-300">
                          Sin foto
                        </span>
                      )}
                    </span>

                    <span className="flex items-center justify-between gap-2 border-t border-brand-100 px-4 py-3.5">
                      <span className="text-[13px] leading-snug font-semibold text-ink-950">
                        {titleCase(category.name)}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
                      />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Novedades
      --------------------------------------------------------------- */}
      {novedades.items.length > 0 && (
        <section className="py-16 lg:py-20">
          <Container>
            <SectionHeading
              eyebrow="Recién llegados"
              title="Últimas incorporaciones"
              description="Lo último que sumamos al catálogo."
            />
            <ViewItemList
              products={novedades.items}
              listId="novedades"
              listName="Últimas incorporaciones"
            />
            <ProductCarousel
              products={novedades.items}
              listId="novedades"
              listName="Últimas incorporaciones"
            />
          </Container>
        </section>
      )}

      {/* ---------------------------------------------------------------
          Contenido. Poco texto a la vista: dos párrafos y el resto dentro
          de las preguntas frecuentes, que es donde no hace ruido.
      --------------------------------------------------------------- */}
      <Resenas />

      <section className="border-t border-ink-200 py-16 lg:py-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 className="text-[26px] leading-[1.15] font-medium text-ink-950 sm:text-[32px]">
                Equipamiento gastronómico para panaderías y cocinas profesionales
              </h2>

              <div className="rich-text mt-6 max-w-xl">
                <p>
                  En <strong>{site.name}</strong> llevamos más de {site.yearsInBusiness} años
                  vendiendo maquinaria para panaderías, pastelerías, hoteles, restaurantes y
                  supermercados. Trabajamos desde {site.contact.city} y despachamos a la Región de
                  Los Lagos, Aysén y Magallanes.
                </p>
                <p>
                  Lo que te conviene no es el equipo más caro: es el que rinde para tu producción
                  real, entra en el espacio que tienes y se puede reparar sin esperar meses un
                  repuesto importado.
                </p>
              </div>

              <Accordion
                items={[
                  {
                    titulo: 'Cómo se arma una panadería',
                    html: `
                      <p>Todo empieza por la masa. La <a href="/categorias/panaderia">amasadora</a>
                      es la que pone el techo: cuántos kilos entran por vez decide cuánto se puede
                      producir en un turno, y quedarse corto ahí no se arregla comprando otra cosa
                      después. La sobadora y la estiradora vienen a continuación, y son las que
                      definen cuánto de ese trabajo se sigue haciendo a pulso.</p>

                      <p>Después está lo que se gasta y se repone: moldes, bandejas enlozadas y
                      cortadores. Son los
                      <a href="/categorias/articulos-de-pasteleria">artículos de pastelería</a>, que
                      no se compran una vez sino todos los años.</p>
                    `,
                  },
                  {
                    titulo: 'Cocinar, conservar y exhibir',
                    html: `
                      <p>En una cocina el reparto es más simple de lo que parece: está lo que cocina
                      y lo que conserva. Hornos, freidoras y anafes de un lado —la
                      <a href="/categorias/calor">línea de calor</a>—; freezers y frigobares del
                      otro —la <a href="/categorias/frio-2">línea de frío</a>—.</p>

                      <p>Entre las dos están las <a href="/categorias/vitrinas">vitrinas</a>, frías y
                      calientes, y son las que más se subestiman al presupuestar. Un producto bien
                      exhibido se vende; el mismo producto guardado atrás, no.</p>
                    `,
                  },
                  {
                    titulo: 'Lo que sostiene el servicio',
                    html: `
                      <p>El <a href="/categorias/acero">acero inoxidable</a> es la infraestructura:
                      mesones, carros, depósitos gastronómicos, fondos y sartenes. No se luce, pero
                      es lo que permite trabajar limpio y rápido cuando el local está lleno.</p>

                      <p>Los <a href="/categorias/complementarios">equipos complementarios</a> son
                      otra cosa: una máquina de café, una wafflera o una selladora al vacío amplían
                      la carta sin obra y sin cambiar la cocina. Y aparte están los
                      <a href="/categorias/repuestos">repuestos</a>, con stock propio. Esa es la
                      diferencia entre un equipo parado dos días y uno parado dos meses.</p>
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
