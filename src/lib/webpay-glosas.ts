/**
 * Las palabras con las que Webpay se explica.
 *
 * Son tablas de traducción puras: convierten los códigos de Transbank en
 * algo que una persona puede leer. No necesitan el SDK ni las credenciales,
 * y por eso viven acá y no en webpay.ts: cualquier pantalla que quiera
 * mostrar «Crédito» en vez de «VN» no tiene por qué arrastrar la pasarela
 * entera.
 */
const TIPOS_DE_PAGO: Record<string, string> = {
  VD: 'Débito',
  VN: 'Crédito',
  VC: 'Crédito en cuotas',
  SI: 'Crédito, 3 cuotas sin interés',
  S2: 'Crédito, 2 cuotas sin interés',
  NC: 'Crédito, cuotas comercio',
  VP: 'Prepago',
}

/** La página de resultado tiene que decir si fue débito o crédito, en palabras. */
export function tipoDePago(codigo: string | undefined): string {
  if (!codigo) return 'No informado'
  return TIPOS_DE_PAGO[codigo] ?? codigo
}

/**
 * Por qué se pudo haber rechazado.
 *
 * Transbank pide informar al tarjetahabiente las causas posibles cuando la
 * transacción se rechaza. Los códigos negativos no traen glosa en la respuesta,
 * así que se traducen acá.
 */
export function motivoDelRechazo(codigo: number): string {
  switch (codigo) {
    case -1:
      return 'La transacción fue rechazada. Puede ser un error en los datos de la tarjeta, ' +
        'saldo o cupo insuficiente, o que la compra supere el límite diario.'
    case -2:
      return 'La transacción se reintentó y volvió a fallar. Conviene probar con otra tarjeta.'
    case -3:
      return 'Hubo un error al procesar el pago. No se hizo ningún cargo.'
    case -4:
      return 'El banco emisor rechazó la transacción.'
    case -5:
      return 'La transacción fue rechazada por riesgo de fraude.'
    case -6:
      return 'Se excedió el máximo de reintentos permitidos.'
    case -7:
      return 'La transacción fue rechazada. Conviene consultar con el banco emisor.'
    case -8:
      return 'La transacción fue rechazada por un error en los datos ingresados.'
    default:
      return 'La transacción no se completó. No se hizo ningún cargo a la tarjeta.'
  }
}
