// ============================================================
// ROMASE · auditoría de las notas del blog
//
//   node scripts/auditar-notas.mjs
//
// Comprueba cada nota contra el estándar de redacción de la agencia
// (skills/seo/redaccion-contenido en el repositorio de conocimiento).
// Termina con código 1 si alguna regla falla, así puede correr en CI.
//
// Lo que NO puede comprobar una máquina —que la voz suene a persona, que la
// keyword tenga volumen real, que un dato esté verificado— queda como aviso
// para revisar a mano, no como error.
// ============================================================
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const RAIZ = path.join(import.meta.dirname, '..')
const FUENTE = path.join(RAIZ, 'src', 'content', 'blog.ts')

// ------------------------------------------------------------
// Lectura del archivo de contenido
//
// Se parsea con expresiones regulares en vez de importarlo: es un .ts y este
// script corre con node a secas, sin compilar nada.
// ------------------------------------------------------------
const fuente = await readFile(FUENTE, 'utf8')

const bloques = fuente
  .split(/\n  \{\n/)
  .slice(1)
  .map((b) => b.split(/\n  \},\n/)[0])

const campo = (bloque, nombre) => {
  // Cadena simple, posiblemente partida en varias líneas con +.
  const re = new RegExp(`${nombre}:\\s*((?:'[^']*'(?:\\s*\\+\\s*)?)+)`, 'm')
  const m = bloque.match(re)
  if (!m) return null
  return [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).join('')
}

const cuerpoDe = (bloque) => {
  const m = bloque.match(/cuerpo: `([\s\S]*?)`,\s*$/m)
  return m ? m[1] : ''
}

const notas = bloques
  .filter((b) => b.includes('slug:') && b.includes('cuerpo:'))
  .map((b) => ({
    slug: campo(b, 'slug'),
    titulo: campo(b, 'titulo'),
    keyword: campo(b, 'keyword'),
    metaTitulo: campo(b, 'metaTitulo'),
    metaDescripcion: campo(b, 'metaDescripcion'),
    portadaAlt: campo(b, 'portadaAlt'),
    tieneImagenProducto: /imagenProducto: \{/.test(b),
    altProducto: campo(b, 'alt'),
    cuerpo: cuerpoDe(b),
  }))

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------
const sinTildes = (t) =>
  t
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

const contiene = (texto, aguja) => sinTildes(texto).includes(sinTildes(aguja))

const aTexto = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// ------------------------------------------------------------
// Reglas
// ------------------------------------------------------------
let errores = 0
let avisos = 0

const fallo = (msg) => {
  console.log(`   ✗ ${msg}`)
  errores++
}
const aviso = (msg) => {
  console.log(`   ! ${msg}`)
  avisos++
}
const bien = (msg) => console.log(`    · ${msg}`)

for (const nota of notas) {
  console.log(`\n${nota.titulo}`)
  console.log(`  /blog/${nota.slug}  ·  keyword: «${nota.keyword}»`)

  const texto = aTexto(nota.cuerpo)
  const palabras = texto.split(' ').filter(Boolean).length
  const h2 = [...nota.cuerpo.matchAll(/<h2>([\s\S]*?)<\/h2>/g)].map((m) => aTexto(m[1]))
  const parrafos = [...nota.cuerpo.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => aTexto(m[1]))
  const enlaces = [...nota.cuerpo.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1])

  // Extensión
  if (palabras < 600) fallo(`${palabras} palabras: el mínimo es 600`)
  else bien(`${palabras} palabras`)

  // Encabezados
  const h2Esperados = Math.max(2, Math.round(palabras / 300))
  if (h2.length < 2) fallo(`${h2.length} H2: el mínimo es 2`)
  else if (h2.length < h2Esperados)
    aviso(`${h2.length} H2 para ${palabras} palabras; la guía sugiere ${h2Esperados}`)
  else bien(`${h2.length} H2`)

  if (/<h3>/.test(nota.cuerpo) && h2.length === 0) fallo('hay H3 sin ningún H2 por encima')
  if (/<h1>/.test(nota.cuerpo)) fallo('el cuerpo trae un H1: el H1 lo pone la página')

  // Regla anti-conclusión
  const ultimo = h2[h2.length - 1] ?? ''
  if (/^conclusi[oó]n(es)?$/i.test(ultimo.trim()))
    fallo(`el último H2 es «${ultimo}»: tiene que ser descriptivo`)

  // Keyword en los sitios obligatorios
  const sitios = [
    ['H1', nota.titulo],
    ['primer párrafo', parrafos[0] ?? ''],
    ['metatítulo', nota.metaTitulo ?? ''],
    ['metadescripción', nota.metaDescripcion ?? ''],
    ['slug', (nota.slug ?? '').replace(/-/g, ' ')],
  ]
  for (const [donde, valor] of sitios) {
    if (!contiene(valor, nota.keyword)) fallo(`la keyword no está en el ${donde}`)
  }
  if (!h2.some((t) => contiene(t, nota.keyword)))
    aviso('ningún H2 contiene la keyword ni un sinónimo directo')

  const alts = [nota.portadaAlt, nota.altProducto].filter(Boolean)
  if (!alts.some((a) => contiene(a, nota.keyword)))
    fallo('ningún alt de imagen contiene la keyword')

  // Longitudes de los metadatos
  const lt = (nota.metaTitulo ?? '').length
  if (lt < 50 || lt > 60) fallo(`metatítulo de ${lt} caracteres: el rango es 50 a 60`)
  else bien(`metatítulo de ${lt} caracteres`)

  const ld = (nota.metaDescripcion ?? '').length
  if (ld < 135 || ld > 145) fallo(`metadescripción de ${ld} caracteres: el rango es 135 a 145`)
  else bien(`metadescripción de ${ld} caracteres`)

  // Slug
  if ((nota.slug ?? '').length > 60) fallo(`slug de ${nota.slug.length} caracteres: el máximo es 60`)
  if (!/^[a-z0-9-]+$/.test(nota.slug ?? '')) fallo('el slug tiene caracteres fuera de a-z, 0-9 y guion')

  // Párrafos
  const largo = parrafos.filter((p) => p.split(' ').length > 50)
  if (largo.length) fallo(`${largo.length} párrafo(s) de más de 50 palabras`)
  else bien('ningún párrafo pasa de 50 palabras')

  // Los cuatro formatos
  const formatos = {
    negritas: /<strong>/.test(nota.cuerpo),
    cursivas: /<em>/.test(nota.cuerpo),
    listas: /<(ul|ol)>/.test(nota.cuerpo),
    citas: /<blockquote>/.test(nota.cuerpo),
  }
  const faltan = Object.entries(formatos)
    .filter(([, hay]) => !hay)
    .map(([k]) => k)
  if (faltan.length) fallo(`faltan formatos: ${faltan.join(', ')}`)
  else bien('los cuatro formatos presentes')

  // Imágenes
  const imagenes = (nota.portadaAlt ? 1 : 0) + (nota.tieneImagenProducto ? 1 : 0)
  const minimo = palabras >= 1200 ? 3 : 2
  if (imagenes < minimo) fallo(`${imagenes} imagen(es): para ${palabras} palabras van ${minimo}`)
  else bien(`${imagenes} imágenes`)

  // Enlaces
  const externos = enlaces.filter((h) => /^https?:\/\//.test(h))
  if (externos.length) fallo(`${externos.length} enlace(s) externo(s): ${externos.join(', ')}`)

  const internos = enlaces.filter((h) => h.startsWith('/'))
  if (internos.length < 2) fallo(`${internos.length} enlace(s) interno(s): van al menos 2 con el CTA`)
  else bien(`${internos.length} enlaces internos`)

  // CTA al cierre: el último elemento del cuerpo tiene que ser un enlace a una
  // categoría o producto, no a otra nota.
  const ultimoParrafo = parrafos[parrafos.length - 1] ?? ''
  const cierre = nota.cuerpo.trim().match(/<p><a href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/p>\s*$/)
  if (!cierre) fallo('el cuerpo no termina con el CTA como párrafo propio')
  else if (!/^\/(categorias|productos)\//.test(cierre[1]))
    fallo(`el CTA apunta a ${cierre[1]}: tiene que ir a una categoría o producto`)
  else if (/^(compra|haz clic|solicita)/i.test(aTexto(cierre[2])))
    fallo(`el texto del CTA es «${aTexto(cierre[2])}»: suena a instrucción de venta`)
  else bien(`CTA al cierre hacia ${cierre[1]}`)

  if (ultimoParrafo && /^(en conclusi|en resumen|como hemos visto)/i.test(ultimoParrafo))
    fallo('el cierre empieza con una frase de plantilla')

  // Frases de plantilla prohibidas
  const plantillas = [
    'en este artículo te explicamos',
    'a continuación veremos',
    'como hemos visto',
    'en resumen',
    'en conclusión',
    'hoy vamos a hablar',
  ]
  const encontradas = plantillas.filter((f) => contiene(texto, f))
  if (encontradas.length) fallo(`frases de plantilla: ${encontradas.join(', ')}`)

  // Cifras sin fuente: no se puede decidir por máquina, se marca para revisar.
  const cifras = texto.match(/\b\d[\d.,]*\s*(%|°C|kg|kilos?|m²|min|minutos?|horas?|días?)?/g) ?? []
  if (cifras.length) {
    aviso(
      `${cifras.length} cifra(s) en el cuerpo: cada una necesita fuente verificada o ` +
        `pasar a cualitativo — ${[...new Set(cifras)].slice(0, 8).join(' | ')}`,
    )
  } else bien('sin cifras sin fuente')

  // Title Case a la inglesa
  const palabrasTitulo = (nota.titulo ?? '').split(' ').slice(1)
  const mayusculasDeMas = palabrasTitulo.filter((p) => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,}/.test(p))
  if (mayusculasDeMas.length >= 2)
    aviso(`el título parece Title Case a la inglesa: ${mayusculasDeMas.join(', ')}`)
}

console.log(
  `\n${notas.length} nota(s) · ${errores} error(es) · ${avisos} aviso(s) para revisar a mano`,
)

if (errores > 0) process.exitCode = 1
