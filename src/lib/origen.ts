import 'server-only'
import { headers } from 'next/headers'
import { site } from './site'

/**
 * Origen real desde el que se está sirviendo la petición.
 *
 * No es lo mismo que `site.url`, y confundirlos rompe los pagos.
 *
 * `site.url` sale de `NEXT_PUBLIC_SITE_URL` y es el dominio **canónico**: el que
 * se le declara a Google. Hoy vale `https://romase.cl`, que sigue siendo el
 * WordPress viejo, porque ahí es donde va a vivir el sitio cuando se mueva el
 * dominio. Para el SEO está bien.
 *
 * Para Webpay está mal. La URL de retorno que se le entrega a Transbank tiene
 * que ser **donde el sitio está corriendo ahora**, o el comprador termina en
 * otro sitio después de pagar y el pedido queda cobrado sin confirmar.
 *
 * Tampoco sirve `request.url`: detrás del proxy de Render devuelve la dirección
 * interna, `https://localhost:10000`. Los encabezados reenviados sí traen el
 * host público.
 */
export async function origenDelSitio(): Promise<string> {
  const h = await headers()

  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (!host) return site.url

  // En local no hay x-forwarded-proto y el host es localhost: ahí va http.
  const protocolo =
    h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')

  return `${protocolo}://${host}`
}
