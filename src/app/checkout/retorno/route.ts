import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOrderNotification } from '@/lib/email'
import { avisoDesdePedido } from '@/lib/pedido-aviso'
import { origenDelSitio } from '@/lib/origen'
import { aprobada, confirmarTransaccion, type RespuestaWebpay } from '@/lib/webpay'

/**
 * Vuelta desde Webpay.
 *
 * Es un route handler y no una página porque **Transbank puede volver por POST
 * o por GET** según el caso, y una página de Next solo atiende GET: un POST
 * devolvería 405 y el comprador vería un error después de haber pagado.
 *
 * Los cuatro casos que documenta Transbank, y qué llega en cada uno:
 *
 *   token_ws                                     → pago normal, hay que confirmar
 *   TBK_TOKEN + TBK_ORDEN_COMPRA + TBK_ID_SESION → el comprador anuló
 *   TBK_ORDEN_COMPRA + TBK_ID_SESION             → se venció el plazo del formulario
 *   token_ws + TBK_TOKEN                         → error en el formulario de pago
 *
 * En los tres últimos **no se confirma nada**: no hay transacción que cerrar.
 * Confirmar un token anulado es el error que deja pedidos en un estado que no
 * corresponde.
 *
 * Acá solo se procesa y se redirige. Lo que ve el comprador está en
 * /checkout/resultado, que lee el pedido ya resuelto.
 */

export const dynamic = 'force-dynamic'

async function procesar(params: URLSearchParams) {
  const tokenWs = params.get('token_ws')
  const tbkToken = params.get('TBK_TOKEN')
  const ordenCompra = params.get('TBK_ORDEN_COMPRA')

  // Anulado por el comprador, o error en el formulario de pago.
  if (tbkToken) {
    await marcarAnulado(tbkToken, ordenCompra)
    return destino({ estado: 'anulado', orden: ordenCompra })
  }

  // Se venció el plazo: Transbank vuelve sin ningún token.
  if (!tokenWs) {
    await marcarAnulado(null, ordenCompra)
    return destino({ estado: 'vencido', orden: ordenCompra })
  }

  // Pago normal.
  try {
    const pedido = await pedidoPorToken(tokenWs)

    // Si ya está resuelto, no se vuelve a confirmar: Transbank rechaza el
    // segundo commit del mismo token, y basta con que alguien recargue la
    // página de vuelta para que pase.
    if (pedido?.webpay_response) return destino({ estado: 'listo', token: tokenWs })

    const respuesta = await confirmarTransaccion(tokenWs)
    await resolver(tokenWs, respuesta, pedido)
    return destino({ estado: 'listo', token: tokenWs })
  } catch (error) {
    console.error('[webpay] no se pudo confirmar la transacción:', (error as Error).message)
    return destino({ estado: 'error', token: tokenWs })
  }
}

function destino(datos: Record<string, string | null>) {
  const query = new URLSearchParams()
  for (const [clave, valor] of Object.entries(datos)) if (valor) query.set(clave, valor)
  return `/checkout/resultado?${query.toString()}`
}

export async function GET(request: NextRequest) {
  const url = await procesar(request.nextUrl.searchParams)
  return NextResponse.redirect(new URL(url, await origenDelSitio()))
}

export async function POST(request: NextRequest) {
  const formulario = await request.formData()
  const params = new URLSearchParams()
  for (const [clave, valor] of formulario.entries()) params.set(clave, String(valor))
  // También pueden venir en la query, según el caso.
  for (const [clave, valor] of request.nextUrl.searchParams.entries()) params.set(clave, valor)

  const url = await procesar(params)
  // 303: la vuelta es un POST y el destino tiene que abrirse con GET.
  return NextResponse.redirect(new URL(url, await origenDelSitio()), 303)
}

// ------------------------------------------------------------------
// Persistencia
// ------------------------------------------------------------------

type Pedido = {
  id: string
  order_number: number
  total: number
  subtotal: number
  status: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_rut: string | null
  shipping_address: Record<string, string | undefined> | null
  notes: string | null
  webpay_response: unknown
}

function base() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function pedidoPorToken(token: string): Promise<Pedido | null> {
  const db = base()
  if (!db) return null
  const { data } = await db
    .from('orders')
    .select(
      // Va en una sola línea a propósito: supabase-js deduce el tipo de la fila
      // a partir del literal, y partirlo con + deja `data` sin tipar.
      'id, order_number, total, subtotal, status, customer_name, customer_email, customer_phone, customer_rut, shipping_address, notes, webpay_response',
    )
    .eq('webpay_token', token)
    .maybeSingle()
  return (data as Pedido) ?? null
}

async function marcarAnulado(token: string | null, ordenCompra: string | null) {
  const db = base()
  if (!db) return
  const consulta = db.from('orders').update({ status: 'anulado', updated_at: new Date().toISOString() })
  if (token) await consulta.eq('webpay_token', token)
  else if (ordenCompra) await consulta.eq('webpay_buy_order', ordenCompra)
}

/**
 * Deja el pedido en su estado final y avisa por correo si se pagó.
 *
 * El monto se compara contra lo que se guardó al crear el pedido. Si no
 * coincide, el pedido **no** se marca como pagado aunque Transbank diga que
 * autorizó: significa que alguien tocó el monto entre medio.
 */
async function resolver(token: string, respuesta: RespuestaWebpay, pedido: Pedido | null) {
  const db = base()
  const ok = aprobada(respuesta)
  const montoCalza = pedido ? Math.round(Number(pedido.total)) === Math.round(respuesta.amount) : true

  if (ok && !montoCalza) {
    console.error('[webpay] el monto autorizado no coincide con el del pedido', {
      pedido: pedido?.total,
      webpay: respuesta.amount,
    })
  }

  const estado = ok && montoCalza ? 'pagado' : 'rechazado'

  if (db) {
    await db
      .from('orders')
      .update({ status: estado, webpay_response: respuesta, updated_at: new Date().toISOString() })
      .eq('webpay_token', token)
  }

  if (estado !== 'pagado' || !pedido) return

  // El aviso al negocio sale recién con el pago confirmado: antes no hay nada
  // que preparar.
  const { data: lineas } = db
    ? await db
        .from('order_items')
        .select('product_name, sku, quantity, unit_price, line_total')
        .eq('order_id', pedido.id)
    : { data: null }

  // El aviso se reconstruye desde el pedido guardado, no a mano: así lleva la
  // factura, la razón social, el transportista y la dirección con la que se
  // despacha. Ver src/lib/pedido-aviso.ts.
  const tarjeta = respuesta.card_detail?.card_number
  const aviso = avisoDesdePedido(
    pedido,
    lineas ?? [],
    [
      'Pagado con Webpay Plus.',
      `Autorización ${respuesta.authorization_code ?? 's/n'}`,
      tarjeta && `tarjeta terminada en ${tarjeta}`,
      `orden de compra ${respuesta.buy_order}`,
    ]
      .filter(Boolean)
      .join(' · '),
  )

  const enviado = await sendOrderNotification(aviso)
  if (!enviado.sent) {
    console.warn(`[webpay] pedido ${pedido.order_number} pagado pero sin aviso:`, enviado.reason)
  }
}

export const runtime = 'nodejs'
