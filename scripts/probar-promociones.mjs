// ============================================================
// ROMASE · Pruebas del cálculo de precios con promociones
//
//   yarn promos:probar
//
// Mira src/lib/promociones.ts, no una copia: se le quitan los tipos con el
// intérprete de Node y se ejecuta la función que se despliega.
//
// Vale la pena tenerlas: acá se decide cuánto se le cobra a alguien, y la
// regla que no se puede romper —no cobrar más de lo mostrado— no se ve
// mirando el código, solo probándola.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, '..')
const copia = join(tmpdir(), 'romase-promociones.ts')
writeFileSync(copia, readFileSync(join(raiz, 'src/lib/promociones.ts'), 'utf8'), 'utf8')
const m = await import(pathToFileURL(copia).href)

const AHORA = Date.parse('2026-09-08T15:00:00Z')
const MIN = 60 * 1000

const promo = (extra) => ({
  id: 1, alcance: 'categoria', productoId: null, categoriaId: 15,
  porcentaje: 20, etiqueta: null, desde: AHORA - 60 * MIN, hasta: null, activa: true,
  ...extra,
})

// Panadería (15), precio normal 100000 sin oferta propia.
const producto = { id: 500, price: 100000, regularPrice: 100000, salePrice: null, onSale: false, categoryIds: [15] }

let fallos = 0
const igual = (nombre, obtenido, esperado) => {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado)
  if (!ok) fallos++
  console.log(`${ok ? ' ok ' : 'FALLA'}  ${nombre}`)
  if (!ok) console.log(`        esperado ${JSON.stringify(esperado)}\n        obtenido ${JSON.stringify(obtenido)}`)
}

const precio = (p, promos, ahora = AHORA, gracia = 0) =>
  m.resolverPrecio(p, promos, ahora, gracia).price

console.log('— descuento por categoría —')
igual('20% sobre 100.000', precio(producto, [promo({})]), 80000)
igual('sin promociones no toca el precio', precio(producto, []), 100000)

console.log('\n— vigencia —')
igual('programada para mañana no aplica', precio(producto, [promo({ desde: AHORA + 1440 * MIN })]), 100000)
igual('vencida hace una hora no aplica', precio(producto, [promo({ hasta: AHORA - 60 * MIN })]), 100000)
igual('apagada no aplica', precio(producto, [promo({ activa: false })]), 100000)

console.log('\n— la regla que no se puede romper: el cobro es más indulgente —')
const vencidaHace5 = promo({ hasta: AHORA - 5 * MIN })
igual('en vitrina ya no aplica', precio(producto, [vencidaHace5]), 100000)
igual('al cobrar sí aplica (gracia)', precio(producto, [vencidaHace5], AHORA, m.GRACIA_COBRO), 80000)
const vencidaHace20 = promo({ hasta: AHORA - 20 * MIN })
igual('pasada la gracia, tampoco al cobrar', precio(producto, [vencidaHace20], AHORA, m.GRACIA_COBRO), 100000)

console.log('\n— cuál gana —')
const delProducto = promo({ id: 2, alcance: 'producto', productoId: 500, categoriaId: null, porcentaje: 5 })
igual('la del producto pisa a la de la categoría, aunque descuente menos',
  precio(producto, [promo({}), delProducto]), 95000)
igual('entre dos de categoría gana la mayor',
  precio(producto, [promo({}), promo({ id: 3, porcentaje: 35 })]), 65000)
igual('promo de otra categoría no aplica',
  precio(producto, [promo({ categoriaId: 99 })]), 100000)

console.log('\n— no compone ni sube precios —')
const yaEnOferta = { ...producto, price: 70000, salePrice: 70000, onSale: true }
igual('el 20% se calcula sobre el normal, no sobre la oferta',
  precio(yaEnOferta, [promo({})]), 70000)
igual('con 40% sí mejora la oferta propia',
  precio(yaEnOferta, [promo({ porcentaje: 40 })]), 60000)

console.log('\n— redondeo —')
igual('33% de 99.990 redondea a peso', precio({ ...producto, price: 99990, regularPrice: 99990 }, [promo({ porcentaje: 33 })]), 66993)

console.log('\n— cuándo hay que recalcular —')
const en10 = promo({ hasta: AHORA + 10 * MIN })
igual('el próximo cambio es el fin de la promoción', m.proximoCambio([en10], AHORA), AHORA + 10 * MIN)
igual('sin promociones no hay cambio a la vista', m.proximoCambio([], AHORA), null)
igual('una que empieza después cuenta', m.proximoCambio([promo({ desde: AHORA + 3 * MIN })], AHORA), AHORA + 3 * MIN)

console.log('\n— estado para el panel —')
for (const [nombre, p, esperado] of [
  ['vigente', promo({}), 'vigente'],
  ['programada', promo({ desde: AHORA + MIN }), 'programada'],
  ['vencida', promo({ hasta: AHORA - MIN }), 'vencida'],
  ['apagada', promo({ activa: false }), 'apagada'],
]) igual(nombre, m.estadoDeLaPromocion(p, AHORA), esperado)

console.log()
console.log(fallos === 0 ? 'TODO BIEN' : `${fallos} prueba(s) fallando`)
process.exit(fallos === 0 ? 0 : 1)
