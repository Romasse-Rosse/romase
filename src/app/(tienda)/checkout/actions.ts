'use server'

import { createClient } from '@supabase/supabase-js'
import { loadCatalog } from '@/lib/catalog'
import { GRACIA_COBRO, resolverPrecio } from '@/lib/promociones'
import { sendOrderNotification, type OrderNotification } from '@/lib/email'
import { titleCase } from '@/lib/format'
import { regionesVenta, site } from '@/lib/site'
import { origenDelSitio } from '@/lib/origen'
import { crearTransaccion, webpayConfigurado } from '@/lib/webpay'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type CheckoutLine = { id: number; quantity: number }

export type CheckoutState = {
  /**
   * 'pagar' es el camino con Webpay: el formulario recibe la URL y el token y
   * manda al comprador a Transbank. 'ok' es el camino sin pasarela, que sigue
   * existiendo mientras Webpay no esté configurado.
   */
  status: 'idle' | 'ok' | 'error' | 'pagar'
  message?: string
  fieldErrors?: Record<string, string>
  /** Número de pedido, cuando se pudo registrar. */
  orderNumber?: string
  /** Datos para el POST a Webpay, cuando status es 'pagar'. */
  webpay?: { url: string; token: string }
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

  /**
   * La cobertura se comprueba acá, no solo en el selector.
   *
   * El desplegable ya ofrece nada más que las regiones que se atienden, pero un
   * formulario se puede mandar con cualquier valor. Si el servidor no lo
   * comprueba, entra un pedido a una región donde no se despacha y el problema
   * aparece cuando hay que decirle al cliente que no se puede enviar.
   */
  const cubierta = (region: string) => (regionesVenta as readonly string[]).includes(region)
  const fueraDeCobertura =
    'Por ahora despachamos desde la Región de Los Lagos hacia el sur. ' +
    `Escríbenos a ${site.contact.email} y vemos cómo ayudarte.`

  if (datos.region && !cubierta(datos.region)) errores.region = fueraDeCobertura

  if (datos.entrega === 'despacho') {
    const transportistaValido = site.carriers.some((c) => c.id === datos.transportista)
    if (!transportistaValido) errores.transportista = 'Elige una empresa despachadora.'

    if (datos.otraDireccion) {
      if (!datos.envioDireccion) errores.envioDireccion = 'Indica la dirección de envío.'
      if (!datos.envioComuna) errores.envioComuna = 'Indica la comuna de envío.'
      if (datos.envioRegion && !cubierta(datos.envioRegion)) {
        errores.envioRegion = fueraDeCobertura
      }
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

  const { products, promociones } = await loadCatalog()
  const porId = new Map(products.map((p) => [p.id, p]))

  /**
   * El precio de cobro respeta las promociones un rato más que la vitrina.
   *
   * Las páginas de la tienda están generadas de antemano, así que una ficha
   * puede seguir mostrando un descuento unos minutos después de que venció. Si
   * acá se cobrara con la vigencia estricta, ese comprador vería $80.000 y
   * pagaría $100.000. **A nadie se le cobra más de lo que vio.**
   *
   * GRACIA_COBRO es holgadamente mayor que lo que una página puede quedar
   * desactualizada, así que ese caso no existe. El contrario —cobrar menos de
   * lo mostrado en los últimos minutos— sí puede pasar, y es a favor de quien
   * compra.
   */
  const ahora = Date.now()

  const lineas = lineasCliente.flatMap((linea) => {
    const producto = porId.get(linea.id)
    if (!producto) return []

    const { price } = resolverPrecio(producto, promociones, ahora, GRACIA_COBRO)

    return [
      {
        product_id: producto.id,
        product_name: titleCase(producto.name),
        sku: producto.sku,
        unit_price: price,
        quantity: linea.quantity,
        line_total: price * linea.quantity,
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
  // El despacho va por pagar: el flete lo cobra la empresa de transporte a
  // quien recibe, así que el pedido no lleva costo de envío.
  const shippingCost = 0

  const nombreCompleto = `${datos.nombre} ${datos.apellidos}`.trim()
  const transportista = site.carriers.find((c) => c.id === datos.transportista)?.name

  // Dirección de facturación, más la de envío cuando es distinta.
  //
  // Acá van también el tipo de documento, la razón social y la nota del
  // cliente. No tienen columna propia y con Webpay el correo al negocio sale a
  // la vuelta del pago, cuando del formulario ya no queda nada: si no se
  // guardan, el aviso del pedido pagado se manda sin ellos. Ver
  // src/lib/pedido-aviso.ts.
  const direccion: Record<string, string | undefined> = {
    tipo: datos.entrega === 'retiro' ? 'retiro en local' : 'despacho',
    documento: datos.documento,
    razon_social: datos.documento === 'factura' ? datos.razonSocial : undefined,
    nota_cliente: datos.notas || undefined,
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
      : `Despacho por ${transportista ?? 'transportista sin definir'} · envío por pagar`,
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

  // ------------------------------------------------------------
  // Pago con Webpay
  //
  // Solo si hay pasarela configurada y el pedido quedó guardado: el número de
  // orden y el total tienen que existir en la base antes de mandar a nadie a
  // pagar, porque al volver hay que comparar el monto contra lo que se cobró.
  // ------------------------------------------------------------
  if (webpayConfigurado && guardado.ok && guardado.orderNumber && guardado.id) {
    const total = subtotal
    const ordenCompra = ordenDeCompra(guardado.orderNumber)

    try {
      const { token, url } = await crearTransaccion({
        ordenCompra,
        sesion: guardado.id.slice(0, 61),
        monto: total,
        // El origen real, no el canónico: ver src/lib/origen.ts.
        urlRetorno: `${await origenDelSitio()}/checkout/retorno`,
      })

      const anotado = await anotarTransaccion(guardado.id, token, ordenCompra)
      if (!anotado) {
        // Sin el token guardado no se puede reconocer el pedido a la vuelta.
        console.error('[checkout] no se pudo anotar el token de Webpay')
      } else {
        return { status: 'pagar', orderNumber: guardado.orderNumber, webpay: { url, token } }
      }
    } catch (error) {
      // Que Webpay falle no puede perder el pedido: cae al aviso por correo.
      console.error('[checkout] Webpay no respondió:', (error as Error).message)
    }
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
}): Promise<{ ok: boolean; id?: string; orderNumber?: string; reason?: string }> {
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
      /**
       * 23503 es violación de clave ajena: order_items.product_id apunta a
       * la tabla products, y esa tabla puede no tener la fila. Hoy el catálogo
       * se sirve del respaldo local, así que Supabase puede estar sin sembrar
       * y en ese caso **ninguna venta se guardaría**.
       *
       * La línea no necesita el vínculo: el nombre, el SKU y el precio se
       * congelan al comprar, justamente para que el pedido no dependa de que
       * el catálogo no cambie. Así que se reintenta sin la referencia. Perder
       * el vínculo es un inconveniente; perder la venta, no.
       */
      if (errorItems.code === '23503') {
        const { error: sinVinculo } = await db
          .from('order_items')
          .insert(lineas.map((l) => ({ ...l, product_id: null, order_id: pedido.id })))

        if (!sinVinculo) {
          console.warn(
            `[checkout] pedido ${pedido.order_number} guardado sin vínculo a products: ` +
              'la tabla no tiene esos productos. Sembrar el catálogo con yarn catalog:seed.',
          )
          return { ok: true, id: pedido.id, orderNumber: String(pedido.order_number) }
        }
      }

      // El pedido quedó sin líneas: es peor que no tenerlo, así que se borra.
      await db.from('orders').delete().eq('id', pedido.id)
      return { ok: false, reason: `order_items: ${errorItems.message}` }
    }

    return { ok: true, id: pedido.id, orderNumber: String(pedido.order_number) }
  } catch (error) {
    return { ok: false, reason: (error as Error).message }
  }
}

/**
 * Orden de compra para Transbank.
 *
 * Máximo 26 caracteres y **única por código de comercio**. El prefijo importa:
 * si el WooCommerce viejo sigue cobrando con el mismo código, los dos sistemas
 * no pueden generar el mismo número. `ROM-` marca cuál es de este sitio.
 */
function ordenDeCompra(numeroPedido: string): string {
  return `ROM-${numeroPedido}`.slice(0, 26)
}

/** Deja el token de Webpay en el pedido, para reconocerlo cuando vuelva. */
async function anotarTransaccion(
  id: string,
  token: string,
  ordenCompra: string,
): Promise<boolean> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false

  try {
    const db = createClient(url, key, { auth: { persistSession: false } })
    const { error } = await db
      .from('orders')
      .update({ webpay_token: token, webpay_buy_order: ordenCompra, updated_at: new Date().toISOString() })
      .eq('id', id)
    return !error
  } catch {
    return false
  }
}
