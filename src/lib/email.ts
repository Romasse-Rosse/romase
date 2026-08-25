import { site } from './site'

/**
 * Aviso por correo de las consultas que entran por el formulario.
 *
 * Se usa la API de Resend por HTTP en vez del SDK: es una sola llamada y no
 * hace falta sumar una dependencia.
 *
 * Sin RESEND_API_KEY no se envía nada y la función lo informa sin lanzar
 * error: la consulta igual queda guardada en Supabase, que es la copia
 * durable. El correo es la notificación, no el registro.
 */

export type Lead = {
  name: string
  email: string
  phone?: string
  company?: string
  message: string
  productRef?: string
}

/** Escapa el texto que entra desde el formulario antes de meterlo en el HTML. */
function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildHtml(lead: Lead): string {
  const filas: [string, string | undefined][] = [
    ['Nombre', lead.name],
    ['Correo', lead.email],
    ['Teléfono', lead.phone],
    ['Empresa', lead.company],
    ['Producto consultado', lead.productRef],
  ]

  const celdas = filas
    .filter(([, valor]) => valor)
    .map(
      ([etiqueta, valor]) => `
        <tr>
          <td style="padding:6px 12px 6px 0;color:#7a6d64;white-space:nowrap;vertical-align:top">${etiqueta}</td>
          <td style="padding:6px 0;color:#241d18"><strong>${escape(valor!)}</strong></td>
        </tr>`,
    )
    .join('')

  return `
    <div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:600px;color:#241d18">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c53f20">
        ${site.name} · nueva consulta
      </p>
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:600">
        ${escape(lead.name)} escribió desde la web
      </h1>

      <table style="border-collapse:collapse;font-size:14px;margin-bottom:20px">${celdas}</table>

      <div style="border-left:3px solid #dd5330;padding:2px 0 2px 14px;font-size:14px;line-height:1.7;white-space:pre-wrap">${escape(
        lead.message,
      )}</div>

      <p style="margin:24px 0 0;font-size:13px;color:#7a6d64">
        Respondé a este correo y le llega directo a
        <a href="mailto:${escape(lead.email)}" style="color:#a5371b">${escape(lead.email)}</a>.
      </p>
    </div>`
}

export type OrderNotification = {
  orderNumber?: string
  customer: { name: string; email: string; phone: string; rut?: string }
  documento: 'boleta' | 'factura'
  razonSocial?: string
  entrega: 'retiro' | 'despacho'
  transportista?: string
  direccion?: string
  notas?: string
  lines: {
    name: string
    sku: string | null
    quantity: number
    unitPrice: number
    lineTotal: number
  }[]
  subtotal: number
}

const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL')

function buildOrderHtml(pedido: OrderNotification): string {
  const filas = pedido.lines
    .map(
      (l) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5dfd9">
            <strong style="color:#241d18">${escape(l.name)}</strong>
            ${l.sku ? `<br><span style="color:#7a6d64;font-size:12px">SKU ${escape(l.sku)}</span>` : ''}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5dfd9;text-align:center;white-space:nowrap">${l.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5dfd9;text-align:right;white-space:nowrap">${clp(l.lineTotal)}</td>
        </tr>`,
    )
    .join('')

  const datos: [string, string | undefined][] = [
    ['Cliente', pedido.customer.name],
    ['Correo', pedido.customer.email],
    ['Teléfono', pedido.customer.phone],
    ['RUT', pedido.customer.rut],
    ['Documento', pedido.documento === 'factura' ? `Factura — ${pedido.razonSocial}` : 'Boleta'],
    ['Entrega', pedido.entrega === 'retiro' ? 'Retira en el local' : 'Despacho'],
    ['Transportista', pedido.transportista],
    ['Dirección', pedido.direccion],
  ]

  const celdas = datos
    .filter(([, v]) => v)
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:5px 14px 5px 0;color:#7a6d64;white-space:nowrap;vertical-align:top">${k}</td>
          <td style="padding:5px 0;color:#241d18"><strong>${escape(v!)}</strong></td>
        </tr>`,
    )
    .join('')

  return `
    <div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:640px;color:#241d18">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c53f20">
        ${site.name} · nuevo pedido
      </p>
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:600">
        Pedido ${pedido.orderNumber ? `#${escape(pedido.orderNumber)}` : 'nuevo'}
      </h1>

      <table style="border-collapse:collapse;font-size:14px;margin-bottom:24px">${celdas}</table>

      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <thead>
          <tr>
            <th style="padding:0 0 8px;text-align:left;color:#7a6d64;font-weight:500;border-bottom:2px solid #241d18">Producto</th>
            <th style="padding:0 8px 8px;text-align:center;color:#7a6d64;font-weight:500;border-bottom:2px solid #241d18">Cant.</th>
            <th style="padding:0 0 8px;text-align:right;color:#7a6d64;font-weight:500;border-bottom:2px solid #241d18">Total</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:14px 0 0;text-align:right;color:#7a6d64">Subtotal</td>
            <td style="padding:14px 0 0;text-align:right;font-size:18px;font-weight:600">${clp(pedido.subtotal)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin:6px 0 0;font-size:12px;color:#7a6d64">
        IVA incluido. El despacho se cotiza aparte.
      </p>

      ${
        pedido.notas
          ? `<div style="margin-top:22px;border-left:3px solid #dd5330;padding:2px 0 2px 14px;font-size:14px;line-height:1.7;white-space:pre-wrap">${escape(
              pedido.notas,
            )}</div>`
          : ''
      }

      <p style="margin:26px 0 0;font-size:13px;color:#7a6d64">
        Respondé a este correo y le llega directo a
        <a href="mailto:${escape(pedido.customer.email)}" style="color:#a5371b">${escape(
          pedido.customer.email,
        )}</a>.
      </p>
    </div>`
}

export type EmailResult = { sent: boolean; reason?: string }

/** Única salida a Resend. La usan tanto las consultas como los pedidos. */
async function enviar({
  subject,
  html,
  replyTo,
}: {
  subject: string
  html: string
  replyTo: string
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { sent: false, reason: 'RESEND_API_KEY no configurada' }

  // El remitente tiene que ser una dirección de un dominio verificado en Resend.
  const from = process.env.RESEND_FROM ?? `${site.name} <web@romase.cl>`
  const to = process.env.LEADS_EMAIL ?? site.contact.email

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // reply_to apunta al cliente: así se le responde directo desde la bandeja.
      body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, html }),
    })

    if (!res.ok) {
      const detalle = await res.text()
      return { sent: false, reason: `Resend respondió ${res.status}: ${detalle.slice(0, 200)}` }
    }

    return { sent: true }
  } catch (error) {
    return { sent: false, reason: (error as Error).message }
  }
}

export function sendLeadNotification(lead: Lead): Promise<EmailResult> {
  return enviar({
    replyTo: lead.email,
    subject: lead.productRef
      ? `Consulta por ${lead.productRef} — ${lead.name}`
      : `Nueva consulta web — ${lead.name}`,
    html: buildHtml(lead),
  })
}

export function sendOrderNotification(pedido: OrderNotification): Promise<EmailResult> {
  const unidades = pedido.lines.reduce((n, l) => n + l.quantity, 0)
  return enviar({
    replyTo: pedido.customer.email,
    subject:
      `Pedido ${pedido.orderNumber ? `#${pedido.orderNumber}` : 'nuevo'} — ` +
      `${pedido.customer.name} · ${unidades} ${unidades === 1 ? 'unidad' : 'unidades'} · ` +
      clp(pedido.subtotal),
    html: buildOrderHtml(pedido),
  })
}
