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
| `yarn banner:fetch` | Vuelve a bajar las fotos del banner |

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
| `/carrito` | cliente | carrito, en localStorage |
| `/checkout` | cliente | pedido; fuera del índice |
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

## Carrito y checkout

El flujo de compra está completo y **funciona de punta a punta como pedido**. Lo único que
falta es cobrar en línea: ahí entra Webpay.

- **Carrito** (`src/lib/cart.tsx`) — estado en el navegador, persistido en `localStorage`.
  El contador del encabezado aparece recién cuando se leyó el almacenamiento, para que el
  servidor y el cliente rendericen lo mismo.
- **Botones** — «Agregar» en cada tarjeta de la grilla, y selector de cantidad + «Agregar al
  carrito» en la ficha. WhatsApp bajó a acción secundaria.
- **Panel lateral** — se abre solo al agregar algo, con cantidades y subtotal.
- **`/carrito`** — línea por línea, cantidades, subtotal.
- **`/checkout`** — sigue el flujo del sitio actual: detalles de facturación (nombre y
  apellidos separados, dirección, comuna, región como selector con las 16 regiones,
  teléfono y correo), documento (boleta o factura con RUT y razón social), entrega
  (despacho con empresa despachadora —BLUExpress, Chilexpress o Cruz del Sur— o retiro en
  el local), envío a una dirección distinta, y pago.

Al confirmar, el pedido se guarda en `orders` y `order_items` y se avisa por correo, con la
misma regla que el formulario de contacto: basta con que uno de los dos canales funcione. Si
fallan los dos, se ofrece enviar el pedido por WhatsApp con el detalle ya armado.

> **El precio nunca se toma del navegador.** Del cliente solo se acepta qué producto y cuántas
> unidades; el nombre y el precio se releen del catálogo en el servidor al confirmar. Un
> `localStorage` manipulado cambia lo que se ve, no lo que se cobra.

> **Los campos van controlados a propósito.** React 19 resetea los inputs no controlados
> cuando termina una acción de formulario. Con inputs sin controlar, una validación fallida
> del servidor le borraba al cliente todo lo que había escrito en el checkout.

### Lo que falta para cobrar en línea

El esquema ya tiene las columnas `webpay_token`, `webpay_buy_order` y `webpay_response`, y el
paso 3 del checkout tiene el bloque de Webpay marcado como «próximamente». La integración
con Transbank Webpay Plus REST entra ahí: crear la transacción antes de confirmar, redirigir,
y confirmar el pedido contra el resultado.

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

## Home

La portada está armada para que se vea qué se vende y a qué precio desde el primer
segundo:

- **Banner fotográfico a todo el ancho.** Cinco diapositivas, una por sección del catálogo
  —panadería, gastronomía, equipos complementarios, vitrinas y repuestos—, con foto de
  ambiente, titular, conteo de productos y enlace a la categoría. Se cruzan por opacidad con
  un zoom lento sobre la foto activa.

  Antes el banner mostraba productos recortados sobre panel blanco y no se leía como
  carrusel. El texto de cada diapositiva está en `src/content/banner.ts` y las fotos las baja
  `yarn banner:fetch`.
- **Sin buscador en el banner.** El buscador vive en el encabezado, presente en todo el
  sitio.
- **Carruseles en vez de grilla de categorías.** «Productos destacados» y «Últimas
  incorporaciones», 12 productos cada uno, con nombre, precio y botón al carrito. Avanzan
  solos cada 5 s, vuelven al principio al llegar al final, y llevan las flechas circulares
  sobre la pista más viñetas por página —igual que el carrusel de groner.cl, que usa Swiper
  con autoplay de 5 s, bucle infinito y flechas—. Se pausan al pasar el mouse, al enfocar con
  teclado, al tocar la pantalla y si el sistema pide menos movimiento.
- **Menú solo por categorías.** Se quitó el enlace genérico «Todos los productos»: la
  navegación va por las nueve categorías. `/productos` sigue existiendo con filtros y se
  llega desde el pie y desde cada categoría.
- **Texto en desplegables.** El contenido largo pasó a `<details>` bajo «Asesoría antes de
  comprar» y las preguntas frecuentes.

> **Las fotos del banner son CC0.** Pixabay no se pudo usar: su API pide clave y la búsqueda
> web rechaza los pedidos automatizados. Se tomaron de Openverse filtrando por CC0 —dominio
> público equivalente, uso comercial libre y sin atribución obligatoria— y se revisó una por
> una antes de elegirlas. Quedan servidas desde `public/banner/`, no enlazadas de un tercero,
> y la procedencia de cada una está en `public/banner/creditos.json`. Para cambiar una: editar
> su URL en `scripts/banner-fuentes.json` y correr `yarn banner:fetch`.

> **Los desplegables no esconden el contenido de Google.** Un `<details>` cerrado sigue
> teniendo su texto en el HTML, así que se indexa igual. Es lo que permite cumplir a la vez
> las 600+ palabras por página que se acordaron para SEO y el pedido de bajar la carga
> visual de texto: la home tiene 1.471 palabras y una categoría 1.651, sin muro de texto.

Sobre «más vendidos»: no hay datos de venta, así que llamarlo así sería inventarlo. El
carrusel ordena por lo que sí se sabe (disponible, bien fotografiado, bien descrito).
Cuando los pedidos pasen por Supabase se puede calcular de verdad sumando `order_items`.

---

## Diseño

La referencia acordada es [groner.cl](https://groner.cl): limpio y sobrio. Lo que define ese
estilo no es el color sino la **planitud** — casi sin sombras, radios de 2 a 6 px, bordes de
un pelo y mucho espacio en blanco. La paleta es la de ROMASE: la terracota `#dd5330` del
logo, usada con moderación (botones, badges, acentos) sobre neutros cálidos.

Los tokens viven en `src/app/globals.css` y gobiernan todo el sitio: cambiar `--radius-*` o
`--shadow-*` ahí reestila cada componente de una vez.

Piezas propias del rediseño:

- **Tarjetas planas**: el marco rodea solo la foto, el texto respira fuera. Se estiran a la
  altura de la fila para que los precios y los botones queden alineados entre sí.
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

- **Integrar Transbank Webpay Plus REST.** Es la única pasarela del sitio actual y el único
  paso que falta del flujo de compra: hoy el pedido se confirma y el pago se coordina a
  mano. El lugar donde entra está marcado en `checkout-form.tsx` (bloque «Pago») y el
  esquema ya tiene las columnas `webpay_token`, `webpay_buy_order` y `webpay_response`.
  Requiere código de comercio de Transbank.
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
