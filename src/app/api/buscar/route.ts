import { NextResponse } from 'next/server'
import { queryProducts } from '@/lib/catalog'
import { formatPrice, titleCase } from '@/lib/format'

/** Sugerencias del buscador del encabezado. */
export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  if (term.length < 2) {
    return NextResponse.json({ items: [], total: 0 })
  }

  const { items, total } = await queryProducts({ search: term, perPage: 6 })

  return NextResponse.json({
    total,
    items: items.map((p) => ({
      slug: p.slug,
      name: titleCase(p.name),
      price: formatPrice(p.price),
      image: p.images[0]?.src ?? null,
      inStock: p.inStock,
    })),
  })
}
