import Image from 'next/image'
import type { Product } from '@/lib/catalog'
import { formatPrice, titleCase } from '@/lib/format'
import { cn } from '@/lib/cn'
import { AddToCartCompact } from './add-to-cart'
import { esBajoPedido } from '@/lib/bajo-pedido'
import { SelectItemLink } from './analytics'

export function ProductCard({
  product,
  className,
  listId,
  listName,
}: {
  product: Product
  className?: string
  /** Lista de la que viene la tarjeta, para el evento select_item. */
  listId?: string
  listName?: string
}) {
  const image = product.images[0]
  const discount =
    product.onSale && product.regularPrice && product.regularPrice > product.price
      ? Math.round((1 - product.price / product.regularPrice) * 100)
      : 0

  return (
    // Una sola caja para todo: foto, nombre, precio y botón. Antes el marco
    // rodeaba solo la foto y el resto quedaba suelto debajo; con el botón en
    // naranja eso se leía como un botón despegado de su producto.
    <article
      className={cn(
        'group relative flex h-full w-full flex-col border border-ink-200 bg-white transition-all duration-200 hover:border-ink-300 hover:shadow-lift',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden border-b border-ink-100 bg-white">
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

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[13px] leading-snug font-semibold text-ink-950">
          {/* El enlace cubre toda la tarjeta, así el área de click es grande. */}
          <SelectItemLink
            product={product}
            listId={listId}
            listName={listName}
            className="transition-colors before:absolute before:inset-0 group-hover:text-brand-600"
          >
            {titleCase(product.name)}
          </SelectItemLink>
        </h3>

        <div className="mt-auto pt-3">
          {/* Con envoltura: en una grilla de dos columnas a 360 px, un precio
              de siete cifras más el tachado no caben en la misma línea y
              empujaban la página hacia el costado. */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[17px] font-medium text-ink-950">
              {esBajoPedido(product.price) ? 'Bajo pedido' : formatPrice(product.price)}
            </span>
            {discount > 0 && product.regularPrice && (
              <span className="text-[13px] text-ink-400 line-through">
                {formatPrice(product.regularPrice)}
              </span>
            )}
          </div>

          <div className="mt-3">
            <AddToCartCompact
              inStock={product.inStock && !esBajoPedido(product.price)}
              product={{
                id: product.id,
                slug: product.slug,
                name: titleCase(product.name),
                price: product.price,
                image: product.images[0]?.src ?? null,
                sku: product.sku,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

export function ProductGrid({
  products,
  listId,
  listName,
}: {
  products: Product[]
  listId?: string
  listName?: string
}) {
  return (
    // Con la tarjeta cerrada, el aire va entre cajas y no dentro: la
    // separación deja de ser el doble en vertical que en horizontal.
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} listId={listId} listName={listName} />
      ))}
    </div>
  )
}
