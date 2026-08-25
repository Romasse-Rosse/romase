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
  base: 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  variant: {
    primary: 'bg-brand-500 text-white hover:bg-brand-600',
    secondary: 'bg-ink-900 text-white hover:bg-ink-800',
    outline: 'border border-ink-300 bg-white text-ink-900 hover:border-ink-400 hover:bg-ink-50',
    ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
    whatsapp: 'bg-[#25D366] text-white hover:bg-[#1eb855]',
  },
  size: {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-13 px-7 text-base',
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
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">{title}</h2>
        {description && <p className="mt-3 text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
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
