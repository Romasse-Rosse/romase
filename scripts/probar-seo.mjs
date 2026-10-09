import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
function load(relative, mocks = {}) {
  const filename = path.resolve(root, relative)
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const module = { exports: {} }
  const localRequire = (name) => {
    if (name in mocks) return mocks[name]
    if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts', mocks)
    if (name.startsWith('.')) {
      const base = path.resolve(path.dirname(filename), name)
      return load(path.relative(root, base) + '.ts', mocks)
    }
    return require(name)
  }
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, process, URL, console, Intl }, { filename })
  return module.exports
}

const { seoEntries, seoMetadata, seoH1 } = load('src/content/seo.ts')
assert.equal(Object.keys(seoEntries).length, 28)
assert.equal(new Set(Object.values(seoEntries).map((entry) => entry.title)).size, 28)
for (const [url, entry] of Object.entries(seoEntries)) {
  assert.ok(url.startsWith('/'))
  assert.ok(entry.title && entry.description && entry.h1)
  assert.equal(seoMetadata(url).title.absolute, entry.title)
  assert.equal(seoMetadata(url).description, entry.description)
  assert.equal(seoH1(url, 'fallback'), entry.h1)
}
assert.equal(seoH1('/categorias/no-intervenida', 'Original'), 'Original')
assert.equal(Object.keys(seoMetadata('/categorias/no-intervenida')).length, 0)
for (const slug of ['amasadoras', 'batidoras', 'cocinas', 'freidoras', 'hornos', 'sobadoras']) {
  assert.equal(seoEntries['/categorias/' + slug + '-industriales'], undefined)
}

const { productSchemaFor } = load('src/lib/product-schema.ts')
const product = {
  id: 1, name: 'HORNO VENTUS', slug: 'horno-ventus', sku: 'ABC', description: '<p>Horno comercial</p>',
  shortDescription: null, price: 850, regularPrice: 1000, salePrice: 850, onSale: true, inStock: true,
  featured: false, images: [{ src: '/productos/horno.webp', alt: 'Horno' }], categoryIds: [2], legacyPermalink: null,
}
const before = JSON.stringify(product)
for (const price of [0, 1, 10, 50, 100, -1, NaN, Infinity]) {
  assert.equal(productSchemaFor({ ...product, price }, 'https://romase.cl'), null)
}
const schema = productSchemaFor(product, 'https://romase.cl')
assert.equal(schema.offers.price, 850)
assert.equal(schema.offers.priceCurrency, 'CLP')
assert.equal(schema.offers.availability, 'https://schema.org/InStock')
assert.equal(schema.offers.seller.name, 'ROMASE')
assert.equal(schema.brand, undefined)
assert.equal(schema.image[0], 'https://romase.cl/productos/horno.webp')
assert.equal(schema.description, 'Horno comercial')
assert.equal(JSON.stringify(product), before)
assert.equal(productSchemaFor({ ...product, inStock: false }, 'https://romase.cl').offers.availability, 'https://schema.org/BackOrder')

const { seoRedirects } = load('src/content/seo-redirects.ts')
assert.equal(seoRedirects.length, 65)
assert.equal(new Set(seoRedirects.map((redirect) => redirect.source)).size, 65)
for (const redirect of seoRedirects) {
  assert.equal(redirect.permanent, true)
  assert.ok(redirect.destination.startsWith('/categorias/'))
  assert.notEqual(redirect.source, redirect.destination)
}

const catalogMock = {
  getAllProductSlugs: async () => ['producto-de-prueba'],
  getAllCategorySlugs: async () => ['repuestos', 'test-categoria'],
}
const { default: sitemap } = load('src/app/sitemap.ts', { '@/lib/catalog': catalogMock })
const urls = await sitemap()
assert.equal(urls.length, 7)
assert.ok(urls.every((entry) => !('lastModified' in entry)))
assert.ok(urls.every((entry) => !entry.url.endsWith('/test-categoria')))
assert.equal(new Set(urls.map((entry) => entry.url)).size, urls.length)

const cart = load('src/app/(tienda)/carrito/layout.tsx')
assert.equal(cart.metadata.robots.index, false)
assert.equal(cart.metadata.alternates.canonical, '/carrito')
const { site } = load('src/lib/site.ts')
assert.equal(JSON.stringify(site.schemaOpeningHours), JSON.stringify(['Mo-Fr 09:30-13:00', 'Mo-Fr 14:00-18:00']))

// Render real del componente compartido: JSON-LD válido y sin rutas relativas.
const { Breadcrumbs } = load('src/components/ui.tsx')
const { renderToStaticMarkup } = require('react-dom/server')
const html = renderToStaticMarkup(Breadcrumbs({ items: [{ label: 'Inicio', href: '/' }, { label: 'Repuestos <test>' }] }))
const serialized = html.slice(html.indexOf('>', html.indexOf('<script')) + 1, html.indexOf('</script>'))
const crumb = JSON.parse(serialized)
assert.equal(crumb['@type'], 'BreadcrumbList')
assert.equal(crumb.itemListElement[0].item, 'https://romase.cl/')
assert.equal(crumb.itemListElement[1].position, 2)
assert.equal(crumb.itemListElement[1].name, 'Repuestos <test>')
assert.ok(!serialized.includes('<test>'))

console.log('SEO técnico: 28 metadatos, 65 redirecciones, schema, sitemap, noindex y breadcrumbs OK.')
