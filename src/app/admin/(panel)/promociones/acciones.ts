'use server'

import { revalidatePath } from 'next/cache'
import { clienteDelPanel, exigirEscritura } from '@/lib/panel'
import { olvidarCatalogo } from '@/lib/catalog'

export type EstadoPromo = { ok?: string; error?: string }

/**
 * Hace visible el cambio de precio en toda la tienda.
 *
 * Una promoción toca el precio de muchas páginas a la vez, así que no alcanza
 * con invalidar una ficha: se tira el catálogo de memoria y se invalidan la
 * portada, los listados de categoría y las fichas.
 *
 * `revalidatePath` con 'layout' invalida el subárbol completo. Es más de lo
 * necesario cuando la promoción es de un solo producto, pero equivocarse por
 * exceso acá cuesta unas regeneraciones; equivocarse por defecto deja precios
 * viejos a la vista, que es lo que no se puede permitir.
 */
function refrescarPrecios() {
  olvidarCatalogo()
  revalidatePath('/', 'layout')
  revalidatePath('/admin/promociones')
}

/** Convierte lo que manda el formulario, ya en ISO, a algo que Postgres acepte. */
function aFecha(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? '').trim()
  if (!texto) return null
  const t = Date.parse(texto)
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

export async function crearPromocion(
  _previo: EstadoPromo,
  formData: FormData,
): Promise<EstadoPromo> {
  try {
    const sesion = await exigirEscritura()

    const alcance = String(formData.get('alcance') ?? '')
    if (alcance !== 'producto' && alcance !== 'categoria') {
      return { error: 'Elegí si el descuento es de un producto o de una categoría.' }
    }

    const objetivo = Number(formData.get('objetivo'))
    if (!Number.isFinite(objetivo) || objetivo <= 0) {
      return {
        error:
          alcance === 'producto' ? 'Elegí el producto.' : 'Elegí la categoría.',
      }
    }

    const porcentaje = Number(formData.get('porcentaje'))
    if (!Number.isInteger(porcentaje) || porcentaje < 1 || porcentaje > 90) {
      return { error: 'El descuento tiene que ser un número entero entre 1 y 90.' }
    }

    const desde = aFecha(formData.get('desdeIso')) ?? new Date().toISOString()
    const hasta = aFecha(formData.get('hastaIso'))
    const sinFin = formData.get('sinFin') !== null

    if (!hasta && !sinFin) {
      return {
        error:
          'Falta la fecha de término. Si el descuento no tiene fin, marcá la casilla: así queda ' +
          'claro que hay que apagarlo a mano.',
      }
    }

    if (hasta && Date.parse(hasta) <= Date.parse(desde)) {
      return { error: 'La fecha de término tiene que ser posterior a la de inicio.' }
    }

    const db = await clienteDelPanel()

    const { error } = await db.from('promotions').insert({
      scope: alcance,
      product_id: alcance === 'producto' ? objetivo : null,
      category_id: alcance === 'categoria' ? objetivo : null,
      percent: porcentaje,
      label: String(formData.get('etiqueta') ?? '').trim() || null,
      starts_at: desde,
      ends_at: sinFin ? null : hasta,
      is_active: true,
      created_by: sesion.userId,
    })

    if (error) {
      const faltaTabla = /relation .*promotions.* does not exist|schema cache/i.test(error.message)
      return {
        error: faltaTabla
          ? 'Falta correr migration/admin-promociones.sql en Supabase.'
          : `No se pudo crear: ${error.message}`,
      }
    }

    refrescarPrecios()
    return { ok: 'Promoción creada. Los precios ya están actualizados.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/**
 * Apaga o vuelve a encender una promoción.
 *
 * No se borra: se apaga. Así queda el registro de que existió y con qué
 * descuento, que es lo que se necesita cuando alguien pregunta por qué pagó un
 * precio distinto la semana pasada.
 */
export async function cambiarEstadoPromocion(
  id: number,
  activa: boolean,
): Promise<EstadoPromo> {
  try {
    await exigirEscritura()
    const db = await clienteDelPanel()

    const { error } = await db.from('promotions').update({ is_active: activa }).eq('id', id)
    if (error) return { error: error.message }

    refrescarPrecios()
    return { ok: activa ? 'Promoción encendida.' : 'Promoción apagada.' }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

/** Termina una promoción vigente ahora mismo, sin apagarla del historial. */
export async function terminarAhora(id: number): Promise<EstadoPromo> {
  try {
    await exigirEscritura()
    const db = await clienteDelPanel()

    const { error } = await db
      .from('promotions')
      .update({ ends_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }

    refrescarPrecios()
    return {
      ok:
        'Promoción terminada. Ojo: durante los próximos minutos el checkout sigue respetando el ' +
        'descuento, para no cobrarle más de lo que vio a quien tenga una página abierta.',
    }
  } catch (error) {
    return { error: (error as Error).message }
  }
}
