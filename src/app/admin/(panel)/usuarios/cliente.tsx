'use client'

import { useActionState, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2, Copy, UserPlus } from 'lucide-react'
import { cambiarEstado, cambiarRol, crearPersona, type EstadoUsuarios } from './acciones'
import { cn } from '@/lib/cn'

type QuePuede = Record<string, string>

const inicial: EstadoUsuarios = {}

export type Persona = {
  userId: string
  email: string
  nombre: string
  rol: string
  activo: boolean
}

export function ListaDePersonas({
  personas,
  yo,
  error,
  quePuede,
}: {
  personas: Persona[]
  yo: string
  error?: string
  quePuede: QuePuede
}) {
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null)
  const [pendiente, transicion] = useTransition()

  const correr = (accion: () => Promise<EstadoUsuarios>) => {
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

      <ul className="divide-y divide-ink-100 border border-ink-200 bg-white">
        {personas.map((p) => (
          <li key={p.userId} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-40 flex-1">
              <p className="text-sm font-medium text-ink-950">
                {p.nombre || p.email}
                {p.userId === yo && <span className="ml-2 text-xs text-ink-400">(tú)</span>}
              </p>
              <p className="text-xs text-ink-500">{p.email}</p>
            </div>

            <label className="sr-only" htmlFor={`rol-${p.userId}`}>
              Rol de {p.nombre || p.email}
            </label>
            <select
              id={`rol-${p.userId}`}
              value={p.rol}
              disabled={pendiente}
              onChange={(e) => correr(() => cambiarRol(p.userId, e.target.value))}
              className="h-9 rounded-sm border border-ink-200 bg-white px-2 text-sm text-ink-900 focus:border-ink-950 focus:outline-none"
            >
              {Object.keys(quePuede).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={pendiente}
              onClick={() => correr(() => cambiarEstado(p.userId, !p.activo))}
              className={cn(
                'rounded-sm px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                p.activo
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
              )}
            >
              {p.activo ? 'Activa' : 'De baja'}
            </button>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-1.5 text-xs text-ink-500">
        {Object.entries(quePuede).map(([rol, detalle]) => (
          <div key={rol} className="flex gap-2">
            <dt className="w-14 shrink-0 font-medium text-ink-700">{rol}</dt>
            <dd>{detalle}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Dar de baja no borra la cuenta: la deshabilita, y volver a habilitarla es un clic. Así
        queda el registro de quién administró. Borrarla de verdad se hace desde Supabase.
      </p>
    </div>
  )
}

export function AgregarPersona({ quePuede }: { quePuede: QuePuede }) {
  const [estado, accion] = useActionState(crearPersona, inicial)
  const [copiada, setCopiada] = useState(false)

  return (
    <aside className="border border-ink-200 bg-white p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
        <UserPlus aria-hidden="true" className="size-4 text-brand-500" />
        Agregar una persona
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
        <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <p className="flex gap-2 font-medium">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            {estado.ok}
          </p>
          {estado.claveTemporal && (
            <>
              {/* Se muestra una sola vez y no queda guardada en ninguna parte:
                  hay que pasarla ahora o cambiarla de nuevo. */}
              <p className="mt-2">
                Pásale esta contraseña y decile que la cambie desde «Mi cuenta». No se vuelve a
                mostrar.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 border border-emerald-300 bg-white px-2 py-1 font-mono text-xs break-all">
                  {estado.claveTemporal}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(estado.claveTemporal ?? '')
                    setCopiada(true)
                  }}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-emerald-700 hover:bg-emerald-100"
                  aria-label="Copiar contraseña"
                >
                  <Copy aria-hidden="true" className="size-3.5" />
                </button>
              </div>
              {copiada && <p className="mt-1">Copiada.</p>}
            </>
          )}
        </div>
      )}

      <div className="mt-5">
        {/* key fuerza a rehacer el formulario después de crear a alguien: si no,
            quedan los datos de la persona anterior y es fácil crear duplicados. */}
        <form key={estado.ok ?? 'nuevo'} action={accion}>
          <Campo etiqueta="Correo" id="email">
            <input id="email" name="email" type="email" required className={entrada} />
          </Campo>

          <Campo etiqueta="Nombre" id="nombre">
            <input id="nombre" name="nombre" required className={entrada} />
          </Campo>

          <Campo etiqueta="Rol" id="rol">
            <select id="rol" name="rol" defaultValue="editor" className={entrada}>
              {Object.keys(quePuede).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Contraseña inicial" id="clave">
            <input id="clave" name="clave" required minLength={10} className={entrada} />
            <p className="mt-1.5 text-xs text-ink-500">
              Diez caracteres como mínimo. Es temporal: quien entra la cambia desde «Mi cuenta».
            </p>
          </Campo>

          <Boton />
        </form>
      </div>
    </aside>
  )
}

const entrada =
  'w-full rounded-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-ink-950 focus:outline-none'

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
      {pending ? 'Creando…' : 'Crear la cuenta'}
    </button>
  )
}
