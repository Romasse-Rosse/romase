'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cambiarMiClave, type EstadoClave } from '../usuarios/acciones'

const inicial: EstadoClave = {}

export function FormularioClave() {
  const [estado, accion] = useActionState(cambiarMiClave, inicial)

  return (
    <form action={accion} className="border border-ink-200 bg-white p-6">
      {estado.error && (
        <p
          role="alert"
          className="mb-4 flex gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p className="mb-4 flex gap-2 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {estado.ok}
        </p>
      )}

      <label htmlFor="nueva" className="mb-1.5 block text-sm font-medium text-ink-800">
        Contraseña nueva
      </label>
      <input
        id="nueva"
        name="nueva"
        type="password"
        required
        minLength={10}
        autoComplete="new-password"
        className={entrada}
      />

      <label htmlFor="repetida" className="mt-4 mb-1.5 block text-sm font-medium text-ink-800">
        Repetirla
      </label>
      <input
        id="repetida"
        name="repetida"
        type="password"
        required
        minLength={10}
        autoComplete="new-password"
        className={entrada}
      />

      <p className="mt-2 text-xs text-ink-500">Diez caracteres como mínimo.</p>

      <Boton />
    </form>
  )
}

const entrada =
  'w-full rounded-sm border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-ink-950 focus:outline-none'

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 h-10 rounded-sm bg-brand-500 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
    >
      {pending ? 'Cambiando…' : 'Cambiar la contraseña'}
    </button>
  )
}
