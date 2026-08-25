import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getCategoryCover, type CategoryNode } from '@/lib/catalog'
import { titleCase } from '@/lib/format'
import { cn } from '@/lib/cn'

export async function CategoryCard({
  category,
  featured = false,
}: {
  category: CategoryNode
  featured?: boolean
}) {
  const cover = await getCategoryCover(category.slug)

  return (
    <Link
      href={`/categorias/${category.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white transition-shadow hover:shadow-lift',
        featured && 'sm:col-span-2 sm:row-span-2',
      )}
    >
      <div className={cn('relative overflow-hidden bg-ink-50', featured ? 'aspect-4/3' : 'aspect-square')}>
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes={featured ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 640px) 25vw, 50vw'}
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-400">
            {titleCase(category.name)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-ink-100 p-4">
        <div className="min-w-0">
          <h3
            className={cn(
              'truncate font-medium text-ink-950',
              featured ? 'text-lg' : 'text-sm',
            )}
          >
            {titleCase(category.name)}
          </h3>
          <p className="mt-0.5 text-xs text-ink-500">
            {category.productCount} {category.productCount === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
        />
      </div>
    </Link>
  )
}
