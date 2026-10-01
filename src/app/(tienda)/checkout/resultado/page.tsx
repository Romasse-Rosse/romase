import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { site } from '@/lib/site'
import { Container } from '@/components/ui'
import {
  aprobada,
  fechaDeTransaccion,
  motivoDelRechazo,
  tipoDePago,
  type RespuestaWebpay,
} from '@/lib/webpay'
import { CompraConfirmada } from '@/components/compra-confirmada'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Resultado del pago',
  robots: { index: false, follow: false },
}

type SearchParams = Promise<Record<string, string | undefined>>

/**
 * Página de resultado de Webpay.
 *
 * Transbank define qué tiene que ver el tarjetahabiente después de pagar, y no
 * es opcional: es requisito de la homologación. Los nueve datos obligatorios
 * son número de pedido, nombre del comercio, monto y moneda, código de
 * autorización, fecha, tipo de pago, cantidad de cuotas, últimos cuatro dígitos
 * de la tarjeta y descripción de lo comprado.
 *
 * Para las rechazadas piden además informar las causas posibles.
 */
export default async function ResultadoPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const estado = params.estado ?? 'error'
  const token = params.token
  const orden = params.orden

  if (estado === 'anulado' || estado === 'vencido') {
    return (
      <Detenido
        titulo={estado === 'anulado' ? 'Cancelaste el pago' : 'Se venció el tiempo para pagar'}
        texto={
          estado === 'anulado'
            ? 'No se hizo ningún cargo a tu tarjeta. Tu carrito sigue como estaba, así que ' +
              'puedes volver a intentarlo cuando quieras.'
            : 'El formulario de Webpay tiene un tiempo límite y se cumplió antes de terminar. ' +
              'No se hizo ningún cargo a tu tarjeta.'
        }
        orden={orden}
      />
    )
  }

  const pedido = token ? await pedidoPorToken(token) : null

  if (!pedido?.webpay_response) {
    return (
      <Detenido
        titulo="No pudimos confirmar el pago"
        texto={
          `Si el cargo aparece en tu tarjeta, escríbenos a ${site.contact.email} o llámanos ` +
          `al ${site.contact.phone} con el número de pedido y lo resolvemos.`
        }
        orden={orden}
      />
    )
  }

  const r = pedido.webpay_response
  const ok = aprobada(r) && pedido.status === 'pagado'
  const tarjeta = r.card_detail?.card_number

  return (
    <Container className="py-10 lg:py-16">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          {ok ? (
            <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-emerald-600" />
          ) : (
            <XCircle aria-hidden="true" className="mx-auto size-12 text-brand-600" />
          )}
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink-950">
            {ok ? '¡Pago confirmado!' : 'El pago no se completó'}
          </h1>
          <p className="mt-3 text-ink-600">
            {ok
              ? 'Guarda este comprobante: es el respaldo de tu pago. Un asesor te contacta ' +
                'el mismo día hábil para coordinar la entrega.'
              : motivoDelRechazo(r.response_code)}
          </p>
        </div>

        {/* Comprobante. Los nueve campos son los que exige Transbank. */}
        <dl className="mt-9 border border-ink-200 text-sm">
          <Fila termino="Número de pedido" valor={`#${pedido.order_number}`} />
          <Fila termino="Comercio" valor={site.legalName} />
          <Fila
            termino="Monto"
            valor={`${formatPrice(Number(r.amount))} ${pedido.currency ?? 'CLP'}`}
          />
          <Fila
            termino="Código de autorización"
            valor={r.authorization_code ?? 'No informado'}
          />
          <Fila termino="Fecha de la transacción" valor={fechaDeTransaccion(r.transaction_date)} />
          <Fila termino="Tipo de pago" valor={tipoDePago(r.payment_type_code)} />
          <Fila
            termino="Cuotas"
            valor={r.installments_number ? String(r.installments_number) : 'Sin cuotas'}
          />
          <Fila
            termino="Tarjeta"
            valor={tarjeta ? `Terminada en ${tarjeta}` : 'No informada'}
          />
          <Fila termino="Orden de compra" valor={r.buy_order} />
        </dl>

        {pedido.lineas.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-ink-950">Detalle de la compra</h2>
            <ul className="border border-ink-200 divide-y divide-ink-100 text-sm">
              {pedido.lineas.map((l, i) => (
                <li key={i} className="flex items-start justify-between gap-4 px-5 py-3.5">
                  <span className="text-ink-800">
                    <span className="font-semibold">{l.product_name}</span>
                    {l.sku && <span className="block text-xs text-ink-500">SKU {l.sku}</span>}
                    <span className="block text-xs text-ink-500">
                      {l.quantity} {l.quantity === 1 ? 'unidad' : 'unidades'}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium text-ink-950">
                    {formatPrice(Number(l.line_total))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/#categorias"
            className="inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Seguir comprando
          </Link>
          {!ok && (
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center rounded-sm border border-ink-300 px-6 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
            >
              Intentar de nuevo
            </Link>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          ¿Algo no cuadra? Escríbenos a{' '}
          <a href={`mailto:${site.contact.email}`} className="text-brand-700 underline">
            {site.contact.email}
          </a>{' '}
          con el número de pedido.
        </p>
      </div>

      {/* El evento purchase y el vaciado del carrito van acá, con el pago ya
          confirmado: en el formulario todavía no se sabía si se iba a aprobar. */}
      {ok && (
        <CompraConfirmada
          transactionId={r.buy_order}
          items={pedido.lineas.map((l) => ({
            // Igual que <g:id> en Merchant Center. Solo se usa el SKU como
            // respaldo si el producto fue eliminado después de la compra.
            item_id: l.product_id ? String(l.product_id) : (l.sku ?? l.product_name),
            item_name: l.product_name,
            price: Number(l.line_total) / Math.max(1, l.quantity),
            item_brand: site.name,
            quantity: l.quantity,
          }))}
        />
      )}
    </Container>
  )
}

function Fila({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-3 last:border-b-0">
      <dt className="text-ink-600">{termino}</dt>
      <dd className="text-right font-medium text-ink-950">{valor}</dd>
    </div>
  )
}

function Detenido({
  titulo,
  texto,
  orden,
}: {
  titulo: string
  texto: string
  orden?: string
}) {
  return (
    <Container className="py-14 lg:py-20">
      <div className="mx-auto max-w-lg text-center">
        <AlertCircle aria-hidden="true" className="mx-auto size-11 text-amber-600" />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
          {titulo}
        </h1>
        <p className="mt-3 leading-relaxed text-ink-600">{texto}</p>
        {orden && <p className="mt-3 text-sm text-ink-500">Orden de compra: {orden}</p>}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/checkout"
            className="inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Volver a intentar
          </Link>
          <Link
            href="/carrito"
            className="inline-flex h-11 items-center justify-center rounded-sm border border-ink-300 px-6 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
          >
            Ver mi carrito
          </Link>
        </div>
      </div>
    </Container>
  )
}

// ------------------------------------------------------------------
// Lectura del pedido
// ------------------------------------------------------------------

type PedidoResuelto = {
  order_number: number
  status: string
  currency: string | null
  webpay_response: RespuestaWebpay | null
  lineas: {
    product_id: number | null
    product_name: string
    sku: string | null
    quantity: number
    line_total: number
  }[]
}

async function pedidoPorToken(token: string): Promise<PedidoResuelto | null> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  try {
    const db = createClient(url, key, { auth: { persistSession: false } })
    const { data } = await db
      .from('orders')
      .select('id, order_number, status, currency, webpay_response')
      .eq('webpay_token', token)
      .maybeSingle()

    if (!data) return null

    const { data: lineas } = await db
      .from('order_items')
      .select('product_id, product_name, sku, quantity, line_total')
      .eq('order_id', data.id)

    return {
      order_number: data.order_number,
      status: data.status,
      currency: data.currency,
      webpay_response: data.webpay_response as RespuestaWebpay | null,
      lineas: lineas ?? [],
    }
  } catch {
    return null
  }
}
