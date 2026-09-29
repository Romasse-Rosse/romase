// ============================================================
// ROMASE · cómo se leen los pedidos en el panel
//
//   yarn pedidos:probar
//
// Un pedido guarda el despacho y la respuesta de Transbank como jsonb, con
// glosas que no coinciden con lo que uno adivinaría: el retiro en tienda se
// guarda como «retiro en local», no como «retiro». Comparar contra la palabra
// equivocada no rompe nada visible —simplemente todos los pedidos figuran como
// despacho— y por eso conviene comprobarlo.
//
// Las pruebas corren sobre datos inventados, sin tocar la base. Al final, si
// hay credenciales en .env.local, contrasta contra los pedidos de verdad.
// ============================================================
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

// Node pide la extensión en los imports; el TypeScript del proyecto no la
// escribe. Se copian los dos módulos a un temporal con la ruta resuelta, igual
// que hacen las otras pruebas.
const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, '..')

const glosas = join(tmpdir(), 'romase-webpay-glosas.ts')
writeFileSync(glosas, readFileSync(join(raiz, 'src/lib/webpay-glosas.ts'), 'utf8'), 'utf8')

const copia = join(tmpdir(), 'romase-pedidos-panel.ts')
writeFileSync(
  copia,
  readFileSync(join(raiz, 'src/lib/pedidos-panel.ts'), 'utf8').replace(
    "from './webpay-glosas'",
    "from './romase-webpay-glosas.ts'",
  ),
  'utf8',
)

const {
  ESTADOS,
  estadoDe,
  esCobrado,
  despachoDe,
  direccionEnUnaLinea,
  pagoDe,
  fechaHora,
} = await import(pathToFileURL(copia).href)

let fallos = 0
const comprobar = (nombre, condicion, detalle = '') => {
  if (!condicion) fallos++
  console.log(`${condicion ? ' ok ' : 'FALLA'}  ${nombre}${detalle ? ` · ${detalle}` : ''}`)
}

console.log('— estados —')
comprobar('pagado se reconoce', estadoDe('pagado') === 'pagado')
comprobar('rechazado se reconoce', estadoDe('rechazado') === 'rechazado')
comprobar('un estado desconocido cae en pendiente', estadoDe('marciano') === 'pendiente')
comprobar('null cae en pendiente', estadoDe(null) === 'pendiente')
comprobar('solo pagado cuenta como cobrado', esCobrado('pagado') && !esCobrado('pendiente'))
comprobar(
  'todos los estados tienen glosa',
  Object.values(ESTADOS).every((e) => e.etiqueta && e.glosa && e.tono),
)

console.log('\n— despacho —')
const despacho = despachoDe({
  tipo: 'despacho',
  documento: 'boleta',
  transportista: 'Starken',
  facturacion_calle: 'de la huella 4303',
  facturacion_comuna: 'Puerto Montt',
  facturacion_region: 'Los Lagos',
})
comprobar('un despacho se lee como despacho', despacho.tipo === 'despacho')
comprobar('toma el transportista', despacho.transportista === 'Starken')
comprobar(
  'arma la dirección en una línea',
  direccionEnUnaLinea(despacho) === 'de la huella 4303, Puerto Montt, Los Lagos',
  direccionEnUnaLinea(despacho) ?? '',
)

// La que importa: la glosa real del checkout.
const retiro = despachoDe({ tipo: 'retiro en local', documento: 'factura', razon_social: 'ACME SpA' })
comprobar('«retiro en local» se lee como retiro', retiro.tipo === 'retiro')
comprobar('toma la razón social', retiro.razonSocial === 'ACME SpA')
comprobar('toma el tipo de documento', retiro.documento === 'factura')

comprobar('la palabra suelta «retiro» NO es lo que guarda el checkout', despachoDe({ tipo: 'retiro' }).tipo === 'despacho')

const vacio = despachoDe(null)
comprobar('sin datos no revienta', vacio.tipo === 'despacho' && vacio.transportista === null)
comprobar('sin dirección devuelve null', direccionEnUnaLinea(vacio) === null)
comprobar('las cadenas en blanco cuentan como ausentes', despachoDe({ transportista: '   ' }).transportista === null)

console.log('\n— pago —')
const aprobado = pagoDe({
  vci: 'TSY',
  amount: 11500,
  status: 'AUTHORIZED',
  buy_order: 'ROM-5',
  card_detail: { card_number: '6623' },
  response_code: 0,
  transaction_date: '2026-09-03T17:43:24.416Z',
  payment_type_code: 'VN',
  authorization_code: '1213',
  installments_number: 0,
})
comprobar('toma la autorización', aprobado?.autorizacion === '1213')
comprobar('toma los últimos cuatro dígitos', aprobado?.tarjeta === '6623')
comprobar('toma la orden de compra', aprobado?.ordenDeCompra === 'ROM-5')
comprobar('traduce el tipo de pago', Boolean(aprobado?.tipo) && aprobado?.tipo !== 'VN', aprobado?.tipo ?? '')
comprobar('un código 0 no lleva motivo de rechazo', aprobado?.motivo === null)
comprobar('cuotas 0 se distingue de null', aprobado?.cuotas === 0)

const rechazado = pagoDe({ response_code: -1, status: 'FAILED', buy_order: 'ROM-9' })
comprobar('un código negativo trae motivo', Boolean(rechazado?.motivo))
comprobar('el motivo está en español', /rechazada/i.test(rechazado?.motivo ?? ''))

comprobar('sin respuesta de Transbank devuelve null', pagoDe(null) === null)
comprobar('una respuesta que no es objeto devuelve null', pagoDe('hola') === null)

console.log('\n— fechas —')
comprobar('formatea una fecha', fechaHora('2026-09-03T17:43:24.416Z') !== '—')
comprobar('una fecha inválida no revienta', fechaHora('cualquier cosa') === '—')
comprobar('null devuelve raya', fechaHora(null) === '—')
// 2026-09-03T23:43Z es el 3 en Chile (UTC-3/-4), no el 4.
comprobar(
  'usa el horario de Chile, no UTC',
  fechaHora('2026-09-03T23:43:00.000Z').includes('3'),
  fechaHora('2026-09-03T23:43:00.000Z'),
)

// ------------------------------------------------------------
// Contraste con los pedidos reales, si hay con qué.
// ------------------------------------------------------------
const env = {}
if (existsSync('.env.local')) {
  for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
}

if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n— contra los pedidos de verdad —')
  const r = await fetch(env.SUPABASE_URL + '/rest/v1/orders?select=*&order=id.desc', {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY },
  })
  const pedidos = await r.json()
  comprobar('se leyeron pedidos', Array.isArray(pedidos) && pedidos.length > 0, `${pedidos.length ?? 0}`)

  // El id es un uuid y el número que se ve en pantalla es order_number.
  // Confundirlos manda NaN a la consulta y Postgres responde con un error de
  // sintaxis en vez de un 404: le pasó a la ficha del pedido el 29/9/2026.
  const esUuid = (v) => /^[0-9a-f-]{32,36}$/i.test(String(v))
  comprobar('el id de los pedidos es uuid, no correlativo', pedidos.every((p) => esUuid(p.id)))
  comprobar('order_number sí es un número', pedidos.every((p) => Number.isFinite(Number(p.order_number))))
  comprobar('la comprobación de forma rechaza NaN', !esUuid('NaN') && !esUuid('5'))

  for (const p of pedidos) {
    const e = estadoDe(p.status)
    const d = despachoDe(p.shipping_address)
    const pg = pagoDe(p.webpay_response)
    const linea = [
      '#' + p.order_number,
      ESTADOS[e].etiqueta,
      d.tipo === 'retiro' ? 'retiro' : (d.transportista ?? 'despacho'),
      pg ? 'aut. ' + pg.autorizacion : 'sin pago',
    ].join(' · ')
    console.log('      ' + linea)
    comprobar('  #' + p.order_number + ' tiene estado conocido', p.status in ESTADOS, p.status)
    if (e === 'pagado') {
      comprobar('  #' + p.order_number + ' pagado trae autorización', Boolean(pg?.autorizacion))
    }
  }
} else {
  console.log('\n(sin credenciales en .env.local: no se contrastó contra la base)')
}

console.log()
console.log(fallos === 0 ? 'TODO BIEN' : `${fallos} comprobación(es) fallando`)
// exitCode y no exit(): con peticiones HTTP recién cerradas, exit() fuerza
// la salida antes de que libuv suelte sus manejadores y Windows devuelve un
// código de salida basura que parece un fallo cuando todo pasó.
process.exitCode = fallos === 0 ? 0 : 1
