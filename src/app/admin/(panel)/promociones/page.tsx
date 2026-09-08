import { AlertCircle } from 'lucide-react'
import { clienteDelPanel, sesionDelPanel } from '@/lib/panel'
import { titleCase } from '@/lib/format'
import { estadoDeLaPromocion, type Promocion } from '@/lib/promociones'
import { CrearPromocion, ListaDePromociones } from './cliente'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Promociones' }

export default async function PromocionesPanel() {
  const sesion = await sesionDelPanel()
  const db = await clienteDelPanel()

  const [promos, categorias, productos, vinculos] = await Promise.all([
    db
      .from('promotions')
      .select('id, scope, product_id, category_id, percent, label, starts_at, ends_at, is_active')
      .order('created_at', { ascending: false }),
    db.from('categories').select('id, name, parent_id').order('position'),
    db.from('products').select('id, name, sku').order('name'),
    db.from('product_categories').select('product_id, category_id'),
  ])

  const faltaTabla = /does not exist|schema cache/i.test(promos.error?.message ?? '')

  const nombreCategoria = new Map(
    (categorias.data ?? []).map((c) => [c.id as number, titleCase(c.name as string)]),
  )
  const nombreProducto = new Map(
    (productos.data ?? []).map((p) => [p.id as number, titleCase(p.name as string)]),
  )

  // Cuántos productos toca cada categoría: sin este número, «Panadería al 20 %»
  // es una apuesta a ciegas sobre cuánto se está regalando.
  const productosPorCategoria = new Map<number, number>()
  for (const v of vinculos.data ?? []) {
    const id = v.category_id as number
    productosPorCategoria.set(id, (productosPorCategoria.get(id) ?? 0) + 1)
  }

  const ahora = Date.now()

  const lista = (promos.data ?? []).map((r) => {
    const promo: Promocion = {
      id: r.id as number,
      alcance: r.scope as 'producto' | 'categoria',
      productoId: (r.product_id as number | null) ?? null,
      categoriaId: (r.category_id as number | null) ?? null,
      porcentaje: Number(r.percent),
      etiqueta: (r.label as string | null) ?? null,
      desde: Date.parse(r.starts_at as string),
      hasta: r.ends_at ? Date.parse(r.ends_at as string) : null,
      activa: Boolean(r.is_active),
    }

    return {
      ...promo,
      estado: estadoDeLaPromocion(promo, ahora),
      objetivo:
        promo.alcance === 'producto'
          ? (nombreProducto.get(promo.productoId ?? -1) ?? `Producto ${promo.productoId}`)
          : (nombreCategoria.get(promo.categoriaId ?? -1) ?? `Categoría ${promo.categoriaId}`),
      cuantosProductos:
        promo.alcance === 'categoria'
          ? (productosPorCategoria.get(promo.categoriaId ?? -1) ?? 0)
          : 1,
    }
  })

  const opcionesCategoria = (categorias.data ?? [])
    .map((c) => {
      const padre = c.parent_id ? nombreCategoria.get(c.parent_id as number) : null
      const nombre = titleCase(c.name as string)
      return {
        id: c.id as number,
        etiqueta: `${padre ? `${padre} › ${nombre}` : nombre} · ${productosPorCategoria.get(c.id as number) ?? 0} productos`,
      }
    })
    .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'))

  const opcionesProducto = (productos.data ?? []).map((p) => ({
    id: p.id as number,
    etiqueta: `${titleCase(p.name as string)}${p.sku ? ` · ${p.sku}` : ''}`,
  }))

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Promociones</h1>
      <p className="mt-1 text-sm text-ink-500">
        Descuentos con fecha de inicio y término. El precio se calcula solo: cuando vence, deja de
        aplicarse sin que nadie tenga que apagarlo.
      </p>

      {faltaTabla && (
        <p
          role="alert"
          className="mt-6 flex gap-2 border border-amber-300 bg-amber-50 p-4 text-sm text-ink-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Falta correr <code className="text-xs">migration/admin-promociones.sql</code> en el SQL
            Editor de Supabase. Hasta entonces esta sección no puede guardar nada, y la tienda
            vende a precio de lista.
          </span>
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-10">
        <ListaDePromociones
          promociones={lista}
          puedeEscribir={Boolean(sesion?.puedeEscribir)}
          error={faltaTabla ? undefined : promos.error?.message}
        />

        {sesion?.puedeEscribir && (
          <CrearPromocion categorias={opcionesCategoria} productos={opcionesProducto} />
        )}
      </div>
    </div>
  )
}
