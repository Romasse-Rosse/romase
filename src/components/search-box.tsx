'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { search } from '@/lib/analytics'

type Suggestion = {
  slug: string
  name: string
  price: string
  image: string | null
  inStock: boolean
}

export function SearchBox({
  className,
  placeholder = 'Buscar amasadoras, hornos, vitrinas…',
  autoFocus = false,
  onNavigate,
}: {
  className?: string
  placeholder?: string
  autoFocus?: boolean
  onNavigate?: () => void
}) {
  const router = useRouter()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const [term, setTerm] = useState('')
  const [items, setItems] = useState<Suggestion[]>([])
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)

  // Se espera a que la persona deje de escribir antes de consultar.
  useEffect(() => {
    const query = term.trim()
    if (query.length < 2) {
      setItems([])
      setTotal(0)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        setItems(data.items ?? [])
        setTotal(data.total ?? 0)
        setOpen(true)
      } catch {
        // Una consulta cancelada por otra más nueva no es un error que mostrar.
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 220)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term])

  // Cierra el panel al hacer click fuera.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const goToResults = () => {
    const query = term.trim()
    if (!query) return
    search(query)
    setOpen(false)
    onNavigate?.()
    router.push(`/buscar?q=${encodeURIComponent(query)}`)
  }

  const goToProduct = (slug: string) => {
    // Entrar directo a un producto desde el panel también es una búsqueda.
    if (term.trim()) search(term.trim())
    setOpen(false)
    onNavigate?.()
    router.push(`/productos/${slug}`)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!items.length) return
      event.preventDefault()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setOpen(true)
      setHighlighted((current) => {
        const next = current + delta
        if (next < -1) return items.length - 1
        if (next >= items.length) return -1
        return next
      })
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (highlighted >= 0 && items[highlighted]) goToProduct(items[highlighted].slug)
      else goToResults()
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-ink-400"
        />
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Buscar productos"
          autoFocus={autoFocus}
          value={term}
          placeholder={placeholder}
          onChange={(event) => {
            setTerm(event.target.value)
            setHighlighted(-1)
          }}
          onFocus={() => items.length && setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-12 w-full rounded-sm border border-ink-200 bg-white pr-10 pl-11 text-sm text-ink-900 transition-colors placeholder:text-ink-400 focus:border-ink-950 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {loading ? (
          <Loader2
            aria-hidden="true"
            className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-ink-400"
          />
        ) : (
          term && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                setTerm('')
                setItems([])
                setOpen(false)
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-700"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </div>

      {open && term.trim().length >= 2 && (
        <div
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-sm border border-ink-200 bg-white shadow-lift"
        >
          {items.length === 0 && !loading ? (
            <p className="px-4 py-6 text-center text-sm text-ink-500">
              No encontramos productos para «{term.trim()}».{' '}
              <Link href="/contacto" className="text-brand-600 underline" onClick={onNavigate}>
                Consúltanos
              </Link>
              , puede que lo tengamos sin publicar.
            </p>
          ) : (
            <>
              <ul className="max-h-96 overflow-y-auto">
                {items.map((item, index) => (
                  <li key={item.slug}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === highlighted}
                      onMouseEnter={() => setHighlighted(index)}
                      onClick={() => goToProduct(item.slug)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
                        index === highlighted ? 'bg-ink-50' : 'hover:bg-ink-50',
                      )}
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden border border-ink-100 bg-white">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-contain p-1"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink-900">{item.name}</span>
                        <span className="text-xs text-ink-500">
                          {item.price}
                          {!item.inStock && ' · bajo pedido'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={goToResults}
                className="w-full border-t border-ink-100 px-4 py-3 text-center text-sm text-brand-600 transition-colors hover:bg-ink-50"
              >
                Ver los {total} resultados
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
