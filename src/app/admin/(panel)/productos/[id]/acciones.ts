'use server'

import { revalidatePath } from 'next/cache'
import { clienteDelPanel, exigirEscritura, sesionDelPanel } from '@/lib/panel'
import { olvidarCatalogo } from '@/lib/catalog'

export type EstadoGuardado = { ok?: string; error?: string }

/**
 * Acciones del editor de producto.
 *
 * Todas empiezan con `exigirEscritura()`. Es redundante con las políticas de la
 * base —Postgres va a rechazar la escritura de un viewer de todos modos— y así
 * tiene que ser: la comprobación acá da un mensaje entendible, y la de la base
 * es la que no se puede saltear.
 */

/**
 * Hace visible en la tienda lo que se acaba de guardar.
 *
 * Dos invalidaciones, porque hay dos cachés y las dos hacen falta:
 *
 *   · el catálogo vive en memoria del proceso hasta una hora;
 *   · las páginas de producto y categoría están generadas de antemano.
 *
 * Invalidar solo una deja al cliente guardando cambios que no aparecen, que es
 * la peor forma de que un panel se sienta roto: sin error, sin efecto.
 */
async function refrescarTienda(slug: string, productoId: number) {
  olvidarCatalogo()

  revalidatePath(`/productos/${slug}`)
  revalidatePath('/')

  // Las categorías del producto: sus listados muestran precio y stock.
  const db = await clienteDelPanel()
  const { data } = await db
    .from('product_categories')
    .select('categories(slug)')
    .eq('product_id', productoId)

  for (const fila of data ?? []) {
    const categoria = fila.categories as { slug?: string } | null
    if (categoria?.slug) revalidatePath(`/categorias/${categoria.slug}`)
  }

  revalidatePath(`/admin/productos/${productoId}`)
}

/** Lee un número escrito a mano: acepta «1.290.000», «1290000» y vacío. */
function aNumero(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? '').replace(/[^\d]/g, '')
  if (!texto) return null
  const n = Number(texto)
  return Number.isFinite(n) ? n : null
}

export async function guardarProducto(
  _previo: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  try {
    await exigirEscritura()

    const id = Number(formData.get('id'))
    if (!Number.isFinite(id)) return { error: 'Falta el producto.' }

    const nombre = String(formData.get('name') ?? '').trim()
    if (nombre.length < 2) return { error: 'El nombre no puede quedar vacío.' }

    const precio = aNumero(formData.get('price'))
    if (precio === null) return { error: 'El precio tiene que ser un número.' }

    const precioNormal = aNumero(formData.get('regular_price'))
    const precioOferta = aNumero(formData.get('sale_price'))

    /**
     * La oferta tiene que ser menor que el precio normal.
     *
     * Si no, la tienda muestra un precio tachado más bajo que el vigente y
     * parece un error de la web. La comprobación es la misma que usa el
     * catálogo para decidir si algo está en oferta.
     */
    if (precioOferta !== null && precioNormal !== null && precioOferta >= precioNormal) {
      return {
        error:
          'El precio de oferta tiene que ser menor que el normal. Si no hay oferta, dejá ese ' +
          'campo vacío.',
      }
    }

    const db = await clienteDelPanel()

    const { error } = await db
      .from('products')
      .update({
        name: nombre,
        sku: String(formData.get('sku') ?? '').trim() || null,
        short_description: String(formData.get('short_description') ?? '').trim() || null,
        description: String(formData.get('description') ?? '').trim() || null,
        price: precio,
        regular_price: precioNormal ?? precio,
        sale_price: precioOferta,
        in_stock: formData.get('in_stock') !== null,
        featured: formData.get('featured') !== null,
      })
      .eq('id', id)

    if (error) return { error: `No se pudo guardar: ${error.message}` }

    await refrescarTienda(String(formData.get('slug') ?? ''), id)
    return { ok: 'Guardado. Ya se ve en la tienda.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/**
 * Anota en la base una foto que el navegador ya subió a Storage.
 *
 * El archivo no pasa por acá: se sube directo del navegador a Supabase, y esta
 * acción solo registra la fila. Ver src/lib/panel-navegador.ts.
 */
export async function registrarImagen(
  productoId: number,
  src: string,
  alt: string,
  slug: string,
): Promise<EstadoGuardado> {
  try {
    await exigirEscritura()
    const db = await clienteDelPanel()

    // Va al final: la primera foto es la que se usa como portada y no conviene
    // que subir una nueva le cambie la principal al producto sin avisar.
    const { data: ultima } = await db
      .from('product_images')
      .select('position')
      .eq('product_id', productoId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { error } = await db.from('product_images').insert({
      product_id: productoId,
      src,
      alt: alt.trim() || null,
      position: (ultima?.position ?? -1) + 1,
    })

    if (error) return { error: `La foto se subió pero no se pudo anotar: ${error.message}` }

    await refrescarTienda(slug, productoId)
    return { ok: 'Foto agregada.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

export async function borrarImagen(
  imagenId: number,
  productoId: number,
  slug: string,
): Promise<EstadoGuardado> {
  try {
    const sesion = await exigirEscritura()
    if (!sesion.puedeBorrar) {
      return { error: 'Tu rol puede agregar y reordenar fotos, pero no borrarlas.' }
    }

    const db = await clienteDelPanel()
    const { error } = await db.from('product_images').delete().eq('id', imagenId)
    if (error) return { error: `No se pudo borrar: ${error.message}` }

    /**
     * El archivo se queda en Storage a propósito.
     *
     * Borrar la fila es reversible: se vuelve a anotar. Borrar el archivo no.
     * Y una misma foto puede estar referenciada en otro producto o en una nota
     * del blog. La limpieza de archivos huérfanos es una tarea aparte, no un
     * efecto de apretar «quitar».
     */
    await refrescarTienda(slug, productoId)
    return { ok: 'Foto quitada del producto.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/** Sube o baja una foto en el orden. La primera es la portada. */
export async function moverImagen(
  imagenId: number,
  productoId: number,
  direccion: 'sube' | 'baja',
  slug: string,
): Promise<EstadoGuardado> {
  try {
    await exigirEscritura()
    const db = await clienteDelPanel()

    const { data: fotos, error: errorLectura } = await db
      .from('product_images')
      .select('id, position')
      .eq('product_id', productoId)
      .order('position')

    if (errorLectura) return { error: errorLectura.message }

    const lista = fotos ?? []
    const i = lista.findIndex((f) => f.id === imagenId)
    const j = direccion === 'sube' ? i - 1 : i + 1
    if (i === -1 || j < 0 || j >= lista.length) return {}

    /**
     * Se reescriben todas las posiciones, no se intercambian dos.
     *
     * Las posiciones que vinieron del WooCommerce tienen huecos y repetidos.
     * Intercambiar dos valores en una lista con repetidos deja un orden que
     * depende de cómo la base devuelva los empates, o sea impredecible.
     * Renumerar de 0 en adelante después de mover deja el orden explícito.
     */
    const reordenada = [...lista]
    ;[reordenada[i], reordenada[j]] = [reordenada[j], reordenada[i]]

    for (const [posicion, foto] of reordenada.entries()) {
      if (foto.position === posicion) continue
      const { error } = await db
        .from('product_images')
        .update({ position: posicion })
        .eq('id', foto.id)
      if (error) return { error: `No se pudo reordenar: ${error.message}` }
    }

    await refrescarTienda(slug, productoId)
    return { ok: 'Orden actualizado.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/** Texto alternativo de una foto: lo lee quien usa lector de pantalla. */
export async function guardarAlt(
  imagenId: number,
  productoId: number,
  alt: string,
  slug: string,
): Promise<EstadoGuardado> {
  try {
    await exigirEscritura()
    const db = await clienteDelPanel()
    const { error } = await db
      .from('product_images')
      .update({ alt: alt.trim() || null })
      .eq('id', imagenId)
    if (error) return { error: error.message }

    await refrescarTienda(slug, productoId)
    return { ok: 'Descripción de la foto guardada.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/** Para el formulario: quién es y qué puede hacer, sin exponer la sesión. */
export async function permisos() {
  const sesion = await sesionDelPanel()
  return {
    puedeEscribir: Boolean(sesion?.puedeEscribir),
    puedeBorrar: Boolean(sesion?.puedeBorrar),
  }
}

/**
 * Borra un producto.
 *
 * Solo owner y admin, igual que la política de la base. Un editor puede
 * despublicarlo —quitarle «disponible para comprar»—, que es reversible.
 *
 * Qué se lleva, comprobado sobre la base y no solo leído del esquema:
 *
 *   product_images      → se borran sus fotos (cascade)
 *   product_categories  → se borra la fila que lo une a su categoría (cascade).
 *                         **La categoría no se toca**: sigue con sus otros
 *                         productos. Medido: 64 categorías antes y después.
 *   promotions          → se borran las suyas (cascade)
 *   order_items         → **se conservan**, con el vínculo en nulo (set null)
 *
 * Esa última línea es la que importa: el nombre, el SKU y el precio de cada
 * línea de pedido se congelaron al comprar, justamente para que el historial de
 * ventas no dependa del catálogo. Borrar un producto vendido no borra la venta.
 *
 * Aun así conviene despublicar antes que borrar: despublicar se deshace.
 */
export async function eliminarProducto(id: number, slug: string): Promise<EstadoGuardado> {
  try {
    const sesion = await exigirEscritura()
    if (!sesion.puedeBorrar) {
      return {
        error:
          'Tu rol puede editar y despublicar productos, pero no borrarlos. Pedile a un owner o ' +
          'admin que lo haga.',
      }
    }

    const db = await clienteDelPanel()

    // Las categorías se leen antes de borrar: después no hay de dónde sacarlas
    // para invalidar sus listados.
    const { data: enCategorias } = await db
      .from('product_categories')
      .select('categories(slug)')
      .eq('product_id', id)

    const { error } = await db.from('products').delete().eq('id', id)
    if (error) return { error: `No se pudo borrar: ${error.message}` }

    olvidarCatalogo()
    revalidatePath('/')
    revalidatePath(`/productos/${slug}`)
    revalidatePath('/admin/productos')
    for (const fila of enCategorias ?? []) {
      const categoria = fila.categories as { slug?: string } | null
      if (categoria?.slug) revalidatePath(`/categorias/${categoria.slug}`)
    }

    return { ok: 'Producto borrado.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}
