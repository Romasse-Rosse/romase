/**
 * Reglas de las categorías, aparte de la interfaz para poder probarlas.
 *
 * Acá vive lo que, si sale mal, no se nota hasta que la tienda deja de
 * funcionar: sobre todo que la jerarquía no tenga ciclos.
 */

export type CategoriaCruda = {
  id: number
  nombre: string
  slug: string
  padreId: number | null
}

/** Nombre a dirección web. Igual que en productos, y por el mismo motivo. */
export function aSlug(nombre: string): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'categoria'
  )
}

/** Elige el primer slug libre agregando -2, -3… */
export function slugLibre(base: string, tomados: Iterable<string>): string {
  const usados = new Set(tomados)
  let slug = base
  for (let n = 2; usados.has(slug); n++) slug = `${base}-${n}`
  return slug
}

/**
 * Todos los descendientes de una categoría.
 *
 * Recorre con una pila y con un conjunto de visitados. Lo segundo no es una
 * precaución de estilo: si los datos ya tuvieran un ciclo, un recorrido
 * ingenuo no termina nunca.
 */
export function descendientes(id: number, categorias: CategoriaCruda[]): Set<number> {
  const hijosDe = new Map<number, number[]>()
  for (const c of categorias) {
    if (c.padreId === null) continue
    hijosDe.set(c.padreId, [...(hijosDe.get(c.padreId) ?? []), c.id])
  }

  const encontrados = new Set<number>()
  const pila = [...(hijosDe.get(id) ?? [])]

  while (pila.length > 0) {
    const actual = pila.pop()!
    if (encontrados.has(actual)) continue
    encontrados.add(actual)
    pila.push(...(hijosDe.get(actual) ?? []))
  }

  return encontrados
}

export type MotivoInvalido =
  | 'padre-inexistente'
  | 'padre-es-ella-misma'
  | 'padre-es-descendiente'
  | 'demasiada-profundidad'

export const EXPLICACION: Record<MotivoInvalido, string> = {
  'padre-inexistente': 'Esa categoría madre no existe.',
  'padre-es-ella-misma': 'Una categoría no puede colgar de sí misma.',
  'padre-es-descendiente':
    'No se puede colgar una categoría de una de sus propias subcategorías: la jerarquía ' +
    'quedaría dando vueltas sobre sí misma y la tienda dejaría de cargar.',
  'demasiada-profundidad':
    'El sitio muestra dos niveles: rubro y subcategoría. Un tercer nivel no se vería en ' +
    'ninguna parte.',
}

/**
 * ¿Se puede colgar `id` de `padreId`?
 *
 * **El caso que importa es el ciclo.** El árbol del catálogo se arma con una
 * función recursiva que acumula los productos de cada rama; si A cuelga de B y
 * B cuelga de A, esa función no termina y se cae la tienda entera, no solo la
 * categoría. La base no lo impide sola: `parent_id` es una clave ajena a la
 * misma tabla y Postgres acepta ciclos sin protestar.
 *
 * `null` significa que es válido.
 */
export function motivoParaRechazarElPadre(
  id: number | null,
  padreId: number | null,
  categorias: CategoriaCruda[],
): MotivoInvalido | null {
  if (padreId === null) return null

  const padre = categorias.find((c) => c.id === padreId)
  if (!padre) return 'padre-inexistente'

  // Al crear no hay id todavía: solo hay que comprobar la profundidad.
  if (id === null) return padre.padreId === null ? null : 'demasiada-profundidad'

  if (padreId === id) return 'padre-es-ella-misma'
  if (descendientes(id, categorias).has(padreId)) return 'padre-es-descendiente'

  // Dos niveles: el padre tiene que ser una raíz.
  if (padre.padreId !== null) return 'demasiada-profundidad'

  // Y si esta categoría tiene hijas, al colgarla de otra quedarían en un
  // tercer nivel.
  const tieneHijas = categorias.some((c) => c.padreId === id)
  if (tieneHijas) return 'demasiada-profundidad'

  return null
}

export type NodoDelPanel = CategoriaCruda & {
  productosPropios: number
  productosEnLaRama: number
  hijas: NodoDelPanel[]
  /** Si no tiene productos ni hijas con productos, la tienda no la muestra. */
  visibleEnLaTienda: boolean
}

/**
 * Arma el árbol para el panel.
 *
 * A diferencia del de la tienda, este **no esconde las vacías**: el panel tiene
 * que mostrarlas justamente para que se sepa que existen y por qué no se ven.
 */
export function arbolDelPanel(
  categorias: CategoriaCruda[],
  productosPorCategoria: Map<number, number>,
): NodoDelPanel[] {
  const nodos = new Map<number, NodoDelPanel>(
    categorias.map((c) => [
      c.id,
      {
        ...c,
        productosPropios: productosPorCategoria.get(c.id) ?? 0,
        productosEnLaRama: 0,
        hijas: [],
        visibleEnLaTienda: false,
      },
    ]),
  )

  const raices: NodoDelPanel[] = []
  for (const nodo of nodos.values()) {
    const padre = nodo.padreId === null ? null : nodos.get(nodo.padreId)
    // Una categoría cuyo padre no existe se trata como raíz en vez de
    // desaparecer del listado: si no, quedaría invisible también en el panel y
    // nadie podría arreglarla.
    if (padre && padre.id !== nodo.id) padre.hijas.push(nodo)
    else raices.push(nodo)
  }

  const acumular = (nodo: NodoDelPanel, vistos: Set<number>): number => {
    if (vistos.has(nodo.id)) return 0
    vistos.add(nodo.id)

    let total = nodo.productosPropios
    for (const hija of nodo.hijas) total += acumular(hija, vistos)

    nodo.productosEnLaRama = total
    nodo.visibleEnLaTienda = total > 0
    return total
  }

  for (const raiz of raices) acumular(raiz, new Set())

  const ordenar = (lista: NodoDelPanel[]): NodoDelPanel[] =>
    [...lista]
      .map((n) => ({ ...n, hijas: ordenar(n.hijas) }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return ordenar(raices)
}
