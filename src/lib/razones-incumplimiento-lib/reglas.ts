// Reglas de negocio del módulo. El Excel no tiene fórmulas: estas reglas salen de su estructura
// (validación de lista, formato condicional) y de las decisiones del desarrollador del 2026-11-06.
// Cada función está documentada en llm-wiki/excels/razones-incumplimiento-lib.md (sección 2 y 3).
// Sin dependencias de servidor: se pueden usar en el formulario (cliente) y en la Server Action.

import { esFechaIso, textoComparable } from "@/lib/consulta";
import { formatDateLong } from "@/lib/format";
import type { Anomalia, GrupoRazon } from "./types";

/** Primera fecha programada del histórico es 2024-03-04; se acepta desde el inicio de 2024. */
export const FECHA_MINIMA = "2024-01-01";
/** El formulario acepta fechas programadas hasta 90 días después de hoy. */
export const DIAS_FUTURO_PERMITIDOS = 90;
/** Corte del Excel entregado (última modificación del archivo): referencia para marcar años atípicos del histórico. */
export const FECHA_CORTE_HISTORICO = "2026-11-06";
/** Inicio real del registro de fechas en el histórico (primer mes con fecha). */
export const INICIO_FECHAS_HISTORICO = "2024-03-01";
export const MAX_COMENTARIO = 500;

// Variantes vistas en el histórico que no están en el catálogo (aprobado 2026-11-06: se agrupan con su
// razón normalizada; el valor original se muestra marcado). RETRASOS PLANTA ya no es variante: se agregó al
// catálogo desde la plataforma (decisión del desarrollador 2026-11-20) porque el responsable la usa como razón propia.
const VARIANTES: Record<string, string> = {
  "CAPACIAD DEL DIA FULL": "CAPACIDAD DEL DIA FULL",
  "CAMBIO SKU": "CAMBIO DE SKU",
};

/**
 * Regla "La razón debe pertenecer al catálogo" (validación de lista Obs!B2:B38884 ← OBSERVACIONES_PLANEACIÓN).
 * Devuelve la razón del catálogo equivalente (sin distinguir tildes, mayúsculas ni espacios) o el texto original
 * recortado si no hay equivalente. Nunca reemplaza el dato guardado: solo sirve para agrupar.
 */
export function normalizarRazon(texto: string, catalogo: readonly string[]): string {
  const limpio = texto.trim();
  if (catalogo.includes(limpio)) return limpio;
  const comparable = textoComparable(limpio);
  const exacta = catalogo.find((razon) => textoComparable(razon) === comparable);
  if (exacta) return exacta;
  const variante = VARIANTES[comparable];
  return variante && catalogo.includes(variante) ? variante : limpio;
}

export function esRazonDelCatalogo(texto: string, catalogo: readonly string[]): boolean {
  return catalogo.includes(texto.trim());
}

// Grupos por área responsable (aprobados por el desarrollador 2026-11-06, provisionales).
const MAPA_GRUPOS: Record<Exclude<GrupoRazon, "Sin grupo">, string[]> = {
  "Capacidad de planta": ["CAPACIDAD DEL DIA FULL", "CAPACIDAD DEL DIA FULL-RETRASOS PLANTA", "RETRASOS PLANTA", "MOLDE EN REP/FAB", "CAPACIDAD AGOTADA DEL MOLDE", "INVENTARIO/MTTO DE PLANTAS", "NO SE LIBERO X RETRASOS PROD.", "TAMAÑO LOTE INFERIOR A LA PROGRAMACION", "BAJA OCUPACION DE PLANTA"],
  "Materia prima": ["FALTA O PROBLEMAS DE MP", "MP DEFECTUOSA", "RESERVA SIN DISPONIBILIDAD", "DIFERENCIA DE INVENTARIO"],
  Planeación: ["DEFINICION POR PRIORIDADES", "ACUMULACIÓN DE NOVEDAD", "ERROR DE LIBERACION", "CAPACIDAD DEL DIA FULL-PLANEACIÓN", "ERROR EN EL LOTEO", "OP SIN CREAR", "ERROR PROGRAMACION DE FECHA", "DESMONTE DE ORDEN", "BALANCEO DE BODEGAS"],
  "I+D": ["CAPACIDAD DEL DIA FULL-I+D", "FALTA ESPECIFICACIONES I+D", "FALTA PLANO", "ITEM SIN TIPO TOC", "CAMBIO EN EL TIPO TOC"],
  "Comercial / pedido": ["FECHA ENTREGA ERRADA", "URGENCIA CIAL", "PEDIDOS DE SODIMAC ORGANIZADOS TARDE", "CAMBIO DE SKU", "VENTAS", "SOBREDEMANDA STOCK", "ADICION AL PEDIDO", "PEDIDO STOCK -ANTICIPADO", "CAMBIO DE FECHA A LA O.V", "TIPO PEDIDO ERRADO", "NEGOCIACION", "SOBREDEMANDA FV"],
  "Calidad y sistemas": ["CALIDAD", "PROBLEMAS EN EL SISTEMA", "ERROR DE RECIBO"],
};
const GRUPO_POR_RAZON = new Map<string, GrupoRazon>(
  Object.entries(MAPA_GRUPOS).flatMap(([grupo, razones]) => razones.map((razon) => [textoComparable(razon), grupo as GrupoRazon])),
);

/** Área responsable de una razón (ya normalizada). CUMPLE, NO MEDIR y las razones sin uso quedan "Sin grupo". */
export function grupoRazon(razonNormalizada: string): GrupoRazon {
  return GRUPO_POR_RAZON.get(textoComparable(razonNormalizada)) ?? "Sin grupo";
}

export const RAZON_CUMPLE = "CUMPLE";
export const RAZON_NO_MEDIR = "NO MEDIR";

/** La orden se liberó (en la fecha original o en la nueva, si se reprogramó). */
export function cumpleLiberacion(razonNormalizada: string): boolean {
  return razonNormalizada === RAZON_CUMPLE;
}

/**
 * "Cumple con cambio de fecha" en el histórico: se deriva del comentario (sin tildes ni mayúsculas) cuando dice
 * CAMBIO (DE) FECHA o REPROGRAM… (p. ej. "CAMBIO DE FECHA EN LA OP"). En el formulario es una casilla.
 */
export function detectarCambioFecha(comentario: string | null): boolean {
  return comentario ? /CAMBIO (DE )?FECHA|REPROGRAM/.test(textoComparable(comentario)) : false;
}

/** Clasifica el valor de FECHA del histórico: fecha válida, vacía o texto que no es fecha. */
export function leerFechaHistorico(valor: string | null): { fecha: string | null; texto: string | null } {
  if (!valor || !valor.trim()) return { fecha: null, texto: null };
  return esFechaIso(valor) ? { fecha: valor, texto: null } : { fecha: null, texto: valor };
}

/** Fecha real pero fuera del periodo del histórico (año mal digitado o futura respecto al corte del Excel). */
export function esFechaAtipicaHistorico(fecha: string): boolean {
  return fecha < INICIO_FECHAS_HISTORICO || fecha > FECHA_CORTE_HISTORICO;
}

/** Marcas de calidad de una fila del histórico. No corrigen nada: solo señalan. */
export function anomaliasHistorico(fila: { razon: string; fechaValida: string | null; fechaTexto: string | null; conEspacios: boolean }, catalogo: readonly string[]): Anomalia[] {
  const anomalias: Anomalia[] = [];
  if (fila.razon && !esRazonDelCatalogo(fila.razon, catalogo)) anomalias.push("razon-fuera-catalogo");
  if (fila.fechaTexto) anomalias.push("fecha-texto");
  if (fila.fechaValida && esFechaAtipicaHistorico(fila.fechaValida)) anomalias.push("fecha-atipica");
  if (fila.conEspacios) anomalias.push("espacios");
  return anomalias;
}

// ── Validación del formulario (cliente y servidor) ──

export type DatosFormulario = { noOrden: string; razon: string; fechaProgramada: string; cambioFecha: boolean; comentario: string };
export type ErroresFormulario = Partial<Record<keyof DatosFormulario, string>>;

export function rangoFechaFormulario(hoy: string, sumarDias: (fecha: string, dias: number) => string) {
  return { minima: FECHA_MINIMA, maxima: sumarDias(hoy, DIAS_FUTURO_PERMITIDOS) };
}

/** No. de orden: solo dígitos, sin ceros a la izquierda, hasta 10 cifras. */
export function leerNoOrden(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^[1-9]\d{0,9}$/.test(limpio)) return null;
  return Number(limpio);
}

export function validarFormulario(datos: DatosFormulario, catalogo: readonly string[], rango: { minima: string; maxima: string }): ErroresFormulario {
  const errores: ErroresFormulario = {};
  if (!datos.noOrden.trim()) errores.noOrden = "Escribe el número de la orden.";
  else if (leerNoOrden(datos.noOrden) === null) errores.noOrden = "El número de orden solo admite dígitos (hasta 10, sin ceros al inicio).";

  if (!datos.razon) errores.razon = "Selecciona una razón de la lista.";
  else if (!catalogo.includes(datos.razon)) errores.razon = "La razón no está en el catálogo. Selecciónala de la lista.";

  if (!datos.fechaProgramada) errores.fechaProgramada = "Selecciona la fecha programada de la orden.";
  else if (!esFechaIso(datos.fechaProgramada)) errores.fechaProgramada = "La fecha no es válida. Usa el selector de fecha.";
  else if (datos.fechaProgramada < rango.minima || datos.fechaProgramada > rango.maxima) errores.fechaProgramada = `La fecha debe estar entre el ${formatDateLong(rango.minima)} y el ${formatDateLong(rango.maxima)}.`;

  if (datos.comentario.length > MAX_COMENTARIO) errores.comentario = `El comentario admite máximo ${MAX_COMENTARIO} caracteres.`;
  return errores;
}
