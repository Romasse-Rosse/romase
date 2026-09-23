import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { clienteDelPanel, sesionDelPanel } from '@/lib/panel'
import { titleCase } from '@/lib/format'
import { FormularioNuevaCategoria } from './formulario'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Categoría nueva' }

export default async function CategoriaNueva() {
  const sesion = await sesionDelPanel()
  if (!sesion?.puedeEscribir) redirect('/admin/categorias')

  const db = await clienteDelPanel()

  // Solo las raíces pueden ser madres: el sitio muestra dos niveles.
  const { data } = await db
    .from('categories')
    .select('id, name, parent_id')
    .is('parent_id', null)
    .order('name')

  const raices = (data ?? []).map((c) => ({
    id: c.id as number,
    etiqueta: titleCase(c.name as string),
  }))

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/categorias"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Categorías
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-950">Categoría nueva</h1>
      <p className="mt-1 text-sm text-ink-500">
        Al crearla te lleva a su ficha para agregarle productos.
      </p>

      <div className="mt-8">
        <FormularioNuevaCategoria raices={raices} />
      </div>
    </div>
  )
}
