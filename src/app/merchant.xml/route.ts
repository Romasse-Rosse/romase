import { getCatalog } from '@/lib/catalog'
import { titleCase } from '@/lib/format'
import { origenDelSitio } from '@/lib/origen'
import { site } from '@/lib/site'
import { construirFeed, motivoDeExclusion, type ItemDelFeed } from '@/lib/merchant'

/**
 * Feed de productos para Google Merchant Center, en /merchant.xml
 *
 * Se configura una sola vez en Merchant Center como «fetch programado» y Google
 * lo va a buscar todos los días. No hay nada que empujar desde acá.
 *
 * ------------------------------------------------------------------
 * Por qué los enlaces usan el host que sirve el feed
 * ------------------------------------------------------------------
 * `site.url` es el dominio canónico —romase.cl—, y hoy ese dominio todavía
 * apunta al WordPress viejo. Si el feed pusiera esos enlaces, Google entraría a
 * fichas del sitio anterior, con otros precios, y desaprobaría los productos
 * por no coincidir.
 *
 * Usando el origen real, el feed es coherente consigo mismo en los dos
 * momentos: hoy servido desde Render apunta a Render, y cuando el dominio
 * apunte acá apuntará a romase.cl. Sin tocar nada.
 *
 * Es el mismo criterio que la URL de retorno de Webpay, y por la misma razón.
 */

// Una hora. Merchant Center lo lee una vez al día, así que no hace falta más;
// y con esto un cambio de precio del panel llega al feed sin esperar.
export const revalidate = 3600

export async function GET() {
  const [{ products, categories }, origen] = await Promise.all([getCatalog(), origenDelSitio()])

  const porId = new Map(categories.map((c) => [c.id, c]))

  /** «Panadería > Amasadoras», con la rama completa. */
  const rutaDeCategoria = (ids: number[]): string => {
    // La más específica: la que tiene padre gana sobre la raíz.
    const hoja = ids.map((id) => porId.get(id)).find((c) => c?.parentId) ?? porId.get(ids[0] ?? -1)
    if (!hoja) return ''
    const padre = hoja.parentId ? porId.get(hoja.parentId) : null
    return padre
      ? `${titleCase(padre.name)} > ${titleCase(hoja.name)}`
      : titleCase(hoja.name)
  }

  const items: ItemDelFeed[] = []
  for (const producto of products) {
    // Los que Merchant Center rechazaría no se mandan: es mejor un feed de 213
    // productos aprobados que uno de 214 con un error permanente en el panel de
    // Google. `yarn merchant:auditar` dice cuáles quedaron afuera y por qué.
    if (motivoDeExclusion(producto)) continue
    items.push({
      producto,
      nombre: titleCase(producto.name),
      rutaCategoria: rutaDeCategoria(producto.categoryIds),
    })
  }

  const xml = construirFeed({
    items,
    origen,
    nombreTienda: site.name,
    descripcionTienda: site.description,
  })

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
