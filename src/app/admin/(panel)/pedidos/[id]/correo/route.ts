import { NextResponse } from 'next/server'
import { sesionDelPanel, clienteDelPanel } from '@/lib/panel'
import { avisoDesdePedido } from '@/lib/pedido-aviso'
import { buildOrderHtml } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * El correo que recibe el negocio, tal cual, para un pedido concreto.
 *
 * Se arma con las mismas funciones que corren al confirmar un pago —
 * `avisoDesdePedido` y `buildOrderHtml`— y no con una copia parecida: si
 * alguna vez cambia el correo de verdad, esta vista cambia con él. Una
 * previsualización que se mantiene aparte deja de parecerse al original
 * justo cuando hace falta que se parezca.
 *
 * No envía nada. Solo devuelve el HTML.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await sesionDelPanel()
  if (!sesion) {
    return NextResponse.json({ error: 'Hay que ingresar al panel.' }, { status: 401 })
  }

  const { id } = await params
  const db = await clienteDelPanel()

  const [{ data: pedido }, { data: lineas }] = await Promise.all([
    db.from('orders').select('*').eq('id', Number(id)).maybeSingle(),
    db
      .from('order_items')
      .select('product_name, sku, quantity, unit_price, line_total')
      .eq('order_id', Number(id))
      .order('id'),
  ])

  if (!pedido) {
    return NextResponse.json({ error: 'No existe ese pedido.' }, { status: 404 })
  }

  const r = (pedido.webpay_response ?? {}) as Record<string, unknown>
  const tarjeta = (r.card_detail as Record<string, unknown> | undefined)?.card_number

  // La línea de pago es la misma que arma el retorno de Webpay. Cuando el
  // pedido nunca se pagó se dice así, en vez de inventar una autorización.
  const pago =
    pedido.status === 'pagado'
      ? [
          'Pagado con Webpay Plus.',
          `Autorización ${r.authorization_code ?? 's/n'}`,
          tarjeta ? `tarjeta terminada en ${tarjeta}` : null,
          `orden de compra ${r.buy_order ?? pedido.webpay_buy_order ?? 's/n'}`,
        ]
          .filter(Boolean)
          .join(' · ')
      : 'Este pedido no llegó a pagarse, así que el negocio no recibió este aviso.'

  const aviso = avisoDesdePedido(pedido, lineas ?? [], pago)

  return new NextResponse(buildOrderHtml(aviso), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
