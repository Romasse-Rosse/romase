import type { Product } from '@/lib/catalog'
import { esBajoPedido } from './bajo-pedido'

/**
 * Feed de productos para Google Merchant Center.
 *
 * ------------------------------------------------------------------
 * Por qué un feed XML y no la Content API
 * ------------------------------------------------------------------
 * La Content API necesita un proyecto de Google Cloud, credenciales OAuth y un
 * proceso que empuje los cambios. El feed es una URL que Google va a buscar
 * cuando quiere: no hay credenciales que guardar ni que rotar, y si el sitio
 * está arriba el feed está al día. Para un catálogo de 214 productos que cambia
 * poco, la API no compra nada.
 *
 * ------------------------------------------------------------------
 * Qué exige Merchant Center y qué hacemos con lo que falta
 * ------------------------------------------------------------------
 * Un producto sin imagen no se puede listar: se excluye del feed en vez de
 * mandarlo para que Google lo rechace. Lo mismo con precio en cero.
 *
 * La marca es obligatoria salvo que se declare que no hay identificadores. Los
 * productos de ROMASE no tienen columna de marca, pero muchos la traen en el
 * nombre —«Balanza 40 KG Ventus»—, así que se detecta de ahí. Cuando no se
 * puede, se manda `identifier_exists: no`, que es la forma documentada de
 * decirle a Google «este producto no tiene marca ni GTIN ni MPN» en vez de
 * inventar una.
 *
 * `google_product_category` se omite a propósito. Poner un id equivocado del
 * árbol de Google es peor que no ponerlo: Google lo infiere solo, y con una
 * categoría mal declarada la campaña compite en el lugar equivocado. Se manda
 * `product_type`, que es nuestra propia taxonomía y es texto libre.
 */

/**
 * Marcas que aparecen en los nombres del catálogo.
 *
 * Salió de contar el catálogo real: Ventus en 33 productos, Ecobeck en 20,
 * Pareti en 7, Cousiño en 5, Maigas en 3, ISI en 2. El resto no tiene marca
 * reconocible en el nombre.
 *
 * La clave se busca en minúsculas dentro del nombre; el valor es cómo se
 * escribe la marca.
 */
export const MARCAS_CONOCIDAS: Record<string, string> = {
  ventus: 'Ventus',
  ecobeck: 'Ecobeck',
  pareti: 'Pareti',
  kitchenette: 'Pareti Kitchenette',
  'cousiño': 'Cousiño',
  cousino: 'Cousiño',
  maigas: 'Maigas',
  isi: 'ISI',
  vulcano: 'Vulcano',
  hobart: 'Hobart',
  javar: 'Javar',
  doregrill: 'Doregrill',
}

/** Detecta la marca en el nombre. Devuelve null si no hay ninguna reconocible. */
export function marcaDe(nombre: string): string | null {
  const n = nombre.toLowerCase()
  for (const [clave, marca] of Object.entries(MARCAS_CONOCIDAS)) {
    // Con límites de palabra: «isi» no puede salir de «pisos» ni de «isidro».
    if (new RegExp(`(^|[^a-záéíóúñ])${clave}([^a-záéíóúñ]|$)`, 'i').test(n)) return marca
  }
  return null
}

export type MotivoDeExclusion = 'sin-imagen' | 'sin-precio'

/** ¿Se puede listar en Merchant Center? */
export function motivoDeExclusion(producto: Product): MotivoDeExclusion | null {
  if (producto.images.length === 0) return 'sin-imagen'
  if (esBajoPedido(producto.price)) return 'sin-precio'
  return null
}

export const EXPLICACION_EXCLUSION: Record<MotivoDeExclusion, string> = {
  'sin-imagen': 'Sin foto. Merchant Center no lista productos sin imagen.',
  'sin-precio': 'Precio en cero. Merchant Center lo rechaza.',
}

/** Escapa lo que XML no admite en el contenido de un elemento. */
function xml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Quita etiquetas y espacios de sobra: el feed no admite HTML. */
export function sinHtml(valor: string): string {
  return valor
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function recortar(valor: string, maximo: number): string {
  if (valor.length <= maximo) return valor
  // Se corta en el último espacio para no partir una palabra al medio.
  const corte = valor.slice(0, maximo)
  const espacio = corte.lastIndexOf(' ')
  return (espacio > maximo * 0.6 ? corte.slice(0, espacio) : corte).trim()
}

/** Absoluta siempre: Google rechaza las rutas relativas. */
function absoluta(ruta: string, origen: string): string {
  if (/^https?:\/\//i.test(ruta)) return ruta
  return origen.replace(/\/$/, '') + (ruta.startsWith('/') ? ruta : `/${ruta}`)
}

export type ItemDelFeed = {
  producto: Product
  nombre: string
  rutaCategoria: string
}

/**
 * Un `<item>` del feed.
 *
 * `price` lleva el precio de lista y `sale_price` el vigente cuando hay
 * descuento. Al revés —mandar el precio con descuento como `price`— Shopping
 * no muestra que hay oferta y se pierde justamente lo que hace clic.
 */
function item({ producto, nombre, rutaCategoria }: ItemDelFeed, origen: string): string {
  const enlace = `${origen.replace(/\/$/, '')}/productos/${producto.slug}`
  const marca = marcaDe(nombre)

  const descripcion =
    recortar(sinHtml(producto.description ?? producto.shortDescription ?? ''), 4900) ||
    `${nombre}. Consulta disponibilidad y despacho.`

  const normal = producto.regularPrice && producto.regularPrice > producto.price
    ? producto.regularPrice
    : producto.price

  const lineas = [
    `      <g:id>${xml(String(producto.id))}</g:id>`,
    producto.sku ? `      <g:mpn>${xml(producto.sku)}</g:mpn>` : null,
    `      <g:title>${xml(recortar(nombre, 150))}</g:title>`,
    `      <g:description>${xml(descripcion)}</g:description>`,
    `      <g:link>${xml(enlace)}</g:link>`,
    `      <g:image_link>${xml(absoluta(producto.images[0].src, origen))}</g:image_link>`,
    // Hasta diez adicionales admite Google; con dos o tres alcanza y el feed
    // no se infla.
    ...producto.images
      .slice(1, 4)
      .map(
        (i) =>
          `      <g:additional_image_link>${xml(absoluta(i.src, origen))}</g:additional_image_link>`,
      ),
    `      <g:availability>${producto.inStock ? 'in_stock' : 'backorder'}</g:availability>`,
    `      <g:condition>new</g:condition>`,
    `      <g:price>${normal} CLP</g:price>`,
    normal > producto.price ? `      <g:sale_price>${producto.price} CLP</g:sale_price>` : null,
    marca ? `      <g:brand>${xml(marca)}</g:brand>` : null,
    // Sin marca, sin GTIN y sin MPN de fabricante: se declara en vez de
    // inventar una marca, que es motivo de rechazo.
    marca ? null : `      <g:identifier_exists>no</g:identifier_exists>`,
    rutaCategoria ? `      <g:product_type>${xml(rutaCategoria)}</g:product_type>` : null,
  ].filter(Boolean)

  return `    <item>\n${lineas.join('\n')}\n    </item>`
}

export function construirFeed({
  items,
  origen,
  nombreTienda,
  descripcionTienda,
}: {
  items: ItemDelFeed[]
  origen: string
  nombreTienda: string
  descripcionTienda: string
}): string {
  const cuerpo = items.map((i) => item(i, origen)).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>${xml(nombreTienda)}</title>`,
    `    <link>${xml(origen)}</link>`,
    `    <description>${xml(descripcionTienda)}</description>`,
    cuerpo,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
