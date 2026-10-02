import type { Metadata } from 'next'
import { Mail, MapPin, Phone, Clock } from 'lucide-react'
import { site } from '@/lib/site'
import { Breadcrumbs, Container } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Política de devoluciones y garantía',
  description:
    'Conoce el derecho a retracto, la garantía legal y cómo solicitar la reparación, el cambio ' +
    'o la devolución de productos comprados en ROMASE.',
  alternates: { canonical: '/politica-de-devoluciones' },
}

/**
 * Política de devoluciones, retracto y garantía.
 *
 * El texto es legal y viene redactado por el cliente: no se reescribe ni se
 * resume. Lo único que no está escrito a mano son los datos de contacto, que
 * salen de `site.ts` para que no queden dos direcciones distintas en el sitio
 * el día que cambie alguna.
 */
export default function PoliticaDevolucionesPage() {
  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs
        items={[{ label: 'Inicio', href: '/' }, { label: 'Política de devoluciones' }]}
      />

      <article className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950">
          Política de devoluciones, retracto y garantía
        </h1>

        <p className="mt-4 text-ink-600">
          En {site.name} queremos que tu compra sea clara y segura. Aquí encontrarás las
          condiciones para ejercer el derecho a retracto en compras online, solicitar la garantía
          legal de un producto con fallas y gestionar una solicitud de postventa.
        </p>

        <Seccion titulo="Derecho a retracto en compras online">
          <p>
            Si compraste un producto a través de nuestro sitio web u otro medio de venta a
            distancia, puedes poner término a la compra sin expresión de causa dentro de los{' '}
            <strong className="font-semibold text-ink-900">10 días corridos</strong> siguientes a
            la recepción del producto, de acuerdo con la normativa vigente.
          </p>
          <p>
            Para ejercer este derecho, el producto debe encontrarse en buen estado y no presentar
            deterioros atribuibles al consumidor. Debes restituir los elementos originales del
            producto, como embalajes, etiquetas, manuales, certificados de garantía y accesorios, o
            su valor cuando corresponda.
          </p>
          <p>
            El derecho a retracto puede excluirse únicamente en los casos permitidos por la
            normativa vigente, por ejemplo, cuando el producto fue confeccionado según las
            especificaciones del consumidor, fue instalado o utilizado más allá de su inspección,
            puede deteriorarse o caducar rápidamente, o corresponde a un producto de uso personal o
            higiene cuyo sello fue abierto.
          </p>
        </Seccion>

        <Seccion titulo="Garantía legal para productos con fallas">
          <p>
            Si un producto nuevo presenta una falla, le faltan piezas o partes, no es apto para el
            uso al que está destinado o tiene una deficiencia cubierta por la Ley del Consumidor,
            puedes ejercer la garantía legal dentro de los{' '}
            <strong className="font-semibold text-ink-900">6 meses</strong> siguientes a la fecha
            en que recibiste el producto.
          </p>
          <p>Cuando corresponde la garantía legal, puedes elegir una de estas alternativas:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>reparación gratuita;</li>
            <li>cambio del producto; o</li>
            <li>devolución del dinero pagado, previa restitución del producto.</li>
          </ul>
          <p>
            La garantía legal no aplica cuando el deterioro o la falla se debe a un hecho imputable
            al consumidor, como mal uso, golpes, intervención no autorizada, instalación incorrecta
            realizada por terceros o utilización contraria al manual del fabricante.
          </p>
        </Seccion>

        <Seccion titulo="Cómo solicitar una devolución o garantía">
          <ol className="ml-5 list-decimal space-y-2">
            <li>
              Contáctanos por correo electrónico o teléfono e indica si solicitas retracto o
              garantía legal.
            </li>
            <li>
              Envía tu nombre, número de pedido o documento que acredite la compra, producto y
              modelo, número de serie cuando corresponda, descripción de la solicitud y fotografías
              o videos que permitan identificar el estado o la falla.
            </li>
            <li>{site.name} te informará las instrucciones de entrega o retiro del producto.</li>
            <li>
              Una vez recibido el producto y los antecedentes necesarios, {site.name} revisará la
              solicitud e informará los pasos siguientes.
            </li>
          </ol>
        </Seccion>

        <Seccion titulo="Entrega o retiro del producto">
          <p>
            En solicitudes por retracto, {site.name} informará el medio y las condiciones para
            restituir el producto.
          </p>
          <p>
            En solicitudes de garantía legal de productos comprados a distancia o con despacho a
            domicilio, {site.name} coordinará un mecanismo de retiro{' '}
            <strong className="font-semibold text-ink-900">sin costo adicional</strong> para el
            consumidor.
          </p>
          <p>
            También puedes entregar el producto, previa coordinación, en {site.contact.address},{' '}
            {site.contact.city}, Región de {site.contact.region}.
          </p>
        </Seccion>

        <Seccion titulo="Plazo de respuesta">
          <p>
            {site.name} informará el resultado de la solicitud dentro de un plazo máximo de{' '}
            <strong className="font-semibold text-ink-900">15 días hábiles</strong> desde que
            cuente con el producto y todos los antecedentes necesarios para revisarlo. La
            reparación, el cambio o la devolución se ejecutará a la brevedad y conforme a los
            plazos aplicables a cada caso.
          </p>
          <p>
            Este plazo operativo no reduce ni reemplaza los 6 meses de garantía legal ni los demás
            derechos de las personas consumidoras.
          </p>
        </Seccion>

        <Seccion titulo="Garantía del fabricante">
          <p>
            Los productos pueden contar además con una garantía voluntaria del fabricante. Su
            duración y condiciones dependen de la marca y el modelo y se informan en el certificado
            o documentación correspondiente.
          </p>
          <p>
            La garantía del fabricante complementa la garantía legal y no la reemplaza ni limita.
          </p>
        </Seccion>

        {/* Los datos salen de site.ts: si cambia el teléfono, cambia acá solo. */}
        <section className="mt-10 border border-ink-200 bg-paper-50 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink-950">Datos de contacto</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Contacto icono={MapPin} etiqueta="Dirección">
              {site.contact.address}, {site.contact.city}, Región de {site.contact.region}
              {site.contact.postalCode ? `, ${site.contact.postalCode}` : null}
            </Contacto>

            <Contacto icono={Mail} etiqueta="Correo">
              <a
                href={`mailto:${site.contact.email}`}
                className="text-brand-700 underline underline-offset-2"
              >
                {site.contact.email}
              </a>
            </Contacto>

            <Contacto icono={Phone} etiqueta="Teléfono">
              {site.contact.phones.map((t, i) => (
                <span key={t.href}>
                  {i > 0 && ' · '}
                  <a href={t.href} className="text-brand-700 underline underline-offset-2">
                    {t.numero}
                  </a>
                </span>
              ))}
            </Contacto>

            <Contacto icono={Clock} etiqueta="Horario">
              {site.hours.map((h) => `${h.days}, ${h.time}`).join(' · ')}
            </Contacto>
          </dl>
        </section>

        <p className="mt-8 border-t border-ink-200 pt-6 text-sm leading-relaxed text-ink-600">
          Esta política se aplica sin perjuicio de los derechos establecidos en la{' '}
          <strong className="font-medium text-ink-900">
            Ley N.º 19.496 sobre Protección de los Derechos de los Consumidores
          </strong>{' '}
          y demás normativa vigente en Chile.
        </p>
      </article>
    </Container>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight text-ink-950">{titulo}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink-600">{children}</div>
    </section>
  )
}

function Contacto({
  icono: Icono,
  etiqueta,
  children,
}: {
  icono: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <Icono aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-400" />
      <div className="min-w-0">
        <dt className="text-xs tracking-wide text-ink-500 uppercase">{etiqueta}</dt>
        <dd className="mt-0.5 text-ink-800">{children}</dd>
      </div>
    </div>
  )
}
