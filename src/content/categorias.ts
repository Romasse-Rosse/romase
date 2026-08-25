import type { Faq } from '@/lib/catalog'

/**
 * Contenido editorial por categoría.
 *
 * El acuerdo del kick-off es que cada categoría llegue a un mínimo de 600
 * palabras propias, con preguntas frecuentes, para poder competir en Google.
 * Están escritas las nueve categorías raíz, que son las que concentran la
 * intención de búsqueda. Las subcategorías heredan el contenido de su padre
 * hasta que se les escriba el propio.
 *
 * Cuando se cargue seo_content en Supabase, ese texto tiene prioridad sobre
 * lo que hay acá.
 */
export type CategoryContent = {
  /** Bajada bajo el H1, en texto plano. */
  intro: string
  /** Bloque largo, en HTML. */
  seoHtml: string
  faqs: Faq[]
}

const despachoFaq: Faq = {
  pregunta: '¿Despachan a regiones?',
  respuesta:
    'Sí, despachamos a todo Chile. En Puerto Montt la entrega es sin costo. Para el resto del ' +
    'país coordinamos con empresas de transporte y el flete se cotiza según el volumen del ' +
    'equipo y el destino. Te confirmamos el valor antes de que compres.',
}

const garantiaFaq: Faq = {
  pregunta: '¿Los equipos tienen garantía?',
  respuesta:
    'Todos los equipos cuentan con garantía del fabricante, cuyo plazo depende de la marca y el ' +
    'modelo. Además mantenemos stock de repuestos, que es lo que realmente importa cuando una ' +
    'máquina se detiene en plena producción.',
}

const facturaFaq: Faq = {
  pregunta: '¿Emiten factura para mi empresa?',
  respuesta:
    'Sí, emitimos boleta y factura electrónica. Si necesitas factura, indícanos el RUT y la razón ' +
    'social al momento de la compra.',
}

export const categoryContent: Record<string, CategoryContent> = {
  // ------------------------------------------------------------
  panaderia: {
    intro:
      'Maquinaria para panadería: amasadoras, sobadoras, estiradoras de masa, divisoras y ' +
      'cortadores. Equipos pensados para producción diaria, con repuestos disponibles en Chile.',
    seoHtml: `
      <h2>Maquinaria para panadería: qué necesitas según tu producción</h2>

      <p>Montar o renovar una panadería empieza por una pregunta que casi nadie hace a tiempo:
      <strong>¿cuántos kilos de masa vas a trabajar por día?</strong> De esa respuesta sale todo lo
      demás. Una amasadora de 10 kilos y una de 50 kilos no se diferencian solo en el precio: cambian
      el ritmo del obrador, el consumo eléctrico, el espacio que ocupan y la vida útil que vas a
      obtener. Comprar por debajo de tu producción real es el error más caro que vemos, porque la
      máquina trabaja siempre al límite y se rompe antes.</p>

      <p>En ROMASE llevamos más de 24 años equipando panaderías del sur de Chile, y esa experiencia
      es la que ponemos a disposición antes de que compres. No vendemos catálogo: vendemos el equipo
      que corresponde a tu volumen.</p>

      <h3>Amasadoras y sobadoras</h3>

      <p>La <strong>amasadora</strong> es el corazón del obrador. Las de espiral son el estándar para
      pan porque desarrollan bien el gluten sin calentar la masa en exceso, algo crítico en
      fermentaciones largas. Para panadería tradicional chilena —marraqueta, hallulla, dobladita— la
      amasadora de espiral con tazón fijo cubre la mayoría de los casos.</p>

      <p>La <strong>sobadora</strong> viene después y es la que define la textura final. En la
      marraqueta y la hallulla el sobado no es opcional: es lo que da la miga cerrada y la corteza
      característica. Si estás produciendo pan chileno en volumen, una sobadora de rodillos bien
      dimensionada te ahorra tiempo y te da consistencia entre hornadas, que es lo que fideliza al
      cliente.</p>

      <h3>Estiradoras de masa, divisoras y cortadores</h3>

      <p>Las <strong>estiradoras de masa</strong> resuelven el laminado con un espesor parejo y
      repetible. Sirven para masa de pizza, empanadas, hojaldre y masas de pastelería. El punto no es
      solo la velocidad: es que el espesor sea siempre el mismo, porque de eso depende que el
      horneado sea uniforme y que no se te quemen unas piezas mientras otras quedan crudas.</p>

      <p>Los <strong>cortadores</strong> y las <strong>divisoras</strong> estandarizan el peso de la
      pieza. Esto tiene un impacto directo en el margen: si cada marraqueta pesa cinco gramos de más,
      en mil piezas diarias estás regalando cinco kilos de masa por día. Un cortador que porciona
      bien se paga solo en unos pocos meses.</p>

      <h3>Cómo elegir sin equivocarte</h3>

      <p>Antes de decidir, revisa cuatro cosas. Primero, la <strong>producción diaria real</strong>,
      no la que te gustaría tener: dimensiona para hoy con algo de holgura, no para un escenario
      hipotético. Segundo, la <strong>instalación eléctrica</strong>: muchos equipos de panadería son
      trifásicos y si tu local es monofásico el costo de adecuar la instalación puede superar al del
      equipo. Tercero, el <strong>espacio y la circulación</strong>: una máquina que entra pero
      bloquea el paso hacia el horno te complica la operación todos los días. Cuarto, el
      <strong>servicio postventa</strong>: pregunta siempre si hay repuestos en Chile antes de
      comprar, porque un equipo detenido esperando una pieza importada durante meses deja de ser un
      ahorro.</p>

      <h3>Repuestos y servicio</h3>

      <p>Mantenemos stock de repuestos para los equipos que comercializamos. Es una decisión
      deliberada: en panadería la producción no se puede parar, y el costo de un día sin producir
      supera con creces el de tener la pieza disponible. Si compraste con nosotros y necesitas un
      repuesto, escríbenos con el modelo y el número de serie.</p>

      <p>Si estás armando una panadería desde cero o ampliando la que tienes, escríbenos
      o pasa por nuestro local en Puerto Montt. Cuéntanos cuántos kilos produces por día, qué
      superficie tienes y con qué instalación cuentas, y armamos una propuesta concreta.</p>
    
      <h3>El horno y el resto de la línea</h3>

      <p>Aunque la maquinaria de masa es la que más se consulta, el rendimiento final depende de toda la línea trabajando en conjunto. De poco sirve una amasadora que produce cien kilos por hora si el horno solo absorbe cuarenta: el cuello de botella se traslada, no desaparece. Al proyectar una panadería conviene dibujar el recorrido completo —amasado, sobado, formado, fermentación, horneado, enfriado y venta— y verificar que cada etapa tenga capacidad equivalente.</p>

      <p>La fermentación es la etapa que más se descuida y la que más afecta la calidad. Un espacio de fermentación con temperatura y humedad controladas hace que el producto salga igual todos los días, en invierno y en verano. En el sur de Chile, donde la diferencia térmica entre estaciones es marcada, esto no es un lujo: es lo que evita que tu pan de julio no se parezca al de enero.</p>

      <p>Por último, considera el enfriado y el almacenamiento. Pan embolsado tibio genera condensación, y la condensación acorta la vida útil y favorece el desarrollo de hongos. Carros de enfriado suficientes y un espacio ventilado resuelven un problema que muchas panaderías arrastran sin identificar su causa.</p>
    `,
    faqs: [
      {
        pregunta: '¿Qué capacidad de amasadora necesito?',
        respuesta:
          'Como referencia general, la capacidad del tazón debería cubrir tu batido más grande sin ' +
          'llegar al tope. Trabajar siempre al límite acorta la vida del equipo. Cuéntanos cuántos ' +
          'kilos de masa haces por jornada y cuántas hornadas diarias, y te decimos qué capacidad ' +
          'conviene.',
      },
      {
        pregunta: '¿Los equipos de panadería son trifásicos?',
        respuesta:
          'Varios de los equipos de mayor capacidad sí requieren instalación trifásica, mientras que ' +
          'los modelos más chicos suelen ser monofásicos. Es importante confirmarlo antes de comprar: ' +
          'adecuar una instalación eléctrica puede costar más que el equipo. Consúltanos por el ' +
          'modelo que te interesa y te confirmamos el requerimiento.',
      },
      {
        pregunta: '¿Cuál es la diferencia entre amasadora y sobadora?',
        respuesta:
          'La amasadora mezcla los ingredientes y desarrolla el gluten. La sobadora trabaja la masa ' +
          'ya formada pasándola entre rodillos, y es la que da la textura de miga cerrada típica de ' +
          'la marraqueta y la hallulla. Para panadería chilena tradicional se usan las dos.',
      },
      garantiaFaq,
      despachoFaq,
    ],
  },

  // ------------------------------------------------------------
  'articulos-de-pasteleria': {
    intro:
      'Moldes de bizcocho, moldes kuchen, moldes de teflón y bandejas enlozadas. El equipamiento ' +
      'de obrador que define la forma y el acabado de tu producto.',
    seoHtml: `
      <h2>Artículos de pastelería para obradores profesionales</h2>

      <p>En pastelería el molde no es un accesorio: es parte de la receta. El material, el espesor y
      el acabado de la superficie deciden cómo se transmite el calor, cuánto se dora la base y si la
      pieza sale entera o se queda pegada. Un buen molde te da repetibilidad, y la repetibilidad es
      lo que separa a un obrador profesional de una cocina que improvisa.</p>

      <h3>Moldes de bizcocho</h3>

      <p>Los <strong>moldes de bizcocho</strong> son la base de tortas y layer cakes. Lo que importa
      acá es la altura de la pared y la uniformidad del diámetro entre unidades: si compras moldes
      del mismo número y no coinciden, las capas no van a apilar parejo y vas a perder producto en el
      armado. Conviene estandarizar los diámetros que realmente usas y comprar varios de cada uno, en
      vez de tener uno de cada medida.</p>

      <h3>Moldes kuchen</h3>

      <p>El <strong>kuchen</strong> es parte de la identidad gastronómica del sur de Chile, y acá en
      la Región de Los Lagos es un producto de venta diaria. Los moldes kuchen tienen pared más baja
      y borde definido, pensados para masa quebrada con relleno de fruta. El detalle que marca la
      diferencia es la conducción del calor en la base: si la base no se cocina bien, el relleno la
      humedece y el kuchen se desarma al cortarlo.</p>

      <h3>Moldes de teflón</h3>

      <p>Los <strong>moldes de teflón</strong> —o con recubrimiento antiadherente— reducen el uso de
      desmoldante y facilitan el desmolde en piezas delicadas. Tienen una contrapartida: el
      recubrimiento se daña con utensilios metálicos y con lavado abrasivo. Si trabajas con teflón,
      define un protocolo de lavado con tu equipo, porque un molde rayado deja de ser antiadherente y
      pasa a ser el peor de los dos mundos.</p>

      <h3>Bandejas enlozadas</h3>

      <p>Las <strong>bandejas enlozadas</strong> son un clásico del obrador chileno por una razón
      simple: transmiten bien el calor, resisten el uso intensivo y son fáciles de limpiar. Se usan
      tanto para horneado como para almacenamiento y transporte interno de producto. Al elegirlas,
      verifica que la medida sea compatible con las guías de tu horno y de tus carros: una bandeja que
      no calza obliga a improvisar y termina deformada.</p>

      <h3>Cuántos moldes comprar</h3>

      <p>La cuenta que conviene hacer no es cuántos moldes necesitas para una hornada, sino cuántos
      necesitas para que el flujo no se detenga. Mientras una tanda está en el horno, otra debería
      estar armándose. Si tienes exactamente los moldes de una hornada, tu obrador trabaja en serie y
      pierde tiempo muerto. Con juegos suficientes para dos o tres ciclos, el trabajo fluye.</p>

      <h3>Cuidado y vida útil</h3>

      <p>El enemigo del molde profesional es el lavado agresivo y el golpe. Evita el remojo
      prolongado en moldes con recubrimiento, no uses esponjas metálicas sobre teflón y guarda los
      moldes apilados con separación para que no se rayen entre sí. Un juego bien tratado dura años;
      uno maltratado se reemplaza cada temporada.</p>

      <p>Si tienes dudas sobre qué medidas te convienen para tu carta, escríbenos con
      las piezas que produces y te orientamos.</p>
    
      <h3>Material del molde y transmisión de calor</h3>

      <p>El material define el comportamiento en el horno. El aluminio conduce el calor rápido y de forma pareja, lo que favorece bizcochos de miga uniforme. El acero con recubrimiento antiadherente facilita el desmolde pero conduce algo más lento, así que puede requerir ajustar tiempos. El enlozado resiste muy bien el uso intensivo y es el más tolerante al maltrato del obrador. No hay un material mejor en abstracto: hay uno mejor para cada producto.</p>

      <p>El color también influye, aunque casi nunca se menciona. Los moldes oscuros absorben más calor y doran más la base; los claros son más suaves. Si cambias de moldes oscuros a claros y no ajustas la temperatura, vas a notar que el mismo bizcocho sale distinto. Cuando incorpores moldes nuevos a una línea que ya funciona, haz una hornada de prueba antes de comprometer producción.</p>

      <h3>Estandarizar para escalar</h3>

      <p>Si tu obrador crece, la estandarización deja de ser una preferencia y pasa a ser una necesidad operativa. Menos medidas distintas significa recetas más simples, menos errores del equipo, almacenamiento más ordenado y reposición más fácil. Define un set de medidas base y sostenlo en el tiempo.</p>
    `,
    faqs: [
      {
        pregunta: '¿Los moldes de teflón se pueden lavar en lavavajillas?',
        respuesta:
          'No es lo recomendable. El lavado industrial con detergentes alcalinos deteriora el ' +
          'recubrimiento antiadherente. Lo mejor es lavarlos a mano con agua tibia y esponja suave, ' +
          'y evitar por completo los utensilios metálicos y las esponjas de acero.',
      },
      {
        pregunta: '¿Qué medida de bandeja necesito para mi horno?',
        respuesta:
          'Depende de la separación entre las guías y del ancho útil de tu horno. Antes de comprar, ' +
          'mide el espacio interior y las guías. Si nos dices la marca y el modelo del horno, te ' +
          'confirmamos qué bandejas calzan.',
      },
      facturaFaq,
      despachoFaq,
    ],
  },

  // ------------------------------------------------------------
  calor: {
    intro:
      'Línea de calor para cocinas profesionales. Equipos de cocción dimensionados para servicio ' +
      'continuo, con la potencia y la superficie que tu carta necesita.',
    seoHtml: `
      <h2>Línea de calor para cocinas profesionales</h2>

      <p>La línea de calor es donde se define el ritmo de tu cocina. No importa qué tan bien
      organizada esté la partida si el equipo de cocción no da abasto en la hora peak: ahí se acumulan
      las comandas, se estira el tiempo de espera y el cliente lo nota. Dimensionar bien esta línea es
      una de las decisiones más importantes al montar un local.</p>

      <h3>Dimensionar por servicio, no por metros cuadrados</h3>

      <p>El error habitual es elegir los equipos según el espacio disponible. La variable correcta es
      <strong>cuántos cubiertos sirves en la hora de mayor demanda</strong> y qué proporción de tu
      carta pasa por cada tipo de cocción. Un local de cincuenta cubiertos con carta de parrilla
      necesita una configuración completamente distinta a uno del mismo tamaño con carta de guisos.
      Primero define la carta, después el equipo.</p>

      <h3>Gas o electricidad</h3>

      <p>La decisión entre gas y electricidad depende de tres factores concretos. El
      <strong>costo energético</strong> en tu zona, que en el sur de Chile suele favorecer al gas para
      cocción intensiva. La <strong>instalación disponible</strong>: si tu local no tiene acometida de
      gas ni posibilidad de instalar cilindros con la ventilación reglamentaria, la decisión ya está
      tomada. Y la <strong>respuesta térmica</strong>: el gas sube y baja de temperatura al instante,
      lo que importa en cocción a la vista; el eléctrico es más estable y más fácil de controlar en
      cocciones largas.</p>

      <h3>Extracción y ventilación</h3>

      <p>Todo equipo de calor necesita extracción acorde. Es la parte del proyecto que más se
      subestima y la que más problemas trae después, tanto con la autoridad sanitaria como con la
      habitabilidad de la cocina. La campana debe cubrir la superficie de cocción con margen y el
      caudal del extractor tiene que corresponder a la carga térmica instalada. Si estás proyectando
      una cocina, conversa la extracción al mismo tiempo que los equipos, no después.</p>

      <h3>Seguridad y mantención</h3>

      <p>Los equipos de gas requieren revisión periódica de conexiones, quemadores y sistemas de
      seguridad. Los quemadores obstruidos consumen más y calientan menos, así que la limpieza
      regular no es solo higiene: es eficiencia. En equipos eléctricos, la revisión de resistencias y
      termostatos evita fallas en medio del servicio. Una rutina de mantención preventiva cuesta una
      fracción de lo que cuesta una reparación de urgencia con la cocina detenida.</p>

      <h3>Instalación eléctrica</h3>

      <p>Antes de comprar cualquier equipo eléctrico de potencia, confirma la capacidad de tu tablero
      y el tipo de alimentación disponible. Sumar equipos sin revisar la instalación termina en cortes
      de suministro en el peor momento. Si nos cuentas qué tienes instalado, te decimos qué se puede
      conectar sin intervenir el tablero y qué requiere una adecuación previa.</p>

      <h3>Asesoría antes de comprar</h3>

      <p>En ROMASE trabajamos hace más de 24 años con cocinas profesionales del sur de Chile.
      Escríbenos con tu carta, tu proyección de cubiertos y el plano de la cocina, y te armamos una
      propuesta que considere el equipo, la instalación y la extracción como un conjunto. Despachamos
      a todo Chile y en Puerto Montt entregamos sin costo.</p>
    
      <h3>Distribución de la cocina y flujo de trabajo</h3>

      <p>La ubicación de los equipos de calor determina cómo se mueve el personal durante el servicio. Una cocina bien resuelta mantiene un flujo en una sola dirección: recepción, almacenamiento, preparación, cocción, emplatado y salida. Cuando ese flujo se cruza consigo mismo, aparecen choques entre personas cargando producto caliente, y ahí es donde ocurren los accidentes.</p>

      <p>Agrupa la línea de calor en un solo bloque, con la extracción cubriéndolo por completo. Separa físicamente la zona de calor de la zona de frío: instalarlas enfrentadas obliga al equipo de refrigeración a trabajar contra el calor ambiente, con mayor consumo y menor vida útil del compresor.</p>

      <h3>Consumo energético y costo operativo</h3>

      <p>El precio de compra es solo una parte del costo del equipo. Un equipo con mejor aislación y control de temperatura consume menos todos los días, y en un local que opera doce horas diarias esa diferencia se acumula rápido. Al comparar alternativas, pide siempre la potencia instalada y estima el consumo mensual real: muchas veces el equipo más caro es el más barato al cabo de dos años.</p>
    `,
    faqs: [
      {
        pregunta: '¿Conviene gas o eléctrico para mi cocina?',
        respuesta:
          'Depende de la instalación que tengas disponible, del costo energético en tu zona y del ' +
          'tipo de cocción de tu carta. El gas ofrece respuesta térmica inmediata; el eléctrico es ' +
          'más estable y más simple de instalar. Cuéntanos tu caso y lo evaluamos juntos.',
      },
      {
        pregunta: '¿Incluyen la instalación de los equipos?',
        respuesta:
          'Coordinamos la instalación según el equipo y la ubicación. Para equipos de gas la ' +
          'instalación debe hacerla un instalador autorizado, y es un requisito que no conviene ' +
          'saltarse. Consúltanos por tu caso puntual.',
      },
      garantiaFaq,
      despachoFaq,
    ],
  },

  // ------------------------------------------------------------
  'frio-2': {
    intro:
      'Línea de frío para conservación profesional: freezers, frigobares y refrigeración ' +
      'comercial. La cadena de frío es donde se pierde o se protege tu inventario.',
    seoHtml: `
      <h2>Línea de frío: conservación y refrigeración comercial</h2>

      <p>La refrigeración es el seguro de tu inventario. Un equipo mal dimensionado o mal ubicado no
      falla de golpe: falla de a poco, manteniendo temperaturas apenas fuera de rango, acortando la
      vida útil de los productos sin que nadie lo note hasta que hay merma. Por eso conviene elegir
      con criterio y no solo por precio.</p>

      <h3>Freezers y congelación</h3>

      <p>Los <strong>freezers</strong> operan en rangos de congelación y sirven tanto para
      almacenamiento de materia prima como para producto terminado. La distinción importante es entre
      congelación y conservación: un equipo de conservación mantiene lo que ya está congelado, pero no
      está diseñado para bajar la temperatura de producto fresco en volumen. Si necesitas congelar
      producción propia, dilo al momento de cotizar, porque el equipo es distinto.</p>

      <h3>Frigobares y refrigeración de punto de venta</h3>

      <p>Los <strong>frigobares</strong> resuelven la refrigeración de bajo volumen: bebidas en
      recepción, minibar de hotel, refrigeración de apoyo en barra. Su ventaja es el tamaño y el
      consumo; su límite es la capacidad y la velocidad de recuperación de temperatura. En una barra
      con alta rotación, donde la puerta se abre constantemente, un frigobar doméstico no da el ancho:
      ahí se necesita un equipo comercial diseñado para ciclos frecuentes.</p>

      <h3>Dimensionar bien</h3>

      <p>Para elegir, considera el <strong>volumen de almacenamiento real</strong> —incluyendo los
      días de mayor stock, no el promedio—, la <strong>frecuencia de apertura</strong> de las puertas
      y la <strong>temperatura ambiente</strong> del lugar donde va a estar el equipo. Este último
      punto se pasa por alto seguido: un equipo instalado junto a la línea de calor o sin ventilación
      posterior trabaja forzado, consume más y dura menos.</p>

      <h3>Ubicación e instalación</h3>

      <p>Deja siempre espacio libre en la parte posterior y en los costados para que el condensador
      disipe calor. No instales equipos de frío pegados a fuentes de calor ni en espacios sin
      ventilación. Y una recomendación práctica: después de trasladar un equipo de refrigeración,
      déjalo reposar en posición vertical varias horas antes de encenderlo, para que el aceite del
      compresor vuelva a su lugar. Encenderlo de inmediato es una de las causas más comunes de falla
      temprana.</p>

      <h3>Mantención de la cadena de frío</h3>

      <p>La mantención básica es simple y evita la mayoría de los problemas: limpiar el condensador
      con regularidad —el polvo acumulado es la causa número uno de bajo rendimiento—, revisar el
      estado de las gomas de las puertas, y controlar la temperatura con termómetro propio en vez de
      confiar solo en el display. Registrar temperaturas a diario, además, es exigible en fiscalización
      sanitaria.</p>

      <h3>Consúltanos antes de comprar</h3>

      <p>Cuéntanos qué vas a conservar, en qué volumen y en qué condiciones de ambiente, y te
      recomendamos el equipo que corresponde. Trabajamos hace más de 24 años con locales del sur de
      Chile y sabemos qué aguanta la operación real. Despachamos a todo el país.</p>
    
      <h3>Registro de temperaturas y fiscalización</h3>

      <p>Mantener un registro diario de temperaturas no es solo una exigencia de la autoridad sanitaria: es tu mejor herramienta de diagnóstico. Un equipo que empieza a fallar rara vez se detiene de golpe; primero muestra una deriva lenta en las temperaturas registradas. Quien lleva planilla lo detecta con semanas de anticipación y programa la reparación. Quien no la lleva, se entera cuando pierde el inventario.</p>

      <p>Usa termómetros independientes del display del equipo y ubícalos en el punto más desfavorable de la cámara, no junto al evaporador. Registra al inicio y al cierre de la jornada. Es un procedimiento de dos minutos que protege un inventario de varios millones.</p>

      <h3>Qué hacer ante un corte de energía</h3>

      <p>La regla es simple: no abrir. Un equipo cerrado mantiene temperatura durante varias horas; uno que se abre cada quince minutos para revisar, pierde la carga de frío en poco tiempo. Ten definido de antemano el umbral a partir del cual se descarta producto, y déjalo por escrito para que no se decida bajo presión.</p>
    `,
    faqs: [
      {
        pregunta: '¿Puedo usar un refrigerador doméstico en mi local?',
        respuesta:
          'No es recomendable. Los equipos domésticos están diseñados para pocas aperturas diarias y ' +
          'no recuperan temperatura con la rapidez que exige un local comercial. Además, en ' +
          'fiscalización sanitaria se evalúa la capacidad real de mantener la cadena de frío.',
      },
      {
        pregunta: '¿Cuánto espacio hay que dejar alrededor del equipo?',
        respuesta:
          'Como regla práctica, deja espacio libre en la parte posterior y en los costados para la ' +
          'disipación de calor, y nunca lo instales junto a fuentes de calor. El manual de cada ' +
          'equipo indica la separación mínima; respetarla alarga bastante la vida del compresor.',
      },
      {
        pregunta: '¿Qué mantención necesita un equipo de frío?',
        respuesta:
          'Limpieza periódica del condensador, revisión de las gomas de las puertas y control de ' +
          'temperatura con termómetro independiente. El condensador sucio es la causa más común de ' +
          'bajo rendimiento y de mayor consumo eléctrico.',
      },
      garantiaFaq,
      despachoFaq,
    ],
  },

  // ------------------------------------------------------------
  vitrinas: {
    intro:
      'Vitrinas frías y calientes para exhibición. Una buena vitrina no solo conserva: vende, ' +
      'porque el producto que se ve bien se pide.',
    seoHtml: `
      <h2>Vitrinas de exhibición frías y calientes</h2>

      <p>La vitrina es el vendedor silencioso del local. En panaderías, pastelerías y cafeterías,
      buena parte de la decisión de compra ocurre frente al mostrador, mirando. Un producto excelente
      exhibido en una vitrina opaca, mal iluminada o con temperatura irregular vende menos que un
      producto correcto bien presentado. Es una inversión que se recupera en ventas, no solo un mueble
      de conservación.</p>

      <h3>Vitrinas frías</h3>

      <p>Las <strong>vitrinas refrigeradas</strong> mantienen en rango de frío productos que lo
      requieren: tortas, postres, kuchen, sándwiches, lácteos, cecinas. Lo que hay que mirar al elegir
      es la <strong>uniformidad de temperatura</strong> en todos los niveles —no solo en el
      inferior— y la calidad del cierre, porque una vitrina que pierde frío por las puertas trabaja
      forzada todo el día. También conviene revisar si el equipo es de refrigeración estática o
      ventilada: la ventilada distribuye mejor, pero puede resecar productos descubiertos si no se
      protegen.</p>

      <h3>Vitrinas calientes</h3>

      <p>Las <strong>vitrinas calientes</strong> mantienen temperatura de servicio en empanadas,
      completos, pizzas por porción y preparaciones listas. El desafío técnico opuesto al frío: hay
      que sostener el calor sin resecar. Las vitrinas con control de humedad conservan mucho mejor la
      textura, lo que en empanadas se nota de inmediato. Ten claro que una vitrina caliente
      <strong>mantiene</strong> producto ya cocido, no lo cocina: si el producto entra tibio, sale
      tibio.</p>

      <h3>Iluminación y presentación</h3>

      <p>La iluminación LED cambia por completo cómo se ve el producto y prácticamente no aporta
      calor, algo importante en vitrinas frías. Un consejo que damos siempre: no llenes la vitrina
      hasta el tope. Una vitrina saturada se ve desordenada, obstruye la circulación de aire y
      deteriora el rendimiento del equipo. Menos producto, bien dispuesto y con espacio entre piezas,
      vende más que una vitrina abarrotada.</p>

      <h3>Medidas y circulación</h3>

      <p>Antes de comprar, mide el frente del mostrador y considera la circulación detrás de la
      vitrina para quien atiende. Una vitrina que entra justo pero deja un pasillo de cuarenta
      centímetros complica el servicio en hora peak. Considera también el acceso: mide las puertas y
      los pasillos por los que el equipo tiene que entrar al local, porque las vitrinas grandes no se
      desarman.</p>

      <h3>Mantención</h3>

      <p>En vitrinas frías, la limpieza del condensador y la revisión de las gomas de cierre son la
      base. En calientes, revisa las resistencias y el sistema de humidificación si lo tiene. En
      ambas, la limpieza diaria de vidrios es parte del trabajo comercial: una vitrina con vidrios
      opacos anula la razón por la que la compraste.</p>

      <p>Cuéntanos qué producto vas a exhibir, cuánto frente de mostrador tienes disponible y en qué
      volumen trabajas, y te recomendamos la vitrina adecuada. Despachamos a todo Chile.</p>
    
      <h3>Rotación y reposición durante el día</h3>

      <p>Una vitrina bien gestionada se repone varias veces al día en vez de llenarse una vez en la mañana. Cargarla completa al abrir tiene dos costos: el producto de las últimas horas llega deteriorado a la vitrina y el equipo trabaja forzado al máximo de carga durante toda la jornada. Reponer en tandas mantiene la presentación fresca y distribuye mejor la carga térmica.</p>

      <p>Define también un criterio de retiro. El producto que lleva demasiadas horas en exhibición daña la percepción de toda la vitrina, incluso del producto recién repuesto. Es preferible una vitrina con menos piezas impecables que una llena con producto cansado.</p>

      <h3>Consumo y ubicación en el local</h3>

      <p>La vitrina fría es uno de los equipos de mayor consumo eléctrico continuo del local, porque funciona las veinticuatro horas. Ubicarla lejos de la entrada, de ventanales con sol directo y de la línea de calor reduce el consumo de forma notoria. Si tu vitrina queda expuesta al sol de la tarde, considera protección solar en el ventanal: se paga sola en la cuenta de luz.</p>
    `,
    faqs: [
      {
        pregunta: '¿Qué diferencia hay entre vitrina fría estática y ventilada?',
        respuesta:
          'La estática enfría por convección natural y puede tener variación de temperatura entre ' +
          'niveles. La ventilada distribuye el aire de forma más pareja, pero tiende a resecar ' +
          'productos descubiertos si no se protegen. Para pastelería fina se suele preferir la ' +
          'estática o la ventilada con control de humedad.',
      },
      {
        pregunta: '¿La vitrina caliente cocina el producto?',
        respuesta:
          'No. Una vitrina caliente mantiene el producto a temperatura de servicio, pero no lo ' +
          'cocina. El producto debe entrar ya cocido y caliente; de lo contrario permanecerá tibio y ' +
          'además pasará tiempo en el rango de temperatura que conviene evitar sanitariamente.',
      },
      {
        pregunta: '¿Cómo sé qué medida de vitrina me sirve?',
        respuesta:
          'Mide el frente disponible en tu mostrador, el espacio de circulación detrás y, muy ' +
          'importante, el ancho de las puertas y pasillos por donde tiene que entrar. Con esas ' +
          'medidas te decimos qué modelos calzan.',
      },
      despachoFaq,
      garantiaFaq,
    ],
  },

  // ------------------------------------------------------------
  acero: {
    intro:
      'Mobiliario y utensilios en acero inoxidable: mesones, carros, bandejas, depósitos ' +
      'gastronómicos, fondos, sartenes, coladores y poruñas.',
    seoHtml: `
      <h2>Acero inoxidable para cocinas profesionales</h2>

      <p>El acero inoxidable no es una elección estética en una cocina profesional: es una condición
      de trabajo. Es la superficie que se puede sanitizar de verdad, que no absorbe olores ni
      humedad, que resiste detergentes fuertes y que soporta el uso diario durante años. Cualquier
      inspección sanitaria empieza mirando las superficies de trabajo, y ahí el acero no tiene
      reemplazo.</p>

      <h3>Mesones y superficies de trabajo</h3>

      <p>Los <strong>mesones de acero inoxidable</strong> son la base de la partida. Lo que conviene
      revisar es el espesor de la lámina y la estructura de soporte: un mesón de lámina delgada se
      abolla y se ondula con el uso, y una superficie ondulada acumula suciedad en las depresiones. Si
      vas a trabajar con peso —amasado, despiece, apoyo de equipos— vale la pena el mesón más
      robusto.</p>

      <h3>Carros de transporte</h3>

      <p>Los <strong>carros</strong> resuelven el movimiento interno de producto entre el obrador, el
      horno y el punto de venta. Además de ahorrar tiempo, evitan lesiones: mover bandejas cargadas a
      mano, varias veces al día, pasa factura. Al elegir, revisa que las ruedas sean adecuadas al piso
      del local y que al menos dos tengan freno.</p>

      <h3>Depósitos gastronómicos y bandejas</h3>

      <p>Los <strong>depósitos gastronómicos</strong> siguen el estándar de medidas GN, y esa es
      precisamente su ventaja: son intercambiables entre equipos, baños maría, vitrinas y
      refrigeradores que respeten el mismo estándar. Estandarizar tus depósitos simplifica el
      almacenamiento, el inventario y el servicio. Las <strong>bandejas</strong> de acero, por su
      parte, son el elemento de mayor rotación en cualquier cocina, así que conviene tener stock de
      sobra.</p>

      <h3>Fondos, sartenes y utensilios</h3>

      <p>Los <strong>fondos</strong> se usan para preparaciones de volumen: caldos, guisos, cocción
      de pastas. El punto crítico es el espesor de la base: una base delgada genera puntos calientes y
      quema el fondo de la preparación. Para cocciones largas, el fondo grueso es lo que hace la
      diferencia. Los <strong>sartenes</strong>, <strong>coladores</strong> y
      <strong>poruñas</strong> completan el set de trabajo y son piezas de reposición frecuente.</p>

      <h3>Limpieza y cuidado</h3>

      <p>El acero inoxidable se cuida mejor de lo que la mayoría cree. Evita las esponjas de acero y
      los productos clorados en contacto prolongado: el cloro puede generar corrosión por picadura,
      que es justamente lo que uno intenta evitar al comprar inoxidable. Limpia siguiendo el sentido
      del pulido, enjuaga bien y seca. Con eso, una superficie de acero dura décadas.</p>

      <h3>Equipamiento a medida</h3>

      <p>Si necesitas mesones o estructuras con medidas específicas para tu cocina, consúltanos. En
      más de 24 años equipando locales del sur de Chile hemos resuelto muchas cocinas con espacios
      difíciles, y casi siempre hay una solución mejor que forzar un mueble estándar en un espacio que
      no le corresponde.</p>
    
      <h3>Calidades de acero inoxidable</h3>

      <p>No todo el acero inoxidable es igual. En equipamiento gastronómico los más habituales son el AISI 304 y el AISI 430. El 304 tiene mayor contenido de níquel y mejor resistencia a la corrosión, y es el que conviene en superficies de contacto directo con alimentos y en ambientes húmedos o salinos. El 430 es más económico y funciona bien en estructuras, revestimientos y piezas que no están en contacto permanente con humedad.</p>

      <p>En una zona costera como Puerto Montt esta distinción importa más que en el interior: el aire con carga salina exige mejor calidad de acero en las superficies expuestas. Al cotizar, pregunta siempre la calidad del acero, no solo el espesor.</p>

      <h3>Espesor y estructura</h3>

      <p>El espesor de la lámina define si el mesón se mantiene plano con los años. Para superficies de trabajo con carga —amasado, despiece, apoyo de equipos pesados— conviene lámina más gruesa y refuerzo estructural inferior. Para estanterías y mobiliario de apoyo, una lámina más delgada cumple sin problema y reduce el costo. Dimensiona según el uso real de cada superficie en vez de aplicar el mismo criterio a toda la cocina.</p>
    `,
    faqs: [
      {
        pregunta: '¿Qué es el estándar GN en depósitos gastronómicos?',
        respuesta:
          'GN (Gastronorm) es un estándar internacional de medidas que permite que los depósitos ' +
          'sean intercambiables entre equipos de distintas marcas: baños maría, vitrinas, hornos y ' +
          'refrigeradores. Estandarizar en GN simplifica bastante la operación.',
      },
      {
        pregunta: '¿El acero inoxidable se puede oxidar?',
        respuesta:
          'El acero inoxidable resiste la corrosión, pero no es inmune. El contacto prolongado con ' +
          'cloro, sal o productos muy abrasivos puede generar corrosión por picadura. Se evita ' +
          'enjuagando bien después de limpiar y no dejando productos clorados actuando por horas.',
      },
      {
        pregunta: '¿Fabrican mobiliario a medida?',
        respuesta:
          'Consúltanos con las medidas de tu espacio. Según el requerimiento evaluamos si conviene ' +
          'una solución estándar o una a medida, y te cotizamos ambas alternativas.',
      },
      facturaFaq,
      despachoFaq,
    ],
  },

  // ------------------------------------------------------------
  complementarios: {
    intro:
      'Equipos complementarios que amplían tu carta sin rehacer la cocina: balanzas, licuadoras, ' +
      'hervidores, waffleras, creperas, selladoras, moledoras y más.',
    seoHtml: `
      <h2>Equipos complementarios para ampliar tu carta</h2>

      <p>Esta es, con diferencia, la categoría más amplia del catálogo, y también la que mejor
      retorno suele dar. Son equipos de inversión acotada que habilitan productos nuevos sin tocar la
      estructura de la cocina. Una wafflera, una crepera o una máquina de café bien elegida puede
      abrir una línea de venta completa en un local que ya está funcionando.</p>

      <h3>Medición y control: balanzas</h3>

      <p>Las <strong>balanzas</strong> son el equipo menos glamoroso y uno de los más rentables. En
      panadería y pastelería, pesar bien es la diferencia entre un producto consistente y uno que
      varía de un día a otro. Y en venta por peso, una balanza descalibrada te hace regalar producto en
      cada operación. Si vendes al público por peso, considera que la balanza debe cumplir con la
      normativa metrológica vigente.</p>

      <h3>Preparación: licuadoras, procesadores y extractores</h3>

      <p>Las <strong>licuadoras</strong> de uso comercial están construidas para ciclos continuos, a
      diferencia de las domésticas que se sobrecalientan con uso intensivo. Los
      <strong>procesadores de alimentos</strong> y <strong>procesadores de vegetales</strong>
      estandarizan cortes y ahorran horas de trabajo manual: un procesador que resuelve el mise en
      place de la mañana libera a una persona para tareas de mayor valor. Los
      <strong>extractores</strong>, <strong>exprimidores de cítricos</strong> y
      <strong>máquinas de jugos</strong> habilitan la línea de bebidas naturales, que tiene buen
      margen y alta demanda.</p>

      <h3>Cocción específica: waffleras, creperas y más</h3>

      <p>Acá están los equipos que crean producto nuevo: <strong>waffleras</strong>,
      <strong>creperas</strong>, <strong>máquinas de conos</strong>, <strong>donuts maker</strong>,
      <strong>cupcake maker</strong>, <strong>omelette maker</strong>,
      <strong>plancha panini</strong> y <strong>máquinas de pop corn</strong>. Todos comparten la misma
      lógica de negocio: costo de entrada bajo, producto de alto margen y fuerte impacto visual en el
      punto de venta. Antes de comprar, calcula cuántas unidades necesitas vender al mes para
      amortizar el equipo; en general la cuenta cierra rápido.</p>

      <h3>Procesamiento de carnes</h3>

      <p>Las <strong>moledoras de carne</strong>, <strong>embutidoras</strong> y
      <strong>cortadoras de cecinas</strong> permiten procesar internamente en vez de comprar
      procesado. Además del margen, ganas control sobre la calidad y la trazabilidad. Son equipos que
      exigen protocolos de limpieza estrictos: se desarman, se lavan y se sanitizan después de cada
      uso, sin excepción.</p>

      <h3>Conservación y envasado</h3>

      <p>Las <strong>selladoras al vacío</strong> y <strong>selladoras de bolsas</strong> extienden la
      vida útil del producto, reducen merma y ordenan el almacenamiento. Para un local que produce por
      lotes, el envasado al vacío cambia la logística: permite producir con anticipación sin sacrificar
      calidad.</p>

      <h3>Cómo priorizar la inversión</h3>

      <p>Si tienes presupuesto acotado, prioriza en este orden: primero lo que te hace perder dinero
      hoy —una balanza descalibrada, un equipo que genera merma—; segundo, lo que ahorra horas de
      trabajo; tercero, lo que abre productos nuevos. Escríbenos contándonos tu carta y tu operación y
      te ayudamos a ordenar la prioridad.</p>
    
      <h3>Uso doméstico contra uso comercial</h3>

      <p>La diferencia entre un equipo doméstico y uno comercial no está en la marca ni en el aspecto: está en el ciclo de trabajo para el que fue diseñado. Un equipo doméstico se calcula para minutos de uso diario; uno comercial, para horas continuas. Cuando se usa un equipo doméstico en un local, la falla no es una posibilidad remota sino una cuestión de tiempo, y además la garantía normalmente no cubre el uso comercial.</p>

      <p>Hacemos esta advertencia seguido porque el ahorro inicial es real y la tentación es comprensible. Pero al segundo o tercer reemplazo, el equipo barato terminó costando más que el comercial, y en el medio hubo días sin poder vender ese producto.</p>

      <h3>Espacio de mesón y consumo eléctrico</h3>

      <p>Antes de sumar equipos complementarios, revisa dos límites que se llenan rápido: el mesón disponible y la capacidad del tablero eléctrico. Cinco equipos chicos ocupan el frente completo de un mesón y pueden superar la capacidad del circuito. Planifica dónde va cada uno y cuánto consume antes de comprarlos, no después.</p>
    `,
    faqs: [
      {
        pregunta: '¿Sirve una licuadora doméstica para uso comercial?',
        respuesta:
          'No para uso intensivo. Las licuadoras domésticas no están diseñadas para ciclos ' +
          'continuos y el motor se sobrecalienta. Una licuadora comercial tiene motor y vaso ' +
          'preparados para uso constante y sale más barata a mediano plazo.',
      },
      {
        pregunta: '¿Las balanzas sirven para vender al público?',
        respuesta:
          'Para venta al público por peso, la balanza debe cumplir con la normativa metrológica ' +
          'vigente. Indícanos si la usarás para venta directa o solo para control interno de ' +
          'producción, porque el equipo indicado es distinto.',
      },
      {
        pregunta: '¿Qué equipo conviene para empezar a vender un producto nuevo?',
        respuesta:
          'Depende del producto y de tu público. Waffles, crepes y donuts tienen buen margen y ' +
          'requieren poca inversión inicial. Cuéntanos qué tipo de local tienes y qué venden mejor ' +
          'tus clientes actuales, y te sugerimos por dónde empezar.',
      },
      despachoFaq,
      garantiaFaq,
    ],
  },

  // ------------------------------------------------------------
  gastronomia: {
    intro:
      'Utensilios y equipamiento de cocina profesional: cuchillos, fondos, bandejas y picadoras. ' +
      'Las herramientas de trabajo diario de la partida.',
    seoHtml: `
      <h2>Equipamiento y utensilios de cocina profesional</h2>

      <p>Una cocina profesional se sostiene sobre herramientas que se usan cientos de veces al día.
      No son la inversión más visible, pero son las que determinan la velocidad, la seguridad y la
      consistencia del trabajo. Un cuchillo desafilado no es solo incómodo: es peligroso y hace perder
      producto en cada corte.</p>

      <h3>Cuchillos profesionales</h3>

      <p>El <strong>cuchillo</strong> es la extensión de la mano del cocinero. En una cocina bien
      equipada hay al menos tres: el cuchillo de chef para el trabajo general, el deshuesador para el
      despiece y la puntilla para el trabajo fino. Lo que hay que mirar al comprar es el acero y el
      encastre del mango: un mango que se afloja con la humedad es un riesgo de accidente.</p>

      <p>Sobre el filo: un cuchillo profesional necesita asentado frecuente con chaira y afilado
      periódico. Es una rutina de un minuto diario que multiplica la vida útil y previene cortes. La
      mayoría de los accidentes de cocina ocurre con cuchillos desafilados, porque obligan a forzar el
      corte.</p>

      <h3>Fondos y ollas</h3>

      <p>Los <strong>fondos</strong> son el recipiente de las preparaciones de volumen: caldos,
      salsas madre, guisos, cocción de pastas. El factor decisivo es el espesor de la base. Una base
      delgada crea puntos calientes y quema el fondo antes de que el centro esté cocido, lo que arruina
      preparaciones largas. Para caldos y fondos de cocción prolongada, la base gruesa se paga sola.</p>

      <h3>Bandejas y organización</h3>

      <p>Las <strong>bandejas</strong> son el elemento de mayor rotación de la cocina: transporte,
      almacenamiento, servicio y mise en place. Conviene estandarizar medidas para que sean
      compatibles entre carros, hornos y refrigeración. Tener bandejas de cinco medidas distintas es
      una fuente permanente de desorden.</p>

      <h3>Picadoras de papas</h3>

      <p>Las <strong>picadoras de papas</strong> resuelven un corte de alto volumen con velocidad y
      uniformidad. La uniformidad importa más de lo que parece: bastones del mismo grosor se fríen en
      el mismo tiempo, lo que significa que no tienes unos quemados y otros crudos en la misma canasta.
      Es un equipo que se amortiza rápido en cualquier local con carta de frituras.</p>

      <h3>Higiene y normativa</h3>

      <p>Todo el equipamiento que entra en contacto con alimentos debe ser apto para uso alimentario y
      permitir limpieza efectiva. Evita utensilios con uniones, ranuras o mangos porosos donde se
      acumule materia orgánica. Establece protocolos de limpieza por equipo y capacita al personal:
      la mayoría de las observaciones sanitarias apunta a procedimientos, no a falta de equipamiento.</p>

      <h3>Reposición programada</h3>

      <p>Los utensilios son consumibles de rotación media. Conviene llevar un control simple de
      estado y programar reposición en vez de esperar a que se rompa en pleno servicio. Si nos cuentas
      el tamaño de tu operación, te ayudamos a armar un listado base y su frecuencia de reposición.</p>
    
      <h3>Tablas y superficies de corte</h3>

      <p>La tabla de corte es tan importante como el cuchillo y suele recibir mucha menos atención. Las tablas de polietileno de uso profesional son las adecuadas: no dañan el filo, se sanitizan bien y se reemplazan cuando la superficie queda muy marcada. Una tabla con cortes profundos deja de ser higiénica, porque la materia orgánica se aloja en las ranuras y no sale con el lavado normal.</p>

      <p>El sistema de tablas por color es una práctica sencilla que previene contaminación cruzada: una tabla distinta para carnes crudas, aves, pescados, vegetales y productos cocidos. Es de bajo costo, se explica en cinco minutos al equipo y es de las primeras cosas que revisa una fiscalización.</p>

      <h3>Almacenamiento de utensilios</h3>

      <p>Guardar los cuchillos sueltos en un cajón arruina el filo y es un riesgo de corte para quien mete la mano. Usa barra magnética o taco. Cuelga los utensilios de uso frecuente al alcance de la partida y guarda el resto ordenado por función. Una cocina donde cada cosa tiene su lugar trabaja más rápido y pierde menos herramientas.</p>
    `,
    faqs: [
      {
        pregunta: '¿Cada cuánto hay que afilar los cuchillos?',
        respuesta:
          'El asentado con chaira conviene hacerlo a diario, antes de cada servicio. El afilado real ' +
          'con piedra o afilador depende del uso: en una cocina de alto volumen, cada una o dos ' +
          'semanas. Un cuchillo desafilado obliga a forzar el corte y es la causa más frecuente de ' +
          'accidentes.',
      },
      {
        pregunta: '¿Qué cuchillos necesito para empezar?',
        respuesta:
          'Con tres cubres casi todo: un cuchillo de chef de unos 20 cm para el trabajo general, una ' +
          'puntilla para el trabajo fino y un deshuesador si trabajas carnes. A partir de ahí se ' +
          'suman según la carta.',
      },
      facturaFaq,
      despachoFaq,
    ],
  },

  // ------------------------------------------------------------
  repuestos: {
    intro:
      'Repuestos para los equipos que comercializamos. Mantenemos stock porque una máquina ' +
      'detenida cuesta mucho más que la pieza que le falta.',
    seoHtml: `
      <h2>Repuestos para maquinaria gastronómica</h2>

      <p>Tener repuestos disponibles es, para nosotros, parte del producto y no un servicio aparte.
      La razón es simple: en panadería y gastronomía la producción no se puede detener. Un día sin
      producir cuesta mucho más que cualquier repuesto, y cuando una pieza hay que importarla, ese día
      se convierte en semanas.</p>

      <h3>Por qué el respaldo importa más que el precio</h3>

      <p>Es tentador comprar el equipo más barato del mercado. El problema aparece cuando se rompe
      una pieza y descubres que no hay respaldo en Chile. Hemos visto muchas veces la misma escena: un
      equipo funcionalmente sano, detenido meses por una pieza de bajo valor. Por eso, antes de
      comprar cualquier máquina —acá o donde sea— la pregunta que conviene hacer es si hay repuestos
      disponibles en el país.</p>

      <h3>Qué se repone con más frecuencia</h3>

      <p>Los componentes de desgaste son los que más se solicitan: correas y rodamientos en equipos
      con transmisión, resistencias y termostatos en línea de calor, gomas de puerta y componentes de
      refrigeración en línea de frío, cuchillas y discos en equipos de corte. Son piezas de desgaste
      normal, no fallas: se reemplazan según horas de uso.</p>

      <h3>Cómo pedir un repuesto</h3>

      <p>Para identificar la pieza correcta necesitamos tres datos: la <strong>marca y modelo</strong>
      del equipo, el <strong>número de serie</strong> —normalmente en una placa en la parte trasera o
      inferior— y, si puedes, una <strong>fotografía</strong> de la pieza dañada y de su ubicación en
      el equipo. Con eso confirmamos disponibilidad y precio. Enviar la foto ahorra muchísimo tiempo:
      hay piezas que se ven idénticas en catálogo y no lo son.</p>

      <h3>Mantención preventiva</h3>

      <p>La forma más barata de manejar los repuestos es no llegar a la emergencia. Una rutina de
      mantención preventiva —revisión de correas, limpieza de condensadores, control de temperaturas,
      revisión de conexiones eléctricas y de gas— detecta el desgaste antes de la falla. Y permite
      programar el cambio en un día de baja demanda, en vez de sufrirlo un sábado a las siete de la
      mañana.</p>

      <p>Una recomendación práctica para operaciones que no pueden parar: mantén en tu bodega un
      pequeño stock de las piezas de desgaste de tus equipos críticos. Son pocas piezas, de bajo valor,
      y evitan el peor escenario.</p>

      <h3>Equipos que no compraste con nosotros</h3>

      <p>Consúltanos igual. Según la marca y el modelo podemos tener la pieza o conseguirla. Escríbenos
      con los datos del equipo y te respondemos si podemos ayudarte; si no, te lo decimos derecho para
      que no pierdas tiempo.</p>
    
      <h3>Cuándo reparar y cuándo reemplazar</h3>

      <p>No todo equipo antiguo conviene repararlo, y no todo equipo con falla conviene reemplazarlo. La regla práctica que usamos es mirar tres cosas: cuánto cuesta la reparación respecto del valor de un equipo nuevo, cuántos años de vida útil le quedan al equipo reparado y cuánto consume comparado con un modelo actual. Si la reparación supera aproximadamente la mitad del valor de reposición y el equipo ya tiene bastante uso, normalmente conviene renovar.</p>

      <p>Hay una excepción importante: los equipos antiguos de fabricación robusta suelen ser mecánicamente más simples y más reparables que muchos modelos nuevos con electrónica integrada. Un equipo así, bien mantenido, puede durar décadas. Si tienes una máquina de este tipo funcionando, cuídala.</p>

      <h3>Instalación de repuestos</h3>

      <p>Algunos repuestos se cambian sin herramientas especiales y otros requieren técnico, especialmente los que involucran gas, refrigerante o conexiones eléctricas de potencia. Al confirmar el pedido te indicamos cuál es el caso, para que no intentes una reparación que pueda anular la garantía o generar un riesgo.</p>

      <h3>Identifica tus equipos críticos</h3>

      <p>Haz una lista corta de las máquinas sin las cuales tu operación se detiene por completo. Normalmente son dos o tres, no diez. Para esas, vale la pena tener a mano las piezas de desgaste y conocer de antemano a quién llamar. Para el resto, alcanza con reaccionar cuando falle. Esta distinción simple evita inmovilizar capital en repuestos que no vas a usar y, al mismo tiempo, te protege donde de verdad duele.</p>
    `,
    faqs: [
      {
        pregunta: '¿Qué datos necesito para pedir un repuesto?',
        respuesta:
          'Marca y modelo del equipo, número de serie (está en la placa trasera o inferior) y, si es ' +
          'posible, una foto de la pieza dañada y de dónde va montada. Con eso confirmamos ' +
          'disponibilidad y precio rápidamente.',
      },
      {
        pregunta: '¿Tienen repuestos de equipos comprados en otro lado?',
        respuesta:
          'Depende de la marca y el modelo. Escríbenos con los datos del equipo y te confirmamos si ' +
          'lo tenemos o si podemos conseguirlo. Si no podemos, te lo decimos de inmediato.',
      },
      {
        pregunta: '¿Cuánto demora un repuesto?',
        respuesta:
          'Si está en stock, el despacho es inmediato. Si hay que pedirlo, el plazo depende del ' +
          'proveedor y te lo informamos al confirmar el pedido, antes de que decidas.',
      },
      despachoFaq,
    ],
  },
}

/** Contenido de una categoría; si es hija, hereda el del padre. */
export function getCategoryContent(
  slug: string,
  parentSlug?: string | null,
): CategoryContent | null {
  return categoryContent[slug] ?? (parentSlug ? (categoryContent[parentSlug] ?? null) : null)
}

/**
 * Parte el contenido largo en un texto de entrada y secciones desplegables.
 *
 * Corta por los <h3>, que es como ya está escrito: lo que va antes del primer
 * h3 queda visible como bajada y cada h3 pasa a ser una sección que se abre.
 * Así la página no arranca con un muro de texto pero el contenido sigue
 * completo en el HTML, que es lo que importa para posicionar.
 */
/**
 * Separa el primer párrafo del resto de la bajada.
 *
 * La página muestra solo ese párrafo como texto libre; todo lo demás baja a
 * los desplegables. Así la categoría se lee de un vistazo sin perder el
 * contenido que necesita para posicionar.
 */
export function recortarLead(lead: string): { visible: string; resto: string } {
  const corte = lead.indexOf('</p>')
  if (corte < 0) return { visible: lead, resto: '' }
  return {
    visible: lead.slice(0, corte + 4).trim(),
    resto: lead.slice(corte + 4).trim(),
  }
}

export function dividirContenido(html: string): {
  lead: string
  secciones: { titulo: string; html: string }[]
} {
  const partes = html.split(/<h3>/)
  const lead = partes[0].replace(/<h2>[\s\S]*?<\/h2>/, '').trim()

  const secciones = partes.slice(1).map((parte) => {
    const cierre = parte.indexOf('</h3>')
    return {
      titulo: parte.slice(0, cierre).replace(/<[^>]+>/g, '').trim(),
      html: parte.slice(cierre + 5).trim(),
    }
  })

  return { lead, secciones }
}
