/**
 * Lectura de pedidos para el panel.
 *
 * Un pedido guarda tres cosas en formatos distintos: las columnas planas
 * (cliente, totales, estado), el despacho en un jsonb (`shipping_address`) y
 * la respuesta cruda de Transbank en otro (`webpay_response`). Esta capa las
 * traduce una sola vez para que las pantallas no tengan que saber de dónde
 * sale cada dato.
 */
import { tipoDePago, motivoDelRechazo } from './webpay-glosas'

export type EstadoPedido = 'pagado' | 'pendiente' | 'rechazado' | 'anulado' | 'vencido' | 'error'

/**
 * Qué significa cada estado, en palabras del negocio.
 *
 * «Pendiente» es el que más confunde: no es un pedido a medio hacer, es uno
 * que nunca llegó a pagarse —el comprador abandonó el formulario de Transbank
 * o cerró la pestaña—. Por eso la glosa lo dice en vez de dejarlo a la
 * interpretación de quien mira.
 */
export const ESTADOS: Record<
  EstadoPedido,
  { etiqueta: string; glosa: string; tono: 'verde' | 'ambar' | 'rojo' | 'gris' }
> = {
  pagado: {
    etiqueta: 'Pagado',
    glosa: 'Transbank confirmó el cobro. Hay que preparar el despacho.',
    tono: 'verde',
  },
  pendiente: {
    etiqueta: 'Sin pagar',
    glosa: 'El pedido se creó pero nunca se completó el pago. No hay cobro.',
    tono: 'ambar',
  },
  rechazado: {
    etiqueta: 'Rechazado',
    glosa: 'El banco o Transbank rechazaron la tarjeta. No hay cobro.',
    tono: 'rojo',
  },
  anulado: {
    etiqueta: 'Anulado',
    glosa: 'El comprador canceló desde el formulario de Transbank. No hay cobro.',
    tono: 'gris',
  },
  vencido: {
    etiqueta: 'Vencido',
    glosa: 'Se agotó el plazo del formulario de pago. No hay cobro.',
    tono: 'gris',
  },
  error: {
    etiqueta: 'Con error',
    glosa: 'Falló la confirmación con Transbank. Conviene revisarlo a mano.',
    tono: 'rojo',
  },
}

export function estadoDe(valor: string | null | undefined): EstadoPedido {
  return valor && valor in ESTADOS ? (valor as EstadoPedido) : 'pendiente'
}

/** Solo los pagados son plata que entró. */
export function esCobrado(estado: EstadoPedido): boolean {
  return estado === 'pagado'
}

// ============================================================
// Despacho
// ============================================================

export type Despacho = {
  tipo: 'despacho' | 'retiro'
  transportista: string | null
  documento: 'boleta' | 'factura' | null
  razonSocial: string | null
  rut: string | null
  calle: string | null
  comuna: string | null
  region: string | null
  notaDelCliente: string | null
}

const texto = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s.length > 0 ? s : null
}

export function despachoDe(shippingAddress: unknown): Despacho {
  const d = (shippingAddress ?? {}) as Record<string, unknown>
  const doc = texto(d.documento)
  return {
    // El checkout guarda la glosa completa, no la palabra suelta: comparar
    // contra 'retiro' a secas daba siempre falso y todo pedido figuraba
    // como despacho, incluidos los de retiro en tienda.
    tipo: d.tipo === 'retiro en local' ? 'retiro' : 'despacho',
    transportista: texto(d.transportista),
    documento: doc === 'factura' ? 'factura' : doc === 'boleta' ? 'boleta' : null,
    razonSocial: texto(d.razon_social),
    rut: texto(d.rut),
    calle: texto(d.facturacion_calle),
    comuna: texto(d.facturacion_comuna),
    region: texto(d.facturacion_region),
    notaDelCliente: texto(d.nota_cliente),
  }
}

/** La dirección en una línea, o null si no hay nada que mostrar. */
export function direccionEnUnaLinea(d: Despacho): string | null {
  const partes = [d.calle, d.comuna, d.region].filter(Boolean)
  return partes.length > 0 ? partes.join(', ') : null
}

// ============================================================
// Pago
// ============================================================

export type Pago = {
  autorizacion: string | null
  ordenDeCompra: string | null
  tarjeta: string | null
  tipo: string
  cuotas: number | null
  monto: number | null
  fecha: string | null
  /** Glosa del rechazo, solo cuando Transbank devolvió un código negativo. */
  motivo: string | null
  /** El estado que informó Transbank: AUTHORIZED, FAILED… */
  estadoTransbank: string | null
}

export function pagoDe(webpayResponse: unknown): Pago | null {
  if (!webpayResponse || typeof webpayResponse !== 'object') return null
  const r = webpayResponse as Record<string, unknown>

  const codigo = typeof r.response_code === 'number' ? r.response_code : null
  const tarjeta = (r.card_detail as Record<string, unknown> | undefined)?.card_number

  return {
    autorizacion: texto(r.authorization_code),
    ordenDeCompra: texto(r.buy_order),
    tarjeta: texto(tarjeta),
    tipo: tipoDePago(typeof r.payment_type_code === 'string' ? r.payment_type_code : undefined),
    cuotas: typeof r.installments_number === 'number' ? r.installments_number : null,
    monto: typeof r.amount === 'number' ? r.amount : null,
    fecha: texto(r.transaction_date),
    motivo: codigo !== null && codigo < 0 ? motivoDelRechazo(codigo) : null,
    estadoTransbank: texto(r.status),
  }
}

// ============================================================
// Fechas
// ============================================================

/**
 * Fecha y hora en horario de Chile.
 *
 * El negocio está en Puerto Montt y los pedidos se guardan en UTC. Mostrar la
 * hora sin convertir hace que un pedido de las 21:00 figure como del día
 * siguiente, y eso descuadra cualquier conteo por día.
 */
export function fechaHora(valor: string | null | undefined): string {
  if (!valor) return '—'
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(d)
}

export function soloFecha(valor: string | null | undefined): string {
  if (!valor) return '—'
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeZone: 'America/Santiago',
  }).format(d)
}
