'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2, Send } from 'lucide-react'
import { submitContact, type ContactState } from '@/app/contacto/actions'
import { cn } from '@/lib/cn'

const initialState: ContactState = { status: 'idle' }

export function ContactForm({ productRef }: { productRef?: string }) {
  const [state, formAction] = useActionState(submitContact, initialState)

  if (state.status === 'ok') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 aria-hidden="true" className="mx-auto size-9 text-emerald-600" />
        <h2 className="mt-3 text-lg font-medium text-emerald-900">¡Consulta enviada!</h2>
        <p className="mt-1.5 text-sm text-emerald-800">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {productRef && <input type="hidden" name="productRef" value={productRef} />}

      {/* Trampa para bots: oculta y fuera del orden de tabulación. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website">No completar</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === 'error' && state.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nombre"
          name="name"
          required
          autoComplete="name"
          error={state.fieldErrors?.name}
        />
        <Field
          label="Empresa"
          name="company"
          autoComplete="organization"
          hint="Opcional"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Correo electrónico"
          name="email"
          type="email"
          required
          autoComplete="email"
          error={state.fieldErrors?.email}
        />
        <Field
          label="Teléfono"
          name="phone"
          type="tel"
          autoComplete="tel"
          hint="Opcional"
        />
      </div>

      <Field
        label="¿Qué necesitas?"
        name="message"
        as="textarea"
        required
        error={state.fieldErrors?.message}
        hint="Cuéntanos el equipo que buscas, tu volumen de producción y la ciudad de despacho."
      />

      <SubmitButton />

      <p className="text-xs text-ink-500">
        Usamos tus datos únicamente para responder esta consulta.
      </p>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      <Send aria-hidden="true" className="size-4" />
      {pending ? 'Enviando…' : 'Enviar consulta'}
    </button>
  )
}

function Field({
  label,
  name,
  type = 'text',
  as = 'input',
  required,
  autoComplete,
  hint,
  error,
}: {
  label: string
  name: string
  type?: string
  as?: 'input' | 'textarea'
  required?: boolean
  autoComplete?: string
  hint?: string
  error?: string
}) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined
  const control =
    'w-full rounded-lg border bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none'
  const tone = error
    ? 'border-red-400 focus:border-red-500'
    : 'border-ink-200 focus:border-brand-400'

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
        {required && <span className="ml-0.5 text-brand-600">*</span>}
      </label>

      {as === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          rows={5}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={cn(control, tone, 'py-2.5 leading-relaxed')}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={cn(control, tone, 'h-11')}
        />
      )}

      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${name}-hint`} className="mt-1 text-xs text-ink-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
