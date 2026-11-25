import "server-only";
import { createClient } from "@/lib/supabase/server";

// Capa de datos: lee del schema `logistica` de Supabase (proyecto Manufactura) con la sesión del usuario,
// así el RLS (solo @firplak.com) aplica a cada consulta. Ver llm-wiki/decisiones/ADR-002-supabase-manufactura.md.

const TAMANO_PAGINA = 1000; // Límite de filas por respuesta de la API de Supabase.

const PAGINAS_EN_PARALELO = 8;

/**
 * Lee todas las filas de una tabla, ordenadas por `orden`. Primero cuenta las filas y luego pide las páginas
 * de 1.000 en paralelo (de a 8): 40.000 filas pasan de ~41 viajes en serie a ~6 tandas.
 */
export async function leerTabla<T>(tabla: string, columnas: string, orden: string): Promise<T[]> {
  const supabase = await createClient();
  const { count, error: errorConteo } = await supabase.from(tabla).select("*", { count: "exact", head: true });
  if (errorConteo) throw new Error(`No se pudo contar ${tabla}: ${errorConteo.message}`);

  const total = count ?? 0;
  const inicios = Array.from({ length: Math.ceil(total / TAMANO_PAGINA) }, (_, i) => i * TAMANO_PAGINA);
  const paginas: T[][] = [];
  for (let i = 0; i < inicios.length; i += PAGINAS_EN_PARALELO) {
    const tanda = await Promise.all(inicios.slice(i, i + PAGINAS_EN_PARALELO).map(async (desde) => {
      const { data, error } = await supabase.from(tabla).select(columnas).order(orden).range(desde, desde + TAMANO_PAGINA - 1);
      if (error) throw new Error(`No se pudo leer ${tabla}: ${error.message}`);
      return (data ?? []) as T[];
    }));
    paginas.push(...tanda);
  }
  return paginas.flat();
}

// Las tablas migradas del Excel no cambian desde la app: se leen una vez por proceso del servidor.
// Si se recarga el histórico (scripts/cargar-supabase.mjs), basta reiniciar el servidor.
const inmutables = new Map<string, Promise<unknown>>();

export function leerInmutable<T>(clave: string, leer: () => Promise<T>): Promise<T> {
  let promesa = inmutables.get(clave) as Promise<T> | undefined;
  if (!promesa) {
    promesa = leer();
    inmutables.set(clave, promesa);
    promesa.catch(() => inmutables.delete(clave)); // Si falla (p. ej. sesión vencida), se reintenta en la próxima petición.
  }
  return promesa;
}
