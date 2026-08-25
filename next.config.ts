import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Las imágenes siguen alojadas en el WordPress actual mientras dura la
      // migración. Al pasarlas a Supabase Storage se agrega ese host y se
      // puede sacar este.
      { protocol: 'https', hostname: 'romase.cl', pathname: '/wp-content/uploads/**' },
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async redirects() {
    return [
      // El sitio viejo dejó URLs sin nombre: /9-2 era el carrito y /8-2 el
      // checkout. Ahora tienen destino propio con URL legible.
      { source: '/9-2', destination: '/carrito', permanent: true },
      { source: '/8-2', destination: '/checkout', permanent: true },
      { source: '/tienda/:path*', destination: '/productos/:path*', permanent: true },
      { source: '/producto/:slug', destination: '/productos/:slug', permanent: true },
      { source: '/categoria-producto/:slug', destination: '/categorias/:slug', permanent: true },
    ]
  },
}

export default nextConfig
