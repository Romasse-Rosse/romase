// ============================================================
// ROMASE · Carga el catálogo descargado de WooCommerce en Supabase.
//
//   1. node migration/fetch-catalog.mjs   (baja los datos de romase.cl)
//   2. Ejecutar migration/schema.sql en el SQL Editor de Supabase
//   3. node migration/seed-supabase.mjs   (este script)
//
// Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el .env.
// Es idempotente: se puede correr las veces que haga falta.
// ============================================================
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error(
    'Faltan credenciales. Definí SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el .env\n' +
      '(la service_role key, no la anon: el catálogo es de solo lectura para el público).',
  )
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

const json = async (name) =>
  JSON.parse(await readFile(new URL(`./data/${name}.json`, import.meta.url), 'utf8'))

/** WooCommerce devuelve los precios como enteros en la unidad mínima. En CLP no hay decimales. */
const toAmount = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Sube las filas en tandas para no pasarse del límite de payload de PostgREST. */
async function upsertAll(table, rows, options = {}) {
  const size = 200
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size)
    const { error } = await db.from(table).upsert(chunk, options)
    if (error) throw new Error(`${table}: ${error.message}`)
    process.stdout.write(`\r  ${table}: ${Math.min(i + size, rows.length)}/${rows.length}`)
  }
  process.stdout.write('\n')
}

const products = await json('products')
const categories = await json('categories')

// ------------------------------------------------------------
// Categorías. Se insertan primero las raíz y después las hijas,
// porque parent_id es una FK contra la propia tabla.
// ------------------------------------------------------------
const categoryRows = categories.map((c, index) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  parent_id: c.parent || null,
  description: c.description || null,
  image_url: c.image?.src || null,
  product_count: c.count ?? 0,
  position: index,
}))

console.log('Cargando categorías…')
await upsertAll('categories', categoryRows.filter((c) => !c.parent_id))
await upsertAll('categories', categoryRows.filter((c) => c.parent_id))

// ------------------------------------------------------------
// Productos
// ------------------------------------------------------------
console.log('Cargando productos…')
await upsertAll(
  'products',
  products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku || null,
    description: p.description || null,
    short_description: p.short_description || null,
    price: toAmount(p.prices?.price),
    regular_price: toAmount(p.prices?.regular_price),
    sale_price: p.on_sale ? toAmount(p.prices?.sale_price) : null,
    currency: p.prices?.currency_code || 'CLP',
    in_stock: Boolean(p.is_in_stock),
    featured: false, // se curan a mano desde Supabase
    legacy_permalink: p.permalink || null,
    updated_at: new Date().toISOString(),
  })),
)

// ------------------------------------------------------------
// Imágenes. Se reemplazan por completo en cada corrida para que
// borrar una imagen en el origen también la borre acá.
// ------------------------------------------------------------
console.log('Cargando imágenes…')
const productIds = products.map((p) => p.id)
for (let i = 0; i < productIds.length; i += 200) {
  const { error } = await db
    .from('product_images')
    .delete()
    .in('product_id', productIds.slice(i, i + 200))
  if (error) throw new Error(`product_images (limpieza): ${error.message}`)
}

const imageRows = products.flatMap((p) =>
  (p.images ?? []).map((img, position) => ({
    product_id: p.id,
    src: img.src,
    alt: img.alt || p.name,
    position,
  })),
)
await upsertAll('product_images', imageRows)

// ------------------------------------------------------------
// Relación producto ↔ categoría
// ------------------------------------------------------------
console.log('Vinculando productos con categorías…')
const knownCategories = new Set(categoryRows.map((c) => c.id))
const links = products.flatMap((p) =>
  (p.categories ?? [])
    .filter((c) => knownCategories.has(c.id))
    .map((c) => ({ product_id: p.id, category_id: c.id })),
)
await upsertAll('product_categories', links, { onConflict: 'product_id,category_id' })

console.log(
  `\nListo: ${categoryRows.length} categorías, ${products.length} productos, ` +
    `${imageRows.length} imágenes, ${links.length} vínculos.`,
)
