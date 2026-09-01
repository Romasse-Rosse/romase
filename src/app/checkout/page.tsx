import type { Metadata } from 'next'
import { Breadcrumbs, Container } from '@/components/ui'
import { CheckoutForm } from '@/components/checkout-form'
import { pagoEnLineaActivo, webpayEsIntegracion } from '@/lib/webpay'

export const metadata: Metadata = {
  title: 'Finalizar pedido',
  // Un checkout no aporta nada al índice y no debería aparecer en búsquedas.
  robots: { index: false, follow: false },
}

/**
 * Se renderiza en cada visita, no en el build.
 *
 * Sin esto la página queda prerenderizada y el estado del pago se congela con
 * las variables de entorno que había al compilar: el panel dice «próximamente»
 * aunque el servidor esté cobrando, y activar Webpay en Render no tiene efecto
 * hasta el siguiente despliegue. Un checkout no se cachea de todas formas.
 */
export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Carrito', href: '/carrito' },
          { label: 'Finalizar pedido' },
        ]}
      />

      <h1 className="mt-4 mb-10 text-3xl font-medium tracking-tight text-ink-950 sm:text-4xl">
        Finalizar pedido
      </h1>

      <CheckoutForm pagoEnLinea={pagoEnLineaActivo()} ambientePrueba={webpayEsIntegracion} />
    </Container>
  )
}
