/**
 * Diapositivas del banner de portada.
 *
 * Cada una es una de las secciones del catálogo, con una foto de ambiente que
 * la representa. Las fotos están en public/banner/ y las baja
 * scripts/fetch-banner-images.mjs; la procedencia y la licencia de cada una
 * quedan en public/banner/creditos.json.
 *
 * El orden es el que se ve al rotar. Para sacar o sumar una sección basta
 * editar esta lista: el conteo de productos y el enlace salen del catálogo.
 */
export type BannerSlide = {
  /** Slug de la categoría: de ahí salen el nombre, el enlace y el conteo. */
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
  {
    slug: 'vitrinas',
    imagen: 'vitrinas',
    titular: 'Vitrinas que venden solas',
    bajada:
      'Frías y calientes. Una buena exhibición decide si tu producto se vende o se queda en el mostrador.',
  },
  {
    slug: 'repuestos',
    imagen: 'repuestos',
    titular: 'Repuestos con stock en Chile',
    bajada:
      'Una máquina detenida cuesta más que la pieza que le falta. Por eso mantenemos el repuesto acá.',
  },
]
