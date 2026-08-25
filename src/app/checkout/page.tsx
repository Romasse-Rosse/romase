import type { Metadata } from 'next'
import { Breadcrumbs, Container } from '@/components/ui'
import { CheckoutForm } from '@/components/checkout-form'

export const metadata: Metadata = {
  title: 'Finalizar pedido',
  // Un checkout no aporta nada al índice y no debería aparecer en búsquedas.
  robots: { index: false, follow: false },
}

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

      <CheckoutForm />
    </Container>
  )
}
