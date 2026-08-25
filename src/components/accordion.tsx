import type { ReactNode } from 'react'

export type AccordionItem = {
  titulo: string
  /** HTML ya armado, o nodos de React. */
  html?: string
  children?: ReactNode
}

/**
 * Secciones desplegables.
 *
 * Se usan <details> nativos: funcionan sin JavaScript y el contenido queda en
 * el HTML, así que Google lo indexa igual aunque esté cerrado. Es lo que
 * permite bajar la carga visual de texto sin perder el contenido de
 * posicionamiento que se acordó.
 */
export function Accordion({
  items,
  abrirPrimero = false,
}: {
  items: AccordionItem[]
  abrirPrimero?: boolean
}) {
  if (items.length === 0) return null

  return (
    <div className="divide-y divide-ink-200 border-y border-ink-200">
      {items.map((item, index) => (
        <details key={item.titulo} open={abrirPrimero && index === 0} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left marker:content-none">
            <span className="text-base font-medium text-ink-950 sm:text-lg">{item.titulo}</span>
            <span
              aria-hidden="true"
              className="relative flex size-7 shrink-0 items-center justify-center rounded-full border border-ink-300 text-ink-600 transition-colors group-open:border-brand-500 group-open:bg-brand-500 group-open:text-white"
            >
              <span className="block h-px w-3 bg-current" />
              <span className="absolute block h-3 w-px bg-current transition-transform group-open:scale-y-0" />
            </span>
          </summary>

          <div className="pb-7">
            {item.html ? (
              <div className="rich-text max-w-3xl" dangerouslySetInnerHTML={{ __html: item.html }} />
            ) : (
              <div className="rich-text max-w-3xl">{item.children}</div>
            )}
          </div>
        </details>
      ))}
    </div>
  )
}
