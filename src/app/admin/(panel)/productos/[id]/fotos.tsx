'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, ImagePlus, Trash2 } from 'lucide-react'
import {
  BUCKET_IMAGENES,
  clienteDelNavegador,
  reducirImagen,
  rutaEnStorage,
} from '@/lib/panel-navegador'
import { borrarImagen, guardarAlt, moverImagen, registrarImagen } from './acciones'

export type FotoDelPanel = {
  id: number
  src: string
  servida: string
  alt: string
}

/**
 * Fotos del producto.
 *
 * La subida va del navegador directamente a Supabase Storage: el archivo no
 * pasa por nuestro servidor. Ver el comentario de `src/lib/panel-navegador.ts`.
 * Cuando el archivo ya está arriba, una server action anota la fila.
 */
export function Fotos({
  productoId,
  slug,
  nombre,
  fotos,
  puedeEscribir,
  puedeBorrar,
}: {
  productoId: number
  slug: string
  nombre: string
  fotos: FotoDelPanel[]
  puedeEscribir: boolean
  puedeBorrar: boolean
}) {
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null)
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [pendiente, transicion] = useTransition()
  const entrada = useRef<HTMLInputElement>(null)

  const elegir = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return
    setAviso(null)

    for (const original of Array.from(archivos)) {
      try {
        setSubiendo(`Preparando ${original.name}…`)
        const archivo = await reducirImagen(original)

        const ahorro =
          archivo.size < original.size
            ? ` (${Math.round(original.size / 1024)} KB → ${Math.round(archivo.size / 1024)} KB)`
            : ''
        setSubiendo(`Subiendo ${original.name}${ahorro}…`)

        const db = clienteDelNavegador()
        const ruta = rutaEnStorage(productoId, archivo.name)

        const { error: errorSubida } = await db.storage
          .from(BUCKET_IMAGENES)
          .upload(ruta, archivo, { contentType: archivo.type, upsert: false })

        if (errorSubida) {
          // El mensaje de Storage cuando falta permiso es opaco: conviene
          // traducirlo, porque la causa real casi siempre es el rol.
          const detalle = /policy|permission|unauthorized/i.test(errorSubida.message)
            ? 'Tu cuenta no tiene permiso para subir imágenes.'
            : errorSubida.message
          setAviso({ texto: `No se pudo subir ${original.name}: ${detalle}`, error: true })
          continue
        }

        const { data } = db.storage.from(BUCKET_IMAGENES).getPublicUrl(ruta)

        const resultado = await registrarImagen(
          productoId,
          data.publicUrl,
          // Un alt por defecto que al menos nombra el producto. Es mejor que
          // vacío y se puede editar abajo.
          nombre,
          slug,
        )

        if (resultado.error) setAviso({ texto: resultado.error, error: true })
        else setAviso({ texto: `${original.name} agregada.` })
      } catch (error) {
        setAviso({ texto: (error as Error).message, error: true })
      }
    }

    setSubiendo(null)
    if (entrada.current) entrada.current.value = ''
  }

  const correr = (accion: () => Promise<{ ok?: string; error?: string }>) => {
    transicion(async () => {
      const r = await accion()
      if (r.error) setAviso({ texto: r.error, error: true })
      else if (r.ok) setAviso({ texto: r.ok })
    })
  }

  return (
    <aside className="border border-ink-200 bg-white p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink-950">
        Fotos {fotos.length > 0 && <span className="font-normal text-ink-500">({fotos.length})</span>}
      </h2>
      <p className="mt-1 text-xs text-ink-500">
        La primera es la que se usa como portada en los listados.
      </p>

      {aviso && (
        <p
          role="alert"
          className={
            aviso.error
              ? 'mt-4 flex gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700'
              : 'mt-4 border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800'
          }
        >
          {aviso.error && <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />}
          {aviso.texto}
        </p>
      )}

      {puedeEscribir && (
        <div className="mt-4">
          <input
            ref={entrada}
            id="fotos"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => elegir(e.target.files)}
            className="sr-only"
          />
          <label
            htmlFor="fotos"
            className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-ink-300 px-4 py-6 text-sm text-ink-600 transition-colors hover:border-brand-500 hover:text-brand-700"
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            {subiendo ?? 'Agregar fotos'}
          </label>
          <p className="mt-2 text-xs text-ink-500">
            Se reducen a 1600 px y se convierten a WebP en tu navegador antes de subirse, así la
            tienda carga rápido sin que tengas que preparar los archivos.
          </p>
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {fotos.map((foto, i) => (
          <li key={foto.id} className="border border-ink-100 p-3">
            <div className="flex flex-col gap-3 sm:flex-row">
            <span className="flex size-20 shrink-0 items-center justify-center bg-ink-50 sm:size-16">
              <Image
                src={foto.servida}
                alt={foto.alt || nombre}
                width={80}
                height={80}
                className="size-20 object-contain sm:size-16"
              />
            </span>

            <div className="min-w-0 flex-1">
              {i === 0 && (
                <span className="mb-1 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                  Portada
                </span>
              )}

              {puedeEscribir ? (
                <form
                  action={(fd) =>
                    correr(() =>
                      guardarAlt(foto.id, productoId, String(fd.get('alt') ?? ''), slug),
                    )
                  }
                >
                  <label htmlFor={`alt-${foto.id}`} className="sr-only">
                    Descripción de la foto
                  </label>
                  <input
                    id={`alt-${foto.id}`}
                    name="alt"
                    defaultValue={foto.alt}
                    placeholder="Qué se ve en la foto"
                    className="h-10 w-full rounded-sm border border-ink-200 px-2.5 text-xs text-ink-900 focus:border-ink-950 focus:outline-none sm:h-8"
                  />
                  <button
                    type="submit"
                    className="mt-1.5 inline-flex min-h-9 items-center rounded-sm border border-ink-200 px-2.5 text-[11px] text-ink-700 transition-colors hover:border-ink-400 sm:mt-1 sm:min-h-0 sm:border-0 sm:px-0 sm:text-brand-700 sm:hover:underline"
                  >
                    Guardar descripción
                  </button>
                </form>
              ) : (
                <p className="text-xs text-ink-600">{foto.alt || 'Sin descripción'}</p>
              )}
            </div>

            {puedeEscribir && (
              <div className="flex shrink-0 items-center gap-1 border-t border-ink-100 pt-2 sm:flex-col sm:border-0 sm:pt-0">
                <BotonIcono
                  etiqueta="Subir en el orden"
                  desactivado={i === 0 || pendiente}
                  onClick={() => correr(() => moverImagen(foto.id, productoId, 'sube', slug))}
                >
                  <ChevronUp aria-hidden="true" className="size-4" />
                </BotonIcono>
                <BotonIcono
                  etiqueta="Bajar en el orden"
                  desactivado={i === fotos.length - 1 || pendiente}
                  onClick={() => correr(() => moverImagen(foto.id, productoId, 'baja', slug))}
                >
                  <ChevronDown aria-hidden="true" className="size-4" />
                </BotonIcono>
                {puedeBorrar && (
                  <BotonIcono
                    etiqueta="Quitar del producto"
                    desactivado={pendiente}
                    peligro
                    onClick={() => correr(() => borrarImagen(foto.id, productoId, slug))}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </BotonIcono>
                )}
              </div>
            )}
            </div>
          </li>
        ))}
      </ul>

      {fotos.length === 0 && (
        <p className="mt-5 text-xs text-ink-500">
          Este producto no tiene fotos. En los listados sale con un recuadro vacío.
        </p>
      )}
    </aside>
  )
}

function BotonIcono({
  etiqueta,
  desactivado,
  peligro,
  onClick,
  children,
}: {
  etiqueta: string
  desactivado: boolean
  peligro?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactivado}
      aria-label={etiqueta}
      title={etiqueta}
      className={
        'inline-flex size-11 items-center justify-center rounded-sm transition-colors disabled:opacity-30 sm:size-7 ' +
        (peligro
          ? 'text-ink-400 hover:bg-red-50 hover:text-red-700'
          : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900')
      }
    >
      {children}
    </button>
  )
}
