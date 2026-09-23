import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, EyeOff } from 'lucide-react'
import { clienteDelPanel, sesionDelPanel } from '@/lib/panel'
import { imagenServida } from '@/lib/catalog'
import { normalize, titleCase } from '@/lib/format'
import { camposDe, puntuar } from '@/lib/busqueda'
import { DatosDeLaCategoria } from './datos'
import { ProductosDeLaCategoria } from './productos'
import { BorrarCategoria } from './borrar'

export const dynamic = 'force-dynamic'

type Busqueda = Promise<{ buscar?: string }>

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await clienteDelPanel()
  const { data } = await db.from('categories').select('name').eq('id', Number(id)).maybeSingle()
  return { title: data?.name ? titleCase(data.name) : 'Categoría' }
}

/** Cuántos productos caben en el buscador de agregar sin volverlo inútil. */
const RESULTADOS = 20

export default async function EditarCategoria({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Busqueda
}) {
  const [{ id }, { buscar = '' }] = await Promise.all([params, searchParams])
  const categoriaId = Number(id)
  if (!Number.isFinite(categoriaId)) notFound()

  const sesion = await sesionDelPanel()
  const db = await clienteDelPanel()

  const { data: categoria } = await db
    .from('categories')
    .select('id, name, slug, parent_id, description')
    .eq('id', categoriaId)
    .maybeSingle()

  if (!categoria) notFound()

  const [todas, vinculos] = await Promise.all([
    db.from('categories').select('id, name, slug, parent_id').order('name'),
    db.from('product_categories').select('product_id, category_id'),
  ])

  const enEstaCategoria = new Set(
    (vinculos.data ?? [])
      .filter((v) => v.category_id === categoriaId)
      .map((v) => v.product_id as number),
  )

  // Cuántas categorías tiene cada producto: hace falta para avisar cuáles
  // quedarían invisibles al quitarlos de esta.
  const categoriasPorProducto = new Map<number, number>()
  for (const v of vinculos.data ?? []) {
    const p = v.product_id as number
    categoriasPorProducto.set(p, (categoriasPorProducto.get(p) ?? 0) + 1)
  }

  // Los productos de esta categoría, con su foto.
  const { data: productos } = await db
    .from('products')
    .select('id, name, sku, price, in_stock')
    .order('name')

  const listaProductos = productos ?? []

  const idsConFoto = listaProductos.map((p) => p.id as number)
  const fotos = new Map<number, string>()
  if (idsConFoto.length > 0) {
    const { data: imagenes } = await db
      .from('product_images')
      .select('product_id, src, position')
      .in('product_id', idsConFoto)
      .order('position')
    for (const img of imagenes ?? []) {
      const pid = img.product_id as number
      if (!fotos.has(pid)) fotos.set(pid, imagenServida(img.src as string))
    }
  }

  const aFila = (p: (typeof listaProductos)[number]) => ({
    id: p.id as number,
    nombre: titleCase(p.name as string),
    sku: (p.sku as string | null) ?? '',
    precio: p.price === null ? 0 : Number(p.price),
    enStock: Boolean(p.in_stock),
    foto: fotos.get(p.id as number) ?? null,
    cuantasCategorias: categoriasPorProducto.get(p.id as number) ?? 0,
  })

  const dentro = listaProductos.filter((p) => enEstaCategoria.has(p.id as number)).map(aFila)

  /**
   * Candidatos para agregar.
   *
   * Usa la misma búsqueda tolerante a faltas que la tienda: quien administra
   * también escribe «amazadora».
   */
  const termino = buscar.trim()
  let candidatos: ReturnType<typeof aFila>[] = []
  if (termino) {
    // normalize() y no toLowerCase(): hay que quitar las tildes igual que
    // hace la tienda, o buscar «artículos» no encuentra «Articulos de
    // pastelería». La comparación tolerante vive en lib/busqueda.
    const terminos = normalize(termino).split(/\s+/).filter(Boolean)
    candidatos = listaProductos
      .filter((p) => !enEstaCategoria.has(p.id as number))
      .map((p) => ({
        fila: aFila(p),
        puntaje: puntuar(
          camposDe({
            nombre: p.name as string,
            sku: (p.sku as string | null) ?? '',
            cuerpo: '',
          }),
          terminos,
        ).puntaje,
      }))
      .filter((r) => r.puntaje > 0)
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, RESULTADOS)
      .map((r) => r.fila)
  }

  const categoriasCrudas = (todas.data ?? []).map((c) => ({
    id: c.id as number,
    nombre: c.name as string,
    slug: c.slug as string,
    padreId: (c.parent_id as number | null) ?? null,
  }))

  const hijas = categoriasCrudas.filter((c) => c.padreId === categoriaId)
  const padre = categoria.parent_id
    ? categoriasCrudas.find((c) => c.id === categoria.parent_id)
    : null

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/categorias"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Categorías
        </Link>

        {dentro.length > 0 && (
          <Link
            href={`/categorias/${categoria.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
          >
            Ver en la tienda
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-950">
        {titleCase(categoria.name)}
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-500">
        <span>/categorias/{categoria.slug}</span>
        {padre && <span>· dentro de {titleCase(padre.nombre)}</span>}
        <span>
          · {dentro.length} {dentro.length === 1 ? 'producto' : 'productos'}
        </span>
      </p>

      {dentro.length === 0 && hijas.length === 0 && (
        <p className="mt-4 flex gap-2 border border-ink-200 bg-white p-3 text-xs leading-relaxed text-ink-600">
          <EyeOff aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ink-400" />
          <span>
            Esta categoría <strong>todavía no se ve en la tienda</strong>: las que no tienen
            productos no se muestran. Aparece en cuanto le agregues uno.
          </span>
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-10">
        <DatosDeLaCategoria
          categoria={{
            id: categoria.id as number,
            nombre: categoria.name as string,
            slug: categoria.slug as string,
            padreId: (categoria.parent_id as number | null) ?? null,
            descripcion: (categoria.description as string | null) ?? '',
          }}
          categorias={categoriasCrudas}
          cuantasHijas={hijas.length}
          puedeEscribir={Boolean(sesion?.puedeEscribir)}
        />

        <ProductosDeLaCategoria
          categoriaId={categoria.id as number}
          dentro={dentro}
          candidatos={candidatos}
          termino={termino}
          puedeEscribir={Boolean(sesion?.puedeEscribir)}
        />
      </div>

      {sesion?.puedeEscribir && (
        <BorrarCategoria
          categoriaId={categoria.id as number}
          nombre={titleCase(categoria.name)}
          cuantosProductos={dentro.length}
          cuantasHijas={hijas.length}
          quedarianSinCategoria={dentro.filter((p) => p.cuantasCategorias <= 1).length}
          puedeBorrar={Boolean(sesion?.puedeBorrar)}
        />
      )}
    </div>
  )
}
