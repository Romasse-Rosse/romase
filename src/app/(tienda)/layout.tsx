import { ChromeTienda } from '@/components/chrome-tienda'

/**
 * Envoltorio de la tienda.
 *
 * `(tienda)` es un grupo de rutas: los paréntesis no aparecen en la URL, así
 * que `/carrito` sigue siendo `/carrito`. Lo único que cambia es qué layout
 * envuelve a qué, y eso permite que `/admin` no herede el encabezado, el pie ni
 * el carrito de la tienda.
 *
 * El contenido del envoltorio está en `ChromeTienda` porque también lo usa el
 * `not-found.tsx` de la raíz.
 */
export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return <ChromeTienda>{children}</ChromeTienda>
}
