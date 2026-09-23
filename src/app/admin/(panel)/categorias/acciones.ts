'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { clienteDelPanel, exigirEscritura } from '@/lib/panel'
import { olvidarCatalogo } from '@/lib/catalog'
import {
  aSlug,
  descendientes,
  EXPLICACION,
  motivoParaRechazarElPadre,
  slugLibre,
  type CategoriaCruda,
} from '@/lib/categorias-panel'

export type EstadoCategoria = { ok?: string; error?: string }

/**
 * Acciones del módulo de categorías.
 *
 * Todas empiezan con `exigirEscritura()`, redundante con las políticas de la
 * base a propósito: acá el mensaje se entiende, allá no se puede saltear.
 */

/**
 * Hace visible el cambio en la tienda.
 *
 * Una categoría toca el menú, la portada y los listados a la vez, así que se
 * invalida el subárbol completo. Es más de lo estrictamente necesario, y en
 * esto conviene equivocarse por exceso: una categoría a medias en el menú se ve
 * peor que unas regeneraciones de más.
 */
function refrescarTienda() {
  olvidarCatalogo()
  revalidatePath('/', 'layout')
  revalidatePath('/admin/categorias')
}

/** Las categorías tal como las necesita la validación de jerarquía. */
async function leerCategorias(): Promise<CategoriaCruda[]> {
  const db = await clienteDelPanel()
  const { data } = await db.from('categories').select('id, name, slug, parent_id')
  return (data ?? []).map((c) => ({
    id: c.id as number,
    nombre: c.name as string,
    slug: c.slug as string,
    padreId: (c.parent_id as number | null) ?? null,
  }))
}

function leerPadre(formData: FormData): number | null {
  const bruto = String(formData.get('padre') ?? '').trim()
  if (!bruto || bruto === 'raiz') return null
  const n = Number(bruto)
  return Number.isFinite(n) ? n : null
}

export async function crearCategoria(
  _previo: EstadoCategoria,
  formData: FormData,
): Promise<EstadoCategoria> {
  let destino: string | null = null

  try {
    await exigirEscritura()

    const nombre = String(formData.get('nombre') ?? '').trim()
    if (nombre.length < 3) return { error: 'Escribe el nombre de la categoría.' }

    const categorias = await leerCategorias()
    const padreId = leerPadre(formData)

    const motivo = motivoParaRechazarElPadre(null, padreId, categorias)
    if (motivo) return { error: EXPLICACION[motivo] }

    const slug = slugLibre(
      aSlug(nombre),
      categorias.map((c) => c.slug),
    )

    const db = await clienteDelPanel()
    const { data: creada, error } = await db
      .from('categories')
      .insert({
        name: nombre,
        slug,
        parent_id: padreId,
        description: String(formData.get('descripcion') ?? '').trim() || null,
      })
      .select('id')
      .single()

    if (error) {
      const faltaSecuencia = /null value in column "id"|not-null/i.test(error.message)
      return {
        error: faltaSecuencia
          ? 'Falta correr migration/admin-categorias.sql en Supabase: sin eso la base no sabe ' +
            'qué id darle a una categoría nueva.'
          : `No se pudo crear: ${error.message}`,
      }
    }

    refrescarTienda()
    destino = `/admin/categorias/${creada.id}`
  } catch (error) {
    return { error: (error as Error).message }
  }

  if (!destino) return { error: 'No se pudo crear la categoría.' }
  redirect(destino)
}

export async function guardarCategoria(
  _previo: EstadoCategoria,
  formData: FormData,
): Promise<EstadoCategoria> {
  try {
    await exigirEscritura()

    const id = Number(formData.get('id'))
    if (!Number.isFinite(id)) return { error: 'Falta la categoría.' }

    const nombre = String(formData.get('nombre') ?? '').trim()
    if (nombre.length < 3) return { error: 'El nombre no puede quedar vacío.' }

    const categorias = await leerCategorias()
    const padreId = leerPadre(formData)

    /**
     * Acá se impide el ciclo.
     *
     * Colgar una categoría de su propia descendiente deja la jerarquía dando
     * vueltas sobre sí misma, y el árbol del catálogo se arma con una función
     * recursiva: no se rompe la categoría, se cae la tienda entera. Postgres no
     * lo impide solo. Las reglas y sus pruebas están en lib/categorias-panel.
     */
    const motivo = motivoParaRechazarElPadre(id, padreId, categorias)
    if (motivo) return { error: EXPLICACION[motivo] }

    const db = await clienteDelPanel()
    const { error } = await db
      .from('categories')
      .update({
        name: nombre,
        parent_id: padreId,
        description: String(formData.get('descripcion') ?? '').trim() || null,
      })
      .eq('id', id)

    if (error) return { error: `No se pudo guardar: ${error.message}` }

    refrescarTienda()
    return { ok: 'Guardado. Ya se ve en la tienda.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/** Agrega productos a la categoría. No los saca de las otras que tengan. */
export async function agregarProductos(
  categoriaId: number,
  productoIds: number[],
): Promise<EstadoCategoria> {
  try {
    await exigirEscritura()
    if (productoIds.length === 0) return {}

    const db = await clienteDelPanel()

    // `upsert` sobre la clave compuesta: agregar dos veces el mismo producto no
    // puede ser un error, es una acción repetida.
    const { error } = await db
      .from('product_categories')
      .upsert(
        productoIds.map((product_id) => ({ product_id, category_id: categoriaId })),
        { onConflict: 'product_id,category_id' },
      )

    if (error) return { error: `No se pudieron agregar: ${error.message}` }

    refrescarTienda()
    return {
      ok: `${productoIds.length} ${productoIds.length === 1 ? 'producto agregado' : 'productos agregados'}.`,
    }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/**
 * Saca un producto de la categoría.
 *
 * Si es la única que tenía, el producto deja de aparecer en todo listado y solo
 * se llega por su dirección o por el buscador. Se avisa en vez de impedirlo:
 * puede ser exactamente lo que se quiere mientras se reorganiza.
 */
export async function quitarProducto(
  categoriaId: number,
  productoId: number,
): Promise<EstadoCategoria> {
  try {
    await exigirEscritura()
    const db = await clienteDelPanel()

    const { count } = await db
      .from('product_categories')
      .select('product_id', { count: 'exact', head: true })
      .eq('product_id', productoId)

    const { error } = await db
      .from('product_categories')
      .delete()
      .eq('category_id', categoriaId)
      .eq('product_id', productoId)

    if (error) return { error: `No se pudo quitar: ${error.message}` }

    refrescarTienda()
    return {
      ok:
        (count ?? 0) <= 1
          ? 'Producto quitado. Era su única categoría, así que ya no aparece en ningún listado ' +
            'de la tienda: solo por buscador o por su dirección.'
          : 'Producto quitado de esta categoría.',
    }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/**
 * Borra una categoría.
 *
 * Se niega si tiene subcategorías. No es una comodidad: `parent_id` está
 * declarado `on delete set null`, así que al borrar la madre las hijas no se
 * borran, **se convierten en categorías raíz** y aparecen en el menú principal
 * del sitio. Nadie que aprieta «borrar» está pidiendo eso.
 */
export async function borrarCategoria(id: number): Promise<EstadoCategoria> {
  try {
    const sesion = await exigirEscritura()
    if (!sesion.puedeBorrar) {
      return { error: 'Para borrar una categoría hace falta el rol owner o admin.' }
    }

    const categorias = await leerCategorias()
    const hijas = descendientes(id, categorias)
    if (hijas.size > 0) {
      return {
        error:
          `Esta categoría tiene ${hijas.size} ${hijas.size === 1 ? 'subcategoría' : 'subcategorías'}. ` +
          'Si se borrara, no se borrarían con ella: pasarían a ser categorías principales y ' +
          'aparecerían en el menú del sitio. Muévelas o bórralas primero.',
      }
    }

    const db = await clienteDelPanel()
    const { error } = await db.from('categories').delete().eq('id', id)
    if (error) return { error: `No se pudo borrar: ${error.message}` }

    refrescarTienda()
    return { ok: 'Categoría borrada.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}
