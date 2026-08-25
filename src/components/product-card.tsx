import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/catalog'
import { formatPrice, titleCase } from '@/lib/format'
import { cn } from '@/lib/cn'

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const image = product.images[0]
  const discount =
    product.onSale && product.regularPrice && product.regularPrice > product.price
      ? Math.round((1 - product.price / product.regularPrice) * 100)
      : 0

  return (
    <article className={cn('group relative flex flex-col', className)}>
      {/* Marco solo alrededor de la foto: la ficha respira mejor que
          encerrando también el texto. */}
      <div className="relative aspect-square overflow-hidden border border-ink-200 bg-white transition-colors duration-200 group-hover:border-ink-300">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw"
            className="object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-400">
            Sin imagen
          </div>
        )}

        {discount > 0 && (
          <span className="absolute top-0 left-0 bg-brand-500 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white">
            −{discount}%
          </span>
        )}
        {!product.inStock && (
          <span className="absolute top-0 right-0 bg-ink-950/85 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white">
            Bajo pedido
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <h3 className="text-[13px] leading-snug text-ink-800">
          {/* El enlace cubre toda la tarjeta, así el área de click es grande. */}
          <Link
            href={`/productos/${product.slug}`}
            className="transition-colors before:absolute before:inset-0 group-hover:text-brand-600"
          >
            {titleCase(product.name)}
          </Link>
        </h3>

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-[17px] font-medium text-ink-950">{formatPrice(product.price)}</span>
          {discount > 0 && product.regularPrice && (
            <span className="text-[13px] text-ink-400 line-through">
              {formatPrice(product.regularPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
