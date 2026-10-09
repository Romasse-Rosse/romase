import type { NextConfig } from 'next'
import { seoRedirects } from './src/content/seo-redirects'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Las imágenes siguen alojadas en el WordPress actual mientras dura la
      // migración. Al pasarlas a Supabase Storage se agrega ese host y se
      // puede sacar este.
      { protocol: 'https', hostname: 'romase.cl', pathname: '/wp-content/uploads/**' },
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
    // Solo WebP. Medido sobre una foto del catálogo, AVIF tarda 739 ms contra
    // 198 ms de WebP y devuelve un archivo más grande (39 KB contra 29 KB):
    // en una instancia chica es memoria y CPU a cambio de nada.
    formats: ['image/webp'],

    // Menos variantes posibles: cada ancho distinto es una imagen más que el
    // servidor puede tener que generar y guardar. 3840 no aporta con fuentes
    // de 2000 px de ancho.
    deviceSizes: [640, 828, 1080, 1440, 1920],
    imageSizes: [64, 96, 128, 256, 384],

    // Un mes de caché en las variantes ya generadas.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async redirects() {
    return [
      ...seoRedirects,
      // El sitio viejo dejó URLs sin nombre: /9-2 era el carrito y /8-2 el
      // checkout. Ahora tienen destino propio con URL legible.
      { source: '/9-2', destination: '/carrito', permanent: true },
      { source: '/8-2', destination: '/checkout', permanent: true },
      { source: '/tienda/:path*', destination: '/productos/:path*', permanent: true },
      { source: '/producto/:slug', destination: '/productos/:slug', permanent: true },
      { source: '/categoria-producto/:slug', destination: '/categorias/:slug', permanent: true },
      // Ya no hay página de catálogo completo: la navegación es por categoría.
      { source: '/productos', destination: '/', permanent: false },
    ]
  },
}

export default nextConfig
