// Utilidades genéricas para consultar listas grandes en el servidor (filtros por URL y paginación).
// Reutilizables por cualquier módulo: el cliente solo recibe la página que va a mostrar.

export type ParametrosUrl = Record<string, string | string[] | undefined>;

/** Primer valor de un parámetro de la URL, recortado; cadena vacía si no viene. */
export function parametro(params: ParametrosUrl, nombre: string): string {
  const valor = params[nombre];
  return (Array.isArray(valor) ? valor[0] : valor)?.trim() ?? "";
}

/** Valor del parámetro solo si pertenece a la lista permitida (evita valores arbitrarios en la URL). */
export function parametroDe<T extends string>(params: ParametrosUrl, nombre: string, permitidos: readonly T[], porDefecto: T): T {
  const valor = parametro(params, nombre);
  return (permitidos as readonly string[]).includes(valor) ? (valor as T) : porDefecto;
}

/** Texto comparable: sin tildes, en mayúsculas y con espacios simples. */
export function textoComparable(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
}

export type Pagina<T> = { filas: T[]; total: number; pagina: number; paginas: number; tamano: number };

export function paginar<T>(filas: T[], paginaPedida: number, tamano = 50): Pagina<T> {
  const paginas = Math.max(1, Math.ceil(filas.length / tamano));
  const pagina = Math.min(Math.max(1, Number.isFinite(paginaPedida) ? Math.trunc(paginaPedida) : 1), paginas);
  return { filas: filas.slice((pagina - 1) * tamano, pagina * tamano), total: filas.length, pagina, paginas, tamano };
}

/** Construye `?a=1&b=2` omitiendo vacíos; útil para enlaces de paginación que conservan los filtros. */
export function construirQuery(valores: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor !== undefined && valor !== null && String(valor) !== "") query.set(clave, String(valor));
  }
  const texto = query.toString();
  return texto ? `?${texto}` : "";
}

/** Fecha ISO (AAAA-MM-DD) real del calendario. */
export function esFechaIso(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

/** Hoy en Colombia (AAAA-MM-DD), sin depender de la zona horaria del servidor. */
export function hoyColombia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function sumarDias(fechaIso: string, dias: number): string {
  const fecha = new Date(`${fechaIso}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}
