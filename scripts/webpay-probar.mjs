// ============================================================
// ROMASE · prueba de Webpay Plus
//
//   node scripts/webpay-probar.mjs [monto]
//
// Abre una transacción contra el ambiente configurado y deja lista una página
// local que lleva al formulario de Webpay. Sirve para dos cosas:
//
//   1. Comprobar que las credenciales y la conexión funcionan, sin tener que
//      pasar por todo el checkout.
//   2. Generar la evidencia de pruebas que pide Transbank para la homologación.
//
// La entrada a Webpay es un POST con un campo `token_ws`: por eso no basta con
// abrir la URL en el navegador y hace falta el archivo HTML que genera este
// script.
// ============================================================
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  WebpayPlus,
  Options,
  Environment,
  IntegrationCommerceCodes,
  IntegrationApiKeys,
} from 'transbank-sdk'

const AMBIENTE = process.env.WEBPAY_AMBIENTE === 'produccion' ? 'produccion' : 'integracion'
const CODIGO = process.env.WEBPAY_CODIGO_COMERCIO ?? IntegrationCommerceCodes.WEBPAY_PLUS
const LLAVE = process.env.WEBPAY_API_KEY ?? IntegrationApiKeys.WEBPAY
const SITIO = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://romase-web.onrender.com'
const MONTO = Number(process.argv[2] ?? 39900)

if (AMBIENTE === 'produccion') {
  console.error(
    'Este script no corre contra producción: abriría un cobro real.\n' +
      'Dejá WEBPAY_AMBIENTE en integracion para probar.',
  )
  process.exit(1)
}

console.log(`ambiente : ${AMBIENTE}`)
console.log(`comercio : ${CODIGO}`)
console.log(`retorno  : ${SITIO}/checkout/retorno`)
console.log(`monto    : $${MONTO.toLocaleString('es-CL')}\n`)

const tx = new WebpayPlus.Transaction(new Options(CODIGO, LLAVE, Environment.Integration))

const orden = `ROM-PRUEBA-${Date.now().toString().slice(-8)}`
const creada = await tx.create(orden, `prueba-${Date.now()}`, MONTO, `${SITIO}/checkout/retorno`)

console.log('Transacción abierta:')
console.log(`  orden de compra : ${orden}`)
console.log(`  token           : ${creada.token}`)
console.log(`  url             : ${creada.url}`)

const salida = path.join(process.cwd(), 'webpay-prueba.html')
await writeFile(
  salida,
  `<!doctype html>
<html lang="es">
<meta charset="utf-8">
<title>Prueba de Webpay · ${orden}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 34rem; margin: 4rem auto; padding: 0 1.5rem;
         line-height: 1.6; color: #17120f; }
  h1 { font-size: 1.4rem; }
  dt { font-size: .8rem; color: #7a6d64; margin-top: .75rem; }
  dd { margin: 0; font-family: ui-monospace, monospace; font-size: .85rem; word-break: break-all; }
  button { margin-top: 2rem; background: #dd5330; color: #fff; border: 0; border-radius: 2px;
           padding: .9rem 1.8rem; font-size: 1rem; cursor: pointer; }
  ul { background: #faf8f6; border: 1px solid #e5dfd9; padding: 1rem 1rem 1rem 2.2rem; font-size: .9rem; }
</style>
<h1>Prueba de Webpay · ambiente de integración</h1>
<dl>
  <dt>Orden de compra</dt><dd>${orden}</dd>
  <dt>Monto</dt><dd>$${MONTO.toLocaleString('es-CL')}</dd>
  <dt>Vuelve a</dt><dd>${SITIO}/checkout/retorno</dd>
</dl>
<p>Tarjetas de prueba de Transbank:</p>
<ul>
  <li><strong>VISA aprobada</strong> — 4051 8856 0044 6623, CVV 123, cualquier fecha futura</li>
  <li><strong>MASTERCARD rechazada</strong> — 5186 0595 5959 0568, CVV 123</li>
  <li>Cuando pida autenticación: RUT <strong>11.111.111-1</strong>, clave <strong>123</strong></li>
</ul>
<form method="POST" action="${creada.url}">
  <input type="hidden" name="token_ws" value="${creada.token}">
  <button type="submit">Ir a pagar</button>
</form>
`,
  'utf8',
)

console.log(`\nAbrí este archivo en el navegador y apretá «Ir a pagar»:`)
console.log(`  ${pathToFileURL(salida).href}`)
console.log(`\nAl terminar, la vuelta cae en ${SITIO}/checkout/retorno`)
console.log('El archivo queda ignorado por git; se puede borrar cuando ya no sirva.')
