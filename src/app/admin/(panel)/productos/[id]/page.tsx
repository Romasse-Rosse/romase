import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { clienteDelPanel, sesionDelPanel } from '@/lib/panel'
import { imagenServida } from '@/lib/catalog'
import { titleCase } from '@/lib/format'
import { EditorProducto } from './editor'
import { Fotos } from './fotos'
import { EliminarProducto } from './eliminar'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await clienteDelPanel()
  const { data } = await db.from('products').select('name').eq('id', Number(id)).maybeSingle()
  return { title: data?.name ? titleCase(data.name) : 'Producto' }
}

export default async function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productoId = Number(id)
  if (!Number.isFinite(productoId)) notFound()

  const sesion = await sesionDelPanel()
  const db = await clienteDelPanel()

  const { data: producto } = await db
    .from('products')
    .select(
      'id, name, slug, sku, description, short_description, price, regular_price, sale_price, in_stock, featured, updated_at',
    )
    .eq('id', productoId)
    .maybeSingle()

  if (!producto) notFound()

  const { data: imagenes } = await db
    .from('product_images')
    .select('id, src, alt, position')
    .eq('product_id', productoId)
    .order('position')

  // Cuántas líneas de pedido lo referencian. Es el dato que cambia la
  // decisión de borrar, así que se muestra antes de ofrecer el botón.
  const { count: enPedidos } = await db
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productoId)

  const fotos = (imagenes ?? []).map((i) => ({
    id: i.id as number,
    src: i.src as string,
    servida: imagenServida(i.src as string),
    alt: (i.alt as string | null) ?? '',
  }))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Productos
        </Link>

        <Link
          href={`/productos/${producto.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
        >
          Ver en la tienda
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </Link>
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-950">
        {titleCase(producto.name)}
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        SKU {producto.sku || 'sin SKU'} · id {producto.id}
        {producto.updated_at && (
          <> · editado el {new Date(producto.updated_at).toLocaleDateString('es-CL')}</>
        )}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        <EditorProducto
          producto={{
            id: producto.id,
            name: producto.name,
            slug: producto.slug,
            sku: producto.sku ?? '',
            shortDescription: producto.short_description ?? '',
            description: producto.description ?? '',
            price: producto.price === null ? '' : String(Math.round(Number(producto.price))),
            regularPrice:
              producto.regular_price === null
                ? ''
                : String(Math.round(Number(producto.regular_price))),
            salePrice:
              producto.sale_price === null ? '' : String(Math.round(Number(producto.sale_price))),
            inStock: Boolean(producto.in_stock),
            featured: Boolean(producto.featured),
          }}
          puedeEscribir={Boolean(sesion?.puedeEscribir)}
          /** Cómo se va a ver el nombre en la tienda, que no es como se guarda. */
          nombreEnLaTienda={titleCase(producto.name)}
        />

        <Fotos
          productoId={producto.id}
          slug={producto.slug}
          nombre={titleCase(producto.name)}
          fotos={fotos}
          puedeEscribir={Boolean(sesion?.puedeEscribir)}
          puedeBorrar={Boolean(sesion?.puedeBorrar)}
        />
      </div>

      {sesion?.puedeEscribir && (
        <EliminarProducto
          productoId={producto.id}
          slug={producto.slug}
          nombre={titleCase(producto.name)}
          enPedidos={enPedidos ?? 0}
          puedeBorrar={Boolean(sesion?.puedeBorrar)}
        />
      )}
    </div>
  )
}
