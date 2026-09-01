import 'server-only'
import type { OrderNotification } from '@/lib/email'

/**
 * Reconstruye el aviso al negocio a partir del pedido guardado.
 *
 * Hace falta porque con Webpay el correo ya no sale cuando se envía el
 * formulario, sino a la vuelta del pago, y ahí no queda nada del formulario:
 * solo la fila de la base. Cuando armé esa vuelta rehíce el aviso a mano y dejé
 * el tipo de documento y la entrega fijos en «boleta» y «despacho», sin
 * dirección: un pedido pagado con factura y retiro llegaba al negocio mal y sin
 * domicilio para despacharlo.
 *
 * Está acá, en una sola función, para que la vuelta de Webpay no vuelva a
 * inventar el aviso por su cuenta.
 *
 * Los datos que no tienen columna propia viajan en `shipping_address`, que es
 * jsonb y ya guardaba el tipo de entrega y el transportista. Se prefirió eso
 * antes que deducir el documento leyendo el texto de `notes`: la prosa cambia,
 * las claves no.
 */

export type PedidoGuardado = {
  order_number: number | string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_rut: string | null
  shipping_address: Record<string, string | undefined> | null
  subtotal: number | string
  notes: string | null
}

export type LineaGuardada = {
  product_name: string
  sku: string | null
  quantity: number
  unit_price: number | string
  line_total: number | string
}

export function avisoDesdePedido(
  pedido: PedidoGuardado,
  lineas: LineaGuardada[],
  pago?: string,
): OrderNotification {
  const dir = pedido.shipping_address ?? {}
  const retiro = dir.tipo === 'retiro en local'

  const domicilio = dir.envio_calle
    ? [dir.envio_calle, dir.envio_comuna, dir.envio_region]
    : [dir.facturacion_calle, dir.facturacion_comuna, dir.facturacion_region]

  const notaCliente = dir.nota_cliente?.trim()

  return {
    orderNumber: String(pedido.order_number),
    customer: {
      name: pedido.customer_name,
      email: pedido.customer_email,
      phone: pedido.customer_phone ?? '',
      rut: pedido.customer_rut ?? undefined,
    },
    documento: dir.documento === 'factura' ? 'factura' : 'boleta',
    razonSocial: dir.razon_social || undefined,
    entrega: retiro ? 'retiro' : 'despacho',
    transportista: dir.transportista || undefined,
    direccion: retiro ? undefined : domicilio.filter(Boolean).join(', ') || undefined,
    notas: [notaCliente, pago].filter(Boolean).join('\n\n') || undefined,
    lines: lineas.map((l) => ({
      name: l.product_name,
      sku: l.sku,
      quantity: l.quantity,
      unitPrice: Number(l.unit_price),
      lineTotal: Number(l.line_total),
    })),
    subtotal: Number(pedido.subtotal),
  }
}
