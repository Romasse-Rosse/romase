import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Los resultados de búsqueda y las combinaciones de filtros generan
      // infinitas URLs sin contenido propio: no aportan al índice.
      disallow: ['/api/', '/productos?'],
    },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
