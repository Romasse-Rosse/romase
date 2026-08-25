'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Product } from '@/lib/catalog'
import { titleCase } from '@/lib/format'
import { cn } from '@/lib/cn'
import { ProductCard } from './product-card'

export type FeaturedGroup = {
  slug: string
  name: string
  products: Product[]
}

/**
 * Destacados agrupados por categoría. Deja ver de un vistazo el alcance del
 * catálogo sin obligar a entrar a cada sección, que es lo que hoy no pasa:
 * la maquinaria grande queda enterrada detrás de varios clicks.
 */
export function FeaturedTabs({ groups }: { groups: FeaturedGroup[] }) {
  const [active, setActive] = useState(0)
  const current = groups[active]

  if (!current) return null

  return (
    <div>
      <div className="mb-9 overflow-x-auto no-scrollbar">
        <div
          role="tablist"
          aria-label="Categorías destacadas"
          className="flex min-w-max gap-7 border-b border-ink-200"
        >
          {groups.map((group, index) => (
            <button
              key={group.slug}
              role="tab"
              type="button"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className={cn(
                '-mb-px border-b-2 pb-3 text-sm whitespace-nowrap transition-colors',
                index === active
                  ? 'border-brand-500 font-medium text-ink-950'
                  : 'border-transparent text-ink-500 hover:text-ink-800',
              )}
            >
              {titleCase(group.name)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {current.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href={`/categorias/${current.slug}`}
          className="inline-flex h-11 items-center justify-center rounded-sm border border-ink-300 px-8 text-sm font-medium text-ink-900 transition-colors hover:border-ink-950 hover:bg-ink-950 hover:text-white"
        >
          Ver todo en {titleCase(current.name).toLowerCase()}
        </Link>
      </div>
    </div>
  )
}
