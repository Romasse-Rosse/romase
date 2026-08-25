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

/** Convierte el HTML que viene de WooCommerce en texto plano. */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8217;|&#039;|&#8216;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
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
  'KG', 'GR', 'LT', 'ML', 'CC', 'CM', 'MM', 'MT', 'W', 'V', 'A', 'HZ',
])

/**
 * Los nombres del catálogo vienen en MAYÚSCULA SOSTENIDA desde WooCommerce
 * ("MOLDE CUADRADO TEFLÓN 24 CMS"). Se pasan a mayúscula de oración, que es
 * lo correcto en español —no Title Case, que es una convención del inglés—,
 * respetando siglas, unidades y códigos de modelo.
 */
export function titleCase(text: string): string {
  if (!text) return ''
  // Si ya viene con mayúsculas y minúsculas mezcladas, se respeta tal cual.
  if (text !== text.toUpperCase()) return text

  const resultado = text
    .toLowerCase()
    .split(/(\s+)/)
    .map((token) => {
      if (!token.trim()) return token
      const letras = token.toUpperCase().replace(/[^A-Z]/g, '')
      // Unidades y siglas: "CMS" y "CM" comparten raíz, por eso se prueba sin la S final.
      if (SIGLAS.has(letras) || (letras.endsWith('S') && SIGLAS.has(letras.slice(0, -1)))) {
        return token.toUpperCase()
      }
      // Medidas y códigos de modelo: "1/2", "R-134A", "GN1/1".
      if (/\d/.test(token)) return token.toUpperCase()
      return token
    })
    .join('')

  // Mayúscula inicial, salvo que la primera palabra ya sea una sigla.
  return resultado.charAt(0).toUpperCase() + resultado.slice(1)
}
