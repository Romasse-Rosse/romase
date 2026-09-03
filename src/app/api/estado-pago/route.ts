import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { origenDelSitio } from '@/lib/origen'
import { pagoEnLineaActivo, webpayConfigurado, webpayEsIntegracion } from '@/lib/webpay'

/**
 * ¿Está el sitio en condiciones de cobrar?
 *
 * Existe porque la respuesta depende de variables de entorno que solo se ven
 * desde adentro del servidor, y en Render el plan gratuito no da consola. Sin
 * esto, la única forma de saber si el pago está activo es intentar una compra,
 * que en el peor caso manda un correo al cliente.
 *
 * **Solo devuelve booleanos y la URL pública.** Ningún valor de ninguna
 * credencial: saber que Supabase está configurado no le sirve a nadie que no
 * tenga las llaves, y ahorra media hora de adivinanzas en la puesta en marcha.
 */

export const dynamic = 'force-dynamic'

/**
 * Prueba que Supabase responda de verdad.
 *
 * Que las variables estén cargadas no significa que sirvan. Un pedido de prueba
 * murió con «No pudimos registrar tu pedido» teniendo el diagnóstico en verde:
 * las tres variables presentes y la tabla creada, pero la consulta fallaba y el
 * motivo solo quedaba en el log del servidor, que en el plan gratuito de Render
 * no se puede leer.
 *
 * Pide **exactamente las columnas que el checkout escribe**, no solo `id`: así
 * también se cae si a la tabla le falta una columna, que es la otra forma en que
 * esto se rompe y una lectura genérica no vería.
 *
 * Va con `head`: cuenta filas sin traer ninguna. No escribe nada y no devuelve
 * datos de ningún cliente.
 */

/** Las columnas que toca el checkout. Si cambia el insert, cambia esta lista. */
const COLUMNAS_PEDIDO =
  'id, order_number, status, customer_name, customer_email, customer_phone, customer_rut, shipping_address, subtotal, shipping_cost, total, currency, notes, webpay_token, webpay_buy_order, webpay_response'
const COLUMNAS_LINEA = 'id, order_id, product_id, product_name, sku, unit_price, quantity, line_total'

async function probarSupabase(): Promise<{
  responde: boolean
  error?: string
  pedidos?: number
  productos?: number
}> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { responde: false, error: 'faltan las variables' }

  try {
    const db = createClient(url, key, { auth: { persistSession: false } })

    const pedidos = await db.from('orders').select(COLUMNAS_PEDIDO, { count: 'exact', head: true })
    if (pedidos.error) return { responde: false, error: `orders: ${motivo(pedidos.error)}` }

    const lineas = await db.from('order_items').select(COLUMNAS_LINEA, { head: true })
    if (lineas.error) return { responde: false, error: `order_items: ${motivo(lineas.error)}` }

    // Cuántos productos hay sembrados. Importa porque order_items.product_id
    // tiene clave ajena a products: con la tabla vacía, el insert de las
    // líneas falla y el pedido no se guarda.
    const productos = await db.from('products').select('id', { count: 'exact', head: true })

    return {
      responde: true,
      pedidos: pedidos.count ?? 0,
      productos: productos.error ? -1 : productos.count ?? 0,
    }
  } catch (error) {
    return { responde: false, error: (error as Error).message }
  }
}

/**
 * Qué clase de llave hay cargada, sin decir cuál.
 *
 * Solo el prefijo, que indica el tipo y no revela ningún carácter del secreto.
 * Hace falta para dos cosas concretas:
 *
 *   · Confirmar que un cambio de llave en Render llegó de verdad al servidor
 *     antes de desactivar la anterior. Que la base responda no alcanza: si el
 *     redespliegue no terminó, el proceso viejo sigue con la llave vieja y
 *     responde igual.
 *   · Cazar la confusión de pegar la llave pública donde va la secreta. Esa
 *     está cargada, tiene forma válida, y las escrituras fallan por RLS.
 */
function tipoDeLlave(valor: string | undefined): string {
  if (!valor) return 'ninguna'
  if (valor.startsWith('sb_secret_')) return 'secret api key'
  if (valor.startsWith('sb_publishable_')) return 'publishable · ES LA PÚBLICA, no sirve para escribir'
  if (valor.startsWith('ey')) return 'jwt legacy (anon o service_role)'
  return 'formato desconocido'
}

function motivo(error: { message: string; hint?: string | null; code?: string }): string {
  return [error.message, error.code && `código ${error.code}`, error.hint].filter(Boolean).join(' · ')
}

export async function GET() {
  const origen = await origenDelSitio()

  // Variable por variable: decir «falta Supabase» obliga a adivinar cuál de
  // las tres es, y son fáciles de confundir entre sí.
  const variables = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    WEBPAY_CODIGO_COMERCIO: Boolean(process.env.WEBPAY_CODIGO_COMERCIO),
    WEBPAY_API_KEY: Boolean(process.env.WEBPAY_API_KEY),
  }

  const hayUrl = variables.SUPABASE_URL || variables.NEXT_PUBLIC_SUPABASE_URL
  const supabase = Boolean(hayUrl && variables.SUPABASE_SERVICE_ROLE_KEY)
  const prueba = await probarSupabase()

  /**
   * Nombres de variables cargadas que se parecen a las que necesitamos.
   *
   * Es para cazar erratas de tipeo, que es el modo de falla real de esto: una
   * variable escrita `SUPABASE_SERVICE_ROL_KEY` está cargada y no sirve, y sin
   * ver los nombres no hay forma de darse cuenta. **Solo los nombres**, nunca
   * los valores.
   */
  const nombresParecidos = Object.keys(process.env)
    .filter((k) => /SUPABASE|WEBPAY|TRANSBANK|RESEND|LEADS/i.test(k))
    .sort()

  // La respuesta la da la misma función que usa el checkout para decidir qué
  // mostrar en el paso de pago. Si el diagnóstico lo calculara por su cuenta
  // podría decir que se cobra mientras la pantalla dice otra cosa, que es
  // justamente lo que pasó.
  const puedeCobrar = pagoEnLineaActivo()

  const queFalta = [
    !webpayConfigurado && 'faltan WEBPAY_CODIGO_COMERCIO y WEBPAY_API_KEY',
    !hayUrl && 'falta SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL)',
    !variables.SUPABASE_SERVICE_ROLE_KEY &&
      'falta SUPABASE_SERVICE_ROLE_KEY. Ojo: no es la anon key. La anon es ' +
        'pública y RLS le bloquea escribir en orders; para guardar el pedido ' +
        'hace falta la service_role, y esa nunca va con prefijo NEXT_PUBLIC_.',
  ].filter(Boolean)

  /**
   * Cosas que no impiden cobrar pero que hay que resolver antes de vender.
   *
   * Van aparte de `queFalta` a propósito: con `puedeCobrar: true` y esta lista
   * vacía uno da por hecho que está todo, y sin correo un pedido pagado no le
   * avisa a nadie. Queda registrado en la base, pero nadie lo mira.
   */
  const advertencias = [
    process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('sb_publishable_') &&
      'En SUPABASE_SERVICE_ROLE_KEY hay una llave publishable, que es la pública. ' +
        'Las lecturas pueden andar y las escrituras las bloquea RLS: ningún pedido se ' +
        'guardaría. Tiene que ir la secret key.',
    supabase &&
      prueba.responde &&
      prueba.productos === 0 &&
      'La tabla products de Supabase está vacía. Las líneas del pedido se guardan sin vínculo al producto; el nombre, el SKU y el precio sí quedan. Para vincularlas hay que sembrar el catálogo con yarn catalog:seed.',
    supabase &&
      !prueba.responde &&
      `Supabase está configurado pero la consulta falla: ${prueba.error}. Ningún ` +
        'pedido se puede guardar hasta resolverlo.',
    !variables.RESEND_API_KEY &&
      'RESEND_API_KEY no está cargada: el pedido pagado se guarda en la base ' +
        'pero no sale ningún correo. Nadie en el negocio se entera de la venta.',
    webpayEsIntegracion &&
      'Webpay apunta al ambiente de prueba de Transbank: no se cobra de verdad. ' +
        'Para cobrar hacen falta WEBPAY_AMBIENTE=produccion y las credenciales ' +
        'que Transbank entrega al terminar la homologación.',
    !variables.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      'NEXT_PUBLIC_SUPABASE_ANON_KEY no está cargada: el catálogo se sirve del ' +
        'respaldo local y no refleja cambios hechos en Supabase.',
  ].filter(Boolean)

  return NextResponse.json(
    {
      puedeCobrar,
      webpay: {
        configurado: webpayConfigurado,
        ambiente: webpayEsIntegracion ? 'integracion' : 'produccion',
        urlDeRetorno: `${origen}/checkout/retorno`,
      },
      supabase: {
        configurado: supabase,
        llave: tipoDeLlave(process.env.SUPABASE_SERVICE_ROLE_KEY),
        ...prueba,
      },
      correo: { configurado: variables.RESEND_API_KEY },
      // Si esto no es el dominio donde está el sitio, la vuelta de Webpay falla.
      origen,
      variables,
      // Solo nombres, para cazar erratas de tipeo. Ningún valor.
      nombresCargados: nombresParecidos,
      queFalta,
      advertencias,
    },
    { headers: { 'x-robots-tag': 'noindex', 'cache-control': 'no-store' } },
  )
}
