import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getCategoryTree } from '@/lib/catalog'
import { site } from '@/lib/site'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { WhatsAppFab } from '@/components/whatsapp-fab'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

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
    telephone: site.contact.phone,
    email: site.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.contact.address,
      addressLocality: site.contact.city,
      addressRegion: site.contact.region,
      addressCountry: site.contact.country,
    },
    openingHours: ['Mo-Fr 09:00-18:30', 'Sa 10:00-14:00'],
  }

  return (
    <html lang="es-CL" className={inter.variable}>
      <body className="font-sans antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Saltar al contenido
        </a>

        <SiteHeader categories={categories} />
        <main id="contenido">{children}</main>
        <SiteFooter />
        <WhatsAppFab />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
        />
      </body>
    </html>
  )
}
