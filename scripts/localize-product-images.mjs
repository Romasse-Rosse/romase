// ============================================================
// ROMASE · trae las fotos de producto al propio sitio.
//
//   node scripts/localize-product-images.mjs
//
// Las fotos vivían en romase.cl pesando entre 400 KB y 1,3 MB cada una, y
// Next las optimizaba en cada arranque en frío: por eso la primera carga
// tardaba segundos y la instancia se quedaba sin memoria.
//
// Este script las baja una vez, las redimensiona y las guarda como WebP en
// public/productos/. Desde ahí se sirven como archivo estático, sin pasar por
// el optimizador.
//
// Es idempotente: si la imagen ya está, no la vuelve a bajar.
// ============================================================
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const RAIZ = path.join(import.meta.dirname, '..')
const DESTINO = path.join(RAIZ, 'public', 'productos')

/** Ancho máximo. La ficha muestra la foto a 700 px como mucho. */
const ANCHO = 900
const CALIDAD = 76

/** Nombre de archivo estable a partir de la URL de origen. */
export function nombreLocal(url) {
  const base = decodeURIComponent(url.split('/').pop() ?? '')
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
  return `${base || 'foto'}.webp`
}

const productos = JSON.parse(
  await readFile(path.join(RAIZ, 'migration', 'data', 'products.json'), 'utf8'),
)

const urls = [...new Set(productos.flatMap((p) => (p.images ?? []).map((i) => i.src)))]
await mkdir(DESTINO, { recursive: true })
const yaEstan = new Set(await readdir(DESTINO).catch(() => []))

console.log(`${urls.length} fotos distintas en el catálogo`)

const mapa = {}
let bajadas = 0
let saltadas = 0
let fallidas = 0
let pesoTotal = 0

for (const url of urls) {
  const archivo = nombreLocal(url)
  mapa[url] = `/productos/${archivo}`

  if (yaEstan.has(archivo)) {
    saltadas++
    continue
  }

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const buf = Buffer.from(await res.arrayBuffer())

    // withoutEnlargement: si la original es más chica, no se agranda.
    const salida = await sharp(buf)
      .resize({ width: ANCHO, withoutEnlargement: true })
      .webp({ quality: CALIDAD })
      .toBuffer()

    await writeFile(path.join(DESTINO, archivo), salida)
    pesoTotal += salida.length
    bajadas++
    if (bajadas % 25 === 0) process.stdout.write(`\r  bajadas ${bajadas}…`)
  } catch (error) {
    fallidas++
    console.error(`\n  falló ${url.split('/').pop()}: ${error.message}`)
    // Si no se pudo bajar se deja la URL remota, para no perder la foto.
    mapa[url] = url
  }
}

await writeFile(
  path.join(RAIZ, 'migration', 'data', 'imagenes-locales.json'),
  JSON.stringify(mapa, null, 2),
)

console.log(
  `\nbajadas ${bajadas}  ·  ya estaban ${saltadas}  ·  fallidas ${fallidas}` +
    (bajadas ? `  ·  ${Math.round(pesoTotal / bajadas / 1024)} KB de promedio` : ''),
)
