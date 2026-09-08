import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { clienteDelPanel, sesionDelPanel } from '@/lib/panel'
import { titleCase } from '@/lib/format'
import { FormularioNuevo } from './formulario'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Producto nuevo' }

export default async function ProductoNuevo() {
  const sesion = await sesionDelPanel()
  if (!sesion?.puedeEscribir) redirect('/admin/productos')

  const db = await clienteDelPanel()

  /**
   * Solo las categorías hoja, y con su rama para poder elegir bien.
   *
   * Un producto colgado de una categoría raíz —«Panadería»— aparece en el
   * listado del rubro pero no en ninguna subcategoría, y el cliente lo busca
   * donde debería estar y no lo encuentra. Se muestran las dos igual, con la
   * jerarquía visible, para que la elección sea consciente.
   */
  const { data: categorias } = await db
    .from('categories')
    .select('id, name, slug, parent_id, position')
    .order('position')

  const lista = categorias ?? []
  const porId = new Map(lista.map((c) => [c.id as number, c]))

  const opciones = lista
    .map((c) => {
      const padre = c.parent_id ? porId.get(c.parent_id as number) : null
      return {
        id: c.id as number,
        etiqueta: padre
          ? `${titleCase(padre.name as string)} › ${titleCase(c.name as string)}`
          : titleCase(c.name as string),
        esRaiz: !c.parent_id,
      }
    })
    .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'))

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Productos
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-950">Producto nuevo</h1>
      <p className="mt-1 text-sm text-ink-500">
        Con esto queda creado. Las fotos y el resto de los datos se cargan enseguida, en la ficha.
      </p>

      <div className="mt-8">
        <FormularioNuevo categorias={opciones} />
      </div>
    </div>
  )
}
