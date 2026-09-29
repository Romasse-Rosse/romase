'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { clienteDelPanel, exigirEscritura } from '@/lib/panel'
import { olvidarCatalogo } from '@/lib/catalog'

export type EstadoNuevo = { error?: string }

/**
 * Convierte el nombre en dirección web.
 *
 * Se genera y no se pide a mano porque es un dato técnico: quien carga un
 * producto piensa en su nombre, no en su URL. Y una vez publicada no se puede
 * cambiar sin romper enlaces, así que conviene que salga bien la primera vez.
 */
function aSlug(nombre: string): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'producto'
  )
}

function aNumero(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? '').replace(/[^\d]/g, '')
  if (!texto) return null
  const n = Number(texto)
  return Number.isFinite(n) ? n : null
}

export async function crearProducto(
  _previo: EstadoNuevo,
  formData: FormData,
): Promise<EstadoNuevo> {
  let destino: string | null = null

  try {
    await exigirEscritura()

    const nombre = String(formData.get('name') ?? '').trim()
    if (nombre.length < 3) return { error: 'Escribe el nombre del producto.' }

    const disponible = formData.get('in_stock') !== null

    /**
     * Sin precio solo si tampoco se puede comprar.
     *
     * La columna no acepta NULL, así que un producto a cotizar se guarda en 0.
     * Eso no es un precio de un peso disfrazado: esBajoPedido() lo reconoce y
     * la tienda muestra «Bajo pedido» en vez de una cifra. Ver
     * src/lib/bajo-pedido.ts.
     */
    const precio = aNumero(formData.get('price'))
    if (precio === null && disponible) {
      return { error: 'Escribe el precio, o desmarca «Disponible para comprar» si se cotiza.' }
    }

    const categoriaId = Number(formData.get('categoria'))
    if (!Number.isFinite(categoriaId)) {
      return { error: 'Elige una categoría: sin eso el producto no aparece en ninguna parte.' }
    }

    const db = await clienteDelPanel()

    /**
     * El slug tiene que ser único: la columna lo exige y la URL lo necesita.
     *
     * Se busca el nombre base y sus variantes en una sola consulta y se elige
     * el primer número libre. Preguntar de a uno haría una consulta por
     * intento, y con nombres parecidos —«Molde cuadrado 24», «26», «28»— eso
     * pasa seguido.
     */
    const base = aSlug(nombre)
    const { data: parecidos } = await db
      .from('products')
      .select('slug')
      .like('slug', `${base}%`)

    const tomados = new Set((parecidos ?? []).map((p) => p.slug as string))
    let slug = base
    for (let n = 2; tomados.has(slug); n++) slug = `${base}-${n}`

    const { data: creado, error } = await db
      .from('products')
      .insert({
        name: nombre,
        slug,
        sku: String(formData.get('sku') ?? '').trim() || null,
        short_description: String(formData.get('short_description') ?? '').trim() || null,
        price: precio ?? 0,
        regular_price: precio ?? 0,
        in_stock: disponible,
        featured: false,
      })
      .select('id')
      .single()

    if (error) {
      // Sin secuencia en products.id el insert falla por id nulo. Es el error
      // que va a aparecer si falta correr la migración, así que conviene
      // decirlo en vez de mostrar el mensaje crudo de Postgres.
      const faltaSecuencia = /null value in column "id"|not-null/i.test(error.message)
      return {
        error: faltaSecuencia
          ? 'Falta correr migration/admin-productos-nuevos.sql en Supabase: sin eso la base no ' +
            'sabe qué id darle a un producto nuevo.'
          : `No se pudo crear: ${error.message}`,
      }
    }

    const { error: errorCategoria } = await db
      .from('product_categories')
      .insert({ product_id: creado.id, category_id: categoriaId })

    if (errorCategoria) {
      /**
       * Sin categoría el producto queda invisible: no sale en ningún listado y
       * solo se llega por la URL directa. Es peor que no haberlo creado, así
       * que se borra y se avisa.
       */
      await db.from('products').delete().eq('id', creado.id)
      return { error: `No se pudo asignar la categoría, el producto no se creó: ${errorCategoria.message}` }
    }

    olvidarCatalogo()
    revalidatePath('/')
    revalidatePath('/admin/productos')

    destino = `/admin/productos/${creado.id}`
  } catch (error) {
    return { error: (error as Error).message }
  }

  if (!destino) return { error: 'No se pudo crear el producto.' }

  // Fuera del try: redirect() lanza para interrumpir el render y el catch se lo
  // comería. Se va al editor, que es donde se cargan las fotos.
  redirect(destino)
}
