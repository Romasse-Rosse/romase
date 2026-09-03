import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { getCategoryTree } from '@/lib/catalog'
import { regionesVenta, site } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CartProvider } from '@/lib/cart'
import { CartDrawer } from '@/components/cart-drawer'
import { TagManager } from '@/components/analytics'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline} en Chile`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    'maquinaria para panadería',
    'equipamiento gastronómico',
    'hornos industriales',
    'amasadoras',
    'vitrinas refrigeradas',
    'equipamiento para restaurantes',
    'Puerto Montt',
    'Chile',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: site.name,
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategoryTree()

  // Datos estructurados del negocio: ayudan a que Google muestre
  // dirección, teléfono y horario directamente en los resultados.
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
    <html lang="es-CL" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Saltar al contenido
        </a>

        <TagManager />

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
      </body>
    </html>
  )
}
