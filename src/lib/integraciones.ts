import 'server-only'
import { getCatalog } from './catalog'
import { estadoDelCorreo, destinatarios, remitente } from './email'
import { pagoEnLineaActivo, webpayConfigurado, webpayEsIntegracion } from './webpay'
import { motivoDeExclusion, EXPLICACION_EXCLUSION, type MotivoDeExclusion } from './merchant'
import { origenDelSitio } from './origen'
import { ultimosEventos, type EventoDeIntegracion } from './integracion-eventos'

/**
 * El estado real de lo que el sitio tiene conectado afuera.
 *
 * No hay una tabla de configuración: cada integración se configura con
 * variables de entorno, y la verdad de si funciona o no está en el servicio,
 * no en la base. Por eso esto se calcula preguntando —a Resend qué dominios
 * verificó, a Supabase si responde, al catálogo cuántos productos entran en el
 * feed— y no leyendo un registro que alguien tendría que mantener al día.
 *
 * Un panel que dice «conectado» porque una fila dice «conectado» miente en
 * cuanto algo se rompe.
 */

export type Salud = 'ok' | 'atencion' | 'apagada' | 'error'

export type Integracion = {
  clave: string
  nombre: string
  /** Qué hace, para quien no lo sepa. */
  proposito: string
  salud: Salud
  /** Una línea que resume el estado, en palabras. */
  resumen: string
  datos: { etiqueta: string; valor: string }[]
  /** Lo que habría que hacer, si hay algo. */
  pendiente?: string
  enlace?: { texto: string; href: string }
}

export const COLOR_DE_SALUD: Record<Salud, string> = {
  ok: 'verde',
  atencion: 'ambar',
  apagada: 'gris',
  error: 'rojo',
}

export const ETIQUETA_DE_SALUD: Record<Salud, string> = {
  ok: 'Funcionando',
  atencion: 'Requiere atención',
  apagada: 'Sin configurar',
  error: 'Con error',
}

// ============================================================
// Merchant Center
// ============================================================

export type DiagnosticoDelFeed = {
  total: number
  incluidos: number
  excluidos: number
  porMotivo: { motivo: MotivoDeExclusion; explicacion: string; cuantos: number; ejemplos: string[] }[]
}

/**
 * Qué productos entran en el feed y cuáles no.
 *
 * Lo mismo que decide la ruta de `/merchant.xml`, contado. Sirve para saber
 * por qué Google ve menos productos de los que hay en la tienda, que es la
 * pregunta que siempre aparece primero.
 */
export async function diagnosticoDelFeed(): Promise<DiagnosticoDelFeed> {
  const { products } = await getCatalog()

  const agrupado = new Map<MotivoDeExclusion, string[]>()
  let incluidos = 0

  for (const p of products) {
    const motivo = motivoDeExclusion(p)
    if (!motivo) {
      incluidos++
      continue
    }
    const lista = agrupado.get(motivo) ?? []
    lista.push(p.name)
    agrupado.set(motivo, lista)
  }

  return {
    total: products.length,
    incluidos,
    excluidos: products.length - incluidos,
    porMotivo: [...agrupado.entries()]
      .map(([motivo, nombres]) => ({
        motivo,
        explicacion: EXPLICACION_EXCLUSION[motivo],
        cuantos: nombres.length,
        ejemplos: nombres.slice(0, 5),
      }))
      .sort((a, b) => b.cuantos - a.cuantos),
  }
}

// ============================================================
// Todas
// ============================================================

/** Lo que hizo falta para leer el historial; el panel ya tiene un cliente. */
type LectorDeEventos = { from: (tabla: string) => any }

export async function estadoDeLasIntegraciones(db: LectorDeEventos): Promise<Integracion[]> {
  const [feed, correo, origen, envios] = await Promise.all([
    diagnosticoDelFeed(),
    estadoDelCorreo(),
    origenDelSitio(),
    ultimosEventos(db, 'resend', 5),
  ])

  const ultimoEnvio: EventoDeIntegracion | null =
    'eventos' in envios && envios.eventos.length > 0 ? envios.eventos[0] : null

  const integraciones: Integracion[] = []

  // ---------------------------------------------------------
  // Merchant Center
  // ---------------------------------------------------------
  const verificacion = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  integraciones.push({
    clave: 'merchant-center',
    nombre: 'Google Merchant Center',
    proposito:
      'Publica el catálogo en Google Shopping. Google viene a buscar el archivo una vez al día; no se le manda nada.',
    salud: feed.incluidos === 0 ? 'error' : feed.excluidos > 0 ? 'atencion' : 'ok',
    resumen:
      feed.incluidos === 0
        ? 'El feed no tiene ningún producto.'
        : feed.excluidos > 0
          ? `${feed.incluidos} productos en el feed, ${feed.excluidos} quedan afuera.`
          : `Los ${feed.incluidos} productos del catálogo están en el feed.`,
    datos: [
      { etiqueta: 'Dirección del feed', valor: `${origen}/merchant.xml` },
      { etiqueta: 'Productos en el catálogo', valor: String(feed.total) },
      { etiqueta: 'En el feed', valor: String(feed.incluidos) },
      { etiqueta: 'Fuera del feed', valor: String(feed.excluidos) },
      {
        etiqueta: 'Verificación del dominio',
        valor: verificacion ? 'Configurada' : 'Sin configurar',
      },
    ],
    pendiente: verificacion
      ? undefined
      : 'Falta NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION para que Google confirme que el dominio es tuyo.',
    enlace: { texto: 'Ver el feed', href: '/merchant.xml' },
  })

  // ---------------------------------------------------------
  // Webpay
  // ---------------------------------------------------------
  const puedeCobrar = pagoEnLineaActivo()
  integraciones.push({
    clave: 'webpay',
    nombre: 'Transbank Webpay Plus',
    proposito: 'Cobra con tarjeta de crédito, débito y prepago.',
    salud: !webpayConfigurado ? 'apagada' : webpayEsIntegracion ? 'atencion' : puedeCobrar ? 'ok' : 'error',
    resumen: !webpayConfigurado
      ? 'Sin credenciales: el checkout funciona como pedido por correo.'
      : webpayEsIntegracion
        ? 'Conectado al ambiente de prueba: no se cobra de verdad.'
        : puedeCobrar
          ? 'Cobrando en producción.'
          : 'En producción pero sin poder cobrar. Revisar Supabase.',
    datos: [
      { etiqueta: 'Ambiente', valor: webpayEsIntegracion ? 'Prueba' : 'Producción' },
      { etiqueta: 'Puede cobrar', valor: puedeCobrar ? 'Sí' : 'No' },
      { etiqueta: 'URL de retorno', valor: `${origen}/checkout/retorno` },
    ],
    pendiente: webpayEsIntegracion
      ? 'Para cobrar de verdad hacen falta WEBPAY_AMBIENTE=produccion, WEBPAY_CODIGO_COMERCIO y WEBPAY_API_KEY, y la homologación aprobada por Transbank.'
      : undefined,
  })

  // ---------------------------------------------------------
  // Resend
  // ---------------------------------------------------------
  const dominioDelRemitente = remitente().match(/@([^>\s]+)/)?.[1] ?? '(sin dominio)'
  const verificados = correo.dominiosVerificados ?? []

  /**
   * La salud sale de los envíos, no de lo que responda la API de dominios.
   *
   * Una API key de **solo envío** —la opción correcta por seguridad— no puede
   * listar dominios: Resend contesta 401. Deducir de ahí que la integración
   * está mal es castigarla por estar bien configurada, y el panel terminaba
   * diciendo «requiere atención» sobre un correo que llega sin problemas.
   *
   * Un envío que salió bien es prueba directa; lo demás es inferencia.
   */
  const saludDelCorreo: Salud = !correo.configurado
    ? 'apagada'
    : ultimoEnvio
      ? ultimoEnvio.estado === 'ok'
        ? 'ok'
        : 'error'
      : correo.puedeEnviar === false
        ? 'error'
        : // Sin historial y sin poder consultar: se da por bueno. Una llave de
          // solo envío no puede listar dominios, y marcar en ámbar algo que
          // está correctamente configurado enseña a ignorar el ámbar.
          'ok'

  const cuando = ultimoEnvio
    ? new Intl.DateTimeFormat('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Santiago',
      }).format(new Date(ultimoEnvio.creado_en))
    : null

  integraciones.push({
    clave: 'resend',
    nombre: 'Resend',
    proposito: 'Manda los avisos de pedido y las consultas del formulario.',
    salud: saludDelCorreo,
    resumen: !correo.configurado
      ? 'Sin RESEND_API_KEY: no sale ningún correo.'
      : ultimoEnvio && ultimoEnvio.estado === 'ok'
        ? `Enviando. El último correo salió el ${cuando}.`
        : ultimoEnvio
          ? `El último envío falló el ${cuando}.`
          : correo.puedeEnviar === false
            ? `El dominio ${dominioDelRemitente} no está verificado en Resend.`
            : 'Configurado. La API key es de solo envío, así que el panel no puede confirmar la verificación por su cuenta: lo hará en cuanto salga el primer correo.',
    datos: [
      { etiqueta: 'Remitente', valor: remitente() },
      { etiqueta: 'Destinatarios', valor: destinatarios().join(', ') },
      { etiqueta: 'Último envío', valor: cuando ?? 'sin registro todavía' },
      {
        etiqueta: 'Dominios verificados',
        valor:
          verificados.length > 0
            ? verificados.join(', ')
            : 'la API key es de solo envío y no puede consultarlos',
      },
    ],
    pendiente:
      ultimoEnvio?.estado === 'error'
        ? (ultimoEnvio.mensaje ?? 'El último envío falló.')
        : !correo.configurado
          ? 'Falta RESEND_API_KEY.'
          : undefined,
  })

  // ---------------------------------------------------------
  // Google Tag Manager
  // ---------------------------------------------------------
  const gtm = process.env.NEXT_PUBLIC_GTM_ID
  integraciones.push({
    clave: 'gtm',
    nombre: 'Google Tag Manager',
    proposito: 'Mide el embudo de compra: qué se vio, qué se agregó al carrito y qué se compró.',
    salud: gtm ? 'ok' : 'apagada',
    resumen: gtm
      ? `Contenedor ${gtm} cargado en todas las páginas.`
      : 'Sin contenedor: el sitio emite los eventos pero nadie los recibe.',
    datos: [{ etiqueta: 'Contenedor', valor: gtm ?? 'sin configurar' }],
    pendiente: gtm
      ? undefined
      : 'Falta NEXT_PUBLIC_GTM_ID. El dataLayer ya emite todo el embudo; solo falta el contenedor que lo escuche.',
  })

  return integraciones
}
