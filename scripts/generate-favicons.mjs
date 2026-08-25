// ============================================================
// ROMASE · genera los favicons a partir del logo.
//
//   node scripts/generate-favicons.mjs
//
// El logo es un wordmark horizontal: puesto entero en un favicon queda
// ilegible a 16 px. Lo único que se reconoce a ese tamaño es la "R", así
// que se recorta esa letra y se centra en un cuadrado con la terracota de
// la marca.
//
// Si algún día cambia el logo, hay que revisar CAJA_R: son las coordenadas
// de la "R" dentro de public/brand/logo.png (764x280).
// ============================================================
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const RAIZ = path.join(import.meta.dirname, '..')
const LOGO = path.join(RAIZ, 'public/brand/logo.png')
const APP = path.join(RAIZ, 'src/app')

/** Caja de la "R" dentro del logo, medida sobre el canal alfa. */
const CAJA_R = { left: 62, top: 69, width: 126, height: 134 }

const TERRACOTA = { r: 221, g: 83, b: 48, alpha: 1 } // #dd5330

/** Proporción del lado que ocupa la letra. El resto es aire. */
const OCUPACION = 0.68

/**
 * Devuelve un PNG cuadrado del tamaño pedido: fondo terracota y la "R"
 * calada en blanco. Se usa el alfa del logo como máscara, así la letra
 * conserva la forma exacta del original.
 */
async function generarIcono(lado) {
  const alto = Math.round(lado * OCUPACION)
  const ancho = Math.round((alto * CAJA_R.width) / CAJA_R.height)

  // El alfa de la R, escalado, hace de máscara.
  const mascara = await sharp(LOGO)
    .extract(CAJA_R)
    .extractChannel('alpha')
    .resize(ancho, alto, { fit: 'fill' })
    .toBuffer()

  // Un rectángulo blanco al que se le aplica esa máscara como transparencia.
  const letra = await sharp({
    create: { width: ancho, height: alto, channels: 3, background: '#ffffff' },
  })
    .joinChannel(mascara)
    .png()
    .toBuffer()

  return sharp({
    create: { width: lado, height: lado, channels: 4, background: TERRACOTA },
  })
    .composite([{ input: letra, gravity: 'center' }])
    .png()
    .toBuffer()
}

/**
 * Arma un .ico con varias resoluciones. Desde Vista el formato admite PNG
 * embebido, que es mucho más simple que el BMP original.
 */
function empaquetarIco(imagenes) {
  const cabecera = Buffer.alloc(6)
  cabecera.writeUInt16LE(0, 0) // reservado
  cabecera.writeUInt16LE(1, 2) // tipo: icono
  cabecera.writeUInt16LE(imagenes.length, 4)

  let offset = 6 + imagenes.length * 16
  const entradas = imagenes.map(({ lado, png }) => {
    const entrada = Buffer.alloc(16)
    // 256 se codifica como 0, porque el campo es de un byte.
    entrada.writeUInt8(lado >= 256 ? 0 : lado, 0)
    entrada.writeUInt8(lado >= 256 ? 0 : lado, 1)
    entrada.writeUInt8(0, 2) // paleta
    entrada.writeUInt8(0, 3) // reservado
    entrada.writeUInt16LE(1, 4) // planos
    entrada.writeUInt16LE(32, 6) // bits por píxel
    entrada.writeUInt32LE(png.length, 8)
    entrada.writeUInt32LE(offset, 12)
    offset += png.length
    return entrada
  })

  return Buffer.concat([cabecera, ...entradas, ...imagenes.map((i) => i.png)])
}

await mkdir(APP, { recursive: true })

// Next toma estos nombres por convención y arma los <link> solo.
const icono512 = await generarIcono(512)
await writeFile(path.join(APP, 'icon.png'), icono512)
await writeFile(path.join(APP, 'apple-icon.png'), await generarIcono(180))

const ico = empaquetarIco(
  await Promise.all([16, 32, 48].map(async (lado) => ({ lado, png: await generarIcono(lado) }))),
)
await writeFile(path.join(APP, 'favicon.ico'), ico)

// El logo del encabezado y del pie se muestra a unos 44 px de alto. Se
// genera una versión a ese tamaño (con margen para pantallas retina) y se
// sirve tal cual, sin pasar por el optimizador de imágenes: ya viene listo.
const LOGO_WEB_ANCHO = 400
await sharp(LOGO)
  .resize({ width: LOGO_WEB_ANCHO })
  .webp({ quality: 90 })
  .toFile(path.join(RAIZ, 'public', 'brand', 'logo-web.webp'))

console.log('Generados en src/app/:')
console.log('  icon.png        512x512')
console.log('  apple-icon.png  180x180')
console.log(`  favicon.ico     16, 32 y 48 px (${ico.length} bytes)`)
