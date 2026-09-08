/**
 * Promociones con vigencia.
 *
 * ------------------------------------------------------------------
 * Por qué el precio se calcula y no se guarda
 * ------------------------------------------------------------------
 * Un descuento con fecha de término guardado como precio nuevo obliga a que
 * alguien lo apague el día que vence. Si se olvida, la tienda sigue vendiendo
 * con descuento sin que nadie lo haya decidido. Acá vencer es dejar de
 * aplicarse.
 *
 * ------------------------------------------------------------------
 * La regla que no se puede romper
 * ------------------------------------------------------------------
 * **A nadie se le cobra más de lo que vio.**
 *
 * Las páginas de la tienda están generadas de antemano, así que una ficha puede
 * seguir mostrando un descuento unos minutos después de que venció. Si el
 * checkout fuera estricto, ese comprador vería $80.000 y pagaría $100.000.
 *
 * Por eso hay dos vigencias, y la del cobro es más larga:
 *
 *   · la vitrina aplica la promoción hasta `ends_at`;
 *   · el cobro la aplica hasta `ends_at` + GRACIA_COBRO.
 *
 * GRACIA_COBRO es holgadamente mayor que lo que una página puede quedar
 * desactualizada (ver TTL en las páginas de precio), así que el caso «cobré más
 * de lo que mostré» no existe. El caso contrario —cobrar menos de lo mostrado
 * en los últimos minutos— sí puede pasar, y a favor del comprador.
 */

/** Cuánto sigue valiendo una promoción vencida a la hora de cobrar. */
export const GRACIA_COBRO = 15 * 60 * 1000

export type Promocion = {
  id: number
  alcance: 'producto' | 'categoria'
  productoId: number | null
  categoriaId: number | null
  porcentaje: number
  etiqueta: string | null
  desde: number
  hasta: number | null
  activa: boolean
}

/** Lo mínimo que necesita el cálculo. Sirve para Product y para una fila cruda. */
export type ProductoConPrecio = {
  id: number
  price: number
  regularPrice: number | null
  salePrice: number | null
  onSale: boolean
  categoryIds: number[]
}

/** ¿Está vigente en este instante, con la gracia que corresponda? */
export function vigente(promo: Promocion, ahora: number, gracia = 0): boolean {
  if (!promo.activa) return false
  if (promo.desde > ahora) return false
  if (promo.hasta !== null && ahora >= promo.hasta + gracia) return false
  return true
}

/**
 * Qué descuento le toca a un producto.
 *
 * Gana la más específica: una promoción del producto le pisa a la de su
 * categoría. Eso es lo que permite «Panadería al 20 %, pero esta amasadora al
 * 5 %» sin listas de excepciones. Entre dos del mismo alcance gana la de mayor
 * descuento.
 */
export function promocionQueAplica(
  producto: Pick<ProductoConPrecio, 'id' | 'categoryIds'>,
  promos: Promocion[],
  ahora: number,
  gracia = 0,
): Promocion | null {
  let mejorDelProducto: Promocion | null = null
  let mejorDeCategoria: Promocion | null = null

  for (const promo of promos) {
    if (!vigente(promo, ahora, gracia)) continue

    if (promo.alcance === 'producto') {
      if (promo.productoId !== producto.id) continue
      if (!mejorDelProducto || promo.porcentaje > mejorDelProducto.porcentaje) {
        mejorDelProducto = promo
      }
      continue
    }

    if (promo.categoriaId === null) continue
    if (!producto.categoryIds.includes(promo.categoriaId)) continue
    if (!mejorDeCategoria || promo.porcentaje > mejorDeCategoria.porcentaje) {
      mejorDeCategoria = promo
    }
  }

  return mejorDelProducto ?? mejorDeCategoria
}

export type PrecioResuelto = {
  price: number
  regularPrice: number | null
  salePrice: number | null
  onSale: boolean
  promocion: { id: number; porcentaje: number; etiqueta: string | null } | null
}

/**
 * Aplica el descuento a un producto.
 *
 * El porcentaje se calcula sobre el **precio normal**, no sobre el vigente. Si
 * se calculara sobre el vigente, un producto que ya tenía oferta propia
 * acumularía los dos descuentos y terminaría a un precio que nadie definió.
 *
 * Y se toma el menor entre la oferta que ya tenía y la de la promoción: si el
 * producto estaba más barato por su cuenta, la promoción no puede subirle el
 * precio.
 */
export function resolverPrecio(
  producto: ProductoConPrecio,
  promos: Promocion[],
  ahora: number,
  gracia = 0,
): PrecioResuelto {
  const promo = promocionQueAplica(producto, promos, ahora, gracia)

  if (!promo) {
    return {
      price: producto.price,
      regularPrice: producto.regularPrice,
      salePrice: producto.salePrice,
      onSale: producto.onSale,
      promocion: null,
    }
  }

  const base = producto.regularPrice ?? producto.price
  // CLP no tiene decimales.
  const conDescuento = Math.round(base * (1 - promo.porcentaje / 100))
  const precio = Math.min(producto.price, conDescuento)

  return {
    price: precio,
    regularPrice: base,
    salePrice: precio,
    onSale: precio < base,
    promocion: { id: promo.id, porcentaje: promo.porcentaje, etiqueta: promo.etiqueta },
  }
}

/**
 * Cuándo cambia el próximo precio.
 *
 * El catálogo se guarda en memoria hasta una hora. Si una promoción empieza o
 * termina antes, hay que recalcular antes: sin esto, un descuento configurado
 * para las 15:00 podría aparecer a las 15:50 y uno que venció seguiría vigente
 * casi una hora.
 *
 * Devuelve el instante del próximo cambio, o null si no hay ninguno a la vista.
 */
export function proximoCambio(promos: Promocion[], ahora: number): number | null {
  let proximo: number | null = null

  const considerar = (momento: number | null) => {
    if (momento === null || momento <= ahora) return
    if (proximo === null || momento < proximo) proximo = momento
  }

  for (const promo of promos) {
    if (!promo.activa) continue
    considerar(promo.desde)
    considerar(promo.hasta)
    // El fin del período de gracia también cambia lo que se cobra.
    if (promo.hasta !== null) considerar(promo.hasta + GRACIA_COBRO)
  }

  return proximo
}

/** Estado legible para el panel. */
export function estadoDeLaPromocion(
  promo: Promocion,
  ahora: number,
): 'programada' | 'vigente' | 'vencida' | 'apagada' {
  if (!promo.activa) return 'apagada'
  if (promo.desde > ahora) return 'programada'
  if (promo.hasta !== null && ahora >= promo.hasta) return 'vencida'
  return 'vigente'
}
