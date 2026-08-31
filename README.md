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
| `yarn productos:imagenes` | Baja y optimiza las fotos de producto a `public/productos/` |
| `yarn notas:auditar` | Revisa las notas del blog contra el estándar de redacción |
| `yarn webpay:probar` | Abre una transacción de prueba en el ambiente de integración |
| `yarn webpay:casos` | Comprueba las cuatro formas en que Transbank vuelve al sitio |

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
  generate-favicons.mjs      favicons a partir del logo
  fetch-banner-images.mjs    fotos del banner (recorte y espejo)
  localize-product-images.mjs fotos de producto a public/productos/
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
| `/productos/[slug]` | estática (214) | ficha de producto |
| `/categorias/[slug]` | estática (64) | página SEO de categoría |
| `/buscar` | dinámica | resultados de búsqueda; fuera del índice |
| `/blog`, `/blog/[slug]` | estáticas | **construido y oculto**; ver más abajo |
| `/contacto`, `/nosotros`, `/politica-de-privacidad` | estáticas | |
| `/carrito` | cliente | carrito, en localStorage |
| `/checkout` | cliente | pedido; fuera del índice |
| `/api/buscar` | dinámica | sugerencias del buscador |

**No hay página de «todo el catálogo».** La navegación es por categoría, y `/buscar` es la
única vista que mezcla productos de varias categorías —solo cuando alguien busca algo—.
`/productos` redirige a la portada para no dejar roto lo que ya estuviera enlazado.

Las páginas de categoría se mantienen **estáticas a propósito**: son el activo SEO del
sitio. Por eso listan el catálogo completo de la categoría en vez de paginar, así todos los
productos quedan enlazados desde una sola URL indexable.

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

## Blog: construido y oculto

Está armado con su listado y su diseño de artículo, pero **no publicado**: no se enlaza desde
el encabezado ni el pie, no entra al sitemap, `/blog` está en el `disallow` de `robots.ts` y
las dos páginas piden `noindex`. Existe para poder revisar el diseño antes de que se escriba
el contenido.

Los dos artículos de `src/content/blog.ts` son **de ejemplo**, pero están escritos contra el
**estándar de redacción de la agencia** (`skills/seo/redaccion-contenido` en el repositorio de
conocimiento). Se reemplazan sin tocar código: el archivo es una lista de objetos con slug,
título, keyword foco, metatítulo, metadescripción, bajada, tema, fecha, portada, foto de
producto y cuerpo en HTML. Los minutos de lectura se calculan del texto, no se escriben a mano.

### La regla es verificable, no una intención

`yarn notas:auditar` revisa cada nota y sale con código 1 si alguna falla, así que puede correr
en CI. Lo que comprueba:

- Mínimo 600 palabras y 1 H2 cada ~300, con dos como piso.
- Keyword foco en H1, primer párrafo, metatítulo, metadescripción, slug y el alt de una imagen.
- Metatítulo de 50 a 60 caracteres, metadescripción de 135 a 145, slug de hasta 60.
- Ningún párrafo de más de 50 palabras.
- Los cuatro formatos: negritas, cursivas, listas y cita en bloque.
- Dos imágenes como mínimo, tres desde las 1.200 palabras.
- Al menos dos enlaces internos, ningún enlace externo, y CTA al cierre hacia una categoría o
  un producto —no hacia otra nota— con texto que no suene a instrucción de venta.
- Último H2 descriptivo: nunca «Conclusión».
- Frases de plantilla prohibidas («en este artículo te explicamos», «en resumen»…).
- Avisa de toda cifra en el cuerpo, para revisarla contra su fuente a mano.

Lo que una máquina no puede juzgar —que la voz suene a persona, que la keyword tenga volumen
real— sale como aviso, no como error.

> **La keyword foco de cada nota está puesta a criterio y falta validarla con volumen real.**
> Ese es el paso 1 del flujo de la agencia (`seo/keyword-research-notas`) y necesita
> DataForSEO. Las notas cumplen la forma; el research queda pendiente.

### Regla cero-alucinación

Ninguna cifra concreta entra al cuerpo de una nota si no está verificada en una fuente que la
muestre directamente. Es la lección más dura del estándar —viene de una nota de Pandero llena
de rangos de precios inventados que el cliente detectó y mandó a sacar— y la primera versión de
estas dos notas la incumplía: **23 cifras sin fuente** solo en la de amasadoras.

Se reescribieron para explicar **qué mueve** un costo o un plazo en vez de inventar el número.
El lector entiende igual y el cliente no queda expuesto. Cuando ROMASE entregue sus propios
datos —capacidades por modelo, plazos reales de despacho— ahí sí entran, citando la ficha.

Para publicarlo, cuando llegue esa etapa, son tres pasos anotados en el mismo archivo:
`BLOG_VISIBLE = true`, sacar `/blog` del `disallow` y agregar las entradas al sitemap.

Las portadas se resuelven contra `public/banner/manifiesto.json`, igual que el banner de la
portada: así siguen funcionando cuando `yarn banner:fetch` cambia el hash de los nombres.

Las dos páginas cierran con **«Lo más vendido»**, el mismo carrusel de la portada: quien
termina de leer sobre cómo elegir un equipo es justo quien está por comprarlo, y el blog
existe para eso.

**Jerarquía de encabezados.** El listado abre con `h1` y cada nota es un `h2`; el artículo
abre con `h1` y sus apartados son `h2`. Suena obvio pero la primera versión estaba mal: el
listado no tenía `h1` —seis `h2` sueltos— y el artículo saltaba de `h1` a `h3`, dejando un
nivel vacío en medio. Los apartados del cuerpo van en `h2` en `src/content/blog.ts`, no en
`h3` como el texto de las categorías, porque ahí cuelgan de un `h2` de sección y acá cuelgan
del `h1` del artículo.

---

## Carrito y checkout

El flujo de compra está completo y **funciona de punta a punta como pedido**. Lo único que
falta es cobrar en línea: ahí entra Webpay.

- **Carrito** (`src/lib/cart.tsx`) — estado en el navegador, persistido en `localStorage`.
  El contador del encabezado aparece recién cuando se leyó el almacenamiento, para que el
  servidor y el cliente rendericen lo mismo.
- **Botones** — «Agregar» en cada tarjeta de la grilla, y selector de cantidad + «Agregar al
  carrito» en la ficha. La única salida a WhatsApp del sitio es «Cotizar por WhatsApp» dentro
  de la ficha, con el nombre del equipo en el mensaje.
- **Panel lateral** — se abre solo al agregar algo, con cantidades y subtotal.
- **`/carrito`** — línea por línea, cantidades, subtotal.
- **`/checkout`** — sigue el flujo del sitio actual: detalles de facturación (nombre y
  apellidos separados, dirección, comuna, región como selector con las 16 regiones,
  teléfono y correo), documento (boleta o factura con RUT y razón social), entrega
  (despacho con empresa despachadora —BLUExpress, Chilexpress o Cruz del Sur— o retiro en
  el local), envío a una dirección distinta, y pago.

Al confirmar, el pedido se guarda en `orders` y `order_items` y se avisa por correo, con la
misma regla que el formulario de contacto: basta con que uno de los dos canales funcione. Si
fallan los dos, el formulario lo dice en pantalla y no da el pedido por tomado.

> **El precio nunca se toma del navegador.** Del cliente solo se acepta qué producto y cuántas
> unidades; el nombre y el precio se releen del catálogo en el servidor al confirmar. Un
> `localStorage` manipulado cambia lo que se ve, no lo que se cobra.

> **Los campos van controlados a propósito.** React 19 resetea los inputs no controlados
> cuando termina una acción de formulario. Con inputs sin controlar, una validación fallida
> del servidor le borraba al cliente todo lo que había escrito en el checkout.

### Webpay Plus

Integrado con el **SDK oficial de Transbank**. Son dos llamadas y se podrían hacer con
`fetch`, pero en una pasarela conviene el camino que Transbank soporta: la homologación pide
evidencia de las pruebas, y «usamos su SDK» es mejor respuesta que «escribimos el cliente».

**El flujo, de punta a punta:**

1. El checkout valida, vuelve a poner los precios desde el catálogo y guarda el pedido en
   `orders` como `pendiente`.
2. Abre la transacción con Transbank y anota `webpay_token` y `webpay_buy_order` en el pedido.
3. El navegador entra a Webpay con un **POST** y un campo `token_ws` — así lo define
   Transbank, no sirve un enlace.
4. Transbank vuelve a `/checkout/retorno`, que confirma la transacción y deja el pedido en
   `pagado` o `rechazado`.
5. `/checkout/resultado` muestra el comprobante.

**Tres cosas que no son obvias y están resueltas:**

- **La vuelta es un route handler, no una página.** Transbank puede volver por POST o por GET
  según el caso, y una página de Next solo atiende GET: un POST devolvería 405 y el comprador
  vería un error *después* de haber pagado.
- **Cuatro casos de vuelta, no uno.** `token_ws` es el pago normal;
  `TBK_TOKEN` + `TBK_ORDEN_COMPRA` + `TBK_ID_SESION` es que el comprador anuló;
  solo `TBK_ORDEN_COMPRA` + `TBK_ID_SESION` es que se venció el plazo; y
  `token_ws` + `TBK_TOKEN` es error en el formulario. **En los tres últimos no se confirma
  nada**: confirmar un token anulado deja pedidos en un estado que no corresponde.
- **El commit se hace una sola vez.** Transbank rechaza el segundo commit del mismo token, y
  basta con que alguien recargue la página de vuelta para que pase. Si el pedido ya tiene
  `webpay_response`, se muestra lo guardado en vez de volver a llamar.

**Y dos que son de plata:**

- **El monto se compara** contra el que se guardó al crear el pedido. Si no calza, el pedido
  no se marca como pagado aunque Transbank haya autorizado.
- **El carrito se vacía en la página de resultado, no al salir hacia Webpay.** Si el pago se
  rechaza, el comprador tiene que poder reintentar sin volver a armar el pedido. Por lo mismo,
  el evento `purchase` de GA4 sale ahí y no antes.

### El dominio canónico no sirve como URL de retorno

`NEXT_PUBLIC_SITE_URL` vale `https://romase.cl` porque ahí es donde va a vivir el sitio cuando
se mueva el dominio, y para el canónico de Google está bien. Para Webpay está mal: hoy
romase.cl **es el WordPress viejo**, así que darle esa URL a Transbank como retorno manda al
comprador a otro sitio después de pagar y deja el pedido cobrado sin confirmar.

`request.url` tampoco sirve: detrás del proxy de Render devuelve la dirección interna. En el
sitio desplegado la vuelta redirigía literalmente a `https://localhost:10000`.

`src/lib/origen.ts` resuelve el origen real desde `x-forwarded-host` y `x-forwarded-proto`, y
cae a `site.url` si no están. Es lo que se usa para la URL de retorno y para la redirección de
vuelta; el día que el dominio se mueva sigue funcionando sin tocar nada.

> Los dos aparecieron **solo en el despliegue**. En local `request.url` es correcto y
> `NEXT_PUBLIC_SITE_URL` no está puesto, así que todo parecía andar.

**La orden de compra lleva prefijo `ROM-`.** Transbank exige que sea única por código de
comercio: si el WooCommerce viejo sigue cobrando con el mismo código, los dos sistemas no
pueden generar el mismo número.

### La página de resultado es un requisito, no una decisión de diseño

Transbank define qué tiene que ver el tarjetahabiente y lo revisa en la homologación. Los
nueve datos obligatorios están todos en `/checkout/resultado`: número de pedido, nombre del
comercio, monto y moneda, código de autorización, fecha, tipo de pago (débito o crédito),
cantidad de cuotas, últimos cuatro dígitos de la tarjeta y descripción de lo comprado. Para
las rechazadas piden además informar las causas posibles, que salen de traducir el
`response_code`.

### Ambientes y qué falta

Sin variables de entorno el sitio corre contra **integración**, con las credenciales públicas
de prueba de Transbank. Para producción hacen falta `WEBPAY_AMBIENTE=produccion`,
`WEBPAY_CODIGO_COMERCIO` y `WEBPAY_API_KEY`; si alguna falta, Webpay queda apagado y el
checkout sigue funcionando como pedido por correo en vez de romperse.

> **Webpay necesita Supabase.** Sin base no se puede guardar el pedido antes de cobrar, y sin
> eso no hay contra qué comparar el monto a la vuelta ni qué mostrar en el comprobante. Si
> Supabase no está configurado, el pago no se ofrece.

> **Transbank exige HTTPS también en integración**, así que el pago completo solo se puede
> probar en el sitio desplegado, no en localhost. Lo que sí se prueba en local es la vuelta:
> `yarn webpay:casos` recorre las cinco formas en que Transbank puede volver —incluido el
> POST— y comprueba a dónde deriva cada una. Hoy pasan las cinco.

Falta la **homologación**: un formulario de validación, evidencia de las pruebas y una
transacción real el día de la puesta en producción. Recién ahí Transbank entrega la llave
productiva. Y antes que eso, el cliente tiene que recuperar los accesos a Webpay.

---

## Analítica: el embudo de e-commerce

`src/lib/analytics.ts` empuja los eventos nativos de e-commerce a `window.dataLayer`, con la
nomenclatura que espera GA4. `src/components/analytics.tsx` tiene las piezas de cliente que
los disparan.

| Evento | Dónde se dispara |
| --- | --- |
| `view_item_list` | portada (destacados y novedades), categoría y resultados de búsqueda, cuando la lista entra en pantalla |
| `select_item` | click en el nombre de una tarjeta, con la lista de la que viene |
| `view_item` | ficha de producto |
| `add_to_cart` | «Agregar» de la tarjeta y de la ficha, y al subir la cantidad |
| `remove_from_cart` | eliminar una línea o bajar la cantidad |
| `view_cart` | al abrir el panel lateral y al entrar a `/carrito` |
| `begin_checkout` | al cargar `/checkout` con productos |
| `add_shipping_info` | al elegir retiro o despacho (y la empresa despachadora) |
| `add_payment_info` | al enviar el pedido |
| `purchase` | pedido confirmado, con `transaction_id` |
| `search` | búsqueda desde el encabezado |

Tres detalles que importan:

- Antes de cada evento se empuja `{ ecommerce: null }`. Sin eso GTM **fusiona** el objeto
  `ecommerce` anterior con el nuevo y llegan productos de eventos viejos.
- Los eventos se disparan **fuera** de los actualizadores de estado de React. Dentro, React
  puede ejecutarlos dos veces en desarrollo y cada compra se contaría doble.
- `view_item_list` se dispara con `IntersectionObserver`, no al cargar la página: en la
  portada hay dos carruseles y uno está bien abajo, así que anunciarlos juntos falsearía el
  dato.

El contenedor se conecta con `NEXT_PUBLIC_GTM_ID` (formato `GTM-XXXXXXX`). **Sin esa variable
no se carga ningún script**, pero los eventos igual se acumulan en `window.dataLayer`: el día
que se cargue el contenedor aparecen todos sin tocar una línea de código.

---

## Formulario de contacto

Cada consulta va a dos lugares con roles distintos:

1. **Supabase** (tabla `leads`) — el registro durable, para no depender de que
   nadie borre un correo.
2. **Resend** — el aviso a la bandeja, para que alguien lo lea el mismo día.

Se intentan los dos en paralelo y **basta con que uno funcione** para dar la consulta por
recibida. Si fallan los dos, el formulario lo dice y deja el teléfono y el correo: nunca
simula haber enviado algo que se perdió. El correo llega con `reply_to` del cliente, así se le responde
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

- **Banner fotográfico a todo el ancho.** Tres diapositivas, una por sección del catálogo
  —panadería, gastronomía y equipos complementarios—, con foto de ambiente, titular y botón
  a la categoría. Los beneficios van en una banda oscura aparte, justo debajo: dentro del
  banner le comían la foto.

  **La foto se cruza; el texto se releva.** La foto sí se funde con la siguiente —una foto
  encima de otra se ve bien—, pero el texto no: cruzar dos titulares en la misma posición los
  deja superpuestos medio segundo y no se lee ninguno. El que sale se va en 180 ms y el que
  entra arranca a los 200, cuando el otro ya no está; el total acompaña los 700 ms de la
  foto. Cambiar el texto de golpe tampoco servía: se veía la bajada nueva sobre la foto
  vieja.

  El texto de cada diapositiva está en `src/content/banner.ts` y las fotos las baja
  `yarn banner:fetch` según `scripts/banner-fuentes.json`, que admite dos ajustes por foto:
  `recorte` (región en proporciones de 0 a 1) y `espejo`. El espejo existe porque el texto
  ocupa la mitad izquierda: en la foto de panadería el bol y el batidor estaban a la
  izquierda y quedaban tapados por el titular, así que se voltea para que la acción quede al
  aire.

  **Los recortes no se eligen a ojo.** El banner recorta dos veces: primero el script a
  2000×900, y después el navegador con `object-cover` dentro de una franja de 1425×534 que
  además tiene un zoom del 5 %. Elegir mirando la foto entera lleva a equivocarse —así quedó
  la de la cafetería con la taza cortada por abajo—. Hay que simular las dos etapas y mirar
  el resultado: la de café terminó en `{left: 0.10, top: 0.20, width: 0.88}`, que es lo que
  deja la taza completa sobre la bandeja y a la derecha del titular.

> **Lo de la foto en móvil quedó resuelto.** La franja medía 390×766 —los beneficios se
> apilaban y estiraban el bloque—, así que de una imagen de 2000×900 se veía apenas el 10 %
> central del ancho. Al mover los beneficios a su propia banda, el recuadro bajó a unos
> 390×340 y la foto se reconoce. `object-position` se había probado antes y no cambiaba nada:
> el problema era la proporción del recuadro, no dónde estaba centrado el recorte.
- **Sin buscador en el banner.** El buscador vive en el encabezado, presente en todo el
  sitio.
- **Carruseles en vez de grilla de categorías.** «Productos destacados» y «Últimas
  incorporaciones», 12 productos cada uno, con nombre, precio y botón al carrito. Avanzan
  solos cada 5 s, vuelven al principio al llegar al final, y llevan las flechas circulares
  sobre la pista más viñetas por página —igual que el carrusel de groner.cl, que usa Swiper
  con autoplay de 5 s, bucle infinito y flechas—. Se pausan al pasar el mouse, al enfocar con
  teclado, al tocar la pantalla y si el sistema pide menos movimiento.
- **Destacados antes que categorías.** Lo primero después del banner es producto con precio;
  la grilla de categorías viene después, sin conteo de productos en las fichas.
- **Menú solo por categorías.** No hay enlace a «todos los productos» en ninguna parte —ni en
  el encabezado, ni en el pie, ni en las categorías—: la navegación va por las nueve
  categorías. Tampoco hay conteo de productos en el menú.
- **Sin «Cotizar» ni «Contacto» en el encabezado.** El encabezado deja el buscador y el
  carrito; el botón de cotizar por WhatsApp existe **solo dentro de cada ficha de producto**,
  y el mensaje sale con el nombre del equipo y su enlace ya escritos.
- **Texto en desplegables.** El contenido largo pasó a `<details>` y a las preguntas
  frecuentes, en la portada, en cada categoría y en cada ficha de producto. En la categoría
  solo queda a la vista el primer párrafo de la bajada; el resto baja al primer desplegable.

> **Fotos del banner.** Las de panadería, equipos complementarios y vitrinas son de Pexels
> (uso comercial libre, sin atribución obligatoria) y las eligió el cliente. La de gastronomía
> es CC0. La procedencia y licencia de cada una queda en `public/banner/creditos.json`.
>
> **La de repuestos se eliminó.** Estaba tomada del sitio de otra empresa
> (odisaequipa.com.mx), no de un banco de imágenes, así que no tenía licencia verificable.
> Ya no se usaba —el banner quedó en tres diapositivas— y publicar una foto ajena es un
> riesgo real, así que se sacó del repositorio. Si se quiere una diapositiva de repuestos,
> hay que elegir una de Pexels o usar una foto propia del taller.
>
> `vitrinas.webp` queda disponible como repuesto: es de Pexels y no está en uso.

Las fotos se sirven desde `public/banner/`, no enlazadas de un tercero: se recortan a 2000×900
buscando la zona de interés y se guardan en WebP. Para cambiar una, editar su URL en
`scripts/banner-fuentes.json` y correr `yarn banner:fetch`.

### El nombre del archivo lleva el hash del contenido

`yarn banner:fetch` guarda `panaderia-4c1885fe.webp`, borra la versión anterior y escribe
`public/banner/manifiesto.json` con el mapa sección → archivo. La portada lee ese manifiesto
y le pasa la ruta ya resuelta al carrusel.

No es capricho: `/_next/image` se sirve con `Cache-Control: max-age=2592000`. **Con el nombre
fijo, cambiar la foto no cambia la URL, así que el navegador que ya la vio no vuelve a
pedirla en 30 días** —y quien reemplazó la foto la ve bien solo en incógnito—. Pasó
exactamente eso con la de panadería: el archivo nuevo estaba desplegado y correcto, y en el
navegador seguía apareciendo el viejo. Con el hash en el nombre, cambiar la foto cambia la
URL y no hay caché que sobreviva.

> **Las fotos de producto todavía tienen nombre fijo** (`public/productos/<slug>.webp`).
> Están recién creadas, así que hoy no molesta, pero si alguna vez cambia la foto de un
> producto en el origen va a pasar lo mismo. La solución es la misma: hashear el nombre en
> `localize-product-images.mjs` y dejar que `imagenes-locales.json` haga de manifiesto —ya
> cumple ese rol—.

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

- **Tarjetas cerradas**: una sola caja envuelve foto, nombre, precio y botón. La primera
  versión tenía el marco solo alrededor de la foto y el texto suelto debajo, que se veía bien
  mientras el botón era un contorno gris; con el botón en naranja el conjunto se leía como un
  botón despegado de su producto. Se estiran a la altura de la fila para que precios y botones
  queden alineados entre sí.
- **Los controles del carrusel van debajo**, con las viñetas. Antes eran flechas circulares
  sobre la pista: funcionaban cuando la tarjeta era un marco alrededor de la foto, pero sobre
  una caja cerrada tapan una esquina y se ven como un parche. Abajo no roban espacio, no
  pueden chocar con un título de dos líneas, y en móvil se esconden —ahí se navega con el
  dedo—.
- **Menú con etiquetas cortas.** Con los nombres completos, las diez entradas no entran en
  1280 px. Los nombres largos se siguen usando en títulos y migas de pan.

### Dónde entra el color

La primera versión era casi toda blanca: la terracota aparecía en el logo, en algún botón y
poco más, y la página se leía fría para lo que es —un catálogo de equipamiento, no un estudio
de arquitectura—. El color se sumó por bandas y por acción, no repintando todo:

| Dónde | Qué |
| --- | --- |
| Franja superior del encabezado | `bg-brand-700`, la terracota oscura del logo |
| Menú de categorías | el enlace se enciende en `brand-700` al pasar y cuando está abierto |
| Botón «Agregar» de cada tarjeta | naranja lleno, antes era un contorno gris |
| Sección de categorías de la portada | fondo `brand-50` |
| Preguntas frecuentes (portada, categoría, ficha) | fondo `brand-50` |
| Contenido editorial de categoría y relacionados | fondo `brand-50` |
| Chips de subcategoría, búsqueda y 404 | pastilla `brand-50`, se pintan enteros al pasar |
| Borde superior del pie | línea de 2 px en `brand-500` |

Los carruseles de producto y la ficha se dejaron sobre blanco a propósito: el color separa
las bandas, y si todas llevan tinte deja de separar nada.

Un efecto secundario del botón naranja: la pista del carrusel sangraba 1 rem hacia los
márgenes y el borde de la tarjeta anterior asomaba. Con el botón gris no se notaba; en
naranja se leía como una astilla de color. Se quitó el sangrado —la tarjeta siguiente
cortada a la derecha ya avisa que hay más—.

### Móvil

Se auditó con Chrome DevTools **9 páginas × 4 anchos** (320, 360, 390 y 414 px), midiendo
`scrollWidth` contra `clientWidth` y, cuando había diferencia, buscando el elemento culpable
—descartando los que desbordan a propósito dentro de un contenedor con `overflow-x`—. Las 36
combinaciones dan **cero scroll horizontal**.

El único desborde real que había: en la grilla de dos columnas a 360 px, un precio de siete
cifras más el precio tachado no caben en la misma línea y empujaban la página hacia el
costado. La fila de precios ahora envuelve.

Decisiones de móvil:

- **El panel del menú entra desde la derecha, y el botón que lo abre está a la derecha.** Un
  panel tiene que aparecer desde donde se tocó, y ahí queda en la zona del pulgar. El carrito
  lo acompaña; el logo se queda solo a la izquierda. Entre los dos iconos va una línea
  divisoria: pegados se leían como un grupo y era fácil tocar el que no era.
- **Los textos van centrados bajo `sm`** —titular del banner, encabezados de sección y la
  banda de beneficios, con el icono arriba— y vuelven a la izquierda desde ahí. En una columna
  de 390 px un bloque alineado a la izquierda queda descolgado hacia un lado; centrado se lee
  como una decisión.

  El velo del banner tuvo que acompañar: era un degradado de izquierda a derecha pensado para
  el texto a la izquierda, y con el titular centrado dejaba su mitad derecha sobre foto casi
  sin velo. En móvil ahora es parejo, con caída suave arriba y abajo.
- **Objetivos táctiles de 44 px** en carrito, menú, aspa de cerrar y enlaces del panel. Antes
  medían 36 y 40.
- **El panel no separa la lista del bloque de contacto.** Con el contacto anclado al fondo
  quedaba un pantallazo en blanco entre «Línea de frío» y «Sobre nosotros»; ahora todo el
  panel se desplaza como una pieza.
- **Barra de compra fija en la ficha de producto.** En un teléfono la foto ocupa la pantalla
  entera y el botón queda siempre bajo el pliegue. La barra aparece cuando el botón principal
  ya quedó arriba y se retira al llegar al pie, para no taparlo.

  Se implementó midiendo posición en el evento de scroll, con `requestAnimationFrame`, y no
  con `IntersectionObserver`: el observador solo avisa al cruzar el umbral, y de la parte de
  arriba de la página a muy abajo el botón pasa de «no visible» a «no visible» sin cruzar
  nada. Con un salto de scroll —un ancla, la posición restaurada al volver atrás— la barra no
  aparecía nunca.
- **El ritmo vertical se aprieta bajo `sm`**: los márgenes pensados para escritorio se apilan
  y dejan pantallazos vacíos entre bloques cortos.
- **En móvil los carruseles de producto no son carruseles**: el mismo `<ul>` pasa de `flex` a
  `grid grid-cols-2`, con seis productos. La tarjeta cortada al borde de la pantalla se leía
  como un error, y el gesto lateral competía con el scroll de la página. No hizo falta tocar
  la lógica: en grilla no hay desplazamiento horizontal, así que el cálculo de páginas da 1 y
  los controles y el avance automático se apagan solos.
- **Los beneficios salieron de dentro del banner.** Estaban en la misma sección que la foto y
  se la comían; en un teléfono, además, estiraban el bloque a 766 px de alto, y de una imagen
  panorámica de 2000×900 ahí no se reconoce nada. Con banda propia debajo, el recuadro de la
  foto vuelve a ser ancho y la foto se lee. En móvil la banda muestra solo los cuatro títulos
  en dos columnas: con los detalles medía cuatro pantallazos.
- **Y en móvil la banda baja después de los destacados.** Sacarla del banner no alcanzaba:
  el banner es oscuro y la banda también, así que pegadas seguían leyéndose como un solo
  bloque negro y la foto parecía terminar donde empezaba la banda. Ahora el blanco de la
  sección de productos las separa, y lo primero que aparece después de la portada es producto
  con precio.

  El banner, la banda y los destacados están en un contenedor `flex flex-col` y se reordenan
  con `order` según el ancho, en vez de repetir el marcado. En escritorio la banda sigue
  pegada al banner, que es donde funciona. La banda no tiene nada enfocable —iconos y texto—,
  así que el orden visual distinto del orden del DOM no altera el recorrido con teclado.

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

## Calidad de los datos que llegaron del WordPress

**75 de los 214 productos tienen como foto principal una imagen generada por IA.** El nombre
del archivo lo dice sin ambigüedad: 70 son `Gemini_Generated_Image_*.jpg` y 5 son
`ChatGPT-Image-*.png`. No es una sospecha por el aspecto: es el archivo que está subido en
`romase.cl/wp-content`.

Se concentran en los artículos chicos —moldes, cortadores, depósitos gastronómicos—. En
artículos de pastelería es casi toda la rama: el único producto con foto real es la caja de
balines para sifón.

Esto importa por dos razones. La legal: una foto generada no muestra el producto que se
despacha, y en una ficha con precio eso es una descripción del producto. La comercial: se
notan, tienen fondos grises y proporciones que no calzan con el resto del catálogo.

No se tocó ninguna —son las que el cliente subió—, pero sí se excluyeron de las portadas de
categoría en la home: ahí van solo fotos reales. Lo que corresponde es reemplazarlas por
fotos del producto, aunque sean del taller y con el celular.

---

## Memoria y rendimiento

El servicio devolvía 502 de forma intermitente: la instancia se reiniciaba por falta de
memoria. Dos causas, las dos medidas:

**1. El catálogo se rearmaba en cada petición.** `cache()` de React deduplica dentro de un
render, no entre requests, así que cada visita a `/productos` y cada tecleo en el buscador
volvía a leer y parsear 1,1 MB de JSON y a reconstruir los 214 productos. Ahora se guarda a
nivel de módulo, compartido entre peticiones, con una hora de vigencia y deduplicación de
cargas simultáneas.

| | Antes | Después |
| --- | --- | --- |
| En reposo | 93,7 MB | 86,0 MB |
| Tras 40 búsquedas | 117,3 MB | 99,0 MB |
| Tras 15 cargas de `/productos` | 136,8 MB | 103,7 MB |

La latencia de `/api/buscar` bajó de 183 ms a unos 30 ms a partir de la segunda llamada.

**2. AVIF costaba más de lo que daba.** Medido sobre una foto del catálogo: 739 ms y 39 KB
contra 198 ms y 29 KB de WebP. Más lento, más memoria y un archivo más grande, así que se
dejó solo WebP. También se recortaron los `deviceSizes` —cada ancho distinto es una variante
más que el servidor puede tener que generar— y el caché de variantes pasó a un mes.

El logo se sirve con `unoptimized` desde `logo-web.webp` (400 px, 27 KB, generado por
`yarn favicons`): se muestra a 44 px de alto, no tiene sentido que el servidor lo procese en
cada arranque en frío.

**3. Las fotos de producto se pedían a WordPress y se optimizaban en caliente.** Cada una
pesaba entre 400 KB y 1,3 MB en origen, viajaba desde romase.cl y recién ahí el optimizador
de Next la reducía —con el costo de memoria y de tiempo en la primera visita de cada
variante—. `yarn productos:imagenes` (`scripts/localize-product-images.mjs`) baja las 391
fotos una sola vez, las reduce a 900 px WebP y las deja en `public/productos/`; el mapa
URL → archivo queda en `migration/data/imagenes-locales.json` y `src/lib/catalog.ts` lo
aplica al armar el catálogo.

| | Antes | Después |
| --- | --- | --- |
| Peso medio por foto | 400 KB – 1,3 MB | 12 KB |
| Total | ~200 MB en origen | 4,4 MB versionados |

El script es idempotente: vuelve a correrse cuando se agregan productos y solo baja lo que
falta.

> **Peso del proyecto.** La carpeta local pesa unos 620 MB, pero 610 son `node_modules`
> (386 MB) y `.next` (224 MB): generados, ignorados por git y no se despliegan como fuente.
> Lo versionado son **6,5 MB en 468 archivos**, y 4 MB de eso son las fotos de producto.

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
| `NEXT_PUBLIC_GTM_ID` | no | contenedor de Google Tag Manager |

Sin las de Supabase el sitio funciona igual, con el snapshot. Lo que queda a medias es el
formulario: con Resend configurado sigue avisando por correo aunque Supabase no esté, y sin
ninguno de los dos avisa en pantalla con el teléfono y el correo.

---

## Pendiente

- **Integrar Transbank Webpay Plus REST.** Es la única pasarela del sitio actual y el único
  paso que falta del flujo de compra: hoy el pedido se confirma y el pago se coordina a
  mano. El lugar donde entra está marcado en `checkout-form.tsx` (bloque «Pago») y el
  esquema ya tiene las columnas `webpay_token`, `webpay_buy_order` y `webpay_response`.
  Requiere código de comercio de Transbank.
- **Conectar el contenedor de GTM.** El `dataLayer` ya emite todo el embudo; falta cargar
  `NEXT_PUBLIC_GTM_ID` y publicar las etiquetas de GA4 en el contenedor.
- **Productos destacados.** La columna `featured` existe pero está en `false` para todos.
  Mientras no se curen, la home elige los mejor documentados.
- **Contenido de subcategorías.** Las 55 subcategorías heredan el texto del padre.
- **Envíos.** WooCommerce no tiene métodos de envío configurados; hay que definir zonas y
  tarifas antes de vender en línea.
- **Versión compacta del logo.** El lockup incluye la bajada «Distribuidor equipamiento
  integral para el comercio», que a la altura del encabezado (36–44 px) es ilegible. Convendría
  pedir una variante sin bajada para usar ahí.

---

## Ortografía de los nombres del catálogo

WooCommerce tiene los 214 nombres en mayúscula sostenida y **sin tildes**: «SOBADORA
ELECTRICA», «MAQUINA DE JUGOS», «DEPOSITOS GASTRONOMICOS». Al pasarlos a mayúscula de oración
quedaban mal escritos en toda la web.

`titleCase()` en `src/lib/format.ts` aplica un diccionario de correcciones —37 de los 214
nombres cambian— antes de armar el resultado. Es una capa de presentación a propósito:

- El `slug` no cambia, así que **ninguna URL se rompe** y no hacen falta redirecciones.
- La búsqueda compara con `normalize()`, que quita tildes, así que «maquina» sigue encontrando
  «máquina».
- La corrección llega sola a todos lados: tarjetas, fichas, migas de pan, carrito, correo del
  pedido, JSON-LD y el mensaje de WhatsApp.

Dos entradas del diccionario no son tildes sino **erratas del origen**: «ESTIDORA» por
estiradora y «PERRILA» por perilla. Conviene corregirlas en el WordPress; mientras eso no
pase, acá no se publican con la falta.

> Lo correcto es arreglarlo en el origen. El diccionario evita publicar 214 nombres con faltas
> hoy, no reemplaza esa tarea. Cuando el catálogo se cargue bien en Supabase, este bloque se
> puede ir vaciando.

También se colapsan los espacios repetidos: hay nombres cargados con dos espacios que en el
HTML no se notan, pero sí en un atributo `alt` o en el mensaje de WhatsApp.
