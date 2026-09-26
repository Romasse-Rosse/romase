/**
 * Productos bajo pedido: los que no tienen precio publicado.
 *
 * El panel exige un precio para dar de alta un producto y no ofrece forma de
 * decir «todavía no lo sé», así que quien carga el catálogo escribe `1` como
 * marcador. El 26 de septiembre de 2026 había 58 productos así —cocinas,
 * conservadoras, vitrinas y visicoolers Maigas— y con Webpay en producción se
 * podían comprar de verdad por un peso.
 *
 * Estos productos existen y se muestran, pero no se venden en línea: se
 * cotizan. No llevan precio, no se agregan al carrito y no salen en el feed de
 * Merchant Center.
 *
 * **El umbral es una red de contención, no la solución.** Lo correcto es una
 * columna propia en la base que marque el producto como «a cotizar», y que el
 * panel deje dejar el precio vacío. Mientras tanto esto protege el cobro sin
 * pedirle a nadie que toque 58 fichas a mano.
 */

/**
 * Debajo de esto no hay precio real, hay un marcador.
 *
 * Salió de mirar el catálogo: los marcadores valen exactamente 1 y el producto
 * real más barato vale 850. Entre medio no hay nada, así que 100 separa las
 * dos cosas con holgura y además atrapa otros marcadores plausibles (0, 10, 50)
 * sin rozar ningún producto legítimo.
 */
export const UMBRAL_BAJO_PEDIDO = 100

/** ¿Este precio es un marcador en vez de un precio? */
export function esBajoPedido(precio: number | null | undefined): boolean {
  if (precio === null || precio === undefined) return true
  if (!Number.isFinite(precio)) return true
  return precio <= UMBRAL_BAJO_PEDIDO
}
