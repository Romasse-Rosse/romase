import { whatsappUrl } from '@/lib/site'
import { WhatsAppIcon } from './site-header'

/**
 * Hoy la mayoría de las ventas entran por WhatsApp, así que el canal
 * queda disponible en todas las páginas y no solo en Contacto.
 */
export function WhatsAppFab() {
  return (
    <a
      href={whatsappUrl('Hola ROMASE, quiero hacer una consulta sobre sus equipos.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed right-5 bottom-5 z-30 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition-transform hover:scale-105"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  )
}
