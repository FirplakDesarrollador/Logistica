// Lectura de filtros desde la URL (searchParams) para la tabla de órdenes. Valores fuera de lista se ignoran.
import { esFechaIso, parametro, type ParametrosUrl } from "@/lib/consulta";
import type { FiltrosOrdenes } from "./datos";
import { ANOMALIAS, GRUPOS } from "./types";

export const NOMBRES_FILTRO = ["q", "razon", "grupo", "fecha", "desde", "hasta", "cambio", "comentario", "origen", "anomalia"] as const;

function de<T extends string>(params: ParametrosUrl, nombre: string, permitidos: readonly T[]): T | "" {
  const valor = parametro(params, nombre);
  return (permitidos as readonly string[]).includes(valor) ? (valor as T) : "";
}

export function leerFiltros(params: ParametrosUrl): FiltrosOrdenes {
  const fecha = (nombre: string) => { const valor = parametro(params, nombre); return esFechaIso(valor) ? valor : ""; };
  return {
    q: parametro(params, "q").slice(0, 80),
    razon: parametro(params, "razon").slice(0, 120),
    grupo: de(params, "grupo", GRUPOS),
    fecha: de(params, "fecha", ["con", "sin"] as const) || "todas",
    desde: fecha("desde"),
    hasta: fecha("hasta"),
    cambio: de(params, "cambio", ["si", "no"] as const) || "todos",
    comentario: de(params, "comentario", ["con", "sin"] as const) || "todos",
    origen: de(params, "origen", ["historico", "nuevo", "editado"] as const) || "todos",
    anomalia: de(params, "anomalia", ["con", ...ANOMALIAS] as const) || "todas",
  };
}

/** Valores aplicados tal como los muestra la barra de filtros (vacío = sin filtro). */
export function filtrosAplicados(filtros: FiltrosOrdenes): Record<string, string> {
  return Object.fromEntries(NOMBRES_FILTRO.map((n) => [n, ["todas", "todos"].includes(String(filtros[n])) ? "" : String(filtros[n])]));
}
