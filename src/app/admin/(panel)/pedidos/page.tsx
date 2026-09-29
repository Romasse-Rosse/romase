import Link from 'next/link'
import { AlertCircle, ChevronRight } from 'lucide-react'
import { clienteDelPanel } from '@/lib/panel'
import { formatPrice } from '@/lib/format'
import {
  ESTADOS,
  estadoDe,
  esCobrado,
  fechaHora,
  despachoDe,
  type EstadoPedido,
} from '@/lib/pedidos-panel'
import { EstadoChip } from './estado-chip'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Pedidos' }

type Fila = {
  /** uuid, no correlativo: el número que se muestra es order_number. */
  id: string
  order_number: number
  status: string
  customer_name: string | null
  customer_email: string | null
  total: number
  created_at: string
  shipping_address: unknown
  webpay_response: unknown
}

export default async function PedidosPanel({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado: filtro } = await searchParams
  const db = await clienteDelPanel()

  const { data, error } = await db
    .from('orders')
    .select(
      'id, order_number, status, customer_name, customer_email, total, created_at, shipping_address, webpay_response',
    )
    .order('created_at', { ascending: false })
    .limit(500)

  const pedidos = (data ?? []) as Fila[]

  // Los totales se calculan sobre todo, no sobre lo filtrado: si filtrás por
  // «sin pagar» y el resumen cambiara, dejarías de ver cuánto vendiste.
  const cobrados = pedidos.filter((p) => esCobrado(estadoDe(p.status)))
  const vendido = cobrados.reduce((n, p) => n + Number(p.total ?? 0), 0)

  const porEstado = new Map<EstadoPedido, number>()
  for (const p of pedidos) {
    const e = estadoDe(p.status)
    porEstado.set(e, (porEstado.get(e) ?? 0) + 1)
  }

  const visibles =
    filtro && filtro in ESTADOS ? pedidos.filter((p) => estadoDe(p.status) === filtro) : pedidos

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Pedidos</h1>
      <p className="mt-1 text-sm text-ink-500">
        Todo lo que se pidió desde la web, con el detalle de cada pago.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 flex gap-2 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          No se pudieron leer los pedidos: {error.message}
        </p>
      )}

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="border border-ink-200 bg-white p-5">
          <dt className="text-xs tracking-wide text-ink-500 uppercase">Vendido y pagado</dt>
          <dd className="mt-1.5 text-2xl font-semibold text-ink-950">{formatPrice(vendido)}</dd>
          <dd className="mt-0.5 text-xs text-ink-500">
            {cobrados.length} {cobrados.length === 1 ? 'pedido cobrado' : 'pedidos cobrados'}
          </dd>
        </div>
        <div className="border border-ink-200 bg-white p-5">
          <dt className="text-xs tracking-wide text-ink-500 uppercase">Pedidos</dt>
          <dd className="mt-1.5 text-2xl font-semibold text-ink-950">{pedidos.length}</dd>
          <dd className="mt-0.5 text-xs text-ink-500">desde que abrió la tienda</dd>
        </div>
        <div className="border border-ink-200 bg-white p-5">
          <dt className="text-xs tracking-wide text-ink-500 uppercase">Ticket promedio</dt>
          <dd className="mt-1.5 text-2xl font-semibold text-ink-950">
            {cobrados.length > 0 ? formatPrice(Math.round(vendido / cobrados.length)) : '—'}
          </dd>
          <dd className="mt-0.5 text-xs text-ink-500">sobre los pedidos pagados</dd>
        </div>
      </dl>

      {/* Los filtros son enlaces y no un menú: así se pueden compartir y
          quedan en el historial del navegador. */}
      <nav aria-label="Filtrar por estado" className="mt-6 flex flex-wrap gap-2">
        <Filtro href="/admin/pedidos" activo={!filtro || !(filtro in ESTADOS)}>
          Todos ({pedidos.length})
        </Filtro>
        {(Object.keys(ESTADOS) as EstadoPedido[])
          .filter((e) => (porEstado.get(e) ?? 0) > 0)
          .map((e) => (
            <Filtro key={e} href={`/admin/pedidos?estado=${e}`} activo={filtro === e}>
              {ESTADOS[e].etiqueta} ({porEstado.get(e)})
            </Filtro>
          ))}
      </nav>

      {filtro && filtro in ESTADOS && (
        <p className="mt-4 border border-ink-200 bg-white p-4 text-sm text-ink-600">
          {ESTADOS[filtro as EstadoPedido].glosa}
        </p>
      )}

      {visibles.length > 0 ? (
        <ul className="mt-4 divide-y divide-ink-100 border border-ink-200 bg-white">
          {visibles.map((p) => {
            const estado = estadoDe(p.status)
            const despacho = despachoDe(p.shipping_address)
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/pedidos/${p.id}`}
                  className="flex items-start gap-3 p-4 transition-colors hover:bg-ink-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink-950">
                        #{p.order_number}
                      </span>
                      <EstadoChip estado={estado} />
                    </span>
                    <span className="mt-1 block truncate text-sm text-ink-700">
                      {p.customer_name || p.customer_email || 'Sin nombre'}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500">
                      {fechaHora(p.created_at)}
                      {despacho.tipo === 'retiro' ? ' · Retiro en tienda' : null}
                      {despacho.transportista ? ` · ${despacho.transportista}` : null}
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold text-ink-950">
                      {formatPrice(Number(p.total ?? 0))}
                    </span>
                  </span>

                  <ChevronRight
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-ink-300"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-4 border border-dashed border-ink-300 p-10 text-center text-sm text-ink-500">
          {pedidos.length === 0
            ? 'Todavía no hay pedidos.'
            : 'Ningún pedido con ese estado.'}
        </p>
      )}

      {pedidos.length >= 500 && (
        <p className="mt-4 text-xs text-ink-500">
          Se muestran los 500 más recientes.
        </p>
      )}
    </div>
  )
}

function Filtro({
  href,
  activo,
  children,
}: {
  href: string
  activo: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? 'page' : undefined}
      className={
        'inline-flex h-9 items-center rounded-sm border px-3 text-sm transition-colors ' +
        (activo
          ? 'border-ink-950 bg-ink-950 text-white'
          : 'border-ink-200 bg-white text-ink-700 hover:border-ink-400')
      }
    >
      {children}
    </Link>
  )
}
