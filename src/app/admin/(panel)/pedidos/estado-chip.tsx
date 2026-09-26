import { ESTADOS, type EstadoPedido } from '@/lib/pedidos-panel'

/**
 * El estado del pedido, con color.
 *
 * El color no viaja solo: la etiqueta dice lo mismo en palabras. Quien no
 * distingue verde de rojo tiene que poder leer el estado igual, y en una
 * pantalla donde se decide si despachar algo eso no es un detalle.
 */
const TONOS: Record<string, string> = {
  verde: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  ambar: 'border-amber-300 bg-amber-50 text-amber-800',
  rojo: 'border-red-300 bg-red-50 text-red-800',
  gris: 'border-ink-300 bg-ink-50 text-ink-700',
}

export function EstadoChip({
  estado,
  grande = false,
}: {
  estado: EstadoPedido
  grande?: boolean
}) {
  const { etiqueta, tono } = ESTADOS[estado]
  return (
    <span
      className={
        'inline-flex shrink-0 items-center rounded-full border font-medium ' +
        TONOS[tono] +
        (grande ? ' px-3 py-1 text-sm' : ' px-2 py-0.5 text-[11px]')
      }
    >
      {etiqueta}
    </span>
  )
}
