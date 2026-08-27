/**
 * Blog: estructura y contenido.
 *
 * El blog está construido pero **oculto**: no se enlaza desde el encabezado ni
 * el pie, no entra al sitemap, y las dos páginas piden a Google que no las
 * indexe. Existe para poder revisar el diseño antes de que se escriba el
 * contenido de verdad.
 *
 * Para publicarlo, cuando llegue esa etapa:
 *
 *   1. Poner `BLOG_VISIBLE = true` acá abajo. Eso solo enciende el enlace del
 *      pie y saca el `noindex` de las dos páginas.
 *   2. Sacar `/blog` de la lista `disallow` en `src/app/robots.ts`.
 *   3. Agregar las entradas al sitemap en `src/app/sitemap.ts`.
 *
 * ---
 *
 * Las dos notas de acá son **de ejemplo**, pero están escritas contra el
 * estándar de redacción de la agencia (`skills/seo/redaccion-contenido` en el
 * repositorio de conocimiento). Lo que ese estándar exige y acá se cumple:
 *
 *   - Mínimo 600 palabras; 1 H2 cada ~300 palabras, mínimo 2.
 *   - Keyword foco presente en H1, metatítulo, metadescripción y slug.
 *   - Metatítulo de 50 a 60 caracteres; metadescripción de 135 a 145.
 *   - Párrafos de hasta 50 palabras.
 *   - Los cuatro formatos: negritas, cursivas, listas y cita en bloque.
 *   - Dos imágenes con alt descriptivo, una de ellas con la keyword.
 *   - Uno o dos enlaces internos en el cuerpo y un CTA al cierre hacia una
 *     categoría canónica. Ningún enlace externo.
 *   - Último H2 con título descriptivo: nunca «Conclusión».
 *
 * **Regla cero-alucinación.** Ninguna cifra concreta entra al cuerpo si no está
 * verificada en una fuente con la información a la vista. Por eso estas notas
 * explican qué mueve un costo o un plazo en vez de inventar rangos: es más útil
 * para quien lee y no compromete al cliente. Cuando ROMASE entregue sus propios
 * datos —plazos reales de despacho, capacidades de cada modelo—, ahí sí entran,
 * citando la ficha del producto.
 *
 * La keyword foco de cada nota está puesta a criterio y **falta validarla con
 * volumen real** antes de publicar, que es el paso 1 del flujo de la agencia.
 */

export type Articulo = {
  slug: string
  titulo: string
  /**
   * Keyword foco. Tiene que aparecer en el H1, en el primer párrafo, en al
   * menos un H2, en el alt de una imagen, en el metatítulo, en la
   * metadescripción y en el slug.
   */
  keyword: string
  /** 50 a 60 caracteres. Se usa tal cual, sin el sufijo de la marca. */
  metaTitulo: string
  /** 135 a 145 caracteres, con la keyword lo más al principio posible. */
  metaDescripcion: string
  /** Resumen para la tarjeta del listado. */
  bajada: string
  /** Etiqueta temática. Se muestra como pastilla, no genera páginas propias. */
  tema: string
  /** ISO, para <time> y para ordenar. */
  fecha: string
  autor: string
  /** Clave del manifiesto de public/banner/, o null si la nota no lleva foto. */
  portada: string | null
  portadaAlt: string
  /**
   * Segunda imagen, dentro del cuerpo: la foto de un producto del catálogo.
   * Cumple el mínimo de dos imágenes y a la vez da un enlace interno natural.
   */
  imagenProducto: { slug: string; alt: string; pie: string } | null
  /**
   * Cuerpo en HTML. Se pinta con .rich-text, igual que el catálogo.
   * Los apartados van en `<h2>`: cuelgan directamente del `<h1>` del artículo.
   */
  cuerpo: string
}

/** Mientras esté en false, el blog no se enlaza ni se indexa. */
export const BLOG_VISIBLE = false

export const articulos: Articulo[] = [
  {
    slug: 'amasadora-para-panaderia-como-elegir',
    titulo: 'Cómo elegir una amasadora para panadería según tu producción',
    keyword: 'amasadora para panadería',
    metaTitulo: 'Amasadora para panadería: cómo elegir la que necesitas',
    metaDescripcion:
      'Amasadora para panadería: qué mirar antes de comprar, por qué la capacidad del bol no ' +
      'define tu producción y el costo real que nadie te cotiza.',
    bajada:
      'La capacidad del bol no es la cifra que decide. Qué preguntas responder antes de mirar ' +
      'modelos, y por qué quedarse corto en esta compra no se arregla comprando otra cosa.',
    tema: 'Panadería',
    fecha: '2026-08-20',
    autor: 'Equipo ROMASE',
    portada: 'panaderia',
    portadaAlt: 'Amasadora para panadería trabajando masa en un obrador',
    imagenProducto: {
      slug: 'amasadora-12-kg',
      alt: 'Amasadora para panadería de bol fijo con reja de seguridad',
      pie: 'Las amasadoras de bol fijo son las más comunes en obradores chicos y medianos.',
    },
    cuerpo: `
      <p>Hay una compra que se paga durante años y casi siempre se decide en veinte minutos:
      la <strong>amasadora para panadería</strong>. Es la primera máquina del obrador y la que
      le pone techo a todo lo que viene después.</p>

      <p>Un horno chico se compensa haciendo dos hornadas. Una amasadora chica no se compensa
      con nada, porque el tiempo de amasado no se puede acortar. O entra la masa, o no entra.</p>

      <h2>Por qué la capacidad del bol no te dice cuánto vas a producir</h2>

      <p>El número que aparece en la ficha es la capacidad nominal, y se mide en kilos de
      <em>masa</em>, no de pan terminado. Son dos cosas distintas: entre una y otra hay agua
      que se evapora en el horno.</p>

      <p>Además, ninguna amasadora trabaja bien cargada al tope. Con el bol lleno el motor
      sufre, la masa no toma aire y el amasado tarda más. La capacidad real de trabajo continuo
      siempre es menor que la de la etiqueta.</p>

      <p>Y falta el factor que más se olvida: el tiempo. Cada tanda ocupa el amasado, el
      vaciado y la limpieza entre una y otra. En una jornada entran muchas menos tandas de las
      que uno calcula sentado en un escritorio.</p>

      <blockquote>La pregunta correcta no es cuántos kilos entran en el bol, sino cuántas
      tandas alcanzas a hacer en el turno que tienes.</blockquote>

      <h2>Qué responder antes de elegir una amasadora para panadería</h2>

      <p>Antes de comparar precios conviene tener cuatro respuestas por escrito. Sin ellas, la
      decisión termina tomándose por presupuesto y no por producción:</p>

      <ul>
        <li><strong>Cuánto vendes en tu día más cargado</strong>, no en el promedio. La máquina
        tiene que aguantar el sábado, no el martes.</li>
        <li><strong>Cuántas horas de producción efectiva tienes</strong> antes de abrir. Ese es
        el número que limita las tandas.</li>
        <li><strong>Qué tan distintas son tus masas.</strong> Una masa dura exige más motor que
        una masa blanda del mismo peso.</li>
        <li><strong>Dónde quieres estar en dos años.</strong> Si el plan es crecer, comprar
        justo para hoy significa volver a comprar.</li>
      </ul>

      <p>Con eso resuelto, elegir modelo es rápido. Sin eso, cualquier vendedor te puede vender
      cualquier cosa y las dos partes van a creer que se hizo bien.</p>

      <p>Vale la pena escribir esas respuestas antes de pedir la primera cotización. Cuando
      llegan tres presupuestos de máquinas distintas, sin ese papel al lado la comparación se
      vuelve un juego de precios.</p>

      <p>Hay una decisión más que conviene tomar temprano: si el obrador va a trabajar con una
      sola masa o con varias. Un solo tipo de masa permite ajustar la máquina y olvidarse. Con
      recetas distintas conviene un modelo que tolere cargas irregulares sin quejarse.</p>

      <h2>El costo que no aparece en la cotización</h2>

      <p>Las amasadoras grandes suelen ser trifásicas. Si tu local es monofásico, la
      instalación eléctrica puede acercarse al valor de la máquina, y eso no está en el
      presupuesto que te pasaron.</p>

      <p>Lo mismo con el acceso. Conviene medir la puerta, el pasillo y el giro antes de
      comprar, no el día de la entrega. Una máquina que no entra es un problema caro y
      evitable.</p>

      <p>Y el espacio de trabajo alrededor: la amasadora ocupa su base más el lugar para sacar
      el bol y para que alguien trabaje sin chocar con el resto del obrador. En planta se ve
      distinto que en la ficha técnica.</p>

      <p>Si estás armando o renovando el obrador, la amasadora conviene definirla primero y el
      resto de la <a href="/categorias/panaderia">maquinaria para panadería</a> después. Es la
      que manda. Y si el paso siguiente es la conservación, en
      <a href="/blog/como-dimensionar-la-linea-de-frio">cómo dimensionar la línea de frío</a>
      está el mismo criterio aplicado al equipo de frío.</p>

      <p>Cuando tengas tus números de producción a mano, la conversación dura cinco minutos y
      evita una compra mal dimensionada.</p>

      <p><a href="/categorias/panaderia">Conoce las amasadoras y la maquinaria para panadería
      de ROMASE</a></p>
    `,
  },
  {
    slug: 'como-dimensionar-la-linea-de-frio',
    titulo: 'Cómo dimensionar la línea de frío de un local nuevo',
    keyword: 'línea de frío',
    metaTitulo: 'Línea de frío: cómo dimensionarla en un local nuevo',
    metaDescripcion:
      'Línea de frío en un local nuevo: por qué conviene separar la conservación de la ' +
      'exhibición, y el error de cálculo que se repite en casi todos.',
    bajada:
      'Por qué la vitrina no reemplaza al equipo de conservación, el error de cálculo que se ' +
      'repite en casi todos los locales que abren, y qué mirar en la ficha antes de comprar.',
    tema: 'Línea de frío',
    fecha: '2026-08-06',
    autor: 'Equipo ROMASE',
    portada: 'vitrinas',
    portadaAlt: 'Vitrina refrigerada de pastelería, parte de la línea de frío de un local',
    imagenProducto: {
      slug: 'freezer-vertical-163-lts-libero',
      alt: 'Freezer vertical para conservación en la línea de frío de un local',
      pie: 'El equipo cerrado guarda el stock; la vitrina solo muestra lo del día.',
    },
    cuerpo: `
      <p>La <strong>línea de frío</strong> es la inversión que más se subestima al abrir un
      local. No porque sea cara, sino porque se compra pensando en lo que entra hoy y no en lo
      que hay que guardar el día que llega el pedido del proveedor.</p>

      <p>El resultado se ve a los pocos meses: equipos trabajando al límite, producto que se
      seca en la exhibición y cajas apiladas donde no corresponde.</p>

      <h2>Conservar y exhibir no son la misma máquina</h2>

      <p>Una vitrina no es un refrigerador con vidrio. Está pensada para <em>mantener</em>
      temperatura con la puerta abriéndose todo el día y con la carga a la vista, no para bajar
      la temperatura de producto recién llegado.</p>

      <p>Si la vitrina se usa como bodega, el compresor trabaja forzado y el producto de
      adelante se reseca. Se nota primero en la calidad y después en la boleta de la luz.</p>

      <p>Lo que funciona es separar las dos funciones. Un equipo cerrado para el stock y la
      vitrina solo con la exhibición del día, que se repone desde el equipo cerrado y nunca al
      revés.</p>

      <blockquote>La vitrina vende; el equipo cerrado conserva. Pedirle a uno que haga el
      trabajo del otro sale caro por los dos lados.</blockquote>

      <h2>El día que llega el pedido, no el promedio de la semana</h2>

      <p>Casi todos los locales que abren dimensionan el frío para el consumo promedio. El
      problema es que la compra al proveedor no llega promediada: llega entera, una o dos veces
      por semana.</p>

      <p>Ese día necesitas espacio para todo el pedido, no para el promedio diario. Si no lo
      tienes, el producto termina en el piso de la cocina esperando lugar, que es exactamente
      lo que la línea de frío tiene que evitar.</p>

      <p>La forma simple de calcularlo es contar cajas, no litros. Cuántas cajas llegan en la
      entrega más grande de la semana y cuánto mide cada una. Después hay que sumar aire: un
      equipo lleno hasta el techo no enfría, bloquea el flujo y deja zonas tibias.</p>

      <p>Ese ejercicio se hace una vez, con el proveedor al teléfono, y ordena toda la compra.
      Es más confiable que estimar litros de memoria, porque las cajas son lo que de verdad
      entra por la puerta.</p>

      <p>Conviene además pensar dónde va a estar cada equipo. El de conservación puede ir atrás,
      donde no molesta; la vitrina tiene que estar donde la gente pasa. Definir eso antes de
      comprar evita descubrir que el equipo elegido no cabe donde tenía que ir.</p>

      <h2>Qué mirar en la ficha de un equipo de línea de frío</h2>

      <p>Tres cosas separan un equipo que rinde de uno que da problemas, y ninguna es el
      precio:</p>

      <ul>
        <li><strong>El clima de trabajo.</strong> Un equipo especificado para una cocina
        templada rinde distinto en una que se calienta en verano. Conviene mirar el rango de
        temperatura ambiente, no solo la interior.</li>
        <li><strong>El consumo.</strong> Sobre una máquina que anda todos los días y todo el
        día, la diferencia entre dos modelos se paga sola con el tiempo.</li>
        <li><strong>Los repuestos.</strong> Un termostato o un burlete que hay que importar
        deja el equipo parado semanas. Es la pregunta que más rinde hacer antes de comprar.</li>
      </ul>

      <p>Ese último punto es el que más se olvida y el que más cuesta después. Antes de cerrar
      la compra vale la pena confirmar que hay
      <a href="/categorias/repuestos">repuestos disponibles</a> para el modelo, no solo para la
      marca.</p>

      <p>Si estás armando el local completo, el mismo criterio aplica a la maquinaria: en
      <a href="/blog/amasadora-para-panaderia-como-elegir">cómo elegir una amasadora para
      panadería</a> está desarrollado para el obrador.</p>

      <p>Dimensionar el frío al principio cuesta lo mismo que dimensionarlo mal, y evita
      comprar dos veces.</p>

      <p><a href="/categorias/frio-2">Conoce los equipos de línea de frío de ROMASE</a></p>
    `,
  },
]

/** Minutos de lectura, a 200 palabras por minuto sobre el texto sin etiquetas. */
export function minutosDeLectura(cuerpo: string): number {
  const palabras = cuerpo.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length
  return Math.max(1, Math.round(palabras / 200))
}

/** Del más nuevo al más viejo. */
export function articulosPublicados(): Articulo[] {
  return [...articulos].sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export function articuloPorSlug(slug: string): Articulo | null {
  return articulos.find((a) => a.slug === slug) ?? null
}

/** 20 de agosto de 2026 */
export function fechaLarga(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
