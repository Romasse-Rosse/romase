import Link from 'next/link'
import { AlertCircle, ArrowUpRight, Info } from 'lucide-react'
import { clienteDelPanel } from '@/lib/panel'
import {
  estadoDeLasIntegraciones,
  diagnosticoDelFeed,
  ETIQUETA_DE_SALUD,
  type Salud,
} from '@/lib/integraciones'
import { ultimosEventos } from '@/lib/integracion-eventos'
import { fechaHora } from '@/lib/pedidos-panel'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Integraciones' }

const TONOS: Record<Salud, string> = {
  ok: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  atencion: 'border-amber-300 bg-amber-50 text-amber-800',
  apagada: 'border-ink-300 bg-ink-50 text-ink-700',
  error: 'border-red-300 bg-red-50 text-red-800',
}

export default async function IntegracionesPanel() {
  const db = await clienteDelPanel()

  const [integraciones, feed, historial] = await Promise.all([
    estadoDeLasIntegraciones(),
    diagnosticoDelFeed(),
    ultimosEventos(db, 'merchant-center', 20),
  ])

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-950">Integraciones</h1>
      <p className="mt-1 text-sm text-ink-500">
        Lo que el sitio tiene conectado afuera y si está funcionando ahora mismo.
      </p>

      {/*
        El estado se calcula preguntándole a cada servicio, no leyendo una tabla
        de configuración. Un panel que dice «conectado» porque una fila dice
        «conectado» miente en cuanto algo se rompe.
      */}
      <div className="mt-6 space-y-4">
        {integraciones.map((i) => (
          <section key={i.clave} className="border border-ink-200 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink-950">{i.nombre}</h2>
                <p className="mt-0.5 text-sm text-ink-600">{i.resumen}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{i.proposito}</p>
              </div>
              <span
                className={
                  'inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium ' +
                  TONOS[i.salud]
                }
              >
                {ETIQUETA_DE_SALUD[i.salud]}
              </span>
            </div>

            <dl className="divide-y divide-ink-100">
              {i.datos.map((d) => (
                <div
                  key={d.etiqueta}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5 sm:px-5"
                >
                  <dt className="text-xs tracking-wide text-ink-500 uppercase">{d.etiqueta}</dt>
                  <dd className="text-sm break-all text-ink-800">{d.valor}</dd>
                </div>
              ))}
            </dl>

            {i.pendiente && (
              <p className="flex gap-2 border-t border-amber-200 bg-amber-50 p-4 text-sm text-ink-700 sm:px-5">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" />
                {i.pendiente}
              </p>
            )}

            {i.enlace && (
              <p className="border-t border-ink-100 px-4 py-3 sm:px-5">
                <a
                  href={i.enlace.href}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
                >
                  {i.enlace.texto}
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </a>
              </p>
            )}
          </section>
        ))}
      </div>

      {/* ============================================================
          Por qué Google ve menos productos de los que hay
          ============================================================ */}
      {feed.excluidos > 0 && (
        <>
          <h2 className="mt-10 text-sm font-semibold text-ink-950">
            Los {feed.excluidos} productos que no llegan a Google
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            No se mandan a propósito: Merchant Center los rechazaría y dejaría un error permanente
            en el panel de Google. Es preferible un feed más corto y aprobado.
          </p>

          <div className="mt-3 space-y-3">
            {feed.porMotivo.map((m) => (
              <div key={m.motivo} className="border border-ink-200 bg-white p-4 sm:p-5">
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold text-ink-950">{m.cuantos} productos</span>
                  <span className="text-sm text-ink-600">{m.explicacion}</span>
                </p>
                <ul className="mt-2 space-y-0.5 text-xs text-ink-500">
                  {m.ejemplos.map((n) => (
                    <li key={n} className="truncate">
                      · {n}
                    </li>
                  ))}
                  {m.cuantos > m.ejemplos.length && (
                    <li className="text-ink-400">y {m.cuantos - m.ejemplos.length} más</li>
                  )}
                </ul>
                {m.motivo === 'sin-precio' && (
                  <p className="mt-3 text-xs text-ink-600">
                    Son los que están{' '}
                    <Link href="/admin/productos" className="text-brand-700 hover:underline">
                      marcados como bajo pedido
                    </Link>
                    . Si les ponés precio y los marcás disponibles, entran al feed solos.
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============================================================
          Historial
          ============================================================ */}
      <h2 className="mt-10 text-sm font-semibold text-ink-950">Registro de sincronización</h2>

      {'faltaLaTabla' in historial ? (
        <p className="mt-2 flex gap-2 border border-amber-300 bg-amber-50 p-4 text-sm text-ink-700">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span>
            Falta correr <code className="font-mono text-xs">migration/admin-integraciones.sql</code>{' '}
            en Supabase. Todo lo de arriba funciona igual; lo que no se guarda todavía es el
            historial.
          </span>
        </p>
      ) : 'error' in historial ? (
        <p role="alert" className="mt-2 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo leer el historial: {historial.error}
        </p>
      ) : historial.eventos.length === 0 ? (
        <p className="mt-2 border border-dashed border-ink-300 p-8 text-center text-sm text-ink-500">
          Todavía no hay registros. Aparecen cuando el feed se vuelve a armar.
        </p>
      ) : (
        <>
          <p className="mt-1 flex gap-2 text-xs leading-relaxed text-ink-500">
            <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Cada línea es una descarga del feed. Google pasa una vez al día; las visitas de un
              navegador son alguien abriéndolo a mano desde acá.
            </span>
          </p>

          <div className="mt-3 overflow-x-auto border border-ink-200 bg-white">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs tracking-wide text-ink-500 uppercase">
                  <th className="p-3 font-medium">Cuándo</th>
                  <th className="p-3 text-right font-medium">En el feed</th>
                  <th className="p-3 text-right font-medium">Afuera</th>
                  <th className="p-3 font-medium">Pedido por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {historial.eventos.map((e) => {
                  const d = e.detalle as { incluidos?: number; excluidos?: number }
                  return (
                    <tr key={e.id}>
                      <td className="p-3 whitespace-nowrap text-ink-800">{fechaHora(e.creado_en)}</td>
                      <td className="p-3 text-right tabular-nums text-ink-800">
                        {d.incluidos ?? '—'}
                      </td>
                      <td className="p-3 text-right tabular-nums text-ink-600">
                        {d.excluidos ?? '—'}
                      </td>
                      <td className="max-w-[240px] truncate p-3 text-xs text-ink-500">
                        {agenteLegible(e.agente)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * El user-agent en palabras.
 *
 * La cadena cruda no la lee nadie, y lo único que importa de ella es si vino
 * Google o vino una persona.
 */
function agenteLegible(agente: string | null): string {
  if (!agente) return 'sin identificar'
  if (/googlebot|google-inspectiontool|storebot-google/i.test(agente)) return 'Google'
  if (/bot|crawler|spider/i.test(agente)) return 'otro robot'
  return 'un navegador'
}
