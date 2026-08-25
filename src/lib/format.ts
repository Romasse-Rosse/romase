const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

/** $ 1.234.567 — el peso chileno no usa decimales. */
export function formatPrice(value: number): string {
  return clp.format(Math.round(value))
}

/** Quita tildes y pasa a minúsculas, para comparar texto sin sorpresas. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

const ENTIDADES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
  '&#215;': '×',
  '&#8211;': '–',
  '&#8212;': '—',
  '&#8220;': '"',
  '&#8221;': '"',
  '&#8216;': "'",
  '&#8217;': "'",
  '&#039;': "'",
}

/**
 * Decodifica las entidades HTML que WooCommerce deja escapadas.
 * Aparecen incluso en los nombres de producto: hay medidas cargadas como
 * "32,5&#215;17,6" que sin esto se muestran tal cual.
 */
export function decodeEntities(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/&nbsp;|&amp;|&quot;|&lt;|&gt;|&#\d+;/g, (m) => ENTIDADES[m] ?? m)
}

/** Convierte el HTML que viene de WooCommerce en texto plano. */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`
}

/** Siglas y unidades que deben quedar en mayúscula aunque el resto no. */
const SIGLAS = new Set([
  'INOX', 'PVC', 'LED', 'GN', 'RPM', 'AC', 'DC', 'HP', 'CV',
  'KG', 'GR', 'LT', 'ML', 'CC', 'CM', 'MM', 'MT', 'W', 'V', 'HZ',
  // 'A' de amperes queda fuera a propósito: choca con la preposición
  // ('freidora a gas' se convertía en 'freidora A gas').
  'ITA', // marca de depósitos gastronómicos, se escribe en mayúsculas
])

/**
 * Marcas presentes en el catálogo. Se escriben como nombre propio en vez de
 * quedar en minúscula: "Batidora planetaria 20 LTS pareti kitchenette" está mal.
 */
const MARCAS = new Set([
  'VENTUS', 'ECOBECK', 'BLANIK', 'PARETI', 'KITCHENETTE',
  'ARCOS', 'COUSIÑO', 'HERCULES',
])

const capitalizar = (palabra: string) =>
  palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()

/**
 * Los nombres del catálogo vienen en MAYÚSCULA SOSTENIDA desde WooCommerce
 * ("MOLDE CUADRADO TEFLÓN 24 CMS"). Se pasan a mayúscula de oración, que es
 * lo correcto en español —no Title Case, que es una convención del inglés—,
 * respetando siglas, unidades, códigos de modelo y marcas.
 */
export function titleCase(text: string): string {
  if (!text) return ''
  const limpio = decodeEntities(text)

  // Hay nombres que gritan pero traen alguna palabra en minúscula
  // ('BURLETE PARA HORNO TURBO A GAS PRP-8000 Ventus'), así que no alcanza con
  // comparar contra toUpperCase(): se mide la proporción de mayúsculas.
  const letras = limpio.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '')
  if (!letras) return limpio
  const proporcionMayusculas =
    [...letras].filter((c) => c === c.toUpperCase()).length / letras.length
  if (proporcionMayusculas < 0.7) return limpio

  const resultado = limpio
    .toLowerCase()
    .split(/(\s+)/)
    .map((token) => {
      if (!token.trim()) return token
      const letras = token.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ]/g, '')
      // Unidades y siglas: "CMS" y "CM" comparten raíz, por eso se prueba sin la S final.
      if (SIGLAS.has(letras) || (letras.endsWith('S') && SIGLAS.has(letras.slice(0, -1)))) {
        return token.toUpperCase()
      }
      // Marcas, incluidas las compuestas con guion ("PARETI-KITCHENETTE").
      const partes = token.split('-')
      if (partes.some((p) => MARCAS.has(p.toUpperCase()))) {
        return partes.map(capitalizar).join('-')
      }
      // Medidas y códigos de modelo: "1/2", "R-134A", "GN1/1".
      // La x que separa medidas pasa al signo de multiplicar: es lo correcto
      // y además iguala a las que ya venían escritas con ×.
      if (/\d/.test(token)) return token.toUpperCase().replace(/(\d)X(?=\d)/g, '$1×')
      return token
    })
    .join('')

  // Mayúscula inicial, salvo que la primera palabra ya sea una sigla.
  return resultado.charAt(0).toUpperCase() + resultado.slice(1)
}
