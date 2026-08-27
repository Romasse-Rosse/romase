import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Container({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}

const buttonStyles = {
  base: 'inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-[0.01em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50',
  variant: {
    primary: 'bg-brand-500 text-white hover:bg-brand-600',
    secondary: 'bg-ink-950 text-white hover:bg-ink-800',
    outline: 'border border-ink-300 bg-transparent text-ink-900 hover:border-ink-950 hover:bg-ink-950 hover:text-white',
    ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-950',
    whatsapp: 'bg-[#25D366] text-white hover:bg-[#1eb855]',
  },
  size: {
    sm: 'h-9 px-4 text-[13px]',
    md: 'h-11 px-6 text-sm',
    lg: 'h-13 px-8 text-[15px]',
  },
} as const

type ButtonLook = {
  variant?: keyof typeof buttonStyles.variant
  size?: keyof typeof buttonStyles.size
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonLook & ComponentProps<'button'>) {
  return (
    <button
      className={cn(buttonStyles.base, buttonStyles.variant[variant], buttonStyles.size[size], className)}
      {...props}
    />
  )
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonLook & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(buttonStyles.base, buttonStyles.variant[variant], buttonStyles.size[size], className)}
      {...props}
    />
  )
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: 'neutral' | 'brand' | 'success' | 'muted'
  className?: string
  children: ReactNode
}) {
  const tones = {
    neutral: 'bg-ink-100 text-ink-700',
    brand: 'bg-brand-500 text-white',
    success: 'bg-emerald-50 text-emerald-700',
    muted: 'bg-ink-800/85 text-white',
  } as const

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Encabezado de sección con título y, opcionalmente, un enlace a la derecha. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  as = 'h2',
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  /** Nivel del encabezado. La sección que encabeza la página lleva h1. */
  as?: 'h1' | 'h2'
}) {
  const Titulo = as
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 text-center sm:text-left">
      <div className="mx-auto max-w-2xl sm:mx-0">
        {eyebrow && (
          <p className="mb-3 text-[11px] font-medium tracking-[0.18em] text-brand-600 uppercase">
            {eyebrow}
          </p>
        )}
        <Titulo className="text-[26px] leading-[1.15] font-medium text-ink-950 sm:text-[34px]">
          {title}
        </Titulo>
        {description && (
          <p className="mt-3 leading-relaxed text-ink-600">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

/** Enlace discreto de "ver más", con la línea que aparece al pasar por encima. */
export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 border-b border-ink-300 pb-0.5 text-sm text-ink-800 transition-colors hover:border-brand-500 hover:text-brand-600"
    >
      {children}
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  )
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Miga de pan" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-ink-500">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-600 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink-800">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
