import { NextResponse } from 'next/server'
import { origenDelSitio } from '@/lib/origen'
import { webpayConfigurado, webpayEsIntegracion } from '@/lib/webpay'

/**
 * ¿Está el sitio en condiciones de cobrar?
 *
 * Existe porque la respuesta depende de variables de entorno que solo se ven
 * desde adentro del servidor, y en Render el plan gratuito no da consola. Sin
 * esto, la única forma de saber si el pago está activo es intentar una compra,
 * que en el peor caso manda un correo al cliente.
 *
 * **Solo devuelve booleanos y la URL pública.** Ningún valor de ninguna
 * credencial: saber que Supabase está configurado no le sirve a nadie que no
 * tenga las llaves, y ahorra media hora de adivinanzas en la puesta en marcha.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  const origen = await origenDelSitio()

  const supabase = Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  // Webpay necesita guardar el pedido antes de cobrar: sin base no se ofrece.
  const puedeCobrar = webpayConfigurado && supabase

  return NextResponse.json(
    {
      puedeCobrar,
      webpay: {
        configurado: webpayConfigurado,
        ambiente: webpayEsIntegracion ? 'integracion' : 'produccion',
        urlDeRetorno: `${origen}/checkout/retorno`,
      },
      supabase: { configurado: supabase },
      correo: { configurado: Boolean(process.env.RESEND_API_KEY) },
      // Si esto no es el dominio donde está el sitio, la vuelta de Webpay falla.
      origen,
      queFalta: puedeCobrar
        ? []
        : [
            !webpayConfigurado && 'faltan WEBPAY_CODIGO_COMERCIO y WEBPAY_API_KEY',
            !supabase && 'falta Supabase: sin base no se puede guardar el pedido antes de cobrar',
          ].filter(Boolean),
    },
    { headers: { 'x-robots-tag': 'noindex', 'cache-control': 'no-store' } },
  )
}
