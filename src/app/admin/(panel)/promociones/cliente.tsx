'use client'

import { useActionState, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2, Tag } from 'lucide-react'
import {
  cambiarEstadoPromocion,
  crearPromocion,
  terminarAhora,
  type EstadoPromo,
} from './acciones'
import { cn } from '@/lib/cn'

const inicial: EstadoPromo = {}

type Opcion = { id: number; etiqueta: string }

export type PromocionEnPanel = {
  id: number
  alcance: 'producto' | 'categoria'
  porcentaje: number
  etiqueta: string | null
  desde: number
  hasta: number | null
  activa: boolean
  estado: 'programada' | 'vigente' | 'vencida' | 'apagada'
  objetivo: string
  cuantosProductos: number
}

const COLOR_ESTADO = {
  vigente: 'bg-emerald-50 text-emerald-700',
  programada: 'bg-blue-50 text-blue-700',
  vencida: 'bg-ink-100 text-ink-600',
  apagada: 'bg-ink-100 text-ink-500',
} as const

const fecha = (ms: number) =>
  new Date(ms).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

export function ListaDePromociones({
  promociones,
  puedeEscribir,
  error,
}: {
  promociones: PromocionEnPanel[]
  puedeEscribir: boolean
  error?: string
}) {
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null)
  const [pendiente, transicion] = useTransition()

  const correr = (accion: () => Promise<EstadoPromo>) => {
    transicion(async () => {
      const r = await accion()
      if (r.error) setAviso({ texto: r.error, error: true })
      else if (r.ok) setAviso({ texto: r.ok })
    })
  }

  return (
    <div>
      {(error || aviso) && (
        <p
          role="alert"
          className={cn(
            'mb-4 flex gap-2 border p-3 text-sm',
            error || aviso?.error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          )}
        >
          {(error || aviso?.error) && (
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )}
          {error ?? aviso?.texto}
        </p>
      )}

      {promociones.length === 0 ? (
        <p className="border border-dashed border-ink-300 p-10 text-center text-sm text-ink-500">
          Todavía no hay promociones.
        </p>
      ) : (
        <ul className="divide-y divide-ink-100 border border-ink-200 bg-white">
          {promociones.map((p) => (
            <li key={p.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="inline-flex shrink-0 items-baseline gap-1 rounded-sm bg-brand-500 px-2 py-1 text-sm font-semibold text-white">
                  −{p.porcentaje}%
                </span>

                <div className="min-w-40 flex-1">
                  <p className="text-sm font-medium text-ink-950">{p.objetivo}</p>
                  <p className="text-xs text-ink-500">
                    {p.alcance === 'categoria'
                      ? `Categoría · ${p.cuantosProductos} ${p.cuantosProductos === 1 ? 'producto' : 'productos'}`
                      : 'Un producto'}
                    {p.etiqueta && ` · ${p.etiqueta}`}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    Desde {fecha(p.desde)}
                    {p.hasta ? ` hasta ${fecha(p.hasta)}` : ' · sin fecha de término'}
                  </p>
                </div>

                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    COLOR_ESTADO[p.estado],
                  )}
                >
                  {p.estado}
                </span>
              </div>

              {puedeEscribir && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.estado === 'vigente' && (
                    <button
                      type="button"
                      disabled={pendiente}
                      onClick={() => correr(() => terminarAhora(p.id))}
                      className="rounded-sm border border-ink-200 px-3 py-1.5 text-xs text-ink-700 transition-colors hover:border-ink-400 disabled:opacity-50"
                    >
                      Terminar ahora
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pendiente}
                    onClick={() => correr(() => cambiarEstadoPromocion(p.id, !p.activa))}
                    className="rounded-sm border border-ink-200 px-3 py-1.5 text-xs text-ink-700 transition-colors hover:border-ink-400 disabled:opacity-50"
                  >
                    {p.activa ? 'Apagar' : 'Encender'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Cuando una promoción termina, el checkout la sigue respetando unos minutos. Es a propósito:
        las páginas de la tienda están guardadas un rato, y a quien tenga una ficha abierta con el
        precio con descuento no se le puede cobrar más de lo que vio.
      </p>
    </div>
  )
}

export function CrearPromocion({
  categorias,
  productos,
}: {
  categorias: Opcion[]
  productos: Opcion[]
}) {
  const [estado, accion] = useActionState(crearPromocion, inicial)
  const [alcance, setAlcance] = useState<'categoria' | 'producto'>('categoria')
  const [sinFin, setSinFin] = useState(false)

  // Las fechas se mandan en ISO desde el navegador. Un `datetime-local` da la
  // hora local sin zona, y el servidor la interpretaría en UTC: una promoción
  // puesta para las 15:00 empezaría a las 11:00 en Chile.
  const [desde, setDesde] = useState(() => paraInput(new Date()))
  const [hasta, setHasta] = useState('')

  const opciones = alcance === 'categoria' ? categorias : productos

  return (
    <aside className="border border-ink-200 bg-white p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
        <Tag aria-hidden="true" className="size-4 text-brand-500" />
        Nueva promoción
      </h2>

      {estado.error && (
        <p
          role="alert"
          className="mt-4 flex gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p className="mt-4 flex gap-2 border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {estado.ok}
        </p>
      )}

      <form key={estado.ok ?? 'nueva'} action={accion} className="mt-5">
        <input type="hidden" name="alcance" value={alcance} />
        <input type="hidden" name="desdeIso" value={aIso(desde)} />
        <input type="hidden" name="hastaIso" value={sinFin ? '' : aIso(hasta)} />

        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-medium text-ink-800">¿A qué se le aplica?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['categoria', 'producto'] as const).map((valor) => (
              <label
                key={valor}
                className={cn(
                  'flex cursor-pointer items-center justify-center gap-2 border px-3 py-2 text-sm transition-colors',
                  alcance === valor
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-ink-200 text-ink-600 hover:border-ink-400',
                )}
              >
                <input
                  type="radio"
                  name="alcanceVisible"
                  value={valor}
                  checked={alcance === valor}
                  onChange={() => setAlcance(valor)}
                  className="sr-only"
                />
                {valor === 'categoria' ? 'Una categoría' : 'Un producto'}
              </label>
            ))}
          </div>
        </fieldset>

        <Campo etiqueta={alcance === 'categoria' ? 'Categoría' : 'Producto'} id="objetivo">
          {/* key por alcance: al cambiar de categoría a producto hay que
              reiniciar la selección, o queda elegido un id del otro tipo. */}
          <select
            key={alcance}
            id="objetivo"
            name="objetivo"
            required
            defaultValue=""
            className={entrada}
          >
            <option value="" disabled>
              Elegir…
            </option>
            {opciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.etiqueta}
              </option>
            ))}
          </select>
          {alcance === 'categoria' && (
            <p className="mt-1.5 text-xs text-ink-500">
              El número al lado dice a cuántos productos le va a aplicar.
            </p>
          )}
        </Campo>

        <Campo etiqueta="Descuento" id="porcentaje">
          <div className="flex items-center gap-2">
            <input
              id="porcentaje"
              name="porcentaje"
              type="number"
              min={1}
              max={90}
              step={1}
              required
              defaultValue={10}
              className={entrada}
            />
            <span className="text-sm text-ink-600">%</span>
          </div>
          <p className="mt-1.5 text-xs text-ink-500">
            Se calcula sobre el precio normal. Si el producto ya tenía una oferta más baja, se
            queda con la más baja: una promoción nunca le sube el precio a nadie.
          </p>
        </Campo>

        <Campo etiqueta="Nombre (opcional)" id="etiqueta">
          <input
            id="etiqueta"
            name="etiqueta"
            placeholder="Semana de la panadería"
            className={entrada}
          />
          <p className="mt-1.5 text-xs text-ink-500">Para reconocerla en esta lista.</p>
        </Campo>

        <Campo etiqueta="Empieza" id="desde">
          <input
            id="desde"
            type="datetime-local"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            required
            className={entrada}
          />
        </Campo>

        <Campo etiqueta="Termina" id="hasta">
          <input
            id="hasta"
            type="datetime-local"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            disabled={sinFin}
            required={!sinFin}
            className={entrada}
          />
        </Campo>

        <label className="mb-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="sinFin"
            checked={sinFin}
            onChange={(e) => setSinFin(e.target.checked)}
            className="mt-0.5 size-4 rounded-sm border-ink-300 accent-brand-500"
          />
          <span>
            <span className="block text-sm text-ink-900">Sin fecha de término</span>
            <span className="block text-xs text-ink-500">
              Va a seguir aplicándose hasta que alguien la apague. Conviene evitarlo: es la forma
              en que un descuento se queda puesto meses sin que nadie lo note.
            </span>
          </span>
        </label>

        <Boton />
      </form>
    </aside>
  )
}

/** Fecha local en el formato que espera un input datetime-local. */
function paraInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Lo que escribió la persona, en hora local, convertido a ISO con zona. */
function aIso(valorLocal: string): string {
  if (!valorLocal) return ''
  const t = Date.parse(valorLocal)
  return Number.isFinite(t) ? new Date(t).toISOString() : ''
}

const entrada =
  'w-full rounded-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-ink-950 focus:outline-none disabled:bg-ink-50 disabled:text-ink-400'

function Campo({
  etiqueta,
  id,
  children,
}: {
  etiqueta: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">
        {etiqueta}
      </label>
      {children}
    </div>
  )
}

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 w-full rounded-sm bg-brand-500 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
    >
      {pending ? 'Creando…' : 'Crear la promoción'}
    </button>
  )
}
