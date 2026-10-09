import type { Faq } from '@/lib/catalog'
import { site } from '@/lib/site'

/**
 * Se renderizan como <details> nativos: funcionan sin JavaScript y Google
 * los lee igual. El JSON-LD acompaña para optar al bloque de preguntas
 * frecuentes en los resultados de búsqueda.
 */
export function Faqs({ items, title = 'Preguntas frecuentes' }: { items: Faq[]; title?: string }) {
  if (!items.length) return null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((faq) => ({
      '@type': 'Question',
      name: faq.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: faq.respuesta },
    })),
  }

  return (
    <section className="border border-brand-100 bg-brand-50 p-6">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink-950">{title}</h2>

      <div className="divide-y divide-brand-100">
        {items.map((faq) => (
          <details key={faq.pregunta} className="group py-3">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-medium text-ink-900 marker:content-none">
              {faq.pregunta}
              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-lg leading-none text-brand-600 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 pr-6 text-sm leading-relaxed text-ink-600">{faq.respuesta}</p>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </section>
  )
}

/**
 * Preguntas de la ficha de producto.
 *
 * Se arman con el nombre del equipo para que cada ficha tenga su propio
 * bloque: es el lugar donde va el detalle de despacho, garantía y pago, en vez
 * de repetirlo como texto suelto a lo largo de la página.
 */
export function faqsProducto(nombre: string, enStock: boolean): Faq[] {
  return [
    {
      pregunta: '¿En cuánto tiempo llega el pedido?',
      respuesta: enStock
        ? `${nombre} está disponible en bodega: despachamos entre 24 y 72 horas hábiles desde ` +
          `que se confirma el pedido. Puedes retirarlo en ${site.contact.city} o enviarlo por la ` +
          `empresa de transporte que elijas, con el flete por pagar al recibir.`
        : `${nombre} se trae bajo pedido. Al confirmar la compra te damos el plazo exacto, que ` +
          `habitualmente va de 10 a 25 días hábiles según el fabricante. Después lo retiras en ` +
          `${site.contact.city} o lo despachamos a la Región de Los Lagos, Aysén o Magallanes.`,
    },
    {
      pregunta: '¿Qué garantía tiene y hay repuestos disponibles?',
      respuesta:
        'Viene con garantía del fabricante, indicada en la boleta o factura de compra. ' +
        'Mantenemos stock de repuestos de las marcas que representamos, así que una falla no ' +
        'deja el equipo parado esperando una importación.',
    },
    {
      pregunta: '¿Cómo puedo pagar y emiten factura?',
      respuesta:
        'Puedes pagar con transferencia, tarjeta de débito o crédito por Webpay, o en efectivo ' +
        'en el local. Emitimos boleta y factura electrónica: si necesitas factura, indica el RUT ' +
        'y la razón social al momento de la compra.',
    },
    {
      pregunta: '¿Puedo verlo antes de comprar?',
      respuesta:
        `Sí. Te esperamos en ${site.contact.address}, ${site.contact.city}, de lunes a viernes ` +
        `de 09:30 a 13:00 y de 14:00 a 18:00. Avísanos antes de venir por este equipo en ` +
        `particular para asegurarnos de tenerlo en sala.`,
    },
  ]
}

export const homeFaqs: Faq[] = [
  {
    pregunta: '¿Hasta dónde despachan?',
    respuesta:
      `Desde ${site.contact.city} hacia el sur: Región de Los Lagos, Aysén y Magallanes. Sale ` +
      `por empresa de transporte —Cruz del Sur, Starken, Chilexpress o Blue Express, la que ` +
      `prefieras— con el envío por pagar: el flete lo pagas al retirar, según volumen y ` +
      `destino. También puedes retirar en el local sin costo de envío.`,
  },
  {
    pregunta: '¿Los equipos tienen garantía?',
    respuesta:
      'Todos los equipos cuentan con garantía del fabricante. El plazo varía según la marca y el ' +
      'modelo, y queda indicado en la boleta o factura de compra. Ante cualquier falla dentro del ' +
      'período, escríbenos y coordinamos la revisión.',
  },
  {
    pregunta: '¿Puedo ver los equipos antes de comprar?',
    respuesta:
      `Claro. Te esperamos en ${site.contact.address}, ${site.contact.city}, de lunes a viernes ` +
      `de 09:30 a 13:00 y de 14:00 a 18:00. Si vienes por un equipo puntual, avísanos ` +
      'antes para asegurarnos de tenerlo disponible en el local.',
  },
  {
    pregunta: '¿Venden repuestos de los equipos?',
    respuesta:
      'Sí, mantenemos stock de repuestos para los equipos que comercializamos. Escríbenos con el ' +
      'modelo y el número de serie del equipo y te confirmamos disponibilidad y precio.',
  },
  {
    pregunta: '¿Emiten factura?',
    respuesta:
      'Sí, emitimos boleta y factura electrónica. Si necesitas factura, indícanoslo al momento de ' +
      'la compra junto con el RUT y la razón social de tu empresa.',
  },
  {
    pregunta: '¿Qué formas de pago aceptan?',
    respuesta:
      'Aceptamos transferencia bancaria, tarjetas de débito y crédito a través de Webpay, y ' +
      'efectivo en el local. Para compras de mayor volumen podemos evaluar condiciones especiales.',
  },
]
