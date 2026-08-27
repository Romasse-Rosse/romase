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
 * Los dos artículos de acá son **de ejemplo**, escritos con el criterio que
 * usaría el negocio, para que el diseño se pueda juzgar con texto real en vez
 * de relleno. Se reemplazan o se borran sin tocar código.
 */

export type Articulo = {
  slug: string
  titulo: string
  /** Resumen para la tarjeta del listado y para la metadata. */
  bajada: string
  /** Etiqueta temática. Se muestra como pastilla, no genera páginas propias. */
  tema: string
  /** ISO, para <time> y para ordenar. */
  fecha: string
  autor: string
  /** Clave del manifiesto de public/banner/, o null si el artículo no lleva foto. */
  portada: string | null
  portadaAlt: string
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
    slug: 'que-amasadora-necesito-segun-mi-produccion',
    titulo: 'Qué amasadora necesitas según los kilos que amasas al día',
    bajada:
      'La capacidad del bol no es la cifra que importa. Cómo calcular la amasadora que te sirve ' +
      'a partir de la producción real de tu local, y por qué quedarse corto no se arregla después.',
    tema: 'Panadería',
    fecha: '2026-08-20',
    autor: 'Equipo ROMASE',
    portada: 'panaderia',
    portadaAlt: 'Masa siendo batida en un bol de acero sobre un mesón de trabajo',
    cuerpo: `
      <p>La amasadora es la primera máquina que se compra y la que pone el techo de todo lo
      demás. Un horno chico se compensa haciendo dos hornadas; una amasadora chica no se
      compensa con nada, porque el tiempo de amasado no se puede acortar.</p>

      <h2>La capacidad del bol no es la capacidad de producción</h2>

      <p>Una amasadora de 12 kilos no hace 12 kilos de pan: hace 12 kilos de <em>masa</em>, y
      con la masa al tope la máquina trabaja forzada. La regla práctica es contar con el
      70 % de la capacidad nominal para trabajo continuo. Esa misma amasadora rinde unos
      8 kilos de masa por ciclo sin sufrir.</p>

      <p>Después está el tiempo. Un ciclo completo de amasado son entre 12 y 18 minutos según
      la receta, más el vaciado y la limpieza entre tandas. En una jornada de seis horas de
      producción efectiva entran unos 15 ciclos, no 30.</p>

      <h2>Cómo hacer la cuenta al revés</h2>

      <p>Parte de lo que vendes, no de lo que quieres comprar. Si despachas 400 panes de
      100 gramos, son 40 kilos de producto terminado, que con la merma de horneado significan
      unos 46 kilos de masa. Con 15 ciclos disponibles eso da poco más de 3 kilos por ciclo:
      una amasadora de 8 kilos te alcanza y te deja margen para crecer.</p>

      <p>Si en cambio despachas 2.000 panes, la cuenta da 15 kilos por ciclo y necesitas una
      de 22 kilos. Comprar dos de 12 para llegar al mismo número casi nunca conviene: son dos
      motores, dos mantenciones y dos veces el espacio.</p>

      <h2>Lo que se olvida al presupuestar</h2>

      <ul>
        <li><strong>La corriente.</strong> Desde los 20 kilos, la mayoría de los modelos son
        trifásicos. Si el local tiene monofásico, el costo de la instalación eléctrica puede
        acercarse al de la máquina.</li>
        <li><strong>El acceso.</strong> Una amasadora de 22 kilos no pasa por una puerta de
        70 centímetros. Vale la pena medir antes de comprar, no el día de la entrega.</li>
        <li><strong>El espacio de trabajo alrededor.</strong> La máquina ocupa su base más el
        espacio para sacar el bol y para que alguien trabaje sin chocar con el resto.</li>
      </ul>

      <p>Si tienes los números de tu producción a mano, escríbenos y te decimos qué modelo
      corresponde. Es una conversación de cinco minutos que evita una compra de un millón de
      pesos mal dimensionada.</p>
    `,
  },
  {
    slug: 'como-dimensionar-la-linea-de-frio',
    titulo: 'Cómo dimensionar la línea de frío de un local nuevo',
    bajada:
      'Cuánto frío necesitas de verdad, por qué conviene separar la conservación de la ' +
      'exhibición, y el error de cálculo que aparece en casi todos los locales que abren.',
    tema: 'Línea de frío',
    fecha: '2026-08-06',
    autor: 'Equipo ROMASE',
    portada: 'vitrinas',
    portadaAlt: 'Vitrina refrigerada de pastelería con productos a la vista',
    cuerpo: `
      <p>El frío es la inversión que más se subestima al abrir. No porque sea caro, sino porque
      se compra pensando en lo que entra hoy y no en lo que hay que guardar cuando llega el
      pedido del proveedor.</p>

      <h2>Conservar y exhibir son dos cosas distintas</h2>

      <p>Una vitrina no es un refrigerador con vidrio. Está diseñada para mantener temperatura
      con la puerta abriéndose todo el día y con la carga a la vista, no para bajar la
      temperatura de producto recién llegado. Si usas la vitrina como bodega, el compresor
      trabaja al límite y el producto de adelante se seca.</p>

      <p>Lo que funciona: un equipo cerrado para conservar el stock —freezer o refrigerador
      vertical, según lo que guardes— y la vitrina solo con la exhibición del día. La vitrina
      se repone desde el equipo cerrado, no al revés.</p>

      <h2>El error de cálculo típico</h2>

      <p>Casi todos los locales que abren compran frío para el consumo promedio. El problema
      es que la compra al proveedor no llega promediada: llega entera, una o dos veces por
      semana. El día de la entrega necesitas espacio para todo el pedido, no para el promedio
      diario.</p>

      <p>La forma simple de dimensionarlo es contar cajas. Cuántas cajas llegan en la entrega
      más grande de la semana, cuánto mide cada una, y sumar un 20 % de aire para que el frío
      circule. Un equipo lleno hasta el techo no enfría: bloquea el flujo y deja zonas
      tibias.</p>

      <h2>Tres cosas que conviene mirar en la ficha</h2>

      <ul>
        <li><strong>Rango de temperatura y clima de trabajo.</strong> Un equipo especificado
        para 32 °C ambiente rinde distinto en una cocina que llega a 38 °C en verano.</li>
        <li><strong>Consumo.</strong> Sobre un equipo que anda todo el día, todos los días, la
        diferencia de consumo entre dos modelos se paga sola en un par de años.</li>
        <li><strong>Repuestos.</strong> Un termostato o un burlete que hay que importar deja el
        equipo parado semanas. Es la pregunta que más rinde hacer antes de comprar, no
        después.</li>
      </ul>

      <p>Si estás armando un local desde cero, cuéntanos qué vas a vender y cuánto espacio
      tienes: dimensionar el frío al principio cuesta lo mismo y evita comprar dos veces.</p>
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
