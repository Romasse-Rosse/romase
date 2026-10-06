/**
 * Reseñas de clientes, transcritas desde el perfil de Google de ROMASE.
 *
 * ------------------------------------------------------------------
 * Se copian, no se corrigen
 * ------------------------------------------------------------------
 * Varias traen faltas de ortografía —«Exelente», «exalente», «atencion» sin
 * tilde, puntos suspensivos en vez de puntos— y van así. Corregirlas las
 * convierte en texto publicitario y se nota: parte de lo que hace creíble a un
 * testimonio es que no suene escrito por la empresa.
 *
 * Nunca inventar una reseña ni firmarla con un nombre que no la escribió. No
 * es un atajo: es poner en boca de alguien algo que no dijo.
 *
 * ------------------------------------------------------------------
 * Las fechas son aproximadas, y a propósito
 * ------------------------------------------------------------------
 * Google las muestra en relativo —«hace un mes», «hace 4 años»—, y eso
 * envejece mal: dentro de medio año «hace un mes» sería falso sin que nadie lo
 * tocara. Se guardan como mes y año aproximados, calculados desde esa glosa al
 * transcribirlas en octubre de 2026. De las antiguas va solo el año, porque
 * precisar más sería inventar precisión que no tenemos.
 */

export type Resena = {
  /** El texto, tal cual lo publicó quien lo escribió. */
  texto: string
  /** El nombre como figura en Google. */
  autor: string
  /** De 1 a 5. */
  estrellas: number
  /** Cuándo se publicó, aproximado. Ver la nota de arriba. */
  cuando: string
}

/** El enlace al perfil, para que cualquiera pueda verificar. */
export const PERFIL_DE_GOOGLE = 'https://maps.app.goo.gl/RiABhGLF9F8rB8q36'

export const RESENAS: Resena[] = [
  {
    texto:
      'Me gusta esta empresa por sus precios, seriedad y conocimientos en sus productos, en ' +
      'especial la post venta, por que ellos si cumplen.',
    autor: 'Francisco Quijada',
    estrellas: 5,
    cuando: '2024',
  },
  {
    texto:
      'Local bien ubicado..no tener que ir al centro..buena atencion y conocimiento de productos ' +
      'del rubro..me quede muy claro con induccion..En resumen buena etica profesional..',
    autor: 'Juan carlos Muñoz barahona',
    estrellas: 5,
    cuando: 'septiembre de 2026',
  },
  {
    texto:
      'Siempre un excelente servicio y atención... Voy y retorno feliz de los servicios y ' +
      'productos de Romase',
    autor: 'Cristian Eduardo Chavez Gallardo',
    estrellas: 5,
    cuando: '2022',
  },
  {
    texto:
      'La atencion es exalente, el local esta ubicado en avenida principal, estacionamiento ' +
      'gratis, muchos productos de mi interes, me gusto mucho.',
    autor: 'Nelly Carrillo',
    estrellas: 5,
    cuando: 'septiembre de 2026',
  },
  {
    texto:
      'Exelente atención, precios por debajo de la competencia, estacionamiento gratis, muchos ' +
      'productos.',
    autor: 'PATRICIO CARRILLO',
    estrellas: 5,
    cuando: 'septiembre de 2026',
  },
  {
    texto: 'Excelente calidad, atención y muy buenos precios',
    autor: 'pablo marin tellez',
    estrellas: 5,
    cuando: '2025',
  },
]
