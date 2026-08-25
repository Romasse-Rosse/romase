/** Datos del negocio. Tomados del sitio actual (romase.cl) y del kick-off. */
export const site = {
  name: 'ROMASE',
  legalName: 'Rosse Marie Sepúlveda · ROMASE',
  tagline: 'Maquinaria y equipamiento gastronómico',
  description:
    'Más de 24 años entregando maquinaria y equipamiento para panaderías, pastelerías, hoteles, ' +
    'restaurantes y supermercados en todo Chile. Despacho a regiones desde Puerto Montt.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://romase.cl',
  yearsInBusiness: 24,

  contact: {
    phone: '+56 9 8502 5538',
    phoneHref: 'tel:+56985025538',
    whatsapp: '56985025538',
    email: 'rmspmontt@gmail.com',
    address: 'Avda. Cuarta Terraza 5082, Valle Volcanes',
    city: 'Puerto Montt',
    region: 'Los Lagos',
    country: 'CL',
  },

  hours: [
    { days: 'Lunes a viernes', time: '09:00 – 18:30' },
    { days: 'Sábado', time: '10:00 – 14:00' },
  ],

  social: [
    { name: 'Instagram', url: 'https://www.instagram.com/romasepuertomontt/' },
    { name: 'Facebook', url: 'https://www.facebook.com/romase.puerto.montt/' },
  ],

  /** Transportistas con los que se despacha, tal como en el sitio actual. */
  carriers: [
    { id: 'bluexpress', name: 'BLUExpress' },
    { id: 'chilexpress', name: 'Chilexpress' },
    { id: 'cruz-del-sur', name: 'Cruz del Sur' },
  ],
} as const

/** Regiones de Chile, para el selector de dirección. */
export const regionesChile = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
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
    title: 'Despacho a todo Chile',
    detail: 'Coordinamos el envío a regiones y entregamos en Puerto Montt sin costo.',
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
