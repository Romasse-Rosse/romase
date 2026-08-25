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
import { mkdir, readFile, writeFile } from 'node:fs/promises'
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

for (const [clave, foto] of Object.entries(fuentes)) {
  const res = await fetch(foto.url)
  if (!res.ok) {
    console.error(`  ${clave}: no se pudo bajar (${res.status})`)
    continue
  }

  const salida = path.join(DESTINO, `${clave}.webp`)
  await sharp(Buffer.from(await res.arrayBuffer()))
    // 'attention' recorta buscando la zona de más interés visual, así no se
    // pierde lo importante de la foto al pasar a panorámica.
    .resize(ANCHO, ALTO, { fit: 'cover', position: sharp.strategy.attention })
    .webp({ quality: 78 })
    .toFile(salida)

  const meta = await sharp(salida).metadata()
  console.log(`  ${clave.padEnd(17)} ${ANCHO}×${ALTO}  ${Math.round((meta.size ?? 0) / 1024)} KB`)

  creditos.push({
    archivo: `${clave}.webp`,
    titulo: foto.titulo,
    licencia: foto.licencia,
    origen: foto.origen,
    fuente: foto.url,
  })
}

await writeFile(path.join(DESTINO, 'creditos.json'), JSON.stringify(creditos, null, 2))
console.log(`\nListo: ${creditos.length} imágenes en public/banner/`)
