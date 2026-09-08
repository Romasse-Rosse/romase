'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, Lock } from 'lucide-react'
import { ingresar, type EstadoIngreso } from '../acciones-sesion'

const inicial: EstadoIngreso = {}

export function FormularioIngreso() {
  const [estado, accion] = useActionState(ingresar, inicial)

  return (
    <form action={accion} className="border border-ink-200 bg-white p-4 sm:p-6">
      {estado.error && (
        <p
          role="alert"
          className="mb-5 flex gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {estado.error}
        </p>
      )}

      <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-800">
        Correo
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="username"
        autoFocus
        className="mb-4 h-11 w-full rounded-sm border border-ink-200 px-3 text-sm text-ink-900 focus:border-ink-950 focus:outline-none"
      />

      <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-800">
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="mb-6 h-11 w-full rounded-sm border border-ink-200 px-3 text-sm text-ink-900 focus:border-ink-950 focus:outline-none"
      />

      <Boton />

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
        <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Las cuentas las crea quien administra la tienda desde Supabase. No hay registro abierto:
        una tienda no necesita que cualquiera pueda pedir una cuenta de administrador.
      </p>
    </form>
  )
}

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-sm bg-brand-500 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
    >
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  )
}
