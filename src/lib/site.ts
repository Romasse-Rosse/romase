/** Datos del negocio. Tomados del sitio actual (romase.cl) y del kick-off. */
export const site = {
  name: 'ROMASE',
  legalName: 'Rosse Marie Sepúlveda · ROMASE',
  tagline: 'Maquinaria y equipamiento gastronómico',
  description:
    'Más de 24 años entregando maquinaria y equipamiento para panaderías, pastelerías, hoteles, ' +
    'restaurantes y supermercados. Despacho desde Puerto Montt a la Región de Los Lagos y al sur.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://romase.cl',
  yearsInBusiness: 24,

  contact: {
    /**
     * Hay dos números de atención y los dos se publican.
     *
     * `phone` es el principal —el mismo que atiende WhatsApp— y es el que se usa
     * donde solo cabe uno, como en los mensajes de error del checkout. Donde se
     * puede listar más de uno va `phones`.
     */
    phone: '+56 9 2631 3218',
    phoneHref: 'tel:+56926313218',
    phones: [
      { numero: '+56 9 2631 3218', href: 'tel:+56926313218' },
      { numero: '+56 9 8502 5538', href: 'tel:+56985025538' },
    ],
    whatsapp: '56926313218',
    email: 'rmspmontt@gmail.com',
    address: 'Avda. Cuarta Terraza 5082, Valle Volcanes',
    city: 'Puerto Montt',
    /** Va en la política de devoluciones, que es un texto legal. */
    postalCode: '5500846',
    region: 'Los Lagos',
    country: 'CL',
  },

  hours: [
    { days: 'Lunes a viernes', time: '09:30 – 13:00 / 14:00 – 18:00' },
  ],

  social: [
    { name: 'Instagram', url: 'https://www.instagram.com/romasepuertomontt/' },
    { name: 'Facebook', url: 'https://www.facebook.com/romase.puerto.montt/' },
  ],

  /**
   * Transportistas entre los que elige el comprador.
   *
   * El despacho va **por pagar**: el flete lo paga quien recibe, directamente a
   * la empresa de transporte. Por eso el pedido no lleva costo de envío y no
   * hay nada que cotizar.
   */
  carriers: [
    { id: 'cruz-del-sur', name: 'Cruz del Sur' },
    { id: 'starken', name: 'Starken' },
    { id: 'chilexpress', name: 'Chilexpress' },
    { id: 'bluexpress', name: 'Blue Express' },
  ],
} as const

/**
 * Regiones donde ROMASE vende, para el selector de dirección.
 *
 * No son las 16 de Chile a propósito: la cobertura va **desde la Región de Los
 * Lagos hacia el sur**. Ofrecer regiones que no se atienden hace que alguien
 * complete el pedido y después haya que decirle que no se puede despachar.
 *
 * Si mañana se amplía la cobertura, se agregan acá y el checkout se entera solo.
 */
export const regionesVenta = [
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
] as const

/** Abre WhatsApp con un mensaje ya escrito. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`
}

/** Argumentos de venta que se repiten en varias páginas. */
export const trustPoints = [
  {
    title: `${site.yearsInBusiness} años de trayectoria`,
    detail: 'Equipando cocinas y panaderías desde 2001, con servicio técnico propio.',
  },
  {
    title: 'Despacho al sur de Chile',
    detail:
      'Desde Puerto Montt a Los Lagos, Aysén y Magallanes, con el transporte que elijas. ' +
      'También puedes retirar en el local.',
  },
  {
    title: 'Asesoría antes de comprar',
    detail: 'Te decimos qué equipo rinde según tu volumen de producción y tu espacio.',
  },
  {
    title: 'Repuestos y postventa',
    detail: 'Mantenemos stock de repuestos para los equipos que vendemos.',
  },
] as const
