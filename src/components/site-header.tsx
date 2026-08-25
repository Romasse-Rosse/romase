'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronDown, Mail, MapPin, Menu, Phone, Truck, X } from 'lucide-react'
import type { CategoryNode } from '@/lib/catalog'
import { site, whatsappUrl } from '@/lib/site'
import { titleCase } from '@/lib/format'
import { nombreCortoCategoria } from '@/content/nombres-categorias'
import { cn } from '@/lib/cn'
import { SearchBox } from './search-box'
import { Container } from './ui'
import { CartButton } from './cart-drawer'

/**
 * El menú se organiza por categorías de producto, no por secciones
 * institucionales: es lo que se acordó en el kick-off para que la
 * home lea como e-commerce y no como sitio de servicios.
 */
export function SiteHeader({ categories }: { categories: CategoryNode[] }) {
  const pathname = usePathname()
  const [openCategory, setOpenCategory] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const openCategoryNode = categories.find((c) => c.id === openCategory) ?? null

  // Cualquier navegación cierra lo que esté abierto.
  useEffect(() => {
    setOpenCategory(null)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-40 bg-white">
      {/* Barra de utilidad */}
      <div className="hidden bg-ink-950 text-ink-100 lg:block">
        <Container>
          <div className="flex h-9 items-center justify-between text-xs">
            <p className="flex items-center gap-2">
              <Truck aria-hidden="true" className="size-3.5 text-brand-400" />
              Despacho a todo Chile · Entrega sin costo en {site.contact.city}
            </p>
            <div className="flex items-center gap-5">
              <a href={site.contact.phoneHref} className="flex items-center gap-1.5 hover:text-white">
                <Phone aria-hidden="true" className="size-3.5" />
                {site.contact.phone}
              </a>
              <a
                href={`mailto:${site.contact.email}`}
                className="flex items-center gap-1.5 hover:text-white"
              >
                <Mail aria-hidden="true" className="size-3.5" />
                {site.contact.email}
              </a>
            </div>
          </div>
        </Container>
      </div>

      {/* Barra principal */}
      <div className="border-b border-ink-200 bg-white">
        <Container>
          <div className="flex h-18 items-center gap-4">
            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="-ml-2 rounded-lg p-2 text-ink-700 hover:bg-ink-100 lg:hidden"
            >
              <Menu className="size-6" />
            </button>

            <Link href="/" className="shrink-0" aria-label={`${site.name} · Inicio`}>
              <Image
                src="/brand/logo.png"
                alt={site.name}
                width={764}
                height={280}
                priority
                className="h-9 w-auto sm:h-11"
              />
            </Link>

            <SearchBox className="mx-auto hidden max-w-xl flex-1 md:block" />

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Link
                href="/contacto"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 lg:block"
              >
                Contacto
              </Link>
              <a
                href={whatsappUrl('Hola ROMASE, quiero hacer una consulta sobre sus equipos.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-medium text-white hover:bg-[#1eb855]"
              >
                <WhatsAppIcon className="size-4.5" />
                <span className="hidden sm:inline">Cotizar</span>
              </a>
              <CartButton />
            </div>
          </div>

          {/* Buscador en móvil */}
          <div className="pb-3 md:hidden">
            <SearchBox placeholder="Buscar productos…" />
          </div>
        </Container>
      </div>

      {/* Categorías */}
      <nav
        aria-label="Categorías de productos"
        className="relative hidden border-b border-ink-200 bg-white lg:block"
        onMouseLeave={() => setOpenCategory(null)}
      >
        <Container>
          {/* Son diez entradas y no siempre entran: en pantallas angostas la
              barra se desplaza en horizontal en vez de recortar categorías. */}
          <ul className="flex items-stretch gap-4 overflow-x-auto no-scrollbar xl:gap-6">
            {categories.map((category) => {
              const isOpen = openCategory === category.id
              const hasChildren = category.children.length > 0

              return (
                <li key={category.id}>
                  <Link
                    href={`/categorias/${category.slug}`}
                    aria-expanded={hasChildren ? isOpen : undefined}
                    onMouseEnter={() => setOpenCategory(hasChildren ? category.id : null)}
                    onFocus={() => setOpenCategory(hasChildren ? category.id : null)}
                    className={cn(
                      'relative flex h-12 items-center gap-1 text-[13px] whitespace-nowrap transition-colors',
                      'after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-brand-500 after:transition-transform',
                      isOpen
                        ? 'text-ink-950 after:scale-x-100'
                        : 'text-ink-600 after:scale-x-0 hover:text-ink-950',
                    )}
                  >
                    {nombreCortoCategoria(category.slug, titleCase(category.name))}
                    {hasChildren && (
                      <ChevronDown
                        aria-hidden="true"
                        className={cn('size-3.5 transition-transform', isOpen && 'rotate-180')}
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </Container>

        {/* El panel vive fuera de la lista: si estuviera dentro, el scroll
            horizontal de la barra lo recortaría. */}
        {openCategoryNode && openCategoryNode.children.length > 0 && (
          <div className="absolute inset-x-0 top-full z-40 border-b border-ink-200 bg-white shadow-lift">
            <Container>
              <div className="py-8">
                <div className="mb-5 flex items-baseline justify-between border-b border-ink-100 pb-3">
                  <p className="text-[11px] font-medium tracking-[0.18em] text-ink-400 uppercase">
                    {titleCase(openCategoryNode.name)}
                  </p>
                  <Link
                    href={`/categorias/${openCategoryNode.slug}`}
                    className="text-sm text-brand-600 hover:text-brand-700"
                  >
                    Ver los {openCategoryNode.productCount} productos →
                  </Link>
                </div>
                <ul className="grid grid-cols-4 gap-x-10 gap-y-0.5">
                  {openCategoryNode.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categorias/${child.slug}`}
                        className="flex items-baseline justify-between gap-2 py-1.5 text-sm text-ink-600 transition-colors hover:text-brand-600"
                      >
                        <span>{titleCase(child.name)}</span>
                        <span className="text-xs text-ink-300">{child.productCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Container>
          </div>
        )}
      </nav>

      {mobileOpen && (
        <MobileMenu categories={categories} onClose={() => setMobileOpen(false)} />
      )}
    </header>
  )
}

function MobileMenu({
  categories,
  onClose,
}: {
  categories: CategoryNode[]
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-ink-950/50" onClick={onClose} aria-hidden="true" />

      <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200 px-4">
          <span className="text-sm font-semibold tracking-wide text-ink-950">Categorías</span>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {categories.map((category) => (
            <div key={category.id} className="border-t border-ink-100">
              <div className="flex items-stretch">
                <Link
                  href={`/categorias/${category.slug}`}
                  className="flex-1 px-4 py-3 text-sm font-medium text-ink-800"
                  onClick={onClose}
                >
                  {titleCase(category.name)}
                  <span className="ml-2 text-xs text-ink-400">{category.productCount}</span>
                </Link>
                {category.children.length > 0 && (
                  <button
                    type="button"
                    aria-label={`Ver subcategorías de ${category.name}`}
                    aria-expanded={expanded === category.id}
                    onClick={() => setExpanded(expanded === category.id ? null : category.id)}
                    className="px-4 text-ink-500"
                  >
                    <ChevronDown
                      className={cn(
                        'size-4 transition-transform',
                        expanded === category.id && 'rotate-180',
                      )}
                    />
                  </button>
                )}
              </div>

              {expanded === category.id && (
                <ul className="bg-ink-50 pb-2">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categorias/${child.slug}`}
                        className="flex justify-between px-8 py-2.5 text-sm text-ink-600"
                        onClick={onClose}
                      >
                        {titleCase(child.name)}
                        <span className="text-xs text-ink-400">{child.productCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-ink-200 p-4 text-sm">
          <Link href="/nosotros" className="block py-2 text-ink-700" onClick={onClose}>
            Sobre nosotros
          </Link>
          <Link href="/contacto" className="block py-2 text-ink-700" onClick={onClose}>
            Contacto
          </Link>
          <a href={site.contact.phoneHref} className="flex items-center gap-2 py-2 text-ink-700">
            <Phone className="size-4" />
            {site.contact.phone}
          </a>
          <p className="flex items-start gap-2 py-2 text-xs text-ink-500">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {site.contact.address}, {site.contact.city}
          </p>
        </div>
      </div>
    </div>
  )
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.99 2.896 9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
    </svg>
  )
}
