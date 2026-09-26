import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, AlertCircle, Mail } from 'lucide-react'
import { clienteDelPanel } from '@/lib/panel'
import { formatPrice } from '@/lib/format'
import {
  ESTADOS,
  estadoDe,
  despachoDe,
  direccionEnUnaLinea,
  pagoDe,
  fechaHora,
} from '@/lib/pedidos-panel'
import { EstadoChip } from '../estado-chip'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: `Pedido ${id}` }
}

type Linea = {
  product_name: string
  sku: string | null
  unit_price: number
  quantity: number
  line_total: number
}

export default async function PedidoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await clienteDelPanel()

  const [{ data: pedido, error }, { data: lineas }] = await Promise.all([
    db.from('orders').select('*').eq('id', Number(id)).maybeSingle(),
    db
      .from('order_items')
      .select('product_name, sku, unit_price, quantity, line_total')
      .eq('order_id', Number(id))
      .order('id'),
  ])

  if (error) {
    return (
      <p
        role="alert"
        className="flex gap-2 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        No se pudo leer el pedido: {error.message}
      </p>
    )
  }

  if (!pedido) notFound()

  const estado = estadoDe(pedido.status)
  const despacho = despachoDe(pedido.shipping_address)
  const pago = pagoDe(pedido.webpay_response)
  const items = (lineas ?? []) as Linea[]
  const direccion = direccionEnUnaLinea(despacho)

  return (
    <div>
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Pedidos
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-950">
          Pedido #{pedido.order_number}
        </h1>
        <EstadoChip estado={estado} grande />
      </div>
      <p className="mt-1 text-sm text-ink-500">{fechaHora(pedido.created_at)}</p>

      <p className="mt-4 border border-ink-200 bg-white p-4 text-sm text-ink-700">
        {ESTADOS[estado].glosa}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Bloque titulo="Quién compró">
          <Dato etiqueta="Nombre" valor={pedido.customer_name} destacado />
          <Dato etiqueta="Correo" valor={pedido.customer_email} copiable />
          <Dato etiqueta="Teléfono" valor={pedido.customer_phone} copiable />
          <Dato etiqueta="RUT" valor={pedido.customer_rut ?? despacho.rut} />
        </Bloque>

        <Bloque titulo="Entrega y documento">
          <Dato
            etiqueta="Modalidad"
            valor={despacho.tipo === 'retiro' ? 'Retiro en tienda' : 'Despacho'}
            destacado
          />
          {despacho.tipo === 'despacho' && (
            <>
              <Dato etiqueta="Transportista" valor={despacho.transportista} />
              <Dato etiqueta="Dirección" valor={direccion} />
            </>
          )}
          <Dato
            etiqueta="Documento"
            valor={despacho.documento === 'factura' ? 'Factura' : 'Boleta'}
          />
          {despacho.documento === 'factura' && (
            <Dato etiqueta="Razón social" valor={despacho.razonSocial} />
          )}
        </Bloque>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-ink-950">Qué pidió</h2>
      {items.length > 0 ? (
        <div className="mt-2 overflow-x-auto border border-ink-200 bg-white">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs tracking-wide text-ink-500 uppercase">
                <th className="p-3 font-medium">Producto</th>
                <th className="p-3 text-right font-medium">Precio</th>
                <th className="p-3 text-right font-medium">Cant.</th>
                <th className="p-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((l, i) => (
                <tr key={i}>
                  <td className="p-3">
                    <span className="block font-medium text-ink-950">{l.product_name}</span>
                    {l.sku && <span className="mt-0.5 block text-xs text-ink-500">SKU {l.sku}</span>}
                  </td>
                  <td className="p-3 text-right tabular-nums text-ink-700">
                    {formatPrice(Number(l.unit_price))}
                  </td>
                  <td className="p-3 text-right tabular-nums text-ink-700">{l.quantity}</td>
                  <td className="p-3 text-right font-medium tabular-nums text-ink-950">
                    {formatPrice(Number(l.line_total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-2 border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
          Este pedido no tiene líneas guardadas.
        </p>
      )}

      <div className="mt-4 border border-ink-200 bg-white p-4">
        <Renglon etiqueta="Subtotal" valor={formatPrice(Number(pedido.subtotal ?? 0))} />
        <Renglon
          etiqueta="Envío"
          valor={
            Number(pedido.shipping_cost ?? 0) > 0
              ? formatPrice(Number(pedido.shipping_cost))
              : 'Por pagar al recibir'
          }
        />
        <div className="mt-2 flex items-baseline justify-between border-t border-ink-200 pt-2">
          <span className="text-sm font-semibold text-ink-950">Total</span>
          <span className="text-lg font-semibold tabular-nums text-ink-950">
            {formatPrice(Number(pedido.total ?? 0))}
          </span>
        </div>
      </div>

      <p className="mt-4">
        <a
          href={`/admin/pedidos/${pedido.id}/correo`}
          target="_blank"
          rel="noopener"
          className="inline-flex h-10 items-center gap-2 rounded-sm border border-ink-300 px-4 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
        >
          <Mail aria-hidden="true" className="size-4" />
          Ver el correo que recibió el negocio
        </a>
      </p>

      <h2 className="mt-8 text-sm font-semibold text-ink-950">El pago</h2>
      {pago ? (
        <div className="mt-2 grid gap-6 border border-ink-200 bg-white p-4 sm:grid-cols-2 sm:p-5">
          <dl>
            <Dato etiqueta="Código de autorización" valor={pago.autorizacion} destacado copiable />
            <Dato etiqueta="Orden de compra" valor={pago.ordenDeCompra} copiable />
            <Dato etiqueta="Fecha de la transacción" valor={fechaHora(pago.fecha)} />
            <Dato etiqueta="Monto cobrado" valor={pago.monto !== null ? formatPrice(pago.monto) : null} />
          </dl>
          <dl>
            <Dato etiqueta="Medio de pago" valor={pago.tipo} />
            <Dato
              etiqueta="Tarjeta"
              valor={pago.tarjeta ? `Terminada en ${pago.tarjeta}` : null}
            />
            <Dato
              etiqueta="Cuotas"
              valor={pago.cuotas === null ? null : pago.cuotas === 0 ? 'Sin cuotas' : String(pago.cuotas)}
            />
            <Dato etiqueta="Respuesta de Transbank" valor={pago.estadoTransbank} />
          </dl>

          {pago.motivo && (
            <p className="flex gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong className="font-medium">Por qué se rechazó:</strong> {pago.motivo}
              </span>
            </p>
          )}

          {pago.monto !== null && pago.monto !== Number(pedido.total ?? 0) && (
            <p className="flex gap-2 border border-amber-300 bg-amber-50 p-3 text-sm text-ink-700 sm:col-span-2">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>
                <strong className="font-medium">El monto cobrado no coincide con el total.</strong>{' '}
                Transbank cobró {formatPrice(pago.monto)} y el pedido dice{' '}
                {formatPrice(Number(pedido.total ?? 0))}. Conviene revisarlo antes de despachar.
              </span>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 border border-ink-200 bg-white p-4 text-sm text-ink-600">
          No hay datos de pago. El comprador nunca llegó a completar la transacción en Transbank,
          así que no se cobró nada.
          {pedido.webpay_buy_order && (
            <>
              {' '}
              La orden de compra reservada fue{' '}
              <span className="font-medium text-ink-900">{pedido.webpay_buy_order}</span>.
            </>
          )}
        </p>
      )}

      {(pedido.notes || despacho.notaDelCliente) && (
        <>
          <h2 className="mt-8 text-sm font-semibold text-ink-950">Notas</h2>
          <div className="mt-2 border border-ink-200 bg-white p-4 text-sm whitespace-pre-line text-ink-700">
            {despacho.notaDelCliente ?? pedido.notes}
          </div>
        </>
      )}
    </div>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-ink-950">{titulo}</h2>
      <dl className="mt-2 border border-ink-200 bg-white p-4 sm:p-5">{children}</dl>
    </section>
  )
}

/**
 * Un dato del pedido.
 *
 * Los que faltan se muestran como «—» en vez de esconderse: un campo vacío es
 * información —el cliente no dejó teléfono— y esconderlo hace pensar que la
 * pantalla no lo trae.
 */
function Dato({
  etiqueta,
  valor,
  destacado = false,
  copiable = false,
}: {
  etiqueta: string
  valor: string | null | undefined
  destacado?: boolean
  copiable?: boolean
}) {
  const texto = valor && String(valor).trim() ? String(valor) : null
  return (
    <div className="border-b border-ink-100 py-2.5 first:pt-0 last:border-0 last:pb-0">
      <dt className="text-xs tracking-wide text-ink-500 uppercase">{etiqueta}</dt>
      <dd
        className={
          'mt-0.5 ' +
          (texto ? (destacado ? 'text-base font-semibold text-ink-950' : 'text-sm text-ink-800') : 'text-sm text-ink-400') +
          (copiable ? ' font-mono text-[13px] break-all' : '')
        }
      >
        {texto ?? '—'}
      </dd>
    </div>
  )
}

function Renglon({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between py-1 text-sm">
      <span className="text-ink-600">{etiqueta}</span>
      <span className="tabular-nums text-ink-800">{valor}</span>
    </div>
  )
}
