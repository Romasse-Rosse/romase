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
    <section className="rounded-xl border border-ink-200 bg-ink-50 p-6">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink-950">{title}</h2>

      <div className="divide-y divide-ink-200">
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

export const homeFaqs: Faq[] = [
  {
    pregunta: '¿Hacen despacho a regiones?',
    respuesta:
      `Sí. Despachamos a todo Chile mediante empresas de transporte para equipos grandes y ` +
      `encomienda para artículos menores. En ${site.contact.city} la entrega es sin costo. ` +
      `El valor del flete se confirma al cotizar, según volumen y destino.`,
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
      `de 9:00 a 18:30 y sábados de 10:00 a 14:00. Si vienes por un equipo puntual, avísanos ` +
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
