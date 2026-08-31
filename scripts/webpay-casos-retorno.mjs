// ============================================================
// ROMASE · las cuatro vueltas de Webpay
//
//   node scripts/webpay-casos-retorno.mjs [http://localhost:3000]
//
// Transbank vuelve a /checkout/retorno de cuatro formas distintas, y tres de
// ellas NO son un pago. Confundirlas deja pedidos en el estado equivocado, así
// que conviene poder comprobarlo sin depender de que alguien anule una compra
// a mano en el formulario de Webpay.
//
// El pago aprobado no se puede simular acá: necesita un token real y HTTPS.
// Para eso está `yarn webpay:probar`.
// ============================================================
const BASE = process.argv[2] ?? 'http://localhost:3000'

const CASOS = [
  {
    nombre: 'pago normal (token inválido)',
    metodo: 'GET',
    params: { token_ws: 'token-que-no-existe' },
    espera: 'estado=error',
    porque: 'con un token que Transbank no reconoce, el commit falla y se avisa',
  },
  {
    nombre: 'el comprador anuló',
    metodo: 'GET',
    params: { TBK_TOKEN: 't1', TBK_ORDEN_COMPRA: 'ROM-1', TBK_ID_SESION: 's1' },
    espera: 'estado=anulado',
    porque: 'con TBK_TOKEN no hay que confirmar nada',
  },
  {
    nombre: 'se venció el plazo del formulario',
    metodo: 'GET',
    params: { TBK_ORDEN_COMPRA: 'ROM-1', TBK_ID_SESION: 's1' },
    espera: 'estado=vencido',
    porque: 'sin ningún token, la transacción nunca se abrió',
  },
  {
    nombre: 'error en el formulario de pago',
    metodo: 'GET',
    params: { token_ws: 'abc', TBK_TOKEN: 't1' },
    espera: 'estado=anulado',
    porque: 'si viene TBK_TOKEN, manda ese aunque haya token_ws',
  },
  {
    nombre: 'anulación por POST',
    metodo: 'POST',
    params: { TBK_TOKEN: 't2', TBK_ORDEN_COMPRA: 'ROM-2', TBK_ID_SESION: 's2' },
    espera: 'estado=anulado',
    porque: 'Transbank vuelve por POST al anular: una página daría 405',
  },
]

let fallos = 0

for (const caso of CASOS) {
  const query = new URLSearchParams(caso.params)
  const url = `${BASE}/checkout/retorno${caso.metodo === 'GET' ? `?${query}` : ''}`

  const respuesta = await fetch(url, {
    method: caso.metodo,
    redirect: 'manual',
    ...(caso.metodo === 'POST'
      ? {
          body: query,
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
        }
      : {}),
  })

  const destino = respuesta.headers.get('location') ?? ''
  const ok = respuesta.status >= 300 && respuesta.status < 400 && destino.includes(caso.espera)

  console.log(`${ok ? ' ok ' : 'FALLA'}  ${caso.metodo.padEnd(4)} ${caso.nombre}`)
  console.log(`        ${respuesta.status} → ${destino.replace(BASE, '') || '(sin redirección)'}`)
  console.log(`        ${caso.porque}`)
  if (!ok) {
    console.log(`        se esperaba una redirección con ${caso.espera}`)
    fallos++
  }
}

console.log(`\n${CASOS.length} casos · ${fallos} fallo(s)`)
if (fallos) process.exitCode = 1
