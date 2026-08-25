/**
 * Rescate de productos que quedaron sin categoría en WooCommerce.
 *
 * Al migrar aparecieron 12 productos sin ninguna categoría asignada, y son
 * justamente la maquinaria de mayor valor del catálogo (amasadoras, sobadoras
 * y batidoras planetarias, de hasta $1.236.000). Sin categoría no aparecen en
 * ninguna página de categoría ni en el menú: en el sitio anterior estaban,
 * en la práctica, escondidos.
 *
 * La evidencia de que pertenecen a PANADERÍA es el propio conteo de
 * WooCommerce: la categoría declara 53 productos y solo 41 la referencian.
 * Los 12 que faltan son exactamente estos, así que se les devuelve la
 * asignación que perdieron.
 *
 * Esto es un parche de migración. Lo correcto es corregir la asignación en el
 * origen —o directamente en Supabase, en product_categories— y luego borrar
 * este archivo.
 */

/** id de la categoría PANADERÍA en WooCommerce. */
const PANADERIA = 15

/** SKU del producto → ids de categoría que hay que asignarle. */
export const categoriasPorSku: Record<string, number[]> = {
  '19454': [PANADERIA], // BATIDORA 7 LTS ECOBECK
  '19408': [PANADERIA], // REVOLVEDORA DE SOBREMESA 5 KG VENTUS
  '17295': [PANADERIA], // BATIDORA PLANETARIA 20 LTS PARETI KITCHENETTE
  '19426': [PANADERIA], // QUEMADOR DE FIERRO FUNDIDO 21 CM CON CACHIMBA
  '20369': [PANADERIA], // SOBADORA 50 CM. MONOF
  '21114': [PANADERIA], // SOBADORA HERCULES 50 CM
  '18490': [PANADERIA], // AMASADORA 22 KG
  hs30: [PANADERIA], //    AMASADORA 12 KG
  '18468': [PANADERIA], // BATIDORA 30 LTS
  '18467': [PANADERIA], // BATIDORA 20 LTS
  '21026': [PANADERIA], // AMASADORA 8 KG
  '19531': [PANADERIA], // BATIDORA 10 LTS
}

/** Devuelve las categorías del producto, completando las que falten. */
export function categoriasDeProducto(
  sku: string | null,
  actuales: number[],
): number[] {
  if (actuales.length > 0 || !sku) return actuales
  return categoriasPorSku[sku] ?? []
}
