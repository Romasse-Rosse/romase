'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Lock,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react'
import { submitCheckout, type CheckoutState } from '@/app/checkout/actions'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { site, whatsappUrl } from '@/lib/site'
import { cn } from '@/lib/cn'
import { WhatsAppIcon } from './site-header'

const estadoInicial: CheckoutState = { status: 'idle' }

export function CheckoutForm() {
  const { items, subtotal, count, ready, clear } = useCart()
  const [state, formAction] = useActionState(submitCheckout, estadoInicial)
  const [entrega, setEntrega] = useState<'retiro' | 'despacho'>('retiro')
  const [documento, setDocumento] = useState<'boleta' | 'factura'>('boleta')

  // Se guarda una copia para poder mostrar el resumen en la confirmación,
  // después de haber vaciado el carrito.
  const [confirmado, setConfirmado] = useState<{ total: number; unidades: number } | null>(null)

  useEffect(() => {
    if (state.status === 'ok' && !confirmado) {
      setConfirmado({ total: subtotal, unidades: count })
      clear()
    }
  }, [state.status, confirmado, subtotal, count, clear])

  if (state.status === 'ok' && confirmado) {
    return <Confirmacion state={state} resumen={confirmado} />
  }

  if (!ready) {
    return <div className="h-96 animate-pulse rounded-sm bg-ink-50" />
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-ink-300 px-6 py-16 text-center">
        <ShoppingBag aria-hidden="true" className="mx-auto size-10 text-ink-300" />
        <h2 className="mt-4 text-lg font-medium text-ink-900">Tu carrito está vacío</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
          Agrega productos al carrito para poder finalizar un pedido.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Ver el catálogo
        </Link>
      </div>
    )
  }

  const detalleWhatsApp =
    `Hola ROMASE, quiero hacer este pedido:\n\n` +
    items.map((i) => `· ${i.quantity} × ${i.name} — ${formatPrice(i.price * i.quantity)}`).join('\n') +
    `\n\nTotal: ${formatPrice(subtotal)}`

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14" noValidate>
      {/* Las líneas viajan como ids y cantidades: el precio lo pone el servidor. */}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items.map((i) => ({ id: i.id, quantity: i.quantity })))}
      />
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website">No completar</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-10">
        {state.status === 'error' && state.message && (
          <p
            role="alert"
            className="flex items-start gap-2.5 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              {state.message}
              {!state.fieldErrors && (
                <>
                  {' '}
                  <a
                    href={whatsappUrl(detalleWhatsApp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    Enviar el pedido por WhatsApp
                  </a>
                  .
                </>
              )}
            </span>
          </p>
        )}

        <Seccion numero={1} titulo="Tus datos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre y apellido" name="nombre" required autoComplete="name" error={state.fieldErrors?.nombre} />
            <Campo label="Teléfono" name="telefono" type="tel" required autoComplete="tel" error={state.fieldErrors?.telefono} />
            <Campo label="Correo electrónico" name="email" type="email" required autoComplete="email" error={state.fieldErrors?.email} className="sm:col-span-2" />
          </div>
        </Seccion>

        <Seccion numero={2} titulo="Documento">
          <div className="grid gap-3 sm:grid-cols-2">
            <Opcion
              name="documento"
              value="boleta"
              checked={documento === 'boleta'}
              onChange={() => setDocumento('boleta')}
              titulo="Boleta"
              detalle="Para compras personales."
            />
            <Opcion
              name="documento"
              value="factura"
              checked={documento === 'factura'}
              onChange={() => setDocumento('factura')}
              titulo="Factura"
              detalle="Para empresas con RUT."
            />
          </div>

          {documento === 'factura' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Campo label="RUT" name="rut" required placeholder="76.543.210-K" error={state.fieldErrors?.rut} />
              <Campo label="Razón social" name="razonSocial" required error={state.fieldErrors?.razonSocial} />
            </div>
          )}
        </Seccion>

        <Seccion numero={3} titulo="Entrega">
          <div className="grid gap-3 sm:grid-cols-2">
            <Opcion
              name="entrega"
              value="retiro"
              checked={entrega === 'retiro'}
              onChange={() => setEntrega('retiro')}
              icono={Store}
              titulo="Retiro en el local"
              detalle={`${site.contact.address}, ${site.contact.city}. Sin costo.`}
            />
            <Opcion
              name="entrega"
              value="despacho"
              checked={entrega === 'despacho'}
              onChange={() => setEntrega('despacho')}
              icono={Truck}
              titulo="Despacho"
              detalle="A todo Chile. El flete se cotiza según volumen y destino."
            />
          </div>

          {entrega === 'despacho' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Campo label="Dirección" name="direccion" required autoComplete="street-address" error={state.fieldErrors?.direccion} className="sm:col-span-2" />
              <Campo label="Comuna" name="comuna" required error={state.fieldErrors?.comuna} />
              <Campo label="Región" name="region" defaultValue="Los Lagos" />
            </div>
          )}
        </Seccion>

        <Seccion numero={4} titulo="Pago">
          {/* Bloque preparado para Webpay Plus. Hoy el pedido se confirma y se
              coordina el pago; cuando entre la integración, este es el lugar. */}
          <div className="border border-ink-200">
            <div className="flex items-start gap-4 border-b border-ink-100 p-5">
              <CreditCard aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-500" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink-950">Webpay Plus</p>
                  <span className="rounded-sm bg-ink-100 px-2 py-0.5 text-[11px] font-medium tracking-wide text-ink-600 uppercase">
                    Próximamente
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                  Tarjetas de crédito y débito a través de Transbank. La integración está en
                  curso.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-ink-50 p-5">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium text-ink-950">Coordinamos el pago contigo</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                  Al confirmar, tu pedido queda reservado y te contactamos el mismo día hábil
                  para cerrar el pago —transferencia o tarjeta en el local— y la entrega.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="notas" className="mb-1.5 block text-sm font-medium text-ink-800">
              Notas del pedido <span className="font-normal text-ink-500">(opcional)</span>
            </label>
            <textarea
              id="notas"
              name="notas"
              rows={3}
              placeholder="Horario de entrega, referencias de la dirección, dudas sobre los equipos…"
              className="w-full rounded-sm border border-ink-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink-900 transition-colors placeholder:text-ink-400 focus:border-ink-950 focus:outline-none"
            />
          </div>
        </Seccion>
      </div>

      <aside className="lg:sticky lg:top-40 lg:self-start">
        <div className="border border-ink-200 p-6">
          <h2 className="text-base font-medium text-ink-950">Tu pedido</h2>

          <ul className="mt-5 space-y-4 border-b border-ink-100 pb-5">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="relative size-14 shrink-0 border border-ink-200 bg-white">
                  {item.image && (
                    <Image src={item.image} alt="" fill sizes="56px" className="object-contain p-1" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-snug text-ink-900">{item.name}</span>
                  <span className="text-xs text-ink-500">
                    {item.quantity} × {formatPrice(item.price)}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] font-medium text-ink-950">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="font-medium text-ink-950">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Despacho</dt>
              <dd className="text-ink-500">
                {entrega === 'retiro' ? 'Retiro sin costo' : 'A cotizar'}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-ink-200 pt-5">
            <span className="font-medium text-ink-950">Total</span>
            <span className="text-2xl font-semibold text-ink-950">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-500">IVA incluido</p>

          <BotonConfirmar />

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
            <Lock aria-hidden="true" className="size-3.5" />
            Tus datos solo se usan para procesar el pedido.
          </p>

          <a
            href={whatsappUrl(detalleWhatsApp)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex h-11 items-center justify-center gap-2 rounded-sm border border-ink-300 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
          >
            <WhatsAppIcon className="size-4" />
            Prefiero pedirlo por WhatsApp
          </a>
        </div>
      </aside>
    </form>
  )
}

function BotonConfirmar() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-sm bg-brand-500 text-[15px] font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Confirmando…' : 'Confirmar pedido'}
    </button>
  )
}

function Confirmacion({
  state,
  resumen,
}: {
  state: CheckoutState
  resumen: { total: number; unidades: number }
}) {
  return (
    <div className="mx-auto max-w-xl py-8 text-center">
      <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-emerald-600" />
      <h1 className="mt-5 text-3xl font-medium tracking-tight text-ink-950">
        ¡Pedido recibido!
      </h1>

      {state.orderNumber && (
        <p className="mt-3 text-ink-600">
          Tu número de pedido es{' '}
          <strong className="font-semibold text-ink-950">#{state.orderNumber}</strong>. Anótalo
          para cualquier consulta.
        </p>
      )}

      <dl className="mx-auto mt-8 max-w-sm border border-ink-200 text-left text-sm">
        <div className="flex justify-between border-b border-ink-100 px-5 py-3.5">
          <dt className="text-ink-600">Productos</dt>
          <dd className="font-medium text-ink-950">
            {resumen.unidades} {resumen.unidades === 1 ? 'unidad' : 'unidades'}
          </dd>
        </div>
        <div className="flex justify-between px-5 py-3.5">
          <dt className="text-ink-600">Total</dt>
          <dd className="font-semibold text-ink-950">{formatPrice(resumen.total)}</dd>
        </div>
      </dl>

      <p className="mx-auto mt-8 max-w-md leading-relaxed text-ink-600">
        Te enviamos una copia a tu correo. Te contactamos el mismo día hábil para coordinar el
        pago y la entrega. Si lo necesitas antes, escríbenos por WhatsApp.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/productos"
          className="inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Seguir comprando
        </Link>
        <a
          href={whatsappUrl(
            `Hola ROMASE, consulto por mi pedido${state.orderNumber ? ` #${state.orderNumber}` : ''}.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-ink-300 px-6 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
        >
          <WhatsAppIcon className="size-4" />
          Escribir por WhatsApp
        </a>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// Piezas del formulario
// ------------------------------------------------------------

function Seccion({
  numero,
  titulo,
  children,
}: {
  numero: number
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-3 text-base font-medium text-ink-950">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-950 text-xs font-semibold text-white">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Opcion({
  name,
  value,
  checked,
  onChange,
  titulo,
  detalle,
  icono: Icono,
}: {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  titulo: string
  detalle: string
  icono?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 border p-4 transition-colors',
        checked ? 'border-ink-950 bg-ink-50' : 'border-ink-200 hover:border-ink-400',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 shrink-0 accent-brand-500"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium text-ink-950">
          {Icono && <Icono aria-hidden className="size-4 text-brand-500" />}
          {titulo}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-600">{detalle}</span>
      </span>
    </label>
  )
}

function Campo({
  label,
  name,
  type = 'text',
  required,
  autoComplete,
  placeholder,
  defaultValue,
  error,
  className,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
  defaultValue?: string
  error?: string
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
        {required && <span className="ml-0.5 text-brand-600">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(
          'h-11 w-full rounded-sm border bg-white px-3.5 text-sm text-ink-900 transition-colors placeholder:text-ink-400 focus:outline-none',
          error ? 'border-red-400 focus:border-red-500' : 'border-ink-200 focus:border-ink-950',
        )}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
