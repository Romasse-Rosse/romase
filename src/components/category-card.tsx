import Image from 'next/image'
import Link from 'next/link'
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
        'group relative flex flex-col border border-ink-200 bg-white transition-colors duration-200 hover:border-ink-950',
        featured && 'sm:col-span-2 sm:row-span-2',
      )}
    >
      <div className={cn('relative overflow-hidden', featured ? 'aspect-4/3' : 'aspect-square')}>
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes={featured ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 640px) 25vw, 50vw'}
            className="object-contain p-7 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-ink-400">
            {titleCase(category.name)}
          </div>
        )}
      </div>

      <div className="border-t border-ink-200 px-4 py-3.5 transition-colors group-hover:border-ink-950">
        <h3 className={cn('leading-snug text-ink-950', featured ? 'text-base' : 'text-[13px]')}>
          {titleCase(category.name)}
        </h3>
        <p className="mt-1.5 text-[11px] font-medium tracking-[0.14em] text-ink-500 uppercase transition-colors group-hover:text-brand-600">
          Ver {category.productCount} productos
        </p>
      </div>
    </Link>
  )
}
