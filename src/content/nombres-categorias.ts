/**
 * Nombres de categoría para mostrar.
 *
 * En WooCommerce están cargados en mayúscula sostenida y varios perdieron las
 * tildes ("PANADERIA", "GASTRONOMIA", "Maquina de conos"). Se corrigen acá, en
 * vez de tocar la base de origen, para que la migración siga siendo repetible.
 *
 * Algunos nombres además se hicieron más explícitos —"ACERO" pasa a "Acero
 * inoxidable", "CALOR" a "Línea de calor"— porque el menú tiene que leerse como
 * categorías de producto, que es lo que se acordó en el kick-off, y porque son
 * los términos que la gente busca.
 *
 * Solo cambia lo que se muestra: los slugs y los datos quedan intactos.
 */
export const nombresCategorias: Record<string, string> = {
  // Raíz
  panaderia: 'Panadería',
  'articulos-de-pasteleria': 'Artículos de pastelería',
  gastronomia: 'Gastronomía',
  acero: 'Acero inoxidable',
  calor: 'Línea de calor',
  'frio-2': 'Línea de frío',
  complementarios: 'Equipos complementarios',
  vitrinas: 'Vitrinas',
  repuestos: 'Repuestos',

  // Tildes faltantes
  'camara-desengrasadora': 'Cámara desengrasadora',
  'exprimidor-de-citricos': 'Exprimidor de cítricos',
  'maquina-de-conos': 'Máquina de conos',
  'maquina-de-pop-corn': 'Máquina de pop corn',
  'maquina-de-yoguis': 'Máquina de yogurt',
  'maquinas-de-jugos': 'Máquinas de jugos',
  'maquinas-de-cafe': 'Máquinas de café',

  // Desambiguación: hay dos categorías llamadas "Bandejas" en ramas distintas
  'bandejas-acero': 'Bandejas de acero',
  bandejas: 'Bandejas de servicio',

  // Subcategorías de calor y vitrinas, que repiten el nombre del padre
  'calor-vitrinas': 'Vitrinas calientes',
}

/** Nombre a mostrar de una categoría; si no hay override, se usa el de origen. */
export function nombreCategoria(slug: string, original: string): string {
  return nombresCategorias[slug] ?? original
}
