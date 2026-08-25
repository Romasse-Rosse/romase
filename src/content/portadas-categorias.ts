/**
 * Qué producto ilustra cada categoría en la portada.
 *
 * Las tarjetas de «Compra por categoría» muestran la foto de un producto real
 * en vez de un icono: es el catálogo el que se vende, no una ilustración. La
 * elección es a mano y no automática a propósito —el producto más caro de una
 * categoría no es necesariamente el que la representa, y varias fotos del
 * catálogo tienen fondos o encuadres que no funcionan a este tamaño—.
 *
 * Criterio con el que se eligieron: que el objeto se reconozca de un vistazo,
 * que la foto esté recortada sobre blanco y que represente el rubro completo,
 * no un accesorio suelto.
 *
 * Lo del fondo blanco no es un detalle: la tarjeta es blanca y varias fotos del
 * catálogo vienen sobre gris claro, que se ve como un rectángulo pegado. Se
 * midieron las esquinas de cada candidata y solo entraron las que dan 250 o más
 * sobre 255. Por eso panadería lleva la batidora planetaria y no la amasadora,
 * que además tiene una flecha roja dibujada encima.
 *
 * El otro filtro es que la foto sea del producto de verdad. 75 de los 214
 * productos del catálogo tienen como foto principal una imagen generada por IA
 * —el nombre del archivo lo delata: `Gemini_Generated_Image_*` o
 * `ChatGPT-Image-*`—, y ninguna de esas puede ser la cara de una categoría.
 * En artículos de pastelería es casi toda la rama, y el único producto con foto
 * real es la caja de balines: por eso ilustra la categoría, aunque un molde la
 * representaría mejor. Se resuelve el día que haya fotos reales de los moldes.
 *
 * Si algún día se saca de venta uno de estos productos, la tarjeta cae sola al
 * primer producto con foto de la categoría (ver `getCategoryCovers`).
 */
export const portadasCategorias: Record<string, string> = {
  panaderia: 'batidora-planetaria-20-lts-pareti-kitchenette',
  gastronomia: 'fondo-aluminio-40-lts',
  complementarios: 'maquina-de-jugos-vj-183-ventus',
  calor: 'horno-convector-con-humidificador-vhc-4a-ventus',
  'frio-2': 'freezer-vertical-163-lts-libero',
  vitrinas: 'vitrina-mantenedora-de-calor-sobremesa-curva-vmcd-3-ventus',
  acero: 'carro-multiservicio-3-niveles-ecobeck',
  // El único producto de la rama con foto real; ver la nota de arriba.
  'articulos-de-pasteleria': 'balines-para-sifon-crema-isi',
  repuestos: 'batidor-globo-para-batidora-20-lts-ventus',
}
