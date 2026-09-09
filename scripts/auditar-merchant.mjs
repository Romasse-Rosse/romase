// ============================================================
// ROMASE · Auditoría del feed de Google Merchant Center
//
//   yarn merchant:auditar [https://romase-web.onrender.com]
//
// Pide el feed que sirve el sitio y comprueba lo que Merchant Center comprueba,
// antes de que Google lo rechace y quede un error permanente en su panel.
//
// Sin argumento audita el feed local (hace falta `yarn start` corriendo).
// ============================================================

const BASE = (process.argv[2] ?? 'http://127.0.0.1:3000').replace(/\/$/, '')
const URL_FEED = `${BASE}/merchant.xml`

const r = await fetch(URL_FEED, { cache: 'no-store' })
if (!r.ok) {
  console.error(`El feed respondió ${r.status}. ¿Está el sitio arriba en ${BASE}?`)
  process.exit(1)
}

const tipo = r.headers.get('content-type') ?? ''
const xml = await r.text()

console.log(`feed: ${URL_FEED}`)
console.log(`  tipo de contenido : ${tipo}`)
console.log(`  tamaño            : ${(xml.length / 1024).toFixed(1)} KB`)

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1])
console.log(`  productos         : ${items.length}`)
console.log()

const leer = (item, etiqueta) => {
  const m = item.match(new RegExp(`<g:${etiqueta}>([\\s\\S]*?)</g:${etiqueta}>`))
  return m ? m[1] : null
}
const leerTodos = (item, etiqueta) =>
  [...item.matchAll(new RegExp(`<g:${etiqueta}>([\\s\\S]*?)</g:${etiqueta}>`, 'g'))].map((m) => m[1])

const problemas = []
const avisos = []
const ids = new Set()
let conMarca = 0
let sinIdentificador = 0
let conOferta = 0

for (const [i, item] of items.entries()) {
  const id = leer(item, 'id')
  const titulo = leer(item, 'title')
  const enlace = leer(item, 'link')
  const imagen = leer(item, 'image_link')
  const precio = leer(item, 'price')
  const disponibilidad = leer(item, 'availability')
  const descripcion = leer(item, 'description')
  const marca = leer(item, 'brand')
  const identificador = leer(item, 'identifier_exists')
  const oferta = leer(item, 'sale_price')
  const donde = `item ${i + 1}${id ? ` (id ${id})` : ''}${titulo ? ` «${titulo.slice(0, 40)}»` : ''}`

  // --- lo que Merchant Center exige ---
  if (!id) problemas.push(`${donde}: sin g:id`)
  else if (ids.has(id)) problemas.push(`${donde}: g:id repetido`)
  else ids.add(id)

  if (!titulo) problemas.push(`${donde}: sin título`)
  else if (titulo.length > 150) problemas.push(`${donde}: título de ${titulo.length} caracteres, el máximo es 150`)

  if (!descripcion) problemas.push(`${donde}: sin descripción`)
  else if (descripcion.length > 5000) problemas.push(`${donde}: descripción de ${descripcion.length}, el máximo es 5000`)

  if (!enlace) problemas.push(`${donde}: sin enlace`)
  else if (!/^https?:\/\//.test(enlace)) problemas.push(`${donde}: el enlace no es absoluto (${enlace})`)

  if (!imagen) problemas.push(`${donde}: sin imagen`)
  else if (!/^https?:\/\//.test(imagen)) problemas.push(`${donde}: la imagen no es absoluta (${imagen})`)

  if (!precio) problemas.push(`${donde}: sin precio`)
  else if (!/^\d+(\.\d+)? [A-Z]{3}$/.test(precio)) problemas.push(`${donde}: precio con formato raro (${precio})`)
  else if (Number(precio.split(' ')[0]) <= 0) problemas.push(`${donde}: precio en cero`)

  if (!['in_stock', 'out_of_stock', 'backorder', 'preorder'].includes(disponibilidad ?? '')) {
    problemas.push(`${donde}: disponibilidad inválida (${disponibilidad})`)
  }

  // Marca o declaración de que no hay identificadores: una de las dos.
  if (marca) conMarca++
  else if (identificador === 'no') sinIdentificador++
  else problemas.push(`${donde}: sin marca y sin identifier_exists`)

  if (oferta) {
    conOferta++
    const normal = Number((precio ?? '0').split(' ')[0])
    const rebajado = Number(oferta.split(' ')[0])
    if (!(rebajado < normal)) {
      problemas.push(`${donde}: sale_price ${rebajado} no es menor que price ${normal}`)
    }
  }

  // --- cosas que no rechazan pero conviene saber ---
  if (titulo && titulo.length < 15) avisos.push(`${donde}: título muy corto (${titulo.length})`)
  if (descripcion && descripcion.length < 40) avisos.push(`${donde}: descripción muy corta (${descripcion.length})`)
  if (/<[a-z]/i.test(descripcion ?? '')) avisos.push(`${donde}: la descripción parece traer HTML`)
  if (leerTodos(item, 'additional_image_link').length === 0) {
    // No es un problema, solo se cuenta más abajo.
  }
}

// ------------------------------------------------------------
// Fotos generadas por IA
//
// La política de Merchant Center pide que la imagen represente el producto
// real. Las fotos que quedaron del sitio anterior incluyen un lote generado con
// IA, reconocible por el nombre del archivo. No es un error de formato —el feed
// pasa igual— pero es lo que puede costar desaprobaciones por tergiversación, y
// eso escala a la cuenta, no solo al producto.
//
// Va como aviso destacado y no como error: la decisión de mandarlas o no es del
// negocio, pero tiene que ser una decisión y no un descuido.
// ------------------------------------------------------------
const generadas = items.filter((item) => {
  const url = leer(item, 'image_link') ?? ''
  return /gemini-generated|generated-image|stable-?diffusion|midjourney|dall-?e/i.test(url)
})

if (generadas.length > 0) {
  console.log('— ATENCIÓN: fotos generadas por IA —')
  console.log(`  ${generadas.length} de ${items.length} productos usan una foto que parece generada.`)
  console.log('  Merchant Center pide que la imagen sea del producto real. Mandarlas puede')
  console.log('  costar desaprobaciones por tergiversación, y eso afecta a la cuenta entera.')
  console.log('  Los primeros:')
  for (const item of generadas.slice(0, 5)) {
    console.log('    · ' + (leer(item, 'title') ?? '(sin título)'))
  }
  if (generadas.length > 5) console.log(`    … y ${generadas.length - 5} más`)
  console.log()
}

console.log('— identificadores —')
console.log(`  con marca detectada            : ${conMarca}`)
console.log(`  declarados sin identificador   : ${sinIdentificador}`)
console.log(`  con precio de oferta           : ${conOferta}`)
console.log()

// Se comprueba que un puñado de enlaces e imágenes existan de verdad: un feed
// con enlaces roto se desaprueba entero.
const muestra = items.slice(0, 5)
console.log('— comprobación de una muestra —')
for (const item of muestra) {
  for (const etiqueta of ['link', 'image_link']) {
    const url = leer(item, etiqueta)
    if (!url) continue
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
      const ok = res.ok
      if (!ok) problemas.push(`${etiqueta} devuelve ${res.status}: ${url}`)
      console.log(`  ${ok ? 'ok ' : 'MAL'} ${res.status} ${etiqueta.padEnd(11)} ${url.slice(0, 78)}`)
    } catch (e) {
      problemas.push(`${etiqueta} no responde: ${url} (${e.message})`)
      console.log(`  MAL     ${etiqueta.padEnd(11)} ${url.slice(0, 60)} · ${e.message}`)
    }
  }
}

console.log()
if (avisos.length) {
  console.log(`— ${avisos.length} aviso(s) —`)
  for (const a of avisos.slice(0, 12)) console.log('  · ' + a)
  if (avisos.length > 12) console.log(`  … y ${avisos.length - 12} más`)
  console.log()
}

if (problemas.length === 0) {
  console.log(`Feed correcto: ${items.length} productos, ningún problema que Merchant Center rechace.`)
  process.exit(0)
}

console.log(`— ${problemas.length} problema(s) que Merchant Center rechazaría —`)
for (const p of problemas.slice(0, 25)) console.log('  · ' + p)
if (problemas.length > 25) console.log(`  … y ${problemas.length - 25} más`)
process.exit(1)
