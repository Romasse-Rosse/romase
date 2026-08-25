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

export type EmailResult = { sent: boolean; reason?: string }

export async function sendLeadNotification(lead: Lead): Promise<EmailResult> {
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
      body: JSON.stringify({
        from,
        to: [to],
        // Así se puede responder al cliente directo desde la bandeja.
        reply_to: lead.email,
        subject: lead.productRef
          ? `Consulta por ${lead.productRef} — ${lead.name}`
          : `Nueva consulta web — ${lead.name}`,
        html: buildHtml(lead),
      }),
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
