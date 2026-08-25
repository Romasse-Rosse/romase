// Descarga el catálogo completo de romase.cl vía WooCommerce Store API (pública)
import { writeFile } from 'node:fs/promises'

const BASE = 'https://romase.cl/wp-json/wc/store/v1'

async function fetchAll(path) {
  const out = []
  for (let page = 1; ; page++) {
    const res = await fetch(`${BASE}/${path}?per_page=100&page=${page}`)
    if (!res.ok) throw new Error(`${path} p${page}: ${res.status}`)
    const batch = await res.json()
    out.push(...batch)
    const totalPages = Number(res.headers.get('x-wp-totalpages') || 1)
    process.stdout.write(`\r${path}: ${out.length} items (page ${page}/${totalPages})`)
    if (page >= totalPages) break
  }
  process.stdout.write('\n')
  return out
}

const products = await fetchAll('products')
const categories = await fetchAll('products/categories')

await writeFile('migration/data/products.json', JSON.stringify(products, null, 2))
await writeFile('migration/data/categories.json', JSON.stringify(categories, null, 2))
console.log(`OK -> ${products.length} productos, ${categories.length} categorías`)
