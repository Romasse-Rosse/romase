import { cache } from 'react'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { normalize, stripHtml } from './format'
import { nombreCategoria } from '@/content/nombres-categorias'
import { categoriasDeProducto } from '@/content/productos-sin-categoria'
import { portadasCategorias } from '@/content/portadas-categorias'
import imagenesLocales from '../../migration/data/imagenes-locales.json'

// ============================================================
// Fuente de datos del catálogo.
//
// Si hay credenciales de Supabase, lee de ahí. Si no, cae al snapshot
// JSON que bajó migration/fetch-catalog.mjs desde romase.cl. Las dos
// rutas devuelven exactamente la misma forma, así que el resto de la
// app no se entera de cuál está activa.
//
// El catálogo entero (214 productos) se carga en memoria y se cachea.
// A esta escala filtrar y buscar en JS es más simple y más rápido que
// ir a la base por cada consulta; habría que revisarlo por encima de
// unos pocos miles de productos.
// ============================================================

export type Faq = { pregunta: string; respuesta: string }

export type Category = {
  id: number
  name: string
  slug: string
  parentId: number | null
  description: string | null
  seoContent: string | null
  faqs: Faq[]
  imageUrl: string | null
  productCount: number
}

export type CategoryNode = Category & { children: CategoryNode[] }

export type ProductImage = { src: string; alt: string }

export type Product = {
  id: number
  name: string
  slug: string
  sku: string | null
  description: string | null
  shortDescription: string | null
  price: number
  regularPrice: number | null
  salePrice: number | null
  onSale: boolean
  inStock: boolean
  featured: boolean
  images: ProductImage[]
  categoryIds: number[]
  legacyPermalink: string | null
}

export type Catalog = {
  products: Product[]
  categories: Category[]
  source: 'supabase' | 'snapshot'
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// ------------------------------------------------------------
// Supabase
// ------------------------------------------------------------
async function loadFromSupabase(): Promise<Catalog> {
  const db = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: false } })

  const [categories, products, images, links] = await Promise.all([
    db.from('categories').select('*').order('position'),
    db.from('products').select('*').order('name'),
    db.from('product_images').select('product_id, src, alt, position').order('position'),
    db.from('product_categories').select('product_id, category_id'),
  ])

  const failed = [categories, products, images, links].find((r) => r.error)
  if (failed?.error) throw new Error(failed.error.message)

  const imagesByProduct = new Map<number, ProductImage[]>()
  for (const img of images.data ?? []) {
    const list = imagesByProduct.get(img.product_id) ?? []
    list.push({ src: img.src, alt: img.alt ?? '' })
    imagesByProduct.set(img.product_id, list)
  }

  const categoriesByProduct = new Map<number, number[]>()
  for (const link of links.data ?? []) {
    const list = categoriesByProduct.get(link.product_id) ?? []
    list.push(link.category_id)
    categoriesByProduct.set(link.product_id, list)
  }

  return {
    source: 'supabase',
    categories: (categories.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parent_id ?? null,
      description: c.description ?? null,
      seoContent: c.seo_content ?? null,
      faqs: Array.isArray(c.faqs) ? (c.faqs as Faq[]) : [],
      imageUrl: c.image_url ?? null,
      productCount: c.product_count ?? 0,
    })),
    products: (products.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku ?? null,
      description: p.description ?? null,
      shortDescription: p.short_description ?? null,
      price: Number(p.price),
      regularPrice: p.regular_price === null ? null : Number(p.regular_price),
      salePrice: p.sale_price === null ? null : Number(p.sale_price),
      onSale: p.sale_price !== null && Number(p.sale_price) < Number(p.regular_price),
      inStock: Boolean(p.in_stock),
      featured: Boolean(p.featured),
      images: imagesByProduct.get(p.id) ?? [],
      categoryIds: categoriesByProduct.get(p.id) ?? [],
      legacyPermalink: p.legacy_permalink ?? null,
    })),
  }
}

// ------------------------------------------------------------
// Snapshot local (lo que bajó fetch-catalog.mjs de WooCommerce)
// ------------------------------------------------------------
type WooProduct = {
  id: number
  name: string
  slug: string
  sku: string
  description: string
  short_description: string
  permalink: string
  on_sale: boolean
  is_in_stock: boolean
  prices: { price: string; regular_price: string; sale_price: string }
  images: { src: string; alt: string }[]
  categories: { id: number }[]
}

type WooCategory = {
  id: number
  name: string
  slug: string
  parent: number
  description: string
  count: number
  image: { src: string } | null
}

async function readSnapshot<T>(name: string): Promise<T> {
  const file = path.join(process.cwd(), 'migration', 'data', `${name}.json`)
  return JSON.parse(await readFile(file, 'utf8')) as T
}

async function loadFromSnapshot(): Promise<Catalog> {
  const [wooProducts, wooCategories] = await Promise.all([
    readSnapshot<WooProduct[]>('products'),
    readSnapshot<WooCategory[]>('categories'),
  ])

  return {
    source: 'snapshot',
    categories: wooCategories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parent || null,
      description: c.description || null,
      seoContent: null,
      faqs: [],
      imageUrl: c.image?.src ?? null,
      productCount: c.count ?? 0,
    })),
    products: wooProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || null,
      description: p.description || null,
      shortDescription: p.short_description || null,
      price: Number(p.prices?.price ?? 0),
      regularPrice: Number(p.prices?.regular_price ?? 0),
      salePrice: p.on_sale ? Number(p.prices?.sale_price ?? 0) : null,
      onSale: Boolean(p.on_sale),
      inStock: Boolean(p.is_in_stock),
      featured: false,
      images: (p.images ?? []).map((i) => ({ src: i.src, alt: i.alt || p.name })),
      categoryIds: (p.categories ?? []).map((c) => c.id),
      legacyPermalink: p.permalink || null,
    })),
  }
}

const local = imagenesLocales as Record<string, string>

/**
 * Traduce la URL original de una foto a la copia local.
 *
 * Las fotos llegaron del WordPress y `product_images.src` guarda esa URL. El
 * sitio no la usa: sirve una copia ya bajada y redimensionada, y este mapa dice
 * cuál. Lo que no está en el mapa se devuelve tal cual, y eso es lo que hace que
 * una imagen nueva subida al panel —que vive en Supabase Storage— funcione sin
 * tocar nada más.
 *
 * Se exporta para que el panel muestre exactamente la misma imagen que la
 * tienda. Cuando cada uno resuelve la ruta por su cuenta, el panel enseña una
 * foto y la tienda otra.
 */
export function imagenServida(src: string): string {
  return local[src] ?? src
}

async function construirCatalogo(): Promise<Catalog> {
  let catalog: Catalog | null = null

  if (supabaseConfigured) {
    try {
      catalog = await loadFromSupabase()
    } catch (error) {
      // No se cae el sitio si Supabase no responde: se sigue con el snapshot.
      console.warn(
        `[catalogo] Supabase no respondió (${(error as Error).message}). Usando snapshot local.`,
      )
    }
  }

  catalog ??= await loadFromSnapshot()

  // Correcciones que valen para las dos fuentes: nombres de categoría con
  // tildes y productos que llegaron sin categoría asignada.
  return {
    ...catalog,
    categories: catalog.categories.map((c) => ({ ...c, name: nombreCategoria(c.slug, c.name) })),
    products: catalog.products.map((p) => ({
      ...p,
      categoryIds: categoriasDeProducto(p.sku, p.categoryIds),
      // Las fotos se sirven desde el propio sitio: ya bajadas y
      // redimensionadas por scripts/localize-product-images.mjs. Antes venían
      // de romase.cl pesando cientos de KB y se optimizaban en cada arranque
      // en frío, que era lo que hacía esperar segundos a la primera carga.
      images: p.images.map((i) => ({ ...i, src: imagenServida(i.src) })),
    })),
  }
}

// ------------------------------------------------------------
// El catálogo se guarda a nivel de módulo, compartido entre peticiones.
//
// cache() de React deduplica dentro de un mismo render, no entre requests:
// sin esto, cada visita a /productos y cada tecleo en el buscador volvía a
// leer y parsear 1,1 MB de JSON y a reconstruir los 214 productos. La memoria
// crecía pedido a pedido hasta que la instancia se reiniciaba y devolvía 502.
// ------------------------------------------------------------
const VIGENCIA = 60 * 60 * 1000 // una hora, igual que el revalidate de las páginas

let enMemoria: { datos: Catalog; expira: number } | null = null
let cargaEnCurso: Promise<Catalog> | null = null

/**
 * Devuelve el catálogo, reutilizándolo entre peticiones.
 *
 * Las acciones de servidor tienen que usar esta función y no getCatalog():
 * cache() de React necesita el contexto de un render, y una acción no corre
 * dentro de uno.
 */
export async function loadCatalog(): Promise<Catalog> {
  if (enMemoria && enMemoria.expira > Date.now()) return enMemoria.datos

  // Si llegan varias peticiones a la vez comparten la misma carga en lugar de
  // dispararla cada una por su cuenta, que era lo que reventaba el arranque en
  // frío.
  cargaEnCurso ??= construirCatalogo()
    .then((datos) => {
      enMemoria = { datos, expira: Date.now() + VIGENCIA }
      return datos
    })
    .finally(() => {
      cargaEnCurso = null
    })

  return cargaEnCurso
}

/** Deduplica además dentro de un mismo render. */
export const getCatalog = cache(loadCatalog)

// ============================================================
// Consultas derivadas
// ============================================================

/** Árbol de categorías; solo devuelve las que tienen productos. */
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const { categories, products } = await getCatalog()

  // Los productos suelen estar asignados solo a la subcategoría, no a la raíz:
  // PANADERÍA, por ejemplo, no tiene ni un producto asignado directamente.
  // Por eso el conteo tiene que subir por el árbol, y contar productos
  // distintos —un producto asignado a la raíz y a una hija cuenta una vez—.
  const directos = new Map<number, Set<number>>()
  for (const p of products) {
    for (const id of p.categoryIds) {
      const set = directos.get(id) ?? new Set<number>()
      set.add(p.id)
      directos.set(id, set)
    }
  }

  const nodes = new Map<number, CategoryNode>(
    categories.map((c) => [c.id, { ...c, productCount: 0, children: [] }]),
  )

  const roots: CategoryNode[] = []
  for (const node of nodes.values()) {
    const parent = node.parentId === null ? null : nodes.get(node.parentId)
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  // Acumula hacia arriba: cada nodo termina con los productos de su rama.
  const acumular = (node: CategoryNode): Set<number> => {
    const propios = new Set(directos.get(node.id) ?? [])
    for (const hijo of node.children) {
      for (const id of acumular(hijo)) propios.add(id)
    }
    node.productCount = propios.size
    return propios
  }
  roots.forEach(acumular)

  const sortTree = (list: CategoryNode[]): CategoryNode[] =>
    list
      .filter((n) => n.productCount > 0 || n.children.length > 0)
      .map((n) => ({ ...n, children: sortTree(n.children) }))
      .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name, 'es'))

  return sortTree(roots)
})

export const getRootCategories = cache(async (): Promise<CategoryNode[]> => getCategoryTree())

/**
 * Foto que ilustra cada categoría raíz en la portada.
 *
 * Sale de un producto real, elegido a mano en `portadas-categorias.ts`. Si ese
 * producto ya no está —se descatalogó, cambió de slug—, la categoría cae al
 * primer producto de su rama que tenga foto: la tarjeta nunca queda vacía.
 */
export const getCategoryCovers = cache(async (): Promise<Record<string, ProductImage>> => {
  const [{ products }, arbol] = await Promise.all([getCatalog(), getCategoryTree()])
  const porSlug = new Map(products.map((p) => [p.slug, p]))

  const portadas: Record<string, ProductImage> = {}

  for (const raiz of arbol) {
    const elegido = porSlug.get(portadasCategorias[raiz.slug] ?? '')
    if (elegido?.images[0]) {
      portadas[raiz.slug] = elegido.images[0]
      continue
    }

    const ids = new Set(await getCategoryBranchIds(raiz.id))
    const respaldo = products.find(
      (p) => p.images.length > 0 && p.categoryIds.some((id) => ids.has(id)),
    )
    if (respaldo) portadas[raiz.slug] = respaldo.images[0]
  }

  return portadas
})

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const { categories } = await getCatalog()
  return categories.find((c) => c.slug === slug) ?? null
})

/** Ids de una categoría y de toda su descendencia. */
export const getCategoryBranchIds = cache(async (categoryId: number): Promise<number[]> => {
  const { categories } = await getCatalog()
  const childrenOf = new Map<number, number[]>()
  for (const c of categories) {
    if (c.parentId === null) continue
    childrenOf.set(c.parentId, [...(childrenOf.get(c.parentId) ?? []), c.id])
  }

  const ids: number[] = []
  const walk = (id: number) => {
    ids.push(id)
    for (const child of childrenOf.get(id) ?? []) walk(child)
  }
  walk(categoryId)
  return ids
})

/** Ruta desde la raíz hasta la categoría, para las migas de pan. */
export const getCategoryPath = cache(async (slug: string): Promise<Category[]> => {
  const { categories } = await getCatalog()
  const byId = new Map(categories.map((c) => [c.id, c]))

  const path: Category[] = []
  let current = categories.find((c) => c.slug === slug) ?? null
  while (current) {
    path.unshift(current)
    current = current.parentId === null ? null : (byId.get(current.parentId) ?? null)
  }
  return path
})

// ------------------------------------------------------------
// Búsqueda
// ------------------------------------------------------------
function scoreProduct(product: Product, terms: string[]): number {
  const name = normalize(product.name)
  const sku = normalize(product.sku ?? '')
  const body = normalize(stripHtml(product.shortDescription) + ' ' + stripHtml(product.description))

  let score = 0
  for (const term of terms) {
    if (name.startsWith(term)) score += 12
    else if (name.includes(term)) score += 8
    if (sku.includes(term)) score += 6
    if (body.includes(term)) score += 1
    // Un término que no aparece en ningún lado descarta el producto.
    if (!name.includes(term) && !sku.includes(term) && !body.includes(term)) return 0
  }
  return score
}

export type SortKey = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre' | 'novedades'

export type ProductQuery = {
  categorySlug?: string
  search?: string
  sort?: SortKey
  page?: number
  perPage?: number
  onlyInStock?: boolean
  minPrice?: number
  maxPrice?: number
}

export type ProductResults = {
  items: Product[]
  total: number
  page: number
  perPage: number
  totalPages: number
  priceRange: { min: number; max: number }
}

export async function queryProducts(query: ProductQuery = {}): Promise<ProductResults> {
  const { products } = await getCatalog()
  const { page = 1, perPage = 24, sort = 'relevancia' } = query

  let items = products

  if (query.categorySlug) {
    const category = await getCategoryBySlug(query.categorySlug)
    if (!category) {
      return { items: [], total: 0, page, perPage, totalPages: 0, priceRange: { min: 0, max: 0 } }
    }
    const branch = new Set(await getCategoryBranchIds(category.id))
    items = items.filter((p) => p.categoryIds.some((id) => branch.has(id)))
  }

  // El rango de precios del filtro se calcula antes de aplicar el propio
  // filtro de precio, para que el control no se cierre sobre sí mismo.
  const prices = items.map((p) => p.price)
  const priceRange = {
    min: prices.length ? Math.min(...prices) : 0,
    max: prices.length ? Math.max(...prices) : 0,
  }

  if (query.onlyInStock) items = items.filter((p) => p.inStock)
  if (typeof query.minPrice === 'number') items = items.filter((p) => p.price >= query.minPrice!)
  if (typeof query.maxPrice === 'number') items = items.filter((p) => p.price <= query.maxPrice!)

  let scored: { product: Product; score: number }[] | null = null
  const term = query.search?.trim()
  if (term) {
    const terms = normalize(term).split(/\s+/).filter(Boolean)
    scored = items
      .map((product) => ({ product, score: scoreProduct(product, terms) }))
      .filter((r) => r.score > 0)
    items = scored.map((r) => r.product)
  }

  const scoreOf = new Map(scored?.map((r) => [r.product.id, r.score]) ?? [])
  const sorted = [...items].sort((a, b) => {
    switch (sort) {
      case 'precio-asc':
        return a.price - b.price
      case 'precio-desc':
        return b.price - a.price
      case 'nombre':
        return a.name.localeCompare(b.name, 'es')
      case 'novedades':
        return b.id - a.id
      default:
        // Con búsqueda manda el puntaje; sin búsqueda, primero lo que hay en stock.
        if (scoreOf.size) return (scoreOf.get(b.id) ?? 0) - (scoreOf.get(a.id) ?? 0)
        return Number(b.inStock) - Number(a.inStock) || a.name.localeCompare(b.name, 'es')
    }
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)

  return {
    items: sorted.slice((safePage - 1) * perPage, safePage * perPage),
    total,
    page: safePage,
    perPage,
    totalPages,
    priceRange,
  }
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const { products } = await getCatalog()
  return products.find((p) => p.slug === slug) ?? null
})

/** Destacados curados en Supabase; si no hay ninguno, se eligen los mejor documentados. */
export const getFeaturedProducts = cache(async (limit = 8): Promise<Product[]> => {
  const { products } = await getCatalog()

  const curated = products.filter((p) => p.featured && p.inStock)
  if (curated.length >= limit) return curated.slice(0, limit)

  const fallback = products
    .filter((p) => p.inStock && p.images.length > 0 && !curated.includes(p))
    .sort(
      (a, b) =>
        b.images.length - a.images.length ||
        stripHtml(b.description).length - stripHtml(a.description).length,
    )

  return [...curated, ...fallback].slice(0, limit)
})

/**
 * Destacados para el carrusel. Sin datos de venta no se puede hablar de «más
 * vendidos» sin inventarlo, así que se ordena por lo que sí se sabe: que esté
 * disponible, bien fotografiado y bien descrito.
 *
 * Cuando los pedidos empiecen a pasar por Supabase, esto se puede calcular de
 * verdad sumando order_items.
 */
export const getCarouselProducts = cache(async (limit = 12): Promise<Product[]> => {
  const { products } = await getCatalog()

  const curados = products.filter((p) => p.featured && p.inStock)
  const resto = products
    .filter((p) => p.inStock && p.images.length > 0 && !p.featured)
    .sort(
      (a, b) =>
        b.images.length - a.images.length ||
        stripHtml(b.description).length - stripHtml(a.description).length ||
        b.price - a.price,
    )

  return [...curados, ...resto].slice(0, limit)
})

/** Productos de la misma categoría, excluyendo el que se está viendo. */
export const getRelatedProducts = cache(
  async (productId: number, limit = 4): Promise<Product[]> => {
    const { products } = await getCatalog()
    const product = products.find((p) => p.id === productId)
    if (!product) return []

    const own = new Set(product.categoryIds)
    return products
      .filter((p) => p.id !== productId && p.categoryIds.some((id) => own.has(id)))
      .sort((a, b) => Number(b.inStock) - Number(a.inStock) || b.images.length - a.images.length)
      .slice(0, limit)
  },
)

export const getAllProductSlugs = cache(async (): Promise<string[]> => {
  const { products } = await getCatalog()
  return products.map((p) => p.slug)
})

export const getAllCategorySlugs = cache(async (): Promise<string[]> => {
  const { categories } = await getCatalog()
  return categories.map((c) => c.slug)
})
