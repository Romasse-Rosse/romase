/**
 * Diapositivas del banner de portada.
 *
 * Cada una es una de las secciones del catálogo, con una foto de ambiente que
 * la representa. Las fotos están en public/banner/ y las baja
 * scripts/fetch-banner-images.mjs; la procedencia y la licencia de cada una
 * quedan en public/banner/creditos.json.
 *
 * Son tres a propósito: un banner que rota cinco veces cansa antes de que
 * alguien llegue a la tercera. El orden es el que se ve al rotar, y para
 * cambiar la selección basta editar esta lista.
 */
export type BannerSlide = {
  /** Slug de la categoría: de ahí sale el enlace de la diapositiva. */
  slug: string
  /** Archivo en public/banner/, sin extensión. */
  imagen: string
  titular: string
  bajada: string
}

export const bannerSlides: BannerSlide[] = [
  {
    slug: 'panaderia',
    imagen: 'panaderia',
    titular: 'Maquinaria para panadería',
    bajada:
      'Amasadoras, sobadoras y estiradoras dimensionadas para la producción de cada día, con repuestos en stock.',
  },
  {
    slug: 'gastronomia',
    imagen: 'gastronomia',
    titular: 'Equipamiento para cocinas profesionales',
    bajada:
      'Cuchillos, fondos, bandejas y picadoras: las herramientas que sostienen el servicio, todos los días.',
  },
  {
    slug: 'complementarios',
    imagen: 'complementarios',
    titular: 'Equipos que amplían tu carta',
    bajada:
      'Máquinas de café, balanzas, licuadoras, waffleras y selladoras. Poca inversión, producto nuevo.',
  },
]
