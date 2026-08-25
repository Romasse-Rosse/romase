import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/catalog'
import { formatPrice, stripHtml, titleCase, truncate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge } from './ui'

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const image = product.images[0]
  const summary = truncate(stripHtml(product.shortDescription || product.description), 90)
  const discount =
    product.onSale && product.regularPrice && product.regularPrice > product.price
      ? Math.round((1 - product.price / product.regularPrice) * 100)
      : 0

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white transition-shadow hover:shadow-lift',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-ink-50">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-400">
            Sin imagen
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {discount > 0 && <Badge tone="brand">-{discount}%</Badge>}
          {!product.inStock && <Badge tone="muted">Bajo pedido</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm leading-snug font-medium text-ink-900">
          {/* El enlace cubre toda la tarjeta, así el área de click es grande. */}
          <Link href={`/productos/${product.slug}`} className="before:absolute before:inset-0">
            {titleCase(product.name)}
          </Link>
        </h3>

        {summary && <p className="mt-1.5 line-clamp-2 text-xs text-ink-500">{summary}</p>}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-ink-950">{formatPrice(product.price)}</span>
            {discount > 0 && product.regularPrice && (
              <span className="text-sm text-ink-400 line-through">
                {formatPrice(product.regularPrice)}
              </span>
            )}
          </div>
          {product.sku && <p className="mt-1 text-[11px] text-ink-400">SKU {product.sku}</p>}
        </div>
      </div>
    </article>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
