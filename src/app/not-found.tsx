import { ChromeTienda } from '@/components/chrome-tienda'
import NoEncontrado from './(tienda)/not-found'

/**
 * 404 de las URL que no coinciden con ninguna ruta.
 *
 * Hace falta acá, en la raíz, y no solo dentro de `(tienda)`: para una URL que
 * no coincide con nada, Next busca el `not-found` de la raíz. Cuando el archivo
 * quedó solo dentro del grupo, una dirección inexistente mostraba el 404 pelado
 * de Next —sin navegación ni buscador—, justo en la página donde alguien más
 * necesita una salida.
 *
 * Se envuelve con el mismo chrome que la tienda para que se vea igual. El
 * contenido es el mismo componente, no una copia.
 */
export default function NotFound() {
  return (
    <ChromeTienda>
      <NoEncontrado />
    </ChromeTienda>
  )
}
