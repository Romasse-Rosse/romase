import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Administración', template: '%s · Administración ROMASE' },
  // Un panel de administración no tiene nada que hacer en un buscador.
  robots: { index: false, follow: false, nocache: true },
}

/**
 * Envoltorio del panel.
 *
 * No hay guardia acá a propósito: la página de inicio de sesión también vive
 * bajo /admin, y comprobar la sesión en este nivel la dejaría redirigiendo a sí
 * misma. La guardia está en `(panel)/layout.tsx`, que envuelve todo lo que sí
 * requiere haber entrado.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-ink-50">{children}</div>
}
