'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2, Lock, ShoppingBag, Store, Truck } from 'lucide-react'
import { submitCheckout, type CheckoutState } from '@/app/(tienda)/checkout/actions'
import { addPaymentInfo, addShippingInfo, beginCheckout, purchase } from '@/lib/analytics'
import { aItemDeCarrito, useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { regionesVenta, site } from '@/lib/site'
import { cn } from '@/lib/cn'

const estadoInicial: CheckoutState = { status: 'idle' }

export function CheckoutForm({
  /** ¿Se cobra en línea? Lo decide el servidor: ver pagoEnLineaActivo(). */
  pagoEnLinea,
  /** Con Webpay en integración se avisa en pantalla que no hay cargo real. */
  ambientePrueba,
}: {
  pagoEnLinea: boolean
  ambientePrueba: boolean
}) {
  const { items, subtotal, count, ready, clear } = useCart()
  const [state, formAction] = useActionState(submitCheckout, estadoInicial)

  // Los campos van controlados a propósito: React 19 resetea los inputs no
  // controlados cuando termina una acción de formulario, y si la validación
  // del servidor falla eso le borraría al cliente todo lo que escribió.
  const [valores, setValores] = useState<Record<string, string>>({
    nombre: '',
    apellidos: '',
    direccion: '',
    comuna: '',
    region: site.contact.region,
    telefono: '',
    email: '',
    rut: '',
    razonSocial: '',
    envioDireccion: '',
    envioComuna: '',
    envioRegion: site.contact.region,
    notas: '',
  })
  const campo = (name: string) => ({
    value: valores[name] ?? '',
    onChange: (v: string) => setValores((prev) => ({ ...prev, [name]: v })),
  })

  const [entrega, setEntrega] = useState<'retiro' | 'despacho'>('despacho')
  const [documento, setDocumento] = useState<'boleta' | 'factura'>('boleta')
  const [transportista, setTransportista] = useState<string>('')
  const [otraDireccion, setOtraDireccion] = useState(false)

  // Copia para poder mostrar el resumen en la confirmación, ya vaciado el carrito.
  const [confirmado, setConfirmado] = useState<{ total: number; unidades: number } | null>(null)

  // ------------------------------------------------------------
  // Embudo de analítica
  //
  // Las líneas se leen desde una referencia: los eventos se disparan por un
  // cambio de paso, no cada vez que se vuelve a dibujar el formulario.
  // ------------------------------------------------------------
  const lineas = useRef(items)
  lineas.current = items
  const enGa4 = () => lineas.current.map((i) => aItemDeCarrito(i, i.quantity))

  const inicioEnviado = useRef(false)
  useEffect(() => {
    if (!ready || inicioEnviado.current || lineas.current.length === 0) return
    inicioEnviado.current = true
    beginCheckout(enGa4())
  }, [ready])

  useEffect(() => {
    if (!ready || lineas.current.length === 0) return
    const modo =
      entrega === 'retiro'
        ? 'Retiro en tienda'
        : transportista
          ? `Despacho · ${transportista}`
          : 'Despacho a domicilio'
    addShippingInfo(enGa4(), modo)
  }, [ready, entrega, transportista])

  // Con Webpay: se manda al comprador a Transbank con un POST. Tiene que ser
  // POST y el campo tiene que llamarse token_ws — así lo define Transbank.
  // El carrito NO se vacía acá: si el pago se rechaza hay que poder reintentar.
  const enviadoAWebpay = useRef(false)
  useEffect(() => {
    if (state.status !== 'pagar' || !state.webpay || enviadoAWebpay.current) return
    enviadoAWebpay.current = true

    const formulario = document.createElement('form')
    formulario.method = 'POST'
    formulario.action = state.webpay.url
    const campo = document.createElement('input')
    campo.type = 'hidden'
    campo.name = 'token_ws'
    campo.value = state.webpay.token
    formulario.appendChild(campo)
    document.body.appendChild(formulario)
    formulario.submit()
  }, [state.status, state.webpay])

  // ------------------------------------------------------------
  // React 19 hace form.reset() al terminar una acción de formulario, y eso
  // pisa los controles que no son de texto.
  //
  // Los campos de texto se salvan porque están controlados y cualquier tecla
  // provoca un renderizado que vuelve a escribir el valor. El <select> y los
  // radios no: el estado de React sigue diciendo «factura» y «Magallanes»
  // mientras el DOM volvió a «boleta» y a la primera región de la lista.
  //
  // Eso no es un detalle estético: **el formulario manda lo que dice el DOM**.
  // Después de un rechazo de validación, quien compraba con factura terminaba
  // enviando boleta, y quien elegía su región enviaba Arica y Parinacota, sin
  // ver nada raro en pantalla.
  //
  // Se vuelve a escribir el DOM desde el estado cuando la acción termina.
  // ------------------------------------------------------------
  useEffect(() => {
    if (state.status === 'idle') return

    const select = (id: string, valor: string) => {
      const el = document.getElementById(id) as HTMLSelectElement | null
      if (el && valor && el.value !== valor) el.value = valor
    }
    const marcar = (name: string, valor: string) => {
      for (const el of document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) {
        el.checked = el.value === valor
      }
    }

    select('region', valores.region)
    select('envioRegion', valores.envioRegion)
    marcar('documento', documento)
    marcar('entrega', entrega)
    if (transportista) marcar('transportista', transportista)

    const casilla = document.querySelector<HTMLInputElement>('input[name="otraDireccion"]')
    if (casilla) casilla.checked = otraDireccion
  }, [state, valores.region, valores.envioRegion, documento, entrega, transportista, otraDireccion])

  useEffect(() => {
    if (state.status === 'ok' && !confirmado) {
      purchase(enGa4(), {
        transactionId: state.orderNumber ? String(state.orderNumber) : 'sin-numero',
      })
      setConfirmado({ total: subtotal, unidades: count })
      clear()
    }
  }, [state.status, state.orderNumber, confirmado, subtotal, count, clear])

  if (state.status === 'pagar') {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto size-10 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
        <h2 className="mt-6 text-lg font-medium text-ink-950">Te estamos llevando a Webpay</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600">
          El pago se hace en el sitio seguro de Transbank. Si no avanza en unos segundos,
          revisa que el navegador no esté bloqueando la redirección.
        </p>
      </div>
    )
  }

  if (state.status === 'ok' && confirmado) {
    return <Confirmacion state={state} resumen={confirmado} />
  }

  if (!ready) return <div className="h-96 animate-pulse rounded-sm bg-ink-50" />

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-ink-300 px-6 py-16 text-center">
        <ShoppingBag aria-hidden="true" className="mx-auto size-10 text-ink-300" />
        <h2 className="mt-4 text-lg font-medium text-ink-900">Tu carrito está vacío</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
          Agrega productos al carrito para poder finalizar un pedido.
        </p>
        <Link
          href="/#categorias"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Ver las categorías
        </Link>
      </div>
    )
  }

  return (
    <form
      action={formAction}
      // El medio de pago hoy es uno solo: el evento se manda al enviar.
      onSubmit={() => addPaymentInfo(enGa4(), 'Webpay Plus')}
      className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14"
      noValidate
    >
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

      <div className="space-y-11">
        {state.status === 'error' && state.message && (
          <p
            role="alert"
            className="flex items-start gap-2.5 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{state.message}</span>
          </p>
        )}

        {/* ------------------------------------------------------------
            1 · Facturación
        ------------------------------------------------------------ */}
        <Seccion numero={1} titulo="Detalles de facturación">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre" name="nombre" {...campo('nombre')} required autoComplete="given-name" error={state.fieldErrors?.nombre} />
            <Campo label="Apellidos" name="apellidos" {...campo('apellidos')} required autoComplete="family-name" error={state.fieldErrors?.apellidos} />

            <Campo
              label="Dirección de la calle"
              name="direccion" {...campo('direccion')}
              required
              autoComplete="street-address"
              placeholder="Nombre de la calle y número de la casa"
              error={state.fieldErrors?.direccion}
              className="sm:col-span-2"
            />

            <Campo label="Comuna / Ciudad" name="comuna" {...campo('comuna')} required autoComplete="address-level2" error={state.fieldErrors?.comuna} />

            <div>
              <label htmlFor="region" className="mb-1.5 block text-sm font-medium text-ink-800">
                Región <span className="text-brand-600">*</span>
              </label>
              <select
                id="region"
                name="region"
                value={valores.region}
                onChange={(e) => setValores((p) => ({ ...p, region: e.target.value }))}
                className="h-11 w-full rounded-sm border border-ink-200 bg-white px-3 text-sm text-ink-900 transition-colors focus:border-ink-950 focus:outline-none"
              >
                {regionesVenta.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {/* El servidor comprueba la cobertura, así que su respuesta tiene
                  que poder verse: si no, el comprador lee «faltan datos» y no
                  sabe cuál. */}
              {state.fieldErrors?.region && (
                <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.region}</p>
              )}
            </div>

            <Campo label="Teléfono" name="telefono" {...campo('telefono')} type="tel" required autoComplete="tel" error={state.fieldErrors?.telefono} />
            <Campo label="Correo electrónico" name="email" {...campo('email')} type="email" required autoComplete="email" error={state.fieldErrors?.email} />
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-ink-800">Documento</p>
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
                <Campo label="RUT" name="rut" {...campo('rut')} required placeholder="76.543.210-K" error={state.fieldErrors?.rut} />
                <Campo label="Razón social" name="razonSocial" {...campo('razonSocial')} required error={state.fieldErrors?.razonSocial} />
              </div>
            )}
          </div>
        </Seccion>

        {/* ------------------------------------------------------------
            2 · Entrega
        ------------------------------------------------------------ */}
        <Seccion numero={2} titulo="Entrega">
          <div className="grid gap-3 sm:grid-cols-2">
            <Opcion
              name="entrega"
              value="despacho"
              checked={entrega === 'despacho'}
              onChange={() => setEntrega('despacho')}
              icono={Truck}
              titulo="Despacho"
              detalle="A Los Lagos, Aysén y Magallanes, con el transporte que elijas. Envío por pagar."
            />
            <Opcion
              name="entrega"
              value="retiro"
              checked={entrega === 'retiro'}
              onChange={() => setEntrega('retiro')}
              icono={Store}
              titulo="Retiro en el local"
              detalle={`${site.contact.address}, ${site.contact.city}. Sin costo de envío.`}
            />
          </div>

          {entrega === 'despacho' && (
            <div className="mt-6">
              <p className="mb-1 text-sm font-medium text-ink-800">
                Empresa despachadora <span className="text-brand-600">*</span>
              </p>
              <p className="mb-3 text-xs text-ink-500">Elige una.</p>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {site.carriers.map((c) => (
                  <Opcion
                    key={c.id}
                    name="transportista"
                    value={c.id}
                    checked={transportista === c.id}
                    onChange={() => setTransportista(c.id)}
                    titulo={c.name}
                  />
                ))}
              </div>
              {state.fieldErrors?.transportista && (
                <p className="mt-2 text-xs text-red-600">{state.fieldErrors.transportista}</p>
              )}

              <p className="mt-4 border-l-2 border-brand-300 pl-4 text-sm leading-relaxed text-ink-600">
                El envío va <strong className="font-semibold text-ink-800">por pagar</strong>: el
                flete lo pagas al retirar en la empresa de transporte que elijas, según el volumen
                y el destino. Un asesor te contacta para coordinar el despacho, así que revisa que
                tu número telefónico esté bien escrito para evitar demoras.
              </p>

              <label className="mt-6 flex cursor-pointer items-center gap-2.5 text-sm text-ink-800">
                <input
                  type="checkbox"
                  name="otraDireccion"
                  checked={otraDireccion}
                  onChange={(e) => setOtraDireccion(e.target.checked)}
                  className="size-4 rounded-sm border-ink-300 accent-brand-500"
                />
                ¿Enviar a una dirección diferente?
              </label>

              {otraDireccion && (
                <div className="mt-4 grid gap-4 border border-ink-200 bg-ink-50 p-5 sm:grid-cols-2">
                  <Campo
                    label="Dirección de envío"
                    name="envioDireccion" {...campo('envioDireccion')}
                    required
                    placeholder="Nombre de la calle y número"
                    error={state.fieldErrors?.envioDireccion}
                    className="sm:col-span-2"
                  />
                  <Campo label="Comuna / Ciudad" name="envioComuna" {...campo('envioComuna')} required error={state.fieldErrors?.envioComuna} />
                  <div>
                    <label htmlFor="envioRegion" className="mb-1.5 block text-sm font-medium text-ink-800">
                      Región
                    </label>
                    <select
                      id="envioRegion"
                      name="envioRegion"
                      value={valores.envioRegion}
                      onChange={(e) => setValores((p) => ({ ...p, envioRegion: e.target.value }))}
                      className="h-11 w-full rounded-sm border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-ink-950 focus:outline-none"
                    >
                      {regionesVenta.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {state.fieldErrors?.envioRegion && (
                      <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.envioRegion}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Seccion>

        {/* ------------------------------------------------------------
            3 · Pago
        ------------------------------------------------------------ */}
        <Seccion numero={3} titulo="Pago">
          {/* El texto lo decide el servidor con la misma función que usa la
              acción que abre la transacción. Si se decidiera acá por separado,
              la pantalla podría prometer un pago que el servidor no va a hacer
              —que es justo lo que pasaba mientras decía «próximamente» con la
              integración ya funcionando—. */}
          <div className="border border-ink-200">
            <div className="flex items-start gap-4 p-5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 shrink-0 items-center rounded-sm bg-[#4b2e83] px-2 text-[11px] font-bold tracking-tight text-white"
              >
                webpay
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink-950">Webpay Plus</p>
                  {pagoEnLinea && ambientePrueba && (
                    <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-[11px] font-medium tracking-wide text-amber-800 uppercase">
                      Ambiente de prueba
                    </span>
                  )}
                  {!pagoEnLinea && (
                    <span className="rounded-sm bg-ink-100 px-2 py-0.5 text-[11px] font-medium tracking-wide text-ink-600 uppercase">
                      Próximamente
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                  {pagoEnLinea
                    ? 'Al realizar el pedido pasas al sitio seguro de Transbank para pagar con ' +
                      'tarjeta de crédito, débito o prepago. Los datos de tu tarjeta se ' +
                      'ingresan allá; este sitio no los recibe ni los guarda.'
                    : 'Permite el pago con tarjetas de crédito, débito y prepago a través de ' +
                      'Transbank. La integración está en curso.'}
                </p>
                {pagoEnLinea && ambientePrueba && (
                  <p className="mt-2 text-sm leading-relaxed text-amber-800">
                    Está conectado al ambiente de prueba de Transbank: no se hace ningún cargo
                    real. Solo funcionan las tarjetas de prueba.
                  </p>
                )}
              </div>
            </div>

            {!pagoEnLinea && (
              <div className="flex items-start gap-4 border-t border-ink-100 bg-ink-50 p-5">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-emerald-600"
                />
                <div>
                  <p className="font-medium text-ink-950">Coordinamos el pago contigo</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                    Al realizar el pedido queda reservado y te contactamos el mismo día hábil
                    para cerrar el pago —transferencia o tarjeta en el local— y la entrega.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <label htmlFor="notas" className="mb-1.5 block text-sm font-medium text-ink-800">
              Notas del pedido <span className="font-normal text-ink-500">(opcional)</span>
            </label>
            <textarea
              id="notas"
              name="notas"
              rows={3}
              value={valores.notas}
              onChange={(e) => setValores((p) => ({ ...p, notas: e.target.value }))}
              placeholder="Notas sobre tu pedido, por ejemplo, indicaciones especiales para la entrega."
              className="w-full rounded-sm border border-ink-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink-900 transition-colors placeholder:text-ink-400 focus:border-ink-950 focus:outline-none"
            />
          </div>
        </Seccion>
      </div>

      {/* ------------------------------------------------------------
          Resumen
      ------------------------------------------------------------ */}
      <aside className="lg:sticky lg:top-40 lg:self-start">
        <div className="border border-ink-200 p-6">
          <h2 className="text-base font-medium text-ink-950">Tu pedido</h2>

          <div className="mt-5 flex justify-between border-b-2 border-ink-950 pb-2 text-xs font-medium tracking-wide text-ink-500 uppercase">
            <span>Producto</span>
            <span>Subtotal</span>
          </div>

          <ul className="divide-y divide-ink-100">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 py-4">
                <span className="relative size-14 shrink-0 border border-ink-200 bg-white">
                  {item.image && (
                    <Image src={item.image} alt="" fill sizes="56px" className="object-contain p-1" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-snug font-semibold text-ink-900">
                    {item.name}
                  </span>
                  <span className="text-xs text-ink-500">× {item.quantity}</span>
                </span>
                <span className="shrink-0 text-[13px] font-medium text-ink-950">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-3 border-t border-ink-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="font-medium text-ink-950">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-ink-600">Envío</dt>
              <dd className="text-right text-ink-500">
                {entrega === 'retiro'
                  ? 'Retiras en el local'
                  : transportista
                    ? `${site.carriers.find((c) => c.id === transportista)?.name} · por pagar`
                    : 'Elige la empresa despachadora'}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-ink-200 pt-4">
            <span className="font-medium text-ink-950">Total</span>
            <span className="text-2xl font-semibold text-ink-950">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            IVA incluido.{' '}
            {entrega === 'retiro'
              ? 'Retiras en el local, sin costo de envío.'
              : 'El flete no va en este total: se paga al transporte al recibir.'}
          </p>

          <BotonPedido etiqueta={pagoEnLinea ? 'Ir a pagar' : 'Realizar el pedido'} />

          <p className="mt-4 text-xs leading-relaxed text-ink-500">
            Tus datos personales se usan para procesar tu pedido y mejorar tu experiencia en
            esta web, según se describe en nuestra{' '}
            <Link href="/politica-de-privacidad" className="text-brand-700 underline">
              política de privacidad
            </Link>
            .
          </p>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
            <Lock aria-hidden="true" className="size-3.5" />
            Conexión segura
          </p>
        </div>
      </aside>
    </form>
  )
}

function BotonPedido({ etiqueta }: { etiqueta: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 flex h-13 w-full items-center justify-center rounded-sm bg-brand-500 text-[15px] font-medium tracking-wide text-white uppercase transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Procesando…' : etiqueta}
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
      <h1 className="mt-5 text-3xl font-medium tracking-tight text-ink-950">¡Pedido recibido!</h1>

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

      {/*
        No dice «te enviamos una copia a tu correo»: el correo del pedido va al
        negocio, con el cliente en reply_to. El cliente no recibe nada, y
        prometerle un correo que no llega lo deja esperando en vez de llamar.
      */}
      <p className="mx-auto mt-8 max-w-md leading-relaxed text-ink-600">
        Un asesor te contacta el mismo día hábil para coordinar el transporte, el pago y la
        entrega. Si necesitas apurarlo, escríbenos por WhatsApp con tu número de pedido.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/#categorias"
          className="inline-flex h-11 items-center justify-center rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Seguir comprando
        </Link>
        <Link
          href="/contacto"
          className="inline-flex h-11 items-center justify-center rounded-sm border border-ink-300 px-6 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950"
        >
          Consultar por el pedido
        </Link>
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
      <h2 className="mb-5 flex items-center gap-3 border-b border-ink-200 pb-3 text-lg font-medium text-ink-950">
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
  detalle?: string
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
        {detalle && (
          <span className="mt-1 block text-xs leading-relaxed text-ink-600">{detalle}</span>
        )}
      </span>
    </label>
  )
}

function Campo({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required,
  autoComplete,
  placeholder,
  error,
  className,
}: {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
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
