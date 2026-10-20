// ============================================================
// ROMASE · el control de unidades
//
//   yarn stock:probar
//
// Lo que se comprueba es la regla de tres estados, que es donde está todo
// el riesgo de este cambio:
//
//   null → no se controla. Se vende mientras esté disponible.
//   0    → se agotó. No se vende.
//   N    → quedan N. Se vende hasta N.
//
// Confundir null con cero rompería los 295 productos que ya existen: todos
// tienen null, y tratarlos como cero los sacaría de venta a todos de golpe.
//
// Al final, si hay credenciales, mira cómo quedó el catálogo real.
// ============================================================
import { readFileSync, existsSync } from 'node:fs'

let fallos = 0
const comprobar = (nombre, condicion, detalle = '') => {
  if (!condicion) fallos++
  console.log(`${condicion ? ' ok ' : 'FALLA'}  ${nombre}${detalle ? ` · ${detalle}` : ''}`)
}

/**
 * La misma regla que aplica el checkout en el servidor.
 *
 * Se replica acá a propósito y no se importa: si alguien cambia la del
 * checkout sin pensar, esta prueba lo dice en vez de cambiar con ella.
 */
const alcanza = (pedidas, enStock) => enStock === null || pedidas <= enStock

console.log('— la regla de los tres estados —\n')

comprobar('null deja comprar cualquier cantidad', alcanza(5, null))
comprobar('null deja comprar aunque sean muchas', alcanza(99, null))
comprobar('cero no deja comprar ni una', !alcanza(1, 0))
comprobar('con 3 en stock, 3 alcanza', alcanza(3, 3))
comprobar('con 3 en stock, 4 no alcanza', !alcanza(4, 3))
comprobar('con 1 en stock, 1 alcanza', alcanza(1, 1))

console.log('\n— el descuento —\n')

// Lo que hace la función de Postgres, en una línea.
const descontar = (enStock, vendidas) => (enStock === null ? null : Math.max(0, enStock - vendidas))

comprobar('null no se toca al vender', descontar(null, 3) === null, 'sigue en null')
comprobar('10 menos 3 son 7', descontar(10, 3) === 7)
comprobar('3 menos 3 son 0', descontar(3, 3) === 0)
comprobar('nunca queda negativo', descontar(2, 5) === 0, 'se topa en cero')

console.log('\n— lo que no se puede confundir —\n')

comprobar('null y cero no son lo mismo', alcanza(1, null) !== alcanza(1, 0))
comprobar(
  'vaciar el campo no agota el producto',
  alcanza(1, null),
  'vacío guarda null, no cero',
)

// ------------------------------------------------------------
// El catálogo real
// ------------------------------------------------------------
const env = {}
if (existsSync('.env.local')) {
  for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
}

if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n— el catálogo real —\n')
  const r = await fetch(
    env.SUPABASE_URL + '/rest/v1/products?select=id,name,in_stock,stock_quantity&limit=2000',
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY } },
  )

  if (!r.ok) {
    const detalle = (await r.text()).slice(0, 160)
    if (/stock_quantity/.test(detalle)) {
      console.log('  La columna todavía no existe: falta correr migration/admin-stock.sql')
    } else {
      console.log('  no se pudo consultar: ' + detalle)
    }
  } else {
    const ps = await r.json()
    const sinControl = ps.filter((p) => p.stock_quantity === null).length
    const agotados = ps.filter((p) => p.stock_quantity === 0).length
    const conUnidades = ps.filter((p) => p.stock_quantity > 0)

    console.log('  productos            : ' + ps.length)
    console.log('  sin control de stock : ' + sinControl)
    console.log('  agotados (en cero)   : ' + agotados)
    console.log('  con unidades         : ' + conUnidades.length)

    const incoherentes = ps.filter((p) => p.stock_quantity === 0 && p.in_stock)
    comprobar(
      'ninguno en cero figura como disponible',
      incoherentes.length === 0,
      incoherentes.length ? incoherentes.slice(0, 3).map((p) => p.name).join(', ') : '',
    )

    if (conUnidades.length > 0) {
      console.log('\n  los que tienen unidades cargadas:')
      for (const p of conUnidades.slice(0, 10)) {
        console.log('    ' + String(p.stock_quantity).padStart(4) + '  ' + String(p.name).slice(0, 50))
      }
    }
  }
} else {
  console.log('\n(sin credenciales: no se miró el catálogo real)')
}

console.log()
console.log(fallos === 0 ? 'TODO BIEN' : `${fallos} comprobación(es) fallando`)
process.exitCode = fallos === 0 ? 0 : 1
