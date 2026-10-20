import type { Product } from './catalog'
import { esBajoPedido } from './bajo-pedido'
import { stripHtml, titleCase, truncate } from './format'

/** No se anuncian ofertas gratuitas ni precios inventados para equipos a cotizar. */
export function productSchemaFor(product: Product, origin: string) {
  // Sin una oferta, reseña o valoración real no se publica Product para rich results.
  // La ficha sigue indexable; mantiene Store y BreadcrumbList, y su cotización intacta.
  if (esBajoPedido(product.price)) return null
  const name = titleCase(product.name)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    sku: product.sku ?? undefined,
    description: truncate(stripHtml(product.description || product.shortDescription), 300) || name,
    image: product.images.map((image) => new URL(image.src, origin).href),
    // ROMASE es el vendedor, no el fabricante. El catálogo no tiene marca
    // verificada: se omite antes que deducirla de una compatibilidad o inventarla.
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'CLP',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/BackOrder',
      url: new URL('/productos/' + product.slug, origin).href,
      seller: { '@type': 'Organization', name: 'ROMASE' },
    },
  }
}
