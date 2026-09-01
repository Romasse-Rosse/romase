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

  // Variable por variable: decir «falta Supabase» obliga a adivinar cuál de
  // las tres es, y son fáciles de confundir entre sí.
  const variables = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    WEBPAY_CODIGO_COMERCIO: Boolean(process.env.WEBPAY_CODIGO_COMERCIO),
    WEBPAY_API_KEY: Boolean(process.env.WEBPAY_API_KEY),
  }

  const hayUrl = variables.SUPABASE_URL || variables.NEXT_PUBLIC_SUPABASE_URL
  const supabase = Boolean(hayUrl && variables.SUPABASE_SERVICE_ROLE_KEY)

  // Webpay necesita guardar el pedido antes de cobrar: sin base no se ofrece.
  const puedeCobrar = webpayConfigurado && supabase

  const queFalta = [
    !webpayConfigurado && 'faltan WEBPAY_CODIGO_COMERCIO y WEBPAY_API_KEY',
    !hayUrl && 'falta SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL)',
    !variables.SUPABASE_SERVICE_ROLE_KEY &&
      'falta SUPABASE_SERVICE_ROLE_KEY. Ojo: no es la anon key. La anon es ' +
        'pública y RLS le bloquea escribir en orders; para guardar el pedido ' +
        'hace falta la service_role, y esa nunca va con prefijo NEXT_PUBLIC_.',
  ].filter(Boolean)

  return NextResponse.json(
    {
      puedeCobrar,
      webpay: {
        configurado: webpayConfigurado,
        ambiente: webpayEsIntegracion ? 'integracion' : 'produccion',
        urlDeRetorno: `${origen}/checkout/retorno`,
      },
      supabase: { configurado: supabase },
      correo: { configurado: variables.RESEND_API_KEY },
      // Si esto no es el dominio donde está el sitio, la vuelta de Webpay falla.
      origen,
      variables,
      queFalta,
    },
    { headers: { 'x-robots-tag': 'noindex', 'cache-control': 'no-store' } },
  )
}
