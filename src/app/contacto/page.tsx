import type { Metadata } from 'next'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { site } from '@/lib/site'
import { Breadcrumbs, Container } from '@/components/ui'
import { ContactForm } from '@/components/contact-form'

export const metadata: Metadata = {
  title: 'Contacto y cotizaciones',
  description:
    `Contacta a ROMASE en ${site.contact.city}. Cotizaciones de maquinaria para panadería, ` +
    'pastelería y gastronomía, con despacho a todo Chile.',
  alternates: { canonical: '/contacto' },
}

export default function ContactoPage() {
  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Contacto' }]} />

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          Hablemos de tu proyecto
        </h1>
        <p className="mt-4 text-lg text-ink-600">
          Cuéntanos qué necesitas equipar y te armamos una propuesta concreta. Respondemos en
          horario comercial, el mismo día hábil.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div>
          <h2 className="mb-5 text-lg font-semibold text-ink-950">Envíanos tu consulta</h2>
          <ContactForm />
        </div>

        <div className="space-y-4">
          <ContactRow icon={Phone} label="Teléfono" href={site.contact.phoneHref}>
            {site.contact.phone}
          </ContactRow>

          <ContactRow icon={Mail} label="Correo" href={`mailto:${site.contact.email}`}>
            {site.contact.email}
          </ContactRow>

          <ContactRow icon={MapPin} label="Dirección">
            {site.contact.address}
            <br />
            {site.contact.city}, Región de {site.contact.region}
          </ContactRow>

          <ContactRow icon={Clock} label="Horario de atención">
            {site.hours.map((h) => (
              <span key={h.days} className="block">
                {h.days}: {h.time}
              </span>
            ))}
          </ContactRow>

          <div className="overflow-hidden rounded-xl border border-ink-200">
            <iframe
              title={`Ubicación de ${site.name} en ${site.contact.city}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                `${site.contact.address}, ${site.contact.city}, Chile`,
              )}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-64 w-full border-0"
            />
          </div>
        </div>
      </div>
    </Container>
  )
}

function ContactRow({
  icon: Icon,
  label,
  href,
  children,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  href?: string
  children: React.ReactNode
}) {
  const content = (
    <>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-600" />
      <span>
        <span className="block text-sm font-medium text-ink-950">{label}</span>
        <span className="text-sm text-ink-600">{children}</span>
      </span>
    </>
  )

  const className = 'flex gap-4 rounded-xl border border-ink-200 bg-white p-5'

  return href ? (
    <a href={href} className={`${className} transition-colors hover:border-brand-300`}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  )
}
