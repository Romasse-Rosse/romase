import Link from 'next/link'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { clienteDelPanel, sesionDelPanel } from '@/lib/panel'
import { formatPrice } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Inicio' }

/**
 * Resumen de la tienda.
 *
 * Los números se leen con la sesión de quien entró, no con la llave secreta:
 * si mañana se agrega un rol que no deba ver pedidos, alcanza con cambiar la
 * política en la base y esta página se entera sola.
 */
export default async function PanelInicio() {
  const sesion = await sesionDelPanel()
  const db = await clienteDelPanel()

  const [productos, categorias, pedidos, pagados, consultas] = await Promise.all([
    db.from('products').select('id', { count: 'exact', head: true }),
    db.from('categories').select('id', { count: 'exact', head: true }),
    db.from('orders').select('id', { count: 'exact', head: true }),
    db.from('orders').select('total').eq('status', 'pagado'),
    db.from('leads').select('id', { count: 'exact', head: true }),
  ])

  const vendido = (pagados.data ?? []).reduce((n, o) => n + Number(o.total ?? 0), 0)

  // Si una consulta falla es casi siempre por permisos: conviene decirlo en vez
  // de mostrar un cero que parece un dato.
  const fallo = [productos, categorias, pedidos, pagados, consultas].find((r) => r.error)

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-950">
        Hola{sesion?.nombre ? `, ${sesion.nombre.split(' ')[0]}` : ''}
      </h1>
      <p className="mt-1 text-sm text-ink-500">Esto es lo que hay en la tienda ahora mismo.</p>

      {fallo && (
        <p
          role="alert"
          className="mt-6 flex gap-2 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Alguna consulta no se pudo leer: {fallo.error?.message}. Suele ser una política de la
            base que no permite ese acceso a tu rol.
          </span>
        </p>
      )}

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta titulo="Productos" valor={productos.count ?? 0} href="/admin/productos" />
        <Tarjeta titulo="Categorías" valor={categorias.count ?? 0} />
        <Tarjeta titulo="Pedidos" valor={pedidos.count ?? 0} />
        <Tarjeta titulo="Vendido y pagado" valor={formatPrice(vendido)} />
      </dl>

      <div className="mt-8 border border-ink-200 bg-white p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-ink-950">Qué se puede hacer hoy</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-600">
          <li>
            <Link
              href="/admin/productos"
              className="inline-flex items-center gap-1.5 text-brand-700 hover:underline"
            >
              Editar productos <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>{' '}
            — precio, stock, descripción, destacados e imágenes.
          </li>
          <li className="text-ink-400">
            Pedidos, categorías y blog: en construcción. Mientras tanto los pedidos se consultan en
            Supabase.
          </li>
        </ul>
        {consultas.count ? (
          <p className="mt-4 text-xs text-ink-500">
            Hay {consultas.count} {consultas.count === 1 ? 'consulta' : 'consultas'} del formulario
            de contacto guardadas.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function Tarjeta({
  titulo,
  valor,
  href,
}: {
  titulo: string
  valor: number | string
  href?: string
}) {
  const contenido = (
    <>
      <dt className="text-xs tracking-wide text-ink-500 uppercase">{titulo}</dt>
      <dd className="mt-1.5 text-2xl font-semibold text-ink-950">{valor}</dd>
    </>
  )

  if (!href) return <div className="border border-ink-200 bg-white p-5">{contenido}</div>

  return (
    <Link
      href={href}
      className="border border-ink-200 bg-white p-5 transition-colors hover:border-ink-400"
    >
      {contenido}
    </Link>
  )
}
