import { normalize } from './format'

/**
 * Búsqueda tolerante a la ortografía.
 *
 * ------------------------------------------------------------------
 * Por qué hace falta
 * ------------------------------------------------------------------
 * La búsqueda comparaba subcadenas exactas sobre el texto sin tildes. Con eso,
 * quien escribe «amazador» buscando una amasadora no encuentra nada, y el sitio
 * le dice que no existe un producto que sí tiene en stock.
 *
 * ------------------------------------------------------------------
 * Dos mecanismos, en este orden
 * ------------------------------------------------------------------
 * **1. Equivalencia fonética.** En castellano de Chile la mayor parte de las
 * faltas no son errores de tecleo sino de escritura: s, z y c suenan igual, la
 * h no suena, b y v no se distinguen, ll e y son el mismo sonido. Reduciendo
 * las dos cadenas a cómo se pronuncian, «amazador» y «amasadora» pasan a
 * empezar igual. Es determinista, no tiene umbrales que ajustar y cuesta un
 * puñado de reemplazos de texto.
 *
 * **2. Distancia de edición.** Para lo que sí es tecleo: letras faltantes,
 * cambiadas o de más —«amsadora», «amasdora»—. Es más caro, así que solo corre
 * cuando lo anterior no encontró nada.
 *
 * El orden importa para el puntaje: una coincidencia exacta tiene que ganarle
 * siempre a una fonética, y esta a una por distancia. Si no, escribir bien el
 * nombre de un producto podría devolver primero otro parecido.
 */

/**
 * Reduce el texto a cómo se pronuncia.
 *
 * El orden de los reemplazos **no es intercambiable**, y cada paso está donde
 * está por un motivo:
 *
 *   · `qu` se resuelve antes de tocar `ch`, si no «chuleta» pasaría por el
 *     reemplazo de `qu` y quedaría irreconocible;
 *   · `ch` se convierte a `q` —una letra que a esta altura ya no aparece— para
 *     que después se pueda borrar la h sin comerse la de `ch`;
 *   · `c` ante e/i se resuelve antes de convertir el resto de las c en k.
 *
 * Lo que importa no es que el resultado se parezca al español escrito, sino que
 * las dos formas de escribir la misma palabra lleguen a la misma cadena.
 */
export function fonetico(texto: string): string {
  let t = normalize(texto)

  t = t.replace(/ll/g, 'y')
  t = t.replace(/qu/g, 'k')
  t = t.replace(/ch/g, 'q') // la q queda libre después del paso anterior
  t = t.replace(/gu([ei])/g, 'g$1') // guerra → gerra
  t = t.replace(/g([ei])/g, 'j$1') // gente → jente
  t = t.replace(/c([ei])/g, 's$1') // cera → sera
  t = t.replace(/c/g, 'k') // casa → kasa
  t = t.replace(/z/g, 's')
  t = t.replace(/x/g, 's') // inoxidable → inosidable
  t = t.replace(/v/g, 'b')
  t = t.replace(/w/g, 'b')
  t = t.replace(/h/g, '') // hielo → ielo; la de «ch» ya se fue con la q
  t = t.replace(/y/g, 'i') // yema → iema, y llave → yabe → iabe

  // Dobles: «rr» y «nn» se escriben mal muy seguido, en las dos direcciones.
  t = t.replace(/(.)\1+/g, '$1')

  // Todo lo que no es letra ni número separa palabras.
  t = t.replace(/[^a-z0-9ñ]+/g, ' ')

  return t.replace(/\s+/g, ' ').trim()
}

/**
 * Distancia de edición, cortando en cuanto se pasa del máximo.
 *
 * El corte no es un detalle de rendimiento: sin él, comparar cada término con
 * cada palabra de 214 productos en cada tecla escrita se nota.
 */
export function distancia(a: string, b: string, maximo: number): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > maximo) return maximo + 1
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i)
  let actual = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    actual[0] = i
    let mejorDeLaFila = actual[0]

    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1
      actual[j] = Math.min(actual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + costo)
      if (actual[j] < mejorDeLaFila) mejorDeLaFila = actual[j]
    }

    // Ninguna celda de la fila baja del máximo: ya no hay forma de mejorar.
    if (mejorDeLaFila > maximo) return maximo + 1

    const intercambio = anterior
    anterior = actual
    actual = intercambio
  }

  return anterior[b.length]
}

/**
 * Cuánto error se le tolera a una palabra según su largo.
 *
 * En palabras cortas una letra de diferencia cambia el significado —«taza» y
 * «tapa», «vaso» y «paso»— así que hasta cuatro letras no se tolera nada: para
 * esas ya alcanza la equivalencia fonética.
 */
export function toleranciaPara(termino: string): number {
  if (termino.length <= 4) return 0
  if (termino.length <= 7) return 1
  return 2
}

export type CamposDeBusqueda = {
  nombre: string
  sku: string
  cuerpo: string
  nombreFonetico: string
  skuFonetico: string
  cuerpoFonetico: string
  palabrasFoneticas: string[]
}

/** Prepara los campos de un producto una sola vez. */
export function camposDe({
  nombre,
  sku,
  cuerpo,
}: {
  nombre: string
  sku: string
  cuerpo: string
}): CamposDeBusqueda {
  const nombreFonetico = fonetico(nombre)
  return {
    nombre: normalize(nombre),
    sku: normalize(sku),
    cuerpo: normalize(cuerpo),
    nombreFonetico,
    skuFonetico: fonetico(sku),
    cuerpoFonetico: fonetico(cuerpo),
    palabrasFoneticas: nombreFonetico.split(' ').filter(Boolean),
  }
}

/** De dónde salió la coincidencia. Sirve para poder explicar el resultado. */
export type Coincidencia = 'exacta' | 'fonetica' | 'aproximada' | null

const ORDEN_DE_COINCIDENCIA = { exacta: 3, fonetica: 2, aproximada: 1 } as const

/**
 * Puntúa un producto contra los términos buscados.
 *
 * Devuelve 0 cuando **algún** término no aparece de ninguna forma: buscar
 * «horno rotatorio» no puede devolver todos los hornos.
 */
export function puntuar(
  campos: CamposDeBusqueda,
  terminos: string[],
): { puntaje: number; como: Coincidencia } {
  let puntaje = 0
  let como: Coincidencia = null

  const subir = (nueva: Exclude<Coincidencia, null>) => {
    if (!como || ORDEN_DE_COINCIDENCIA[nueva] > ORDEN_DE_COINCIDENCIA[como]) como = nueva
  }

  for (const termino of terminos) {
    const fon = fonetico(termino)
    let delTermino = 0

    // 1 · Exacto. Siempre gana.
    if (campos.nombre.startsWith(termino)) delTermino = 24
    else if (campos.nombre.includes(termino)) delTermino = 16
    else if (campos.sku.includes(termino)) delTermino = 12
    if (delTermino > 0) subir('exacta')

    // 2 · Fonético.
    if (delTermino === 0 && fon) {
      if (campos.nombreFonetico.startsWith(fon)) delTermino = 10
      else if (campos.nombreFonetico.includes(fon)) delTermino = 7
      else if (campos.skuFonetico.includes(fon)) delTermino = 6
      if (delTermino > 0) subir('fonetica')
    }

    // 3 · Aproximado, solo si lo anterior falló: es el más caro de los tres.
    //
    // El puntaje baja con la distancia, y no es un refinamiento: con un valor
    // plano, buscar «amsadora» devolvía «Asador de pollos» antes que
    // «Amasadora», porque las dos entraban con el mismo puntaje y decidía el
    // orden del catálogo. La amasadora está a una edición y el asador a dos.
    if (delTermino === 0) {
      const tolerancia = toleranciaPara(fon)
      if (tolerancia > 0) {
        let mejor = tolerancia + 1
        for (const palabra of campos.palabrasFoneticas) {
          const d = distancia(fon, palabra, tolerancia)
          if (d < mejor) mejor = d
          if (mejor === 1) break // no va a haber nada mejor que esto acá
        }
        if (mejor <= tolerancia) {
          delTermino = Math.max(1, 6 - mejor)
          subir('aproximada')
        }
      }
    }

    // 4 · El cuerpo suma poco: que un término aparezca en la descripción no
    // convierte al producto en el que se estaba buscando.
    if (delTermino === 0) {
      if (campos.cuerpo.includes(termino)) {
        delTermino = 2
        subir('exacta')
      } else if (fon && campos.cuerpoFonetico.includes(fon)) {
        delTermino = 1
        subir('fonetica')
      }
    }

    // Un término que no aparece de ninguna forma descarta el producto.
    if (delTermino === 0) return { puntaje: 0, como: null }

    puntaje += delTermino
  }

  return { puntaje, como }
}
