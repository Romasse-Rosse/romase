'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import type { CategoryNode } from '@/lib/catalog'
import { formatPrice, titleCase } from '@/lib/format'
import { cn } from '@/lib/cn'

/** Construye la URL manteniendo lo que ya estaba y reseteando la paginación. */
function useUpdateParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '') params.delete(key)
        else params.set(key, value)
      }
      // Cambiar un filtro siempre vuelve a la primera página.
      if (!('pagina' in changes)) params.delete('pagina')

      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )
}

export function SortSelect({ value }: { value: string }) {
  const update = useUpdateParams()

  return (
    <label className="flex items-center gap-2 text-sm text-ink-600">
      <span className="hidden sm:inline">Ordenar por</span>
      <select
        value={value}
        onChange={(event) => update({ orden: event.target.value })}
        className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
      >
        <option value="relevancia">Relevancia</option>
        <option value="precio-asc">Menor precio</option>
        <option value="precio-desc">Mayor precio</option>
        <option value="nombre">Nombre (A–Z)</option>
        <option value="novedades">Más recientes</option>
      </select>
    </label>
  )
}

type FiltersProps = {
  categories: CategoryNode[]
  activeCategory: string | null
  onlyInStock: boolean
  priceRange: { min: number; max: number }
  activeMin: number | null
  activeMax: number | null
}

export function CatalogFilters(props: FiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filtros
      </button>

      {/* Escritorio */}
      <aside className="hidden lg:block">
        <FilterPanel {...props} />
      </aside>

      {/* Móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200 px-4">
              <span className="font-semibold text-ink-950">Filtros</span>
              <button
                type="button"
                aria-label="Cerrar filtros"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-ink-600 hover:bg-ink-100"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterPanel {...props} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function FilterPanel({
  categories,
  activeCategory,
  onlyInStock,
  priceRange,
  activeMin,
  activeMax,
}: FiltersProps) {
  const update = useUpdateParams()
  const searchParams = useSearchParams()

  const [min, setMin] = useState(activeMin !== null ? String(activeMin) : '')
  const [max, setMax] = useState(activeMax !== null ? String(activeMax) : '')

  const hasFilters =
    Boolean(activeCategory) || onlyInStock || activeMin !== null || activeMax !== null

  return (
    <div className="space-y-7">
      {hasFilters && (
        <button
          type="button"
          onClick={() => update({ categoria: null, stock: null, min: null, max: null })}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Limpiar filtros
        </button>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-950">Categorías</h2>
        <ul className="space-y-0.5 text-sm">
          <li>
            <FilterLink
              label="Todas"
              active={!activeCategory}
              href={buildHref(searchParams, { categoria: null })}
            />
          </li>
          {categories.map((category) => {
            const isActive = activeCategory === category.slug
            const childActive = category.children.some((c) => c.slug === activeCategory)

            return (
              <li key={category.id}>
                <FilterLink
                  label={titleCase(category.name)}
                  count={category.productCount}
                  active={isActive}
                  href={buildHref(searchParams, { categoria: category.slug })}
                />

                {(isActive || childActive) && category.children.length > 0 && (
                  <ul className="mt-0.5 mb-2 ml-3 space-y-0.5 border-l border-ink-200 pl-3">
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <FilterLink
                          label={titleCase(child.name)}
                          count={child.productCount}
                          active={activeCategory === child.slug}
                          href={buildHref(searchParams, { categoria: child.slug })}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-950">Disponibilidad</h2>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(event) => update({ stock: event.target.checked ? '1' : null })}
            className="size-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
          />
          Solo productos con stock
        </label>
      </section>

      {priceRange.max > priceRange.min && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-ink-950">Precio</h2>
          <p className="mb-3 text-xs text-ink-500">
            Entre {formatPrice(priceRange.min)} y {formatPrice(priceRange.max)}
          </p>
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              update({ min: min || null, max: max || null })
            }}
          >
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={min}
              onChange={(event) => setMin(event.target.value)}
              placeholder="Desde"
              aria-label="Precio mínimo"
              className="h-10 w-full min-w-0 rounded-lg border border-ink-200 px-2.5 text-sm focus:border-brand-400 focus:outline-none"
            />
            <span className="text-ink-400">–</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={max}
              onChange={(event) => setMax(event.target.value)}
              placeholder="Hasta"
              aria-label="Precio máximo"
              className="h-10 w-full min-w-0 rounded-lg border border-ink-200 px-2.5 text-sm focus:border-brand-400 focus:outline-none"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-lg bg-ink-900 px-3 text-sm font-medium text-white hover:bg-ink-800"
            >
              Ir
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

function FilterLink({
  label,
  href,
  active,
  count,
}: {
  label: string
  href: string
  active: boolean
  count?: number
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        'flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5',
        active ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-600 hover:bg-ink-50',
      )}
    >
      <span>{label}</span>
      {count !== undefined && <span className="text-xs text-ink-400">{count}</span>}
    </Link>
  )
}

function buildHref(current: URLSearchParams, changes: Record<string, string | null>): string {
  const params = new URLSearchParams(current.toString())
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) params.delete(key)
    else params.set(key, value)
  }
  params.delete('pagina')
  const query = params.toString()
  return query ? `/productos?${query}` : '/productos'
}
