import type { MetadataRoute } from 'next'
import { getAllCategorySlugs, getAllProductSlugs } from '@/lib/catalog'
import { site } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getAllProductSlugs(), getAllCategorySlugs()])
  // La categoría de pruebas no es una landing comercial. Se conserva en el
  // catálogo/panel, pero no debe proponerse a Google para indexación.
  const publicCategories = categories.filter((slug) => slug !== 'test-categoria')
  // Sin fechas verificables de edición, se omite lastModified: regenerar la
  // caché no significa que todas las páginas hayan cambiado.

  const estaticas: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/nosotros`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${site.url}/contacto`, changeFrequency: 'yearly', priority: 0.6 },
    {
      url: `${site.url}/politica-de-devoluciones`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${site.url}/politica-de-privacidad`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  return [
    ...estaticas,
    // Solo destinos canónicos y públicos; la prioridad no afecta al ranking.
    ...publicCategories.map((slug) => ({
      url: `${site.url}/categorias/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((slug) => ({
      url: `${site.url}/productos/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
