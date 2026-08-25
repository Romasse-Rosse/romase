'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { ProductImage } from '@/lib/catalog'
import { cn } from '@/lib/cn'

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-ink-200 bg-ink-50 text-ink-400">
        <div className="text-center">
          <ImageOff aria-hidden="true" className="mx-auto size-8" />
          <p className="mt-2 text-sm">Sin imagen disponible</p>
        </div>
      </div>
    )
  }

  const current = images[Math.min(active, images.length - 1)]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-ink-200 bg-white">
        <Image
          src={current.src}
          alt={current.alt || name}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-contain p-6"
        />
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {images.map((image, index) => (
            <li key={`${image.src}-${index}`}>
              <button
                type="button"
                aria-label={`Ver imagen ${index + 1} de ${images.length}`}
                aria-current={index === active}
                onClick={() => setActive(index)}
                className={cn(
                  'relative size-20 shrink-0 overflow-hidden rounded-lg border bg-white transition-colors',
                  index === active
                    ? 'border-brand-500 ring-1 ring-brand-500'
                    : 'border-ink-200 hover:border-ink-400',
                )}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-contain p-1.5"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
