import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Muestra primera, última, la actual y sus vecinas; el resto se elide. */
function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current, current - 1, current + 1])
  const visible = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const result: (number | 'gap')[] = []
  let previous = 0
  for (const page of visible) {
    if (previous && page - previous > 1) result.push('gap')
    result.push(page)
    previous = page
  }
  return result
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number
  totalPages: number
  basePath: string
  searchParams: Record<string, string | undefined>
}) {
  if (totalPages <= 1) return null

  const hrefFor = (target: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== 'pagina') params.set(key, value)
    }
    if (target > 1) params.set('pagina', String(target))
    const query = params.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  const linkClass = 'inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm'

  return (
    <nav aria-label="Paginación" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          aria-label="Página anterior"
          className={cn(linkClass, 'border-ink-200 bg-white text-ink-700 hover:border-ink-400')}
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, 'border-ink-100 text-ink-300')} aria-hidden="true">
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageWindow(page, totalPages).map((entry, index) =>
        entry === 'gap' ? (
          <span key={`gap-${index}`} className="px-1.5 text-ink-400">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={hrefFor(entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(
              linkClass,
              entry === page
                ? 'border-brand-500 bg-brand-500 font-medium text-white'
                : 'border-ink-200 bg-white text-ink-700 hover:border-ink-400',
            )}
          >
            {entry}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          aria-label="Página siguiente"
          className={cn(linkClass, 'border-ink-200 bg-white text-ink-700 hover:border-ink-400')}
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, 'border-ink-100 text-ink-300')} aria-hidden="true">
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  )
}
