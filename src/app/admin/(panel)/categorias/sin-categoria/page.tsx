import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { clienteDelPanel, sesionDelPanel } from '@/lib/panel'
import { imagenServida } from '@/lib/catalog'
import { titleCase } from '@/lib/format'
import { AsignarSinCategoria } from './cliente'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Productos sin categoría' }

/**
 * Los productos que no están en ninguna categoría.
 *
 * Existen en la base y tienen ficha propia, pero **no aparecen en ningún
 * listado de la tienda**: ni en el menú, ni en la portada, ni en una categoría.
 * Solo se llega a ellos por el buscador o escribiendo su dirección.
 *
 * Es una lista que conviene que esté vacía, y hasta ahora no había forma de
 * saber que no lo estaba.
 */
export default async function SinCategoria() {
  const sesion = await sesionDelPanel()
  if (!sesion?.puedeEscribir) redirect('/admin/categorias')

  const db = await clienteDelPanel()

  const [productos, vinculos, categorias] = await Promise.all([
    db.from('products').select('id, name, sku, price, in_stock').order('name'),
    db.from('product_categories').select('product_id'),
    db.from('categories').select('id, name, parent_id').order('name'),
  ])

  const conCategoria = new Set((vinculos.data ?? []).map((v) => v.product_id as number))
  const huerfanos = (productos.data ?? []).filter((p) => !conCategoria.has(p.id as number))

  const fotos = new Map<number, string>()
  if (huerfanos.length > 0) {
    const { data: imagenes } = await db
      .from('product_images')
      .select('product_id, src, position')
      .in(
        'product_id',
        huerfanos.map((p) => p.id as number),
      )
      .order('position')
    for (const img of imagenes ?? []) {
      const pid = img.product_id as number
      if (!fotos.has(pid)) fotos.set(pid, imagenServida(img.src as string))
    }
  }

  const porId = new Map((categorias.data ?? []).map((c) => [c.id as number, c]))

  // Con la rama visible: elegir «Amasadoras» a secas obliga a recordar de qué
  // rubro cuelga.
  const opciones = (categorias.data ?? [])
    .map((c) => {
      const padre = c.parent_id ? porId.get(c.parent_id as number) : null
      const nombre = titleCase(c.name as string)
      return {
        id: c.id as number,
        etiqueta: padre ? `${titleCase(padre.name as string)} › ${nombre}` : nombre,
      }
    })
    .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'))

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/categorias"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Categorías
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-950">
        Productos sin categoría
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        {huerfanos.length === 0
          ? 'No hay ninguno: todos los productos están en al menos una categoría.'
          : `${huerfanos.length} ${huerfanos.length === 1 ? 'producto no aparece' : 'productos no aparecen'} en ningún listado de la tienda.`}
      </p>

      {huerfanos.length === 0 ? (
        <p className="mt-8 flex items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 p-10 text-center text-sm text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
          Todo el catálogo está categorizado.
        </p>
      ) : (
        <AsignarSinCategoria
          productos={huerfanos.map((p) => ({
            id: p.id as number,
            nombre: titleCase(p.name as string),
            sku: (p.sku as string | null) ?? '',
            precio: p.price === null ? 0 : Number(p.price),
            enStock: Boolean(p.in_stock),
            foto: fotos.get(p.id as number) ?? null,
          }))}
          categorias={opciones}
        />
      )}
    </div>
  )
}
