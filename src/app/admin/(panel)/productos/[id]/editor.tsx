'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { guardarProducto, type EstadoGuardado } from './acciones'
import { formatPrice } from '@/lib/format'

const inicial: EstadoGuardado = {}

export type ProductoEditable = {
  id: number
  name: string
  slug: string
  sku: string
  shortDescription: string
  description: string
  price: string
  regularPrice: string
  salePrice: string
  inStock: boolean
  featured: boolean
}

export function EditorProducto({
  producto,
  puedeEscribir,
  nombreEnLaTienda,
}: {
  producto: ProductoEditable
  puedeEscribir: boolean
  nombreEnLaTienda: string
}) {
  const [estado, accion] = useActionState(guardarProducto, inicial)

  // El precio se muestra formateado mientras se escribe: un cero de más en
  // 1290000 es invisible, y en $12.900.000 salta a la vista.
  const [precio, setPrecio] = useState(producto.price)
  const [oferta, setOferta] = useState(producto.salePrice)
  const [normal, setNormal] = useState(producto.regularPrice)

  const soloDigitos = (v: string) => v.replace(/[^\d]/g, '')
  const enPesos = (v: string) => (v ? formatPrice(Number(v)) : '—')

  const hayOferta = oferta !== '' && normal !== '' && Number(oferta) < Number(normal)

  return (
    <form action={accion} className="border border-ink-200 bg-white p-6">
      <input type="hidden" name="id" value={producto.id} />
      <input type="hidden" name="slug" value={producto.slug} />

      {estado.error && (
        <p
          role="alert"
          className="mb-5 flex gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p className="mb-5 flex gap-2 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {estado.ok}
        </p>
      )}

      <Campo etiqueta="Nombre" htmlFor="name">
        <input
          id="name"
          name="name"
          defaultValue={producto.name}
          disabled={!puedeEscribir}
          required
          className={entrada}
        />
        {/*
          El nombre se guarda como está escrito y la tienda lo normaliza al
          mostrarlo: capitaliza y corrige tildes con el diccionario del
          catálogo. Sin este aviso, el cliente ve una diferencia entre lo que
          escribió y lo que aparece y cree que el panel le cambió el texto.
        */}
        <p className="mt-1.5 text-xs text-ink-500">
          En la tienda se muestra como <strong className="text-ink-700">{nombreEnLaTienda}</strong>:
          se capitaliza y se corrigen las tildes automáticamente.
        </p>
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="SKU" htmlFor="sku">
          <input
            id="sku"
            name="sku"
            defaultValue={producto.sku}
            disabled={!puedeEscribir}
            className={entrada}
          />
        </Campo>

        <Campo etiqueta="Dirección en la web" htmlFor="slug-visible">
          <input id="slug-visible" value={`/productos/${producto.slug}`} disabled readOnly className={entrada} />
          {/*
            No se edita a propósito. Cambiar el slug cambia la URL: la anterior
            queda dando 404, se pierde el posicionamiento que haya juntado y
            cualquier enlace compartido deja de funcionar. Si hay que cambiarla,
            se hace junto con una redirección.
          */}
          <p className="mt-1.5 text-xs text-ink-500">
            No se edita: cambiarla rompe los enlaces y el posicionamiento de esa página.
          </p>
        </Campo>
      </div>

      <div className="mt-2 grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Precio de venta" htmlFor="price">
          <input
            id="price"
            name="price"
            inputMode="numeric"
            value={precio}
            onChange={(e) => setPrecio(soloDigitos(e.target.value))}
            disabled={!puedeEscribir}
            required
            className={entrada}
          />
          <p className="mt-1.5 text-xs font-medium text-ink-700">{enPesos(precio)}</p>
        </Campo>

        <Campo etiqueta="Precio normal" htmlFor="regular_price">
          <input
            id="regular_price"
            name="regular_price"
            inputMode="numeric"
            value={normal}
            onChange={(e) => setNormal(soloDigitos(e.target.value))}
            disabled={!puedeEscribir}
            className={entrada}
          />
          <p className="mt-1.5 text-xs text-ink-500">{enPesos(normal)}</p>
        </Campo>

        <Campo etiqueta="Precio de oferta" htmlFor="sale_price">
          <input
            id="sale_price"
            name="sale_price"
            inputMode="numeric"
            value={oferta}
            onChange={(e) => setOferta(soloDigitos(e.target.value))}
            disabled={!puedeEscribir}
            className={entrada}
          />
          <p className="mt-1.5 text-xs text-ink-500">
            {oferta ? enPesos(oferta) : 'Vacío: sin oferta'}
          </p>
        </Campo>
      </div>

      {hayOferta && (
        <p className="mt-1 text-xs text-brand-700">
          La ficha va a mostrar {enPesos(oferta)} con {enPesos(normal)} tachado al lado.
        </p>
      )}

      <div className="mt-6 space-y-3 border-y border-ink-100 py-5">
        <Casilla
          name="in_stock"
          defaultChecked={producto.inStock}
          disabled={!puedeEscribir}
          titulo="Disponible para comprar"
          detalle="Sin esto, la ficha sigue visible pero no se puede agregar al carrito."
        />
        <Casilla
          name="featured"
          defaultChecked={producto.featured}
          disabled={!puedeEscribir}
          titulo="Destacado en la portada"
          detalle="Los destacados salen en el carrusel de la home. Si no hay ninguno marcado, la portada elige sola."
        />
      </div>

      <Campo etiqueta="Descripción corta" htmlFor="short_description">
        <textarea
          id="short_description"
          name="short_description"
          rows={3}
          defaultValue={producto.shortDescription}
          disabled={!puedeEscribir}
          className={entrada}
        />
        <p className="mt-1.5 text-xs text-ink-500">
          Es lo primero que se lee en la ficha, arriba del botón de comprar.
        </p>
      </Campo>

      <Campo etiqueta="Descripción completa" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={10}
          defaultValue={producto.description}
          disabled={!puedeEscribir}
          className={entrada}
        />
        <p className="mt-1.5 text-xs text-ink-500">
          Acepta HTML sencillo: párrafos, listas y negritas. Es lo que vino del sitio anterior.
        </p>
      </Campo>

      {puedeEscribir && <Boton />}
    </form>
  )
}

const entrada =
  'w-full rounded-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-ink-950 focus:outline-none disabled:bg-ink-50 disabled:text-ink-500'

function Campo({
  etiqueta,
  htmlFor,
  children,
}: {
  etiqueta: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-800">
        {etiqueta}
      </label>
      {children}
    </div>
  )
}

function Casilla({
  name,
  defaultChecked,
  disabled,
  titulo,
  detalle,
}: {
  name: string
  defaultChecked: boolean
  disabled: boolean
  titulo: string
  detalle: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-0.5 size-4 rounded-sm border-ink-300 accent-brand-500"
      />
      <span>
        <span className="block text-sm font-medium text-ink-900">{titulo}</span>
        <span className="block text-xs text-ink-500">{detalle}</span>
      </span>
    </label>
  )
}

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-11 rounded-sm bg-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </button>
  )
}
