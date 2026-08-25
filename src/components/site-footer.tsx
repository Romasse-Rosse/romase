import Image from 'next/image'
import Link from 'next/link'
import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import type { ComponentType } from 'react'
import { getCategoryTree } from '@/lib/catalog'
import { site } from '@/lib/site'
import { titleCase } from '@/lib/format'
import { Container } from './ui'

const socialIcons: Record<string, ComponentType<{ className?: string }>> = {
  Instagram,
  Facebook,
}

export async function SiteFooter() {
  const categories = await getCategoryTree()

  return (
    <footer className="mt-20 bg-ink-950 text-ink-300">
      <Container>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/brand/logo-web.webp"
              alt={site.name}
              width={400}
              height={147}
              /* Ya viene al tamaño de uso: no hace falta el optimizador. */
              unoptimized
              className="h-10 w-auto brightness-0 invert"
            />
            <p className="mt-4 text-sm leading-relaxed">{site.description}</p>

            <ul className="mt-6 flex gap-2.5">
              {site.social.map(({ name, url }) => {
                const Icon = socialIcons[name]
                return (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${site.name} en ${name}`}
                      className="flex size-10 items-center justify-center border border-ink-800 text-ink-300 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                    >
                      <Icon aria-hidden="true" className="size-4.5" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">Categorías</h2>
            <ul className="space-y-2 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/categorias/${category.slug}`} className="hover:text-brand-400">
                    {titleCase(category.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">La empresa</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/productos" className="hover:text-brand-400">
                  Todos los productos
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="hover:text-brand-400">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-brand-400">
                  Contacto y cotizaciones
                </Link>
              </li>
              <li>
                <Link href="/politica-de-privacidad" className="hover:text-brand-400">
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">Dónde encontrarnos</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <span>
                  {site.contact.address}
                  <br />
                  {site.contact.city}, Región de {site.contact.region}
                </span>
              </li>
              <li className="flex gap-2.5">
                <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <a href={site.contact.phoneHref} className="hover:text-brand-400">
                  {site.contact.phone}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <a href={`mailto:${site.contact.email}`} className="break-all hover:text-brand-400">
                  {site.contact.email}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <span>
                  {site.hours.map((h) => (
                    <span key={h.days} className="block">
                      {h.days}: {h.time}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-ink-800 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName}. Todos los derechos reservados.
          </p>
          <p>
            {site.tagline} en {site.contact.city}, Chile.
          </p>
        </div>
      </Container>
    </footer>
  )
}
