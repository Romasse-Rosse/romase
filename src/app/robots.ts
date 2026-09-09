import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Los resultados de búsqueda y las combinaciones de filtros generan
      // infinitas URLs sin contenido propio: no aportan al índice.
      // El blog está construido pero sin publicar: ver src/content/blog.ts.
      // El panel además lleva noindex en su metadata; esto evita que
      // siquiera se intente rastrear.
      disallow: ['/api/', '/buscar', '/blog', '/admin'],
    },
    sitemap: `${site.url}/sitemap.xml`,
  }
}
