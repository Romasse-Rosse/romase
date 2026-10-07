import type { MetadataRoute } from 'next'
import { getAllCategorySlugs, getAllProductSlugs } from '@/lib/catalog'
import { site } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getAllProductSlugs(), getAllCategorySlugs()])
  // La categoría de pruebas no es una landing comercial. Se conserva en el
  // catálogo/panel, pero no debe proponerse a Google para indexación.
  const publicCategories = categories.filter((slug) => slug !== 'test-categoria')
  const now = new Date()

  const estaticas: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/nosotros`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${site.url}/contacto`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    {
      url: `${site.url}/politica-de-devoluciones`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${site.url}/politica-de-privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  return [
    ...estaticas,
    // Las categorías van con prioridad alta: son las páginas con contenido
    // propio y las que tienen que posicionar.
    ...publicCategories.map((slug) => ({
      url: `${site.url}/categorias/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((slug) => ({
      url: `${site.url}/productos/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
