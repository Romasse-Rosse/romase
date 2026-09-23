// ============================================================
// ROMASE · Pruebas de las reglas de categorías
//
//   yarn categorias:probar
//
// Lo que se prueba acá es lo que, si sale mal, no se nota hasta que la tienda
// deja de cargar: sobre todo que no se pueda armar un ciclo en la jerarquía.
// El árbol del catálogo se recorre con una función recursiva; con A colgando de
// B y B de A, esa función no termina y cae el sitio entero.
// ============================================================

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, '..')

const copia = join(tmpdir(), 'romase-categorias-panel.ts')
writeFileSync(copia, readFileSync(join(raiz, 'src/lib/categorias-panel.ts'), 'utf8'), 'utf8')

const { aSlug, slugLibre, descendientes, motivoParaRechazarElPadre, arbolDelPanel } = await import(
  pathToFileURL(copia).href
)

let fallos = 0
const comprobar = (nombre, condicion, detalle = '') => {
  if (!condicion) fallos++
  console.log(`${condicion ? ' ok ' : 'FALLA'}  ${nombre}${detalle ? ` · ${detalle}` : ''}`)
}

// Jerarquía de prueba:
//   1 Panadería
//     11 Amasadoras
//     12 Hornos
//   2 Gastronomía
//     21 Cocinas
//   3 Repuestos (sin hijas)
const CATS = [
  { id: 1, nombre: 'Panadería', slug: 'panaderia', padreId: null },
  { id: 11, nombre: 'Amasadoras', slug: 'amasadoras', padreId: 1 },
  { id: 12, nombre: 'Hornos', slug: 'hornos', padreId: 1 },
  { id: 2, nombre: 'Gastronomía', slug: 'gastronomia', padreId: null },
  { id: 21, nombre: 'Cocinas', slug: 'cocinas', padreId: 2 },
  { id: 3, nombre: 'Repuestos', slug: 'repuestos', padreId: null },
]

console.log('— direcciones web —')
comprobar('quita tildes y mayúsculas', aSlug('Artículos de Pastelería') === 'articulos-de-pasteleria')
comprobar('colapsa lo que no es letra', aSlug('Línea  de   frío!!') === 'linea-de-frio')
comprobar('nunca queda vacía', aSlug('¿¿¿???') === 'categoria')
comprobar('evita repetidos', slugLibre('hornos', ['hornos', 'hornos-2']) === 'hornos-3')
comprobar('si está libre la usa tal cual', slugLibre('vitrinas', ['hornos']) === 'vitrinas')

console.log()
console.log('— descendientes —')
comprobar('de una raíz con dos hijas', descendientes(1, CATS).size === 2)
comprobar('de una hoja, ninguno', descendientes(11, CATS).size === 0)
comprobar('incluye a las hijas correctas', descendientes(1, CATS).has(11) && descendientes(1, CATS).has(12))

console.log()
console.log('— LO IMPORTANTE: no se puede armar un ciclo —')
comprobar(
  'una categoría no puede colgar de sí misma',
  motivoParaRechazarElPadre(1, 1, CATS) === 'padre-es-ella-misma',
)
comprobar(
  'una raíz no puede colgar de su propia hija',
  motivoParaRechazarElPadre(1, 11, CATS) === 'padre-es-descendiente',
)

// El caso que de verdad tumba la tienda: un ciclo indirecto.
const CON_NIETA = [...CATS, { id: 111, nombre: 'Espirales', slug: 'espirales', padreId: 11 }]
comprobar(
  'ni de una nieta',
  motivoParaRechazarElPadre(1, 111, CON_NIETA) === 'padre-es-descendiente',
)

console.log()
console.log('— dos niveles, no tres —')
comprobar(
  'no se puede colgar de una subcategoría',
  motivoParaRechazarElPadre(3, 11, CATS) === 'demasiada-profundidad',
)
comprobar(
  'una categoría con hijas no se puede volver subcategoría',
  motivoParaRechazarElPadre(1, 2, CATS) === 'demasiada-profundidad',
)
comprobar('una hoja sí se puede mover a otra raíz', motivoParaRechazarElPadre(3, 2, CATS) === null)
comprobar('y se puede dejar como raíz', motivoParaRechazarElPadre(11, null, CATS) === null)

console.log()
console.log('— al crear —')
comprobar('sin padre es válido', motivoParaRechazarElPadre(null, null, CATS) === null)
comprobar('con una raíz de padre es válido', motivoParaRechazarElPadre(null, 1, CATS) === null)
comprobar(
  'con una subcategoría de padre, no',
  motivoParaRechazarElPadre(null, 11, CATS) === 'demasiada-profundidad',
)
comprobar(
  'con un padre inexistente, no',
  motivoParaRechazarElPadre(null, 999, CATS) === 'padre-inexistente',
)

console.log()
console.log('— árbol del panel —')
const conteo = new Map([
  [11, 5],
  [12, 3],
  [21, 0],
])
const arbol = arbolDelPanel(CATS, conteo)

comprobar('tres raíces', arbol.length === 3, arbol.map((r) => r.nombre).join(', '))

const panaderia = arbol.find((r) => r.id === 1)
comprobar('Panadería suma la rama', panaderia.productosEnLaRama === 8, String(panaderia.productosEnLaRama))
comprobar('y se ve en la tienda', panaderia.visibleEnLaTienda === true)

const gastronomia = arbol.find((r) => r.id === 2)
comprobar('Gastronomía está vacía', gastronomia.productosEnLaRama === 0)
comprobar(
  'y el panel avisa que no se ve en la tienda',
  gastronomia.visibleEnLaTienda === false,
)

const repuestos = arbol.find((r) => r.id === 3)
comprobar('Repuestos vacía tampoco se ve', repuestos.visibleEnLaTienda === false)

console.log()
console.log('— el panel muestra hasta lo que está mal —')
{
  // Una categoría cuyo padre ya no existe: en la tienda desaparecería, y en el
  // panel tiene que verse para poder arreglarla.
  const huerfana = [...CATS, { id: 99, nombre: 'Huérfana', slug: 'huerfana', padreId: 777 }]
  const a = arbolDelPanel(huerfana, new Map([[99, 2]]))
  comprobar('una huérfana aparece como raíz', a.some((r) => r.id === 99))
}
{
  // Y si los datos ya vinieran con un ciclo, el panel no puede colgarse.
  const conCiclo = [
    { id: 1, nombre: 'A', slug: 'a', padreId: 2 },
    { id: 2, nombre: 'B', slug: 'b', padreId: 1 },
  ]
  let colgo = false
  const reloj = setTimeout(() => {
    colgo = true
  }, 0)
  try {
    arbolDelPanel(conCiclo, new Map())
  } catch {
    colgo = true
  }
  clearTimeout(reloj)
  comprobar('con un ciclo en los datos no se cuelga ni revienta', !colgo)
  comprobar('y descendientes() tampoco', descendientes(1, conCiclo).size <= 2)
}

console.log()
console.log(fallos === 0 ? 'TODO BIEN' : `${fallos} prueba(s) fallando`)
process.exit(fallos === 0 ? 0 : 1)
