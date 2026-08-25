# ROMASE · e-commerce

Sitio nuevo de [romase.cl](https://romase.cl) — maquinaria y equipamiento gastronómico,
Puerto Montt. Reemplaza al WordPress + WooCommerce alojado en Entel.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase · Render.

---

## Puesta en marcha

```bash
yarn install
cp .env.example .env     # completar si se va a usar Supabase
yarn dev                 # http://localhost:3000
```

El sitio **arranca sin configurar nada**: si no hay credenciales de Supabase lee el
snapshot del catálogo que está en `migration/data/`. Es el modo pensado para desarrollar
y para que el build de Render nunca dependa de un servicio externo.

| Comando | Qué hace |
| --- | --- |
| `yarn dev` | Servidor de desarrollo |
| `yarn build` | Build de producción |
| `yarn start` | Sirve el build (toma el puerto de `PORT`) |
| `yarn catalog:fetch` | Vuelve a bajar el catálogo desde romase.cl |
| `yarn catalog:seed` | Carga el catálogo en Supabase |
| `yarn favicons` | Regenera los favicons desde el logo |

---

## Cómo se leen los datos

`src/lib/catalog.ts` es la única puerta de entrada al catálogo. Decide sola de dónde leer:

1. **Supabase**, si están `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. **Snapshot local** (`migration/data/*.json`) si no las hay, o si Supabase no responde.

Las dos rutas devuelven la misma forma, así que el resto de la app no se entera de cuál
está activa. El catálogo completo —214 productos— se carga en memoria y se cachea: a esta
escala, filtrar y buscar en JavaScript es más simple y más rápido que consultar la base en
cada request. Habría que revisar esa decisión por encima de unos pocos miles de productos.

---

## Migrar el catálogo a Supabase

1. Crear el proyecto en Supabase.
2. Ejecutar `migration/schema.sql` completo en el **SQL Editor**.
3. Poner `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el `.env`.
4. `yarn catalog:seed`

El seed es idempotente: se puede correr las veces que haga falta. Para refrescar el
catálogo desde el WordPress viejo, `yarn catalog:fetch` y después `yarn catalog:seed`.

> Las credenciales de WordPress del `.env` **no sirven** por REST: el Apache de Entel
> descarta el header `Authorization` y `wp-login.php` está oculto por All-In-One-Security.
> No hace falta: el catálogo se baja por la Store API pública. Para mover el backend fuera
> de Entel se necesita acceso al **hosting/cPanel**, no al wp-admin.

---

## Estructura

```
migration/          Migración desde WooCommerce
  fetch-catalog.mjs   descarga el catálogo (Store API pública)
  seed-supabase.mjs   lo carga en Supabase
  schema.sql          esquema completo (catálogo, pedidos, consultas)
  data/               snapshot versionado — lo necesita el build
scripts/
  generate-favicons.mjs  favicons a partir del logo
src/
  app/                rutas
  components/         componentes
  content/            contenido editorial y correcciones de datos
  lib/                catálogo, formato, datos del negocio
```

### Rutas

| Ruta | Render | Notas |
| --- | --- | --- |
| `/` | estática | home e-commerce |
| `/productos` | dinámica | catálogo con buscador y filtros |
| `/productos/[slug]` | estática (214) | ficha de producto |
| `/categorias/[slug]` | estática (64) | página SEO de categoría |
| `/contacto`, `/nosotros`, `/politica-de-privacidad` | estáticas | |
| `/api/buscar` | dinámica | sugerencias del buscador |

Las páginas de categoría se mantienen **estáticas a propósito**: son el activo SEO del
sitio. Por eso listan el catálogo completo de la categoría en vez de paginar, así todos los
productos quedan enlazados desde una sola URL indexable. El orden y los filtros viven en
`/productos?categoria=slug`, que sí es dinámica y está excluida del índice en `robots.ts`.

---

## SEO

- **Contenido de categoría:** `src/content/categorias.ts` tiene entre 600 y 790 palabras
  propias por cada una de las 9 categorías raíz, más preguntas frecuentes. Las
  subcategorías heredan el contenido del padre hasta que se les escriba el propio.
  Si se carga `seo_content` en Supabase, ese texto gana.
- **Datos estructurados:** `Store` en el layout, `Product` con precio y disponibilidad en
  cada ficha, `FAQPage` donde hay preguntas frecuentes.
- **URLs con nombre:** se terminaron las URLs tipo `/9-2`. `next.config.ts` redirige con 301
  las viejas (`/producto/:slug` → `/productos/:slug`, `/tienda` → `/productos`).
- `sitemap.xml` y `robots.txt` se generan solos desde el catálogo.

---

## Formulario de contacto

Cada consulta va a dos lugares con roles distintos:

1. **Supabase** (tabla `leads`) — el registro durable, para no depender de que
   nadie borre un correo.
2. **Resend** — el aviso a la bandeja, para que alguien lo lea el mismo día.

Se intentan los dos en paralelo y **basta con que uno funcione** para dar la consulta por
recibida. Si fallan los dos, el formulario lo dice y ofrece WhatsApp: nunca simula haber
enviado algo que se perdió. El correo llega con `reply_to` del cliente, así se le responde
directo desde la bandeja.

Variables: `RESEND_API_KEY`, `RESEND_FROM`, `LEADS_EMAIL` (ver `.env.example`).

> **Dependencia a resolver.** Resend exige que el remitente sea de un dominio verificado,
> lo que implica cargar registros SPF y DKIM en el DNS de romase.cl — y ese DNS está en
> Entel, donde todavía no tenemos acceso. Hasta que lo tengamos se puede probar con el
> dominio compartido de Resend (`onboarding@resend.dev`), que solo permite enviar al correo
> dueño de la cuenta: alcanza para verificar el flujo, no para producción.

---

## Diseño

La referencia acordada es [groner.cl](https://groner.cl): limpio y sobrio. Lo que define ese
estilo no es el color sino la **planitud** — casi sin sombras, radios de 2 a 6 px, bordes de
un pelo y mucho espacio en blanco. La paleta es la de ROMASE: la terracota `#dd5330` del
logo, usada con moderación (botones, badges, acentos) sobre neutros cálidos.

Los tokens viven en `src/app/globals.css` y gobiernan todo el sitio: cambiar `--radius-*` o
`--shadow-*` ahí reestila cada componente de una vez.

Piezas propias del rediseño:

- **Portada clara**, armada con producto real del catálogo en vez de una foto de banco.
- **Destacados con pestañas por categoría** (`featured-tabs.tsx`), para que se vea el
  alcance del catálogo sin entrar a cada sección.
- **Tarjetas planas**: el marco rodea solo la foto, el texto respira fuera.
- **Menú con etiquetas cortas.** Con los nombres completos, las diez entradas no entran en
  1280 px. Los nombres largos se siguen usando en títulos y migas de pan.

### Favicon

El logo es un wordmark horizontal: entero en un favicon queda ilegible a 16 px. Lo único que
se reconoce a ese tamaño es la **R**, así que se recorta esa letra del logo y se cala en
blanco sobre un cuadrado terracota.

`node scripts/generate-favicons.mjs` regenera `icon.png` (512), `apple-icon.png` (180) y
`favicon.ico` (16, 32 y 48) en `src/app/`, de donde Next los toma por convención. Si cambia
el logo hay que revisar `CAJA_R` en ese script: son las coordenadas de la letra dentro de
`public/brand/logo.png`.

El logo se sirve desde el original de 764×280 en vez de la miniatura de 150×55 que estaba en
el sitio anterior, así se ve nítido en pantallas retina.

---

## Correcciones de datos aplicadas en la migración

Dos parches viven en `src/content/` porque el origen tiene errores. Lo correcto es
arreglarlos en Supabase y después borrar estos archivos.

**`nombres-categorias.ts`** — En WooCommerce las categorías están en mayúscula sostenida y
varias perdieron las tildes (`PANADERIA`, `GASTRONOMIA`, `Maquina de conos`). Además se
hicieron más explícitas las que eran ambiguas: `ACERO` → *Acero inoxidable*, `CALOR` →
*Línea de calor*, `COMPLEMENTARIOS` → *Equipos complementarios*. Solo cambia lo que se
muestra; los slugs y los datos quedan intactos.

**`productos-sin-categoria.ts`** — 12 productos llegaron **sin ninguna categoría asignada**,
y son la maquinaria de mayor valor del catálogo: amasadoras, sobadoras y batidoras
planetarias de hasta $1.236.000. Sin categoría no aparecían en ninguna página de categoría
ni en el menú. Que pertenecen a PANADERÍA lo confirma el propio conteo de WooCommerce: la
categoría declara 53 productos y solo 41 la referenciaban; los 12 que faltaban son
exactamente estos.

---

## Despliegue en Render

`render.yaml` documenta la configuración esperada:

- **Build:** `yarn install --frozen-lockfile && yarn build`
- **Start:** `yarn start`
- **Node:** 22.20.0

Variables de entorno a cargar en el panel de Render:

| Variable | Obligatoria | Para qué |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | sí | URLs canónicas y sitemap |
| `NEXT_PUBLIC_SUPABASE_URL` | no | catálogo desde Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | ídem |
| `SUPABASE_SERVICE_ROLE_KEY` | no | guardar consultas y seed |
| `RESEND_API_KEY` | no | aviso por correo de las consultas |
| `RESEND_FROM` | no | remitente (dominio verificado en Resend) |
| `LEADS_EMAIL` | no | a dónde llegan las consultas |

Sin las de Supabase el sitio funciona igual, con el snapshot. Lo que queda a medias es el
formulario: con Resend configurado sigue avisando por correo aunque Supabase no esté, y sin
ninguno de los dos avisa en pantalla y ofrece WhatsApp.

---

## Pendiente

- **Carrito y checkout.** El esquema ya tiene `orders` y `order_items` preparados para
  Transbank Webpay Plus REST, que es la única pasarela del sitio actual. Hoy la acción
  principal de la ficha de producto es cotizar por WhatsApp, que es como se vende
  realmente. Al construir el checkout hay que reapuntar los redirects de `/9-2` y `/8-2`
  en `next.config.ts` a `/carrito` y `/checkout`.
- **Imágenes a Supabase Storage.** Hoy se sirven desde `romase.cl/wp-content`. Hay que
  moverlas antes de dar de baja el WordPress, o el sitio se queda sin fotos.
- **Productos destacados.** La columna `featured` existe pero está en `false` para todos.
  Mientras no se curen, la home elige los mejor documentados.
- **Contenido de subcategorías.** Las 55 subcategorías heredan el texto del padre.
- **Envíos.** WooCommerce no tiene métodos de envío configurados; hay que definir zonas y
  tarifas antes de vender en línea.
- **Versión compacta del logo.** El lockup incluye la bajada «Distribuidor equipamiento
  integral para el comercio», que a la altura del encabezado (36–44 px) es ilegible. Convendría
  pedir una variante sin bajada para usar ahí.
