// ============================================================
// ROMASE · el filtro de correo basura
//
//   yarn antispam:probar
//
// Dos cosas que comprobar, y la segunda importa más que la primera: que
// ataje el spam que llegó de verdad, y que NO toque las consultas
// legítimas. Un filtro que se come un cliente cuesta mucho más que uno
// que deja pasar un correo.
//
// Al final, si hay credenciales, lo corre contra las consultas reales
// guardadas en Supabase.
// ============================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, '..')

const copia = join(tmpdir(), 'romase-antispam.ts')
writeFileSync(copia, readFileSync(join(raiz, 'src/lib/antispam.ts'), 'utf8'), 'utf8')
const { evaluar, UMBRAL } = await import(pathToFileURL(copia).href)

let fallos = 0
const comprobar = (nombre, condicion, detalle = '') => {
  if (!condicion) fallos++
  console.log(`${condicion ? ' ok ' : 'FALLA'}  ${nombre}${detalle ? ` · ${detalle}` : ''}`)
}

// ------------------------------------------------------------
// Lo que NO se puede tocar: consultas de clientes de verdad
// ------------------------------------------------------------
console.log('— consultas legítimas, tienen que pasar —\n')

const LEGITIMAS = [
  {
    nombre: 'Tatiana',
    email: 'tatiana.jauregui.v@gmail.com',
    empresa: 'Barbotina spa',
    mensaje: 'Horno doble camara a gas para pizzería',
    porque: 'la real que llegó, sin tildes y corta',
  },
  {
    nombre: 'Juan Pérez',
    email: 'juan@panaderiasanjose.cl',
    empresa: 'Panadería San José',
    mensaje:
      'Buenas tardes, necesito cotizar una amasadora de 25 kilos y una sobadora. ' +
      'Tienen despacho a Castro? Gracias',
    porque: 'consulta normal, con pregunta',
  },
  {
    nombre: 'maria',
    email: 'maria.gonzalez@gmail.com',
    mensaje: 'hola quiero saber precio de vitrina refrigerada de 1.5 metros',
    porque: 'todo en minúsculas, sin tildes ni puntuación',
  },
  {
    nombre: 'Roberto Muñoz',
    email: 'rmunoz@hotelpuertovaras.cl',
    empresa: 'Hotel Puerto Varas',
    mensaje:
      'Estimados, estamos equipando la cocina del hotel y necesitamos cotizar ' +
      'cocina industrial de 6 platos, campana y mesones de acero. Quedo atento.',
    porque: 'formal y larga, de empresa',
  },
  {
    nombre: 'Pedro',
    email: 'pedro@gmail.com',
    mensaje: 'Tienen repuestos para horno Maigas? El mio no calienta bien',
    porque: 'muy corta, sin tildes',
  },
]

for (const c of LEGITIMAS) {
  const v = evaluar({ nombre: c.nombre, email: c.email, mensaje: c.mensaje, empresa: c.empresa })
  comprobar(
    `pasa: ${c.porque}`,
    !v.esBasura,
    `${v.puntos} pts${v.motivos.length ? ' · ' + v.motivos.join(' · ') : ''}`,
  )
}

// ------------------------------------------------------------
// El spam que llegó de verdad
// ------------------------------------------------------------
console.log('\n— spam real, tiene que atajarse —\n')

const BASURA = [
  {
    nombre: 'Beatriz Lewers',
    email: 'hello@blastleadgeneration.com',
    empresa: 'OH',
    mensaje:
      'Hello Romase Cl Owner, My name is Beatriz and I am betting you would like your ' +
      'website Romase Cl to generate more leads. Here is how: Web Visitors Into Leads is ' +
      'a software widget that works on your site. Visit https://blastleadgeneration.com',
    porque: 'el que llegó cuatro veces',
  },
  {
    nombre: "Princess O'Flaherty",
    email: 'info@freeb2bdata.org',
    empresa: "Princess O'Flaherty",
    mensaje:
      'Hi, Quick one — we just opened FreeB2BData, a B2B lead finder that gives you ' +
      'people, companies, emails and full outreach tools in one place.',
    porque: 'nombre igual a la empresa',
  },
  {
    nombre: 'John Smith',
    email: 'john@seoexperts.biz',
    mensaje:
      'Hello, I noticed your website is not ranking well on Google. We offer SEO and ' +
      'link building services at the best prices. Check www.seoexperts.biz',
    porque: 'oferta de SEO con enlaces',
  },
]

for (const c of BASURA) {
  const v = evaluar({ nombre: c.nombre, email: c.email, mensaje: c.mensaje, empresa: c.empresa })
  comprobar(`ataja: ${c.porque}`, v.esBasura, `${v.puntos} pts · ${v.motivos.join(' · ')}`)
}

// ------------------------------------------------------------
// La trampa del tiempo
// ------------------------------------------------------------
console.log('\n— la trampa del tiempo —\n')

const normal = { nombre: 'Ana', email: 'ana@gmail.com', mensaje: 'Precio de freidora industrial' }

comprobar(
  'un envío instantáneo se ataja aunque el texto sea inocente',
  evaluar({ ...normal, demoraEnEnviar: 400 }).esBasura,
)
comprobar(
  'escribir treinta segundos pasa',
  !evaluar({ ...normal, demoraEnEnviar: 30_000 }).esBasura,
)
comprobar(
  'sin dato de tiempo no se castiga',
  !evaluar(normal).esBasura,
)
comprobar(
  'un tiempo negativo -reloj cambiado- no se castiga',
  !evaluar({ ...normal, demoraEnEnviar: -5000 }).esBasura,
)

// ------------------------------------------------------------
// Que ninguna señal sola alcance
// ------------------------------------------------------------
console.log('\n— ninguna señal sola descarta —\n')

comprobar(
  'un enlace solo no alcanza',
  !evaluar({ nombre: 'Ana', email: 'ana@gmail.com', mensaje: 'Vi el horno en https://romase.cl/productos/horno, cuánto sale?' }).esBasura,
)
comprobar(
  'nombre igual a empresa solo no alcanza',
  !evaluar({ nombre: 'Panaderia Lo Mejor', email: 'a@b.cl', empresa: 'Panaderia Lo Mejor', mensaje: 'Necesito cotizar una amasadora de 50 kilos' }).esBasura,
)

console.log(`\n(umbral: ${UMBRAL} puntos)`)

// ------------------------------------------------------------
// Contra lo que hay guardado de verdad
// ------------------------------------------------------------
const env = {}
if (existsSync('.env.local')) {
  for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
}

if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n— contra las consultas reales guardadas —\n')
  const r = await fetch(env.SUPABASE_URL + '/rest/v1/leads?select=*&order=created_at.desc', {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY },
  })
  const leads = await r.json()
  for (const l of leads) {
    const v = evaluar({
      nombre: l.name ?? '',
      email: l.email ?? '',
      mensaje: l.message ?? '',
      empresa: l.company ?? undefined,
    })
    const marca = v.esBasura ? 'BASURA' : ' pasa '
    console.log(
      `  ${marca}  ${String(v.puntos).padStart(2)} pts  ${String(l.email).slice(0, 34).padEnd(36)}${String(l.message ?? '').replace(/\s+/g, ' ').slice(0, 44)}`,
    )
  }
} else {
  console.log('\n(sin credenciales: no se contrastó contra la base)')
}

console.log()
console.log(fallos === 0 ? 'TODO BIEN' : `${fallos} comprobación(es) fallando`)
process.exitCode = fallos === 0 ? 0 : 1
