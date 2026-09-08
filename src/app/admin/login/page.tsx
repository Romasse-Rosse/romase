import { redirect } from 'next/navigation'
import { panelConfigurado, sesionDelPanel } from '@/lib/panel'
import { site } from '@/lib/site'
import { FormularioIngreso } from './formulario'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Entrar' }

export default async function LoginPage() {
  // Quien ya entró no vuelve a ver el formulario.
  if (panelConfigurado && (await sesionDelPanel())) redirect('/admin')

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xl font-semibold tracking-tight text-ink-950">{site.name}</p>
          <p className="mt-1 text-sm text-ink-500">Administración de la tienda</p>
        </div>

        {panelConfigurado ? (
          <FormularioIngreso />
        ) : (
          <div className="border border-amber-300 bg-amber-50 p-5 text-sm leading-relaxed text-ink-700">
            <p className="font-semibold text-ink-950">El panel no está configurado todavía</p>
            <p className="mt-2">
              Falta cargar <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en el servidor. Sin
              esas dos variables el panel no puede autenticar a nadie.
            </p>
            <p className="mt-2">
              Se comprueba en <code className="text-xs">/api/estado-pago</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
