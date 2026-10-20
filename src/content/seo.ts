import type { Metadata } from 'next'

export type SeoEntry = { title: string; description: string; h1: string }

// Plan aprobado el 09-10-2026: solo páginas existentes, sin modificar el catálogo.
export const seoEntries: Readonly<Record<string, SeoEntry>> = {
  "/": {
    "title": "Equipamiento gastronómico y repuestos en Puerto Montt · ROMASE",
    "description": "Maquinaria gastronómica y repuestos en Puerto Montt. Asesoría para elegir tu equipo y despacho a Los Lagos, Aysén y Magallanes.",
    "h1": "Equipamiento gastronómico y repuestos en Puerto Montt"
  },
  "/categorias/repuestos": {
    "title": "Repuestos para maquinaria gastronómica · ROMASE",
    "description": "Repuestos para equipos gastronómicos: batidores, termocuplas, controladores y más. Consulta compatibilidad y disponibilidad con ROMASE en Puerto Montt.",
    "h1": "Repuestos para maquinaria gastronómica"
  },
  "/categorias/gastronomia": {
    "title": "Utensilios y equipos de cocina profesional · ROMASE",
    "description": "Cuchillos, fondos, bandejas y picadoras para cocinas profesionales. Compra en ROMASE, Puerto Montt, con despacho al sur de Chile.",
    "h1": "Utensilios y equipos para cocinas profesionales"
  },
  "/categorias/calor": {
    "title": "Equipos de cocción y maquinaria gastronómica · ROMASE",
    "description": "Hornos, cocinas, freidoras y anafes para negocios gastronómicos. Compara equipos y consulta disponibilidad en ROMASE, Puerto Montt.",
    "h1": "Equipos de cocción para cocinas profesionales"
  },
  "/categorias/panaderia": {
    "title": "Maquinaria para panadería y pastelería · ROMASE",
    "description": "Amasadoras, batidoras, sobadoras y accesorios para panadería. Asesoría en Puerto Montt y despacho a Los Lagos, Aysén y Magallanes.",
    "h1": "Maquinaria para panadería y pastelería"
  },
  "/categorias/visicooler": {
    "title": "Visicoolers para negocios: Maigas y Ventus · ROMASE",
    "description": "Compara visicoolers por capacidad y modelo para tu negocio. Consulta equipos Maigas y Ventus en ROMASE, con despacho desde Puerto Montt.",
    "h1": "Visicoolers para refrigeración comercial"
  },
  "/categorias/selladoras-al-vacio": {
    "title": "Selladoras al vacío Ventus y Ecobeck · ROMASE",
    "description": "Selladoras al vacío Ventus y Ecobeck para conservar alimentos. Consulta modelos y disponibilidad en ROMASE, Puerto Montt, con despacho al sur.",
    "h1": "Selladoras al vacío para alimentos"
  },
  "/categorias/pasteleras": {
    "title": "Vitrinas pasteleras refrigeradas · ROMASE",
    "description": "Vitrinas pasteleras verticales, curvas y de sobremesa. Compara modelos Maigas y Ventus en ROMASE y consulta despacho desde Puerto Montt.",
    "h1": "Vitrinas pasteleras refrigeradas"
  },
  "/categorias/vitrinas": {
    "title": "Vitrinas para exhibición gastronómica · ROMASE",
    "description": "Explora vitrinas para exhibir productos en tu negocio. Encuentra líneas pasteleras, conservadoras y de calor en ROMASE, Puerto Montt.",
    "h1": "Vitrinas para exhibición gastronómica"
  },
  "/categorias/cortadoras-de-cecinas": {
    "title": "Cortadoras de cecinas y fiambre · ROMASE",
    "description": "Cortadoras de cecinas para negocios gastronómicos. Compara modelos y consulta disponibilidad en ROMASE, con despacho desde Puerto Montt.",
    "h1": "Cortadoras de cecinas y fiambre"
  },
  "/categorias/conservadoras": {
    "title": "Conservadoras y congeladores comerciales · ROMASE",
    "description": "Conservadoras para refrigeración y congelación comercial. Revisa capacidades y modelos en ROMASE, Puerto Montt, y consulta despacho al sur.",
    "h1": "Conservadoras y congeladores comerciales"
  },
  "/categorias/frio-2": {
    "title": "Refrigeración comercial para negocios · ROMASE",
    "description": "Visicoolers, conservadoras, freezers y frigobares para tu negocio. Asesoría en ROMASE, Puerto Montt, con despacho al sur de Chile.",
    "h1": "Equipos de refrigeración comercial"
  },
  "/categorias/moledoras-de-carne": {
    "title": "Moledoras de carne para uso gastronómico · ROMASE",
    "description": "Compara moledoras de carne para tu cocina o negocio. Consulta capacidad, modelos y repuestos en ROMASE, Puerto Montt.",
    "h1": "Moledoras de carne para uso gastronómico"
  },
  "/categorias/estiradoras-de-masa": {
    "title": "Estiradoras de masa para panadería · ROMASE",
    "description": "Estiradoras de masa para panadería y pastelería. Compara modelos y anchos disponibles en ROMASE, con retiro en Puerto Montt y despacho al sur.",
    "h1": "Estiradoras de masa para panadería"
  },
  "/categorias/maquina-de-yoguis": {
    "title": "Máquina de yoguis Ecobeck · ROMASE",
    "description": "Máquina de yoguis Ecobeck para ampliar la carta de tu negocio. Consulta características y disponibilidad en ROMASE, Puerto Montt.",
    "h1": "Máquina de yoguis"
  },
  "/contacto": {
    "title": "Contacto y cotizaciones en Puerto Montt · ROMASE",
    "description": "Cotiza maquinaria gastronómica y repuestos con ROMASE. Visítanos en Valle Volcanes, Puerto Montt, o consulta por teléfono y WhatsApp.",
    "h1": "Contacto y cotizaciones de ROMASE"
  },
  "/nosotros": {
    "title": "ROMASE: maquinaria gastronómica en Puerto Montt",
    "description": "Conoce ROMASE: trayectoria en equipamiento gastronómico, asesoría y repuestos. Atendemos desde Puerto Montt al sur de Chile.",
    "h1": "ROMASE: equipamiento gastronómico desde Puerto Montt"
  },
  "/productos/batidor-globo-7-lts-vb-7-ventus": {
    "title": "Batidor globo para Ventus VB-7 de 7 litros · ROMASE",
    "description": "Batidor globo para batidora Ventus VB-7 de 7 litros. Confirma la versión y compatibilidad antes de comprar. Consulta a ROMASE, Puerto Montt.",
    "h1": "Batidor globo para batidora Ventus VB-7 de 7 litros"
  },
  "/productos/batidor-globo-vb-7-ventus-modelo-antiguo": {
    "title": "Batidor globo Ventus VB-7: modelo antiguo · ROMASE",
    "description": "Batidor globo para versión antigua de batidora Ventus VB-7. Verifica compatibilidad con tu equipo antes de comprar en ROMASE.",
    "h1": "Batidor globo Ventus VB-7 para modelo antiguo"
  },
  "/productos/termocupla-bifida-para-freidora-maigas": {
    "title": "Termocupla bífida para freidora Maigas · ROMASE",
    "description": "Termocupla bífida para freidora Maigas. Consulta compatibilidad con el equipo y la válvula antes de comprar este repuesto en ROMASE.",
    "h1": "Termocupla bífida para freidora Maigas"
  },
  "/productos/caja-reductora-para-maquina-de-helados-soft-ventus": {
    "title": "Caja reductora para máquina de helados Ventus · ROMASE",
    "description": "Caja reductora para máquinas de helados soft Ventus. Confirma el modelo compatible con ROMASE antes de comprar. Retiro en Puerto Montt.",
    "h1": "Caja reductora para máquina de helados soft Ventus"
  },
  "/productos/calefactor-para-horno-convector-electrico-vhc-1a-4a": {
    "title": "Resistencia para horno Ventus VHC-1A/4A · ROMASE",
    "description": "Calefactor o resistencia para horno convector Ventus VHC-1A/4A, de 1260 W y 230 V. Consulta compatibilidad y disponibilidad en ROMASE.",
    "h1": "Calefactor para horno Ventus VHC-1A/4A"
  },
  "/productos/amasadora-8-kg": {
    "title": "Amasadora industrial de 8 kg para panadería · ROMASE",
    "description": "Amasadora industrial de 8 kg para panadería. Consulta especificaciones, disponibilidad y asesoría de ROMASE en Puerto Montt antes de comprar.",
    "h1": "Amasadora industrial de 8 kg"
  },
  "/productos/batidora-20-lts": {
    "title": "Batidora industrial Maigas de 20 litros · ROMASE",
    "description": "Batidora industrial Maigas de 20 litros para pastelería y cocina profesional. Consulta disponibilidad en ROMASE, Puerto Montt, y despacho al sur.",
    "h1": "Batidora industrial Maigas de 20 litros"
  },
  "/productos/batidora-planetaria-20-lts-pareti-kitchenette": {
    "title": "Batidora planetaria Pareti de 20 litros · ROMASE",
    "description": "Batidora planetaria Pareti Kitchenette de 20 litros. Consulta características y disponibilidad en ROMASE para equipar tu panadería o pastelería.",
    "h1": "Batidora planetaria Pareti Kitchenette de 20 litros"
  },
  "/productos/horno-convector-con-humidificador-vhc-4a-ventus": {
    "title": "Horno convector Ventus VHC-4A con humidificador · ROMASE",
    "description": "Horno convector eléctrico Ventus VHC-4A con humidificador y cuatro bandejas incluidas. Consulta disponibilidad en ROMASE, Puerto Montt.",
    "h1": "Horno convector Ventus VHC-4A con humidificador"
  },
  "/productos/horno-convector-sin-humidificador-vhc-1a-ventus": {
    "title": "Horno convector Ventus VHC-1A · ROMASE",
    "description": "Horno convector eléctrico Ventus VHC-1A para uso comercial. Revisa especificaciones y consulta disponibilidad en ROMASE, Puerto Montt.",
    "h1": "Horno convector eléctrico Ventus VHC-1A"
  },
  "/productos/vitrina-pastelera-vertical-sobremesa-98r-ventus": {
    "title": "Vitrina pastelera de sobremesa Ventus 98R · ROMASE",
    "description": "Vitrina pastelera vertical de sobremesa Ventus 98R. Consulta características y disponibilidad en ROMASE, con despacho desde Puerto Montt.",
    "h1": "Vitrina pastelera de sobremesa Ventus 98R"
  }
}

export function getSeoEntry(path: string): SeoEntry | undefined {
  return seoEntries[path]
}

export function seoMetadata(path: string): Metadata {
  const entry = getSeoEntry(path)
  if (!entry) return {}
  return {
    title: { absolute: entry.title },
    description: entry.description,
    openGraph: { type: 'website', title: entry.title, description: entry.description },
  }
}

export function seoH1(path: string, fallback: string): string {
  return getSeoEntry(path)?.h1 ?? fallback
}
