import Link from 'next/link'
import { ArrowRight, BadgeCheck, Headset, ShieldCheck, Truck } from 'lucide-react'
import { getCarouselProducts, getCategoryTree, queryProducts } from '@/lib/catalog'
import { site, trustPoints } from '@/lib/site'
import { titleCase } from '@/lib/format'
import { Container, SectionHeading } from '@/components/ui'
import { HeroCarousel, type HeroSlide } from '@/components/hero-carousel'
import { bannerSlides } from '@/content/banner'
import manifiestoBanner from '../../public/banner/manifiesto.json'
import { ProductCarousel } from '@/components/product-carousel'
import { Accordion } from '@/components/accordion'
import { Faqs, homeFaqs } from '@/components/faqs'
import { ViewItemList } from '@/components/analytics'

// El catálogo cambia poco: se regenera una vez por hora.
export const revalidate = 3600

const trustIcons = [BadgeCheck, Truck, Headset, ShieldCheck]

export default async function HomePage() {
  const categories = await getCategoryTree()

  const [destacados, novedades] = await Promise.all([
    getCarouselProducts(12),
    queryProducts({ sort: 'novedades', perPage: 12 }),
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

      <HeroCarousel
        slides={slides}
        beneficios={
          <ul className="grid gap-x-8 gap-y-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point, index) => {
              const Icon = trustIcons[index]
              return (
                <li key={point.title} className="flex gap-3">
                  <Icon aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-brand-400" />
                  <div>
                    <p className="text-[13px] font-medium text-white">{point.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-300">{point.detail}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        }
      />

      {/* ---------------------------------------------------------------
          Destacados. Van antes que las categorías: lo primero que se ve
          después del banner es producto con precio.
      --------------------------------------------------------------- */}
      <section className="py-16 lg:py-20">
        <Container>
          <SectionHeading
            eyebrow="Lo más pedido"
            title="Productos destacados"
            description="Los equipos que más nos consultan panaderías, cafeterías y restaurantes."
          />
          <ViewItemList products={destacados} listId="destacados" listName="Productos destacados" />
          <ProductCarousel
            products={destacados}
            listId="destacados"
            listName="Productos destacados"
          />
        </Container>
      </section>

      {/* ---------------------------------------------------------------
          Categorías
      --------------------------------------------------------------- */}
      <section id="categorias" className="border-y border-ink-200 bg-ink-50 py-16 lg:py-20">
        <Container>
          <SectionHeading
            eyebrow="Catálogo"
            title="Compra por categoría"
            description="Todo el equipamiento organizado por rubro."
          />

          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="group flex h-full flex-col justify-between gap-6 border border-ink-200 bg-white p-5 transition-colors hover:border-ink-950"
                >
                  <span className="text-sm leading-snug font-medium text-ink-950">
                    {titleCase(category.name)}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
                  />
                </Link>
              </li>
            ))}
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
            <ProductCarousel products={novedades.items} />
            <ViewItemList
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
                  supermercados. Trabajamos desde {site.contact.city} y despachamos a todo Chile.
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
                    titulo: 'Qué hay en cada sección del catálogo',
                    html: `
                      <p><a href="/categorias/panaderia">Panadería</a>: amasadoras y sobadoras para
                      el trabajo de masa, estiradoras, divisoras y cortadoras.
                      <a href="/categorias/articulos-de-pasteleria">Artículos de pastelería</a>:
                      moldes de bizcocho, de kuchen, de teflón y bandejas enlozadas.</p>

                      <p><a href="/categorias/calor">Línea de calor</a> para la cocción y
                      <a href="/categorias/frio-2">línea de frío</a> para la conservación.
                      <a href="/categorias/vitrinas">Vitrinas</a> frías y calientes: una buena
                      exhibición decide si el producto se vende o se queda.</p>

                      <p><a href="/categorias/acero">Acero inoxidable</a>: mesones, carros,
                      bandejas, depósitos gastronómicos, fondos y sartenes.
                      <a href="/categorias/complementarios">Equipos complementarios</a>: balanzas,
                      licuadoras, máquinas de café, waffleras, selladoras al vacío, moledoras de
                      carne y procesadores. Y <a href="/categorias/repuestos">repuestos</a> con
                      stock.</p>
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
