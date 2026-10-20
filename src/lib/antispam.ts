/**
 * Filtro del correo basura que entra por los formularios.
 *
 * ------------------------------------------------------------------
 * Por qué no alcanzaba el honeypot
 * ------------------------------------------------------------------
 * Los dos formularios tienen un campo trampa desde el principio, y los bots
 * que están llegando lo esquivan: dejan vacíos los campos ocultos. Hay que
 * mirar otra cosa.
 *
 * ------------------------------------------------------------------
 * Lo que decidió el diseño: el spam real
 * ------------------------------------------------------------------
 * De las siete consultas guardadas hasta el 20 de octubre de 2026, cinco eran
 * basura y todas del mismo molde: en inglés, con enlaces, ofreciendo
 * generación de leads o SEO, cuatro desde el mismo dominio. La única consulta
 * legítima era «Horno doble camara a gas para pizzería»: español, 38
 * caracteres, sin enlaces.
 *
 * El filtro está calibrado contra eso. **No hay regla única**: se suman
 * señales y recién al pasar un umbral se marca como basura, para que ninguna
 * señal sola pueda descartar una consulta de verdad. El castellano del sur de
 * Chile se escribe sin tildes con frecuencia, así que la falta de tildes no
 * puntúa.
 *
 * ------------------------------------------------------------------
 * Nunca se descarta en silencio
 * ------------------------------------------------------------------
 * Lo que se marca como basura **igual se guarda**, con otro estado, y lo único
 * que no pasa es que suene el aviso por correo. Si el filtro se equivoca, la
 * consulta sigue estando. Un filtro que borra es peor que no tener filtro: un
 * cliente perdido cuesta mucho más que un correo de más.
 */

export type Veredicto = {
  esBasura: boolean
  puntos: number
  /** Qué disparó cada punto, para poder ajustar el filtro con datos. */
  motivos: string[]
}

/** A partir de acá se considera basura. */
export const UMBRAL = 4

/**
 * Palabras inglesas que no existen en castellano.
 *
 * Se excluyen a propósito las ambiguas —«a», «no», «e», «son», «ser»— porque
 * aparecen en consultas reales en español y harían saltar el filtro solo.
 */
const PALABRAS_INGLESAS = [
  'the', 'your', 'you', 'we', 'our', 'with', 'this', 'that', 'have', 'will',
  'would', 'hello', 'dear', 'please', 'website', 'business', 'free', 'offer',
  'best', 'just', 'about', 'more', 'what', 'here', 'from', 'they', 'their',
  'there', 'can', 'get', 'how', 'who', 'and',
]

/** Lo que vienen a vender los que escriben sin que nadie los llame. */
const TEMAS_DE_SPAM = [
  'lead generation', 'leads', 'seo', 'backlink', 'ranking', 'web design',
  'digital marketing', 'web traffic', 'visitors into', 'b2b', 'outreach',
  'cold email', 'crypto', 'bitcoin', 'loan', 'casino', 'viagra',
  'guest post', 'link building', 'increase sales', 'grow your',
]

/**
 * Dominios desde los que ya llegó basura.
 *
 * Se amplía cuando aparezca otro. No es la defensa principal —cambian de
 * dominio todo el tiempo— pero ataja barato a los que insisten: uno de estos
 * mandó cuatro veces el mismo texto.
 */
const DOMINIOS_CONOCIDOS = [
  'blastleadgeneration.com',
  'freeb2bdata.org',
]

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function evaluar(datos: {
  nombre: string
  email: string
  mensaje: string
  empresa?: string
  /** Milisegundos entre que se abrió el formulario y se envió. */
  demoraEnEnviar?: number
}): Veredicto {
  const motivos: string[] = []
  let puntos = 0

  const mensaje = normalizar(datos.mensaje)
  const dominio = datos.email.split('@')[1]?.toLowerCase() ?? ''

  const sumar = (n: number, motivo: string) => {
    puntos += n
    motivos.push(motivo)
  }

  // Un dominio del que ya vino basura.
  if (DOMINIOS_CONOCIDOS.some((d) => dominio === d || dominio.endsWith('.' + d))) {
    sumar(5, `dominio conocido de spam: ${dominio}`)
  }

  // Enlaces. Nadie que quiera comprar un horno manda una URL.
  const enlaces = (datos.mensaje.match(/https?:\/\/|www\./gi) ?? []).length
  if (enlaces > 0) sumar(enlaces > 1 ? 3 : 2, `${enlaces} enlace(s) en el mensaje`)

  // Inglés. El sitio es de Puerto Montt y está en castellano.
  const inglesas = PALABRAS_INGLESAS.filter((p) =>
    new RegExp(`\\b${p}\\b`, 'i').test(mensaje),
  ).length
  if (inglesas >= 5) sumar(3, `${inglesas} palabras en inglés`)
  else if (inglesas >= 3) sumar(2, `${inglesas} palabras en inglés`)

  // De qué viene a hablar.
  const temas = TEMAS_DE_SPAM.filter((t) => mensaje.includes(t))
  if (temas.length > 0) sumar(3, `ofrece: ${temas.slice(0, 3).join(', ')}`)

  // Nos devuelven el nombre del propio sitio: lo sacaron del dominio.
  if (/romase\s*cl\b|romase\.cl\s+owner|owner of/i.test(datos.mensaje)) {
    sumar(2, 'se dirige al «dueño de Romase Cl», texto generado desde el dominio')
  }

  // El nombre repetido como empresa: señal de formulario rellenado por máquina.
  if (datos.empresa && normalizar(datos.empresa) === normalizar(datos.nombre)) {
    sumar(1, 'el nombre y la empresa son idénticos')
  }

  /**
   * Enviado demasiado rápido.
   *
   * Una persona tarda en leer los campos y escribir. Menos de tres segundos
   * entre que carga la página y envía no lo hace nadie. Es la señal más
   * robusta porque no depende del contenido, así que sobrevive a que cambien
   * el texto.
   */
  if (typeof datos.demoraEnEnviar === 'number' && datos.demoraEnEnviar >= 0) {
    if (datos.demoraEnEnviar < 3000) {
      sumar(4, `enviado en ${(datos.demoraEnEnviar / 1000).toFixed(1)} s`)
    }
  }

  return { esBasura: puntos >= UMBRAL, puntos, motivos }
}
