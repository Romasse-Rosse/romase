'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase para el navegador, con la sesión del panel.
 *
 * Existe por un motivo concreto: **las fotos se suben del navegador
 * directamente a Supabase Storage, sin pasar por nuestro servidor.**
 *
 * La alternativa era mandarlas por una server action, y no sirve por dos
 * razones. Una, el límite de cuerpo de las server actions es de 1 MB por
 * defecto y una foto de producto pesa varios. Dos, y más importante: la
 * instancia de Render tiene 512 MB, y bufferear archivos de varios MB en el
 * servidor para reenviarlos es gastar la memoria que necesita el sitio para
 * atender a los compradores.
 *
 * El permiso no se pierde por subir desde el navegador: la política de Storage
 * exige `has_admin_role()`, así que Postgres rechaza la subida de cualquiera que
 * no administre, sin importar desde dónde se intente.
 */
let cliente: SupabaseClient | null = null

export function clienteDelNavegador(): SupabaseClient {
  if (cliente) return cliente

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const llave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !llave) throw new Error('El panel no está configurado en este servidor.')

  cliente = createBrowserClient(url, llave)
  return cliente
}

export const BUCKET_IMAGENES = 'romase-publico'

/**
 * Reduce la foto antes de subirla.
 *
 * Las fotos que va a subir el cliente vienen de una cámara o de un proveedor:
 * 3 a 6 MB y 4000 px de ancho. Sin esto pasan tres cosas, todas malas: la
 * subida tarda, Storage se llena, y cada vez que alguien entra a la ficha el
 * servidor tiene que redimensionar un archivo enorme —en una instancia de
 * 512 MB eso es justamente lo que hace esperar la primera carga—.
 *
 * 1600 px de lado mayor es más de lo que la ficha usa en la pantalla más
 * grande, así que no se pierde calidad visible. WebP al 82 % es el mismo
 * criterio con el que se redimensionaron las fotos de la migración.
 *
 * Si el navegador no puede procesar el archivo se devuelve el original: es
 * mejor una foto pesada que un panel que no deja subir nada.
 */
export async function reducirImagen(archivo: File, ladoMaximo = 1600): Promise<File> {
  if (!archivo.type.startsWith('image/')) return archivo

  try {
    const mapa = await createImageBitmap(archivo)
    const escala = Math.min(1, ladoMaximo / Math.max(mapa.width, mapa.height))

    // Ya es chica y no es un formato pesado: no se toca.
    if (escala === 1 && archivo.size < 400_000) {
      mapa.close()
      return archivo
    }

    const ancho = Math.round(mapa.width * escala)
    const alto = Math.round(mapa.height * escala)

    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const contexto = lienzo.getContext('2d')
    if (!contexto) {
      mapa.close()
      return archivo
    }
    contexto.drawImage(mapa, 0, 0, ancho, alto)
    mapa.close()

    const blob = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, 'image/webp', 0.82),
    )
    if (!blob || blob.size >= archivo.size) return archivo

    const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.webp'
    return new File([blob], nombre, { type: 'image/webp' })
  } catch {
    return archivo
  }
}

/** Nombre de archivo previsible y sin acentos, con el id del producto delante. */
export function rutaEnStorage(productoId: number, nombreArchivo: string): string {
  const base =
    nombreArchivo
      .normalize('NFD')
      // Los acentos se separan con NFD y se quitan por rango, escrito con
      // escapes: los signos combinantes literales son invisibles en el código.
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'foto'

  const extension = nombreArchivo.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? 'webp'

  // El sufijo de tiempo evita que subir dos veces una foto con el mismo nombre
  // reemplace la anterior sin avisar.
  return `productos/${productoId}/${Date.now()}-${base}.${extension}`
}
