// ============================================================
// ROMASE · Pruebas de la búsqueda tolerante a la ortografía
//
//   yarn busqueda:probar
//
// Corre sobre src/lib/busqueda.ts y sobre el catálogo real de
// migration/data/products.json, no sobre ejemplos inventados: lo que importa es
// que quien escribe «amazador» encuentre la amasadora que ROMASE tiene.
// ============================================================

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, '..')

// Se copian los dos módulos quitándoles lo que solo existe dentro de Next.
const copiar = (origen, destino, transformar = (s) => s) => {
  const ruta = join(tmpdir(), destino)
  writeFileSync(ruta, transformar(readFileSync(join(raiz, origen), 'utf8')), 'utf8')
  return ruta
}

copiar('src/lib/format.ts', 'romase-format.ts')
const rutaBusqueda = copiar('src/lib/busqueda.ts', 'romase-busqueda.ts', (s) =>
  s.replace("from './format'", "from './romase-format.ts'"),
)

const { fonetico, camposDe, puntuar, distancia, toleranciaPara } = await import(
  pathToFileURL(rutaBusqueda).href
)

const productos = JSON.parse(readFileSync(join(raiz, 'migration/data/products.json'), 'utf8'))

const indice = productos.map((p) => ({
  nombre: p.name,
  campos: camposDe({
    nombre: p.name,
    sku: p.sku ?? '',
    cuerpo: `${p.short_description ?? ''} ${p.description ?? ''}`.replace(/<[^>]*>/g, ' '),
  }),
}))

const buscar = (termino) => {
  const terminos = termino
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return indice
    .map((p) => ({ nombre: p.nombre, ...puntuar(p.campos, terminos) }))
    .filter((r) => r.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
}

let fallos = 0
const comprobar = (nombre, condicion, detalle = '') => {
  if (!condicion) fallos++
  console.log(`${condicion ? ' ok ' : 'FALLA'}  ${nombre}${detalle ? ` · ${detalle}` : ''}`)
}

// ------------------------------------------------------------
console.log('— equivalencia fonética —')
const mismoSonido = [
  ['amasadora', 'amazadora'],
  ['amasadora', 'amasadora'],
  ['cocina', 'cosina'],
  ['vitrina', 'bitrina'],
  // La x se mapea a s y no a ks. Con ks, «inocsidable» coincidiría y
  // «inosidable» no; se eligió al revés porque quien escribe mal «inoxidable»
  // pone «inosidable», no «inocsidable». Lo comprobamos con el catálogo: hay 11
  // productos con «inox» en el nombre y es un término que se busca seguido.
  ['inoxidable', 'inosidable'],
  ['hielo', 'ielo'],
  ['llave', 'yave'],
  ['gelatina', 'jelatina'],
  ['queso', 'keso'],
  ['bandeja', 'vandeja'],
  ['cuchillo', 'cuchiyo'],
  ['exhibidor', 'esibidor'],
]
for (const [a, b] of mismoSonido) {
  comprobar(`«${a}» y «${b}» suenan igual`, fonetico(a) === fonetico(b), `${fonetico(a)}`)
}

console.log()
console.log('— palabras distintas NO deben confundirse —')
for (const [a, b] of [
  ['taza', 'tapa'],
  ['horno', 'hornalla'],
  ['balanza', 'bandeja'],
  ['molde', 'monte'],
]) {
  comprobar(`«${a}» ≠ «${b}»`, fonetico(a) !== fonetico(b))
}

// ------------------------------------------------------------
console.log()
console.log('— distancia de edición —')
comprobar('igual = 0', distancia('amasadora', 'amasadora', 2) === 0)
comprobar('una letra menos = 1', distancia('amsadora', 'amasadora', 2) === 1)
comprobar('dos ediciones = 2', distancia('amasdora', 'amasadoras', 3) === 2, String(distancia('amasdora', 'amasadoras', 3)))
comprobar('corta cuando se pasa', distancia('horno', 'refrigerador', 2) > 2)
comprobar('sin tolerancia en palabras cortas', toleranciaPara('taza') === 0)
comprobar('una en medianas', toleranciaPara('bandeja') === 1)
comprobar('dos en largas', toleranciaPara('refrigerador') === 2)

// ------------------------------------------------------------
console.log()
console.log('— sobre el catálogo real —')

const encuentra = (termino, esperado) => {
  const r = buscar(termino)
  const primeros = r.slice(0, 3).map((x) => x.nombre.toLowerCase())
  const acierta = primeros.some((n) => n.includes(esperado.toLowerCase()))
  comprobar(
    `«${termino}» encuentra «${esperado}»`,
    acierta,
    r.length ? `${r.length} resultados · 1º: ${r[0].nombre} (${r[0].como})` : 'sin resultados',
  )
}

// Lo que Tamara escribió y no encontraba nada.
encuentra('amaz', 'amasadora')
encuentra('amazador', 'amasadora')
encuentra('amazadora', 'amasadora')

// Otras faltas del mismo tipo.
encuentra('valanza', 'balanza')
encuentra('arrosera', 'arrocera') // c ante e, que sí está en un nombre
encuentra('bitrina', 'vitrina')
encuentra('inosidable', 'inox')
encuentra('vandeja', 'bandeja')

// Tecleo, no ortografía.
encuentra('amsadora', 'amasadora')
encuentra('balnza', 'balanza')

// Y lo bien escrito tiene que seguir funcionando igual.
encuentra('amasadora', 'amasadora')
encuentra('balanza', 'balanza')
encuentra('horno', 'horno')

console.log()
console.log('— términos que solo están en las descripciones —')
{
  // «cocina» no es el nombre de ningún producto: aparece en 81 descripciones.
  // Que «cosina» devuelva esos 81 es correcto, y que ninguno gane por nombre
  // también: el cuerpo puntúa lo mínimo justamente para eso.
  const r = buscar('cosina')
  comprobar('«cosina» devuelve los que la mencionan', r.length > 50, `${r.length} resultados`)
  comprobar('y ninguno puntúa como si fuera su nombre', r[0].puntaje <= 7, `máximo ${r[0].puntaje}`)
}

console.log()
console.log('— lo escrito bien gana al escrito mal —')
const bien = buscar('amasadora')
const mal = buscar('amazadora')
comprobar(
  'la búsqueda correcta puntúa más alto',
  bien[0].puntaje > mal[0].puntaje,
  `${bien[0].puntaje} contra ${mal[0].puntaje}`,
)
comprobar(
  'y llegan al mismo producto',
  bien[0].nombre === mal[0].nombre,
  `${bien[0].nombre}`,
)

console.log()
console.log('— no se vuelve permisiva de más —')
const disparate = buscar('bicicleta')
comprobar('«bicicleta» no devuelve nada', disparate.length === 0, `${disparate.length} resultados`)
const dosTerminos = buscar('horno rotatorio')
comprobar(
  '«horno rotatorio» no devuelve todos los hornos',
  dosTerminos.length < buscar('horno').length,
  `${dosTerminos.length} contra ${buscar('horno').length}`,
)

console.log()
console.log(fallos === 0 ? 'TODO BIEN' : `${fallos} prueba(s) fallando`)
process.exit(fallos === 0 ? 0 : 1)
