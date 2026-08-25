'use server'

import { createClient } from '@supabase/supabase-js'
import { loadCatalog } from '@/lib/catalog'
import { sendOrderNotification, type OrderNotification } from '@/lib/email'
import { titleCase } from '@/lib/format'
import { site } from '@/lib/site'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type CheckoutLine = { id: number; quantity: number }

export type CheckoutState = {
  status: 'idle' | 'ok' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
  /** Número de pedido, cuando se pudo registrar. */
  orderNumber?: string
}

/** Datos del cliente, tal como los devuelve el formulario. */
type Datos = {
  nombre: string
  apellidos: string
  email: string
  telefono: string
  rut: string
  documento: 'boleta' | 'factura'
  razonSocial: string
  entrega: 'retiro' | 'despacho'
  direccion: string
  comuna: string
  region: string
  /** Transportista elegido, cuando hay despacho. */
  transportista: string
  /** Dirección alternativa de envío, si se pidió una distinta. */
  otraDireccion: boolean
  envioDireccion: string
  envioComuna: string
  envioRegion: string
  notas: string
}

function leerDatos(formData: FormData): Datos {
  const v = (k: string) => String(formData.get(k) ?? '').trim()
  return {
    nombre: v('nombre'),
    apellidos: v('apellidos'),
    email: v('email'),
    telefono: v('telefono'),
    rut: v('rut'),
    documento: v('documento') === 'factura' ? 'factura' : 'boleta',
    razonSocial: v('razonSocial'),
    // El formulario trae 'despacho' por defecto.
    entrega: v('entrega') === 'retiro' ? 'retiro' : 'despacho',
    direccion: v('direccion'),
    comuna: v('comuna'),
    region: v('region'),
    transportista: v('transportista'),
    otraDireccion: formData.get('otraDireccion') !== null,
    envioDireccion: v('envioDireccion'),
    envioComuna: v('envioComuna'),
    envioRegion: v('envioRegion'),
    notas: v('notas'),
  }
}

function validar(datos: Datos): Record<string, string> {
  const errores: Record<string, string> = {}

  if (datos.nombre.length < 2) errores.nombre = 'Escribe tu nombre.'
  if (datos.apellidos.length < 2) errores.apellidos = 'Escribe tus apellidos.'
  if (!EMAIL_RE.test(datos.email)) errores.email = 'Revisa el correo electrónico.'
  if (datos.telefono.replace(/\D/g, '').length < 8) errores.telefono = 'Deja un teléfono de contacto.'

  // La dirección se pide siempre, también para retiro: hace falta para
  // emitir la boleta o la factura.
  if (!datos.direccion) errores.direccion = 'Indica la dirección.'
  if (!datos.comuna) errores.comuna = 'Indica la comuna o ciudad.'

  if (datos.documento === 'factura') {
    if (!datos.rut) errores.rut = 'Para factura necesitamos el RUT.'
    if (!datos.razonSocial) errores.razonSocial = 'Indica la razón social.'
  }

  if (datos.entrega === 'despacho') {
    if (!datos.transportista) errores.transportista = 'Elige una empresa despachadora.'
    if (datos.otraDireccion) {
      if (!datos.envioDireccion) errores.envioDireccion = 'Indica la dirección de envío.'
      if (!datos.envioComuna) errores.envioComuna = 'Indica la comuna de envío.'
    }
  }

  return errores
}

export async function submitCheckout(
  _previo: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  if (formData.get('website')) return { status: 'ok' } // trampa para bots

  const datos = leerDatos(formData)
  const fieldErrors = validar(datos)
  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', message: 'Faltan datos por completar.', fieldErrors }
  }

  // ------------------------------------------------------------
  // Las líneas del pedido se rearman contra el catálogo del servidor.
  // Del navegador solo se acepta qué producto y cuántas unidades: el precio
  // y el nombre se leen acá, así nadie puede mandar un precio inventado.
  // ------------------------------------------------------------
  let lineasCliente: CheckoutLine[] = []
  try {
    const bruto = JSON.parse(String(formData.get('items') ?? '[]'))
    if (Array.isArray(bruto)) {
      lineasCliente = bruto
        .map((l) => ({ id: Number(l?.id), quantity: Math.floor(Number(l?.quantity)) }))
        .filter((l) => Number.isInteger(l.id) && l.quantity > 0 && l.quantity <= 99)
    }
  } catch {
    lineasCliente = []
  }

  if (lineasCliente.length === 0) {
    return { status: 'error', message: 'Tu carrito está vacío.' }
  }

  const { products } = await loadCatalog()
  const porId = new Map(products.map((p) => [p.id, p]))

  const lineas = lineasCliente.flatMap((linea) => {
    const producto = porId.get(linea.id)
    if (!producto) return []
    return [
      {
        product_id: producto.id,
        product_name: titleCase(producto.name),
        sku: producto.sku,
        unit_price: producto.price,
        quantity: linea.quantity,
        line_total: producto.price * linea.quantity,
      },
    ]
  })

  if (lineas.length === 0) {
    return {
      status: 'error',
      message: 'Los productos del carrito ya no están disponibles. Revisa el catálogo.',
    }
  }

  const subtotal = lineas.reduce((n, l) => n + l.line_total, 0)
  // El flete se cotiza aparte: no hay tarifas cargadas todavía.
  const shippingCost = 0

  const nombreCompleto = `${datos.nombre} ${datos.apellidos}`.trim()
  const transportista = site.carriers.find((c) => c.id === datos.transportista)?.name

  // Dirección de facturación, más la de envío cuando es distinta.
  const direccion: Record<string, string | undefined> = {
    tipo: datos.entrega === 'retiro' ? 'retiro en local' : 'despacho',
    facturacion_calle: datos.direccion,
    facturacion_comuna: datos.comuna,
    facturacion_region: datos.region || site.contact.region,
  }

  if (datos.entrega === 'despacho') {
    direccion.transportista = transportista
    if (datos.otraDireccion) {
      direccion.envio_calle = datos.envioDireccion
      direccion.envio_comuna = datos.envioComuna
      direccion.envio_region = datos.envioRegion || site.contact.region
    }
  }

  const notas = [
    datos.documento === 'factura' ? `Factura · razón social: ${datos.razonSocial}` : 'Boleta',
    datos.entrega === 'retiro'
      ? 'Retira en el local'
      : `Despacho por ${transportista ?? 'transportista sin definir'} · flete a cotizar`,
    datos.otraDireccion &&
      `Enviar a: ${datos.envioDireccion}, ${datos.envioComuna}, ${datos.envioRegion}`,
    datos.notas && `Nota del cliente: ${datos.notas}`,
  ]
    .filter(Boolean)
    .join('\n')

  const guardado = await guardarPedido({ datos, lineas, subtotal, shippingCost, direccion, notas })

  const aviso: OrderNotification = {
    orderNumber: guardado.orderNumber,
    customer: {
      name: nombreCompleto,
      email: datos.email,
      phone: datos.telefono,
      rut: datos.rut || undefined,
    },
    documento: datos.documento,
    razonSocial: datos.razonSocial || undefined,
    entrega: datos.entrega,
    transportista,
    direccion:
      datos.entrega === 'despacho'
        ? datos.otraDireccion
          ? `${datos.envioDireccion}, ${datos.envioComuna}, ${datos.envioRegion || site.contact.region}`
          : `${datos.direccion}, ${datos.comuna}, ${datos.region || site.contact.region}`
        : undefined,
    notas: datos.notas || undefined,
    lines: lineas.map((l) => ({
      name: l.product_name,
      sku: l.sku,
      quantity: l.quantity,
      unitPrice: l.unit_price,
      lineTotal: l.line_total,
    })),
    subtotal,
  }

  const enviado = await sendOrderNotification(aviso)

  // Igual que en el formulario de contacto: con que uno de los dos canales
  // funcione, el pedido no se pierde.
  if (guardado.ok || enviado.sent) {
    if (!guardado.ok) console.warn('[checkout] no se pudo guardar el pedido:', guardado.reason)
    if (!enviado.sent) console.warn('[checkout] no se pudo avisar por correo:', enviado.reason)
    return {
      status: 'ok',
      orderNumber: guardado.orderNumber,
      message: 'Recibimos tu pedido.',
    }
  }

  console.error('[checkout] el pedido no se pudo registrar por ningún canal', {
    supabase: guardado.reason,
    correo: enviado.reason,
  })

  return {
    status: 'error',
    message:
      `No pudimos registrar tu pedido en este momento. Llámanos al ${site.contact.phone} o ` +
      `escríbenos a ${site.contact.email} con el detalle y lo tomamos de inmediato.`,
  }
}

async function guardarPedido({
  datos,
  lineas,
  subtotal,
  shippingCost,
  direccion,
  notas,
}: {
  datos: Datos
  lineas: {
    product_id: number
    product_name: string
    sku: string | null
    unit_price: number
    quantity: number
    line_total: number
  }[]
  subtotal: number
  shippingCost: number
  direccion: Record<string, string | undefined>
  notas: string
}): Promise<{ ok: boolean; orderNumber?: string; reason?: string }> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { ok: false, reason: 'Supabase no configurado' }

  try {
    const db = createClient(url, key, { auth: { persistSession: false } })

    const { data: pedido, error } = await db
      .from('orders')
      .insert({
        status: 'pendiente',
        customer_name: `${datos.nombre} ${datos.apellidos}`.trim(),
        customer_email: datos.email,
        customer_phone: datos.telefono,
        customer_rut: datos.rut || null,
        shipping_address: direccion,
        subtotal,
        shipping_cost: shippingCost,
        total: subtotal + shippingCost,
        notes: notas,
      })
      .select('id, order_number')
      .single()

    if (error) return { ok: false, reason: error.message }

    const { error: errorItems } = await db
      .from('order_items')
      .insert(lineas.map((l) => ({ ...l, order_id: pedido.id })))

    if (errorItems) {
      // El pedido quedó sin líneas: es peor que no tenerlo, así que se borra.
      await db.from('orders').delete().eq('id', pedido.id)
      return { ok: false, reason: `order_items: ${errorItems.message}` }
    }

    return { ok: true, orderNumber: String(pedido.order_number) }
  } catch (error) {
    return { ok: false, reason: (error as Error).message }
  }
}
