import 'server-only'
import { WebpayPlus, Options, Environment, IntegrationCommerceCodes, IntegrationApiKeys } from 'transbank-sdk'

// Viven en su propio módulo porque no dependen del SDK; se reexportan
// para que quien ya las importaba de acá siga funcionando.
export { tipoDePago, motivoDelRechazo } from './webpay-glosas'

/**
 * Webpay Plus REST.
 *
 * Se usa el SDK oficial de Transbank en vez de llamar la API a mano. Son solo
 * dos llamadas y se podrían hacer con fetch, pero en una pasarela de pago
 * conviene el camino que Transbank soporta: la homologación pide evidencia de
 * las pruebas, y «usamos su SDK» es mejor respuesta que «escribimos el cliente».
 *
 * ------------------------------------------------------------------
 * Ambientes
 * ------------------------------------------------------------------
 * Sin variables de entorno funciona contra **integración** con las credenciales
 * públicas de prueba que publica Transbank. No hay secreto que proteger ahí: el
 * código de comercio y la llave son los mismos para todo el mundo.
 *
 * Para producción hacen falta las tres variables, y las dos credenciales las
 * entrega Transbank por escrito al terminar la homologación:
 *
 *   WEBPAY_AMBIENTE      = produccion
 *   WEBPAY_CODIGO_COMERCIO
 *   WEBPAY_API_KEY
 *
 * ------------------------------------------------------------------
 * HTTPS
 * ------------------------------------------------------------------
 * Transbank no acepta integraciones sin HTTPS, ni siquiera en integración: la
 * URL de retorno tiene que ser https. En Render lo es; en localhost no, así que
 * el flujo completo se prueba en el sitio desplegado, no en la máquina.
 */

const AMBIENTE = process.env.WEBPAY_AMBIENTE === 'produccion' ? 'produccion' : 'integracion'

const CODIGO_COMERCIO =
  process.env.WEBPAY_CODIGO_COMERCIO ?? IntegrationCommerceCodes.WEBPAY_PLUS
const API_KEY = process.env.WEBPAY_API_KEY ?? IntegrationApiKeys.WEBPAY

/**
 * En producción no se cae a las credenciales de prueba: sería cobrar contra un
 * comercio que no es el del cliente. Si faltan, Webpay queda apagado y el
 * checkout sigue funcionando como pedido por correo.
 */
export const webpayConfigurado =
  AMBIENTE === 'integracion' ||
  Boolean(process.env.WEBPAY_CODIGO_COMERCIO && process.env.WEBPAY_API_KEY)

export const webpayEsIntegracion = AMBIENTE === 'integracion'

/**
 * ¿Se puede cobrar en línea ahora mismo?
 *
 * Webpay necesita Supabase: el pedido tiene que existir en la base antes de
 * mandar a nadie a pagar, porque a la vuelta hay que comparar el monto contra
 * lo que se cobró y hay que tener qué mostrar en el comprobante.
 *
 * Es una sola función a propósito. La usan el diagnóstico, el checkout —para
 * decidir qué texto mostrar en el paso de pago— y la acción que abre la
 * transacción: si cada uno lo decidiera por su cuenta, la pantalla podría
 * prometer algo que el servidor no va a hacer, que es exactamente lo que pasó
 * cuando el panel decía «próximamente» con la integración ya andando.
 */
export function pagoEnLineaActivo(): boolean {
  const supabase = Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
  return webpayConfigurado && supabase
}

function transaccion() {
  return new WebpayPlus.Transaction(
    new Options(
      CODIGO_COMERCIO,
      API_KEY,
      AMBIENTE === 'produccion' ? Environment.Production : Environment.Integration,
    ),
  )
}

/** Lo que devuelve Transbank al confirmar. Solo los campos que se usan. */
export type RespuestaWebpay = {
  vci?: string
  amount: number
  status: string
  buy_order: string
  session_id?: string
  card_detail?: { card_number?: string }
  accounting_date?: string
  transaction_date?: string
  authorization_code?: string
  payment_type_code?: string
  response_code: number
  installments_number?: number
  installments_amount?: number
}

/**
 * Abre la transacción. Devuelve el token y la URL a la que hay que enviar al
 * comprador con un POST.
 *
 * `buyOrder` tiene que ser único por comercio: si el WooCommerce viejo sigue
 * cobrando con el mismo código, los dos sistemas no pueden repetir el número.
 * Por eso el prefijo.
 */
export async function crearTransaccion({
  ordenCompra,
  sesion,
  monto,
  urlRetorno,
}: {
  ordenCompra: string
  sesion: string
  monto: number
  urlRetorno: string
}): Promise<{ token: string; url: string }> {
  // CLP no tiene decimales y Transbank rechaza el monto con coma.
  const entero = Math.round(monto)
  const respuesta = await transaccion().create(ordenCompra, sesion, entero, urlRetorno)
  return { token: respuesta.token, url: respuesta.url }
}

/** Confirma la transacción. Se llama una sola vez por token. */
export async function confirmarTransaccion(token: string): Promise<RespuestaWebpay> {
  return (await transaccion().commit(token)) as RespuestaWebpay
}

/**
 * ¿Quedó aprobada?
 *
 * Las dos condiciones se piden juntas a propósito: la documentación exige
 * `response_code === 0` **y** `status === 'AUTHORIZED'`. Mirar solo una de las
 * dos es el error clásico de estas integraciones.
 */
export function aprobada(r: RespuestaWebpay): boolean {
  return r.response_code === 0 && r.status === 'AUTHORIZED'
}


/** Fecha de la transacción, en el formato que se muestra al comprador. */
export function fechaDeTransaccion(iso: string | undefined): string {
  if (!iso) return 'No informada'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
