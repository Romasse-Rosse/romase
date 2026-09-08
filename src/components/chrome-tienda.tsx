import { getCategoryTree } from '@/lib/catalog'
import { regionesVenta, site } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CartProvider } from '@/lib/cart'
import { CartDrawer } from '@/components/cart-drawer'

/**
 * El envoltorio visible de la tienda: encabezado, pie, carrito y el esquema del
 * negocio.
 *
 * Está en un componente y no directamente en el layout porque hacen falta dos
 * consumidores:
 *
 *   · `(tienda)/layout.tsx`, que envuelve todas las páginas de la tienda;
 *   · `not-found.tsx` de la raíz, que atiende las URL que no coinciden con
 *     ninguna ruta.
 *
 * El segundo existe por algo que se rompió al separar la tienda del panel: con
 * el 404 dentro del grupo `(tienda)`, una URL inexistente ya no lo encontraba y
 * Next mostraba su 404 pelado, sin navegación ni buscador. Justamente en la
 * página donde alguien más necesita salida.
 *
 * No lo usa `/admin`: el panel tiene su propia navegación y no tendría sentido
 * que heredara la barra de categorías ni el carrito.
 */
export async function ChromeTienda({ children }: { children: React.ReactNode }) {
  const categories = await getCategoryTree()

  // Datos estructurados del negocio: ayudan a que Google muestre dirección,
  // teléfono y horario directamente en los resultados.
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.contact.phones.map((t) => t.numero),
    email: site.contact.email,
    // Hasta dónde se vende. Google lo usa para las búsquedas con intención
    // local, y decirlo mal trae consultas que después hay que rechazar.
    areaServed: regionesVenta.map((nombre) => ({
      '@type': 'AdministrativeArea',
      name: nombre,
    })),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.contact.address,
      addressLocality: site.contact.city,
      addressRegion: site.contact.region,
      addressCountry: site.contact.country,
    },
    openingHours: ['Mo-Fr 09:00-18:30', 'Sa 10:00-14:00'],
    // Los perfiles sociales le permiten a Google vincular la ficha del negocio.
    sameAs: site.social.map((red) => red.url),
  }

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>

      <CartProvider>
        <SiteHeader categories={categories} />
        <main id="contenido">{children}</main>
        <SiteFooter />
        <CartDrawer />
      </CartProvider>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
    </>
  )
}
