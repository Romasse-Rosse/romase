import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { site } from '@/lib/site'
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

/**
 * Layout raíz: solo lo que es de todo el sitio.
 *
 * El encabezado, el pie y el carrito se movieron a `(tienda)/layout.tsx`. El
 * panel de `/admin` es otra aplicación —con su propia navegación— y no tiene
 * por qué heredar la barra de categorías ni el carrito.
 *
 * Acá tampoco se leen cabeceras ni cookies a propósito: hacerlo obligaría a
 * renderizar en cada visita **todo** el árbol, y las páginas de categoría y de
 * producto se generan estáticamente.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <TagManager />
        {children}
      </body>
    </html>
  )
}
