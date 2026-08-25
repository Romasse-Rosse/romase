// ============================================================
// ROMASE · imágenes del banner de portada.
//
//   node scripts/fetch-banner-images.mjs
//
// Baja las fotos de ambiente del banner, las recorta a formato panorámico y
// las guarda como WebP en public/banner/. Se sirven desde el propio sitio, no
// enlazadas de un tercero.
//
// Las fuentes están en scripts/banner-fuentes.json. Todas son CC0 (dominio
// público equivalente): uso comercial libre y sin atribución obligatoria. La
// procedencia queda registrada en public/banner/creditos.json, que no se
// muestra en el sitio pero deja el respaldo de dónde salió cada una.
//
// Para cambiar una foto: reemplazar su URL en banner-fuentes.json y volver a
// correr el script.
// ============================================================
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const RAIZ = path.join(import.meta.dirname, '..')
const DESTINO = path.join(RAIZ, 'public', 'banner')

/** Franja panorámica: se ve como banner y no como una foto suelta. */
const ANCHO = 2000
const ALTO = 900

const fuentes = JSON.parse(
  await readFile(path.join(import.meta.dirname, 'banner-fuentes.json'), 'utf8'),
)

await mkdir(DESTINO, { recursive: true })
const creditos = []
/** clave → nombre de archivo con hash, para que el sitio sepa qué pedir. */
const manifiesto = {}

for (const [clave, foto] of Object.entries(fuentes)) {
  const res = await fetch(foto.url)
  if (!res.ok) {
    console.error(`  ${clave}: no se pudo bajar (${res.status})`)
    continue
  }

  let img = sharp(Buffer.from(await res.arrayBuffer()))

  // El texto del banner ocupa la mitad izquierda. Si lo interesante de la foto
  // está a la izquierda, se espeja: así queda al aire y no debajo del titular.
  if (foto.espejo) img = sharp(await img.flop().toBuffer())

  // Recorte manual, en proporciones de 0 a 1. Se usa cuando el automático
  // deja lo interesante debajo del texto del banner: en la foto de panadería
  // el bol y la batidora quedaban tapados, y a la derecha solo se veía un
  // torso.
  if (foto.recorte) {
    const meta = await img.metadata()
    const ancho = Math.round((meta.width ?? 0) * foto.recorte.width)
    img = img.extract({
      left: Math.round((meta.width ?? 0) * foto.recorte.left),
      top: Math.round((meta.height ?? 0) * foto.recorte.top),
      width: ancho,
      height: Math.round((ancho * ALTO) / ANCHO),
    })
  }

  const webp = await img
    // Sin recorte manual, 'attention' busca la zona de más interés visual.
    .resize(ANCHO, ALTO, {
      fit: 'cover',
      position: foto.recorte ? 'center' : sharp.strategy.attention,
    })
    .webp({ quality: 78 })
    .toBuffer()

  // El hash va en el nombre para que cambiar la foto cambie la URL.
  const hash = createHash('sha1').update(webp).digest('hex').slice(0, 8)
  const archivo = `${clave}-${hash}.webp`
  await writeFile(path.join(DESTINO, archivo), webp)

  // Fuera las versiones anteriores de esta misma foto.
  for (const viejo of await readdir(DESTINO)) {
    if (viejo.startsWith(`${clave}-`) && viejo.endsWith('.webp') && viejo !== archivo) {
      await unlink(path.join(DESTINO, viejo))
      console.log(`  ${''.padEnd(17)} (se borró ${viejo})`)
    }
  }

  manifiesto[clave] = archivo
  console.log(`  ${clave.padEnd(17)} ${ANCHO}×${ALTO}  ${Math.round(webp.length / 1024)} KB  ${archivo}`)

  creditos.push({
    archivo,
    titulo: foto.titulo,
    licencia: foto.licencia,
    origen: foto.origen,
    fuente: foto.url,
  })
}

await writeFile(path.join(DESTINO, 'creditos.json'), JSON.stringify(creditos, null, 2) + '\n')

// El sitio lee de acá qué archivo pedir para cada sección.
await writeFile(path.join(DESTINO, 'manifiesto.json'), JSON.stringify(manifiesto, null, 2) + '\n')

console.log(`\nListo: ${creditos.length} imágenes en public/banner/`)
