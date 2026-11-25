// Tipos del módulo "Razones de incumplimiento de liberación" (Excel: Razones incumplimiento lib.xlsx).
// Ficha: llm-wiki/excels/razones-incumplimiento-lib.md (sección 3).

export const SLUG = "razones-incumplimiento-lib";
export const RUTA = `/${SLUG}`;
export const TITULO_MODULO = "Razones de incumplimiento de liberación";

/** Fila de la hoja «Obs» tal como la deja el perfilador (claves = encabezados del Excel). */
export type FilaObs = {
  "No Orden": number | null;
  "OBSERVACIONES PLANEACIÓN": string | null;
  COMENTARIOS: string | null;
  FECHA: string | null;
};

/** Fila de la hoja «Razones» (catálogo). B14715 trae un valor suelto sin encabezado. */
export type FilaRazones = { "OBSERVACIONES PLANEACIÓN": string | null; columna_2: string | null };

/** Fila de la hoja oculta «Hoja1» (notas de reclasificación). */
export type FilaNotas = { "Código OP": number | null; columna_2: string | null };

export const GRUPOS = ["Capacidad de planta", "Materia prima", "Planeación", "I+D", "Comercial / pedido", "Calidad y sistemas", "Sin grupo"] as const;
export type GrupoRazon = (typeof GRUPOS)[number];

export type Origen = "historico" | "nuevo" | "editado";
export const ORIGEN_LABEL: Record<Origen, string> = { historico: "Histórico del Excel", nuevo: "Nuevo en la plataforma", editado: "Histórico editado" };

export type Anomalia = "razon-fuera-catalogo" | "fecha-texto" | "fecha-atipica" | "espacios";
export const ANOMALIAS: Anomalia[] = ["razon-fuera-catalogo", "fecha-texto", "fecha-atipica", "espacios"];
export const ANOMALIA_LABEL: Record<Anomalia, string> = {
  "razon-fuera-catalogo": "Razón fuera del catálogo",
  "fecha-texto": "Fecha escrita como texto",
  "fecha-atipica": "Fecha con año atípico",
  espacios: "Espacios sobrantes",
};

/** Tablas del módulo en el schema `logistica` (supabase/migrations/20261120_logistica_razones_lib.sql). */
export const TABLAS = {
  catalogo: "razones_lib_catalogo",
  historico: "razones_lib_historico",
  notas: "razones_lib_notas",
  registros: "razones_lib_registros",
  eliminadas: "razones_lib_eliminadas",
} as const;

export type FilaEliminadaDb = { no_orden: number; motivo: string | null; eliminado: string; eliminado_por: string };

/** Orden eliminada (borrado lógico) con la versión que tenía al eliminarse; `orden` es null si ya no existe en ninguna fuente. */
export type Eliminacion = { noOrden: number; motivo: string | null; eliminado: string; eliminadoPor: string; orden: Orden | null };

/** Máximo de caracteres del motivo al eliminar una orden (igual que el check de la tabla). */
export const MAX_MOTIVO_ELIMINACION = 300;

export type FilaCatalogoDb = { fila_excel: number; razon: string | null; valor_suelto: string | null };
export type FilaHistoricoDb = { fila_excel: number; no_orden: number; razon: string | null; comentario: string | null; fecha_excel: string | null; originales: Record<string, string> | null };
export type FilaNotaDb = { fila_excel: number; codigo_op: number | null; nota: string | null };
export type FilaRegistroDb = { no_orden: number; razon: string; fecha_programada: string; cambio_fecha: boolean; comentario: string | null; creado: string; actualizado: string; actualizado_por: string };

/** Registro capturado en la plataforma (tabla logistica.razones_lib_registros). */
export type RegistroOrden = {
  noOrden: number;
  razon: string;
  fechaProgramada: string;
  cambioFecha: boolean;
  comentario: string | null;
  creado: string;
  actualizado: string;
  usuario: string;
};

/** Orden lista para mostrar: histórico migrado o registro de la plataforma, con reglas aplicadas. */
export type Orden = {
  noOrden: number;
  /** Razón tal como está guardada (recortada); el original con espacios va en `originales`. */
  razon: string;
  /** Razón del catálogo con la que se agrupa en análisis (igual a `razon` si ya es del catálogo). */
  razonNormalizada: string;
  grupo: GrupoRazon;
  comentario: string | null;
  /** Fecha programada válida (AAAA-MM-DD); null si está vacía o escrita como texto. */
  fechaProgramada: string | null;
  /** Texto de FECHA cuando no es una fecha (p. ej. "09/12/20214"). */
  fechaTexto: string | null;
  cambioFecha: boolean;
  /** De dónde sale `cambioFecha`: del comentario (histórico) o de la casilla del formulario. */
  cambioFechaFuente: "comentario" | "formulario" | null;
  origen: Origen;
  /** Fila del Excel original (null si la orden es nueva en la plataforma). */
  filaExcel: number | null;
  anomalias: Anomalia[];
  /** Valores originales con espacios sobrantes, por columna del Excel. */
  originales: Record<string, string>;
  actualizado: string | null;
  usuario: string | null;
};

export type Catalogo = {
  razones: string[];
  /** Valores sueltos fuera de la tabla del catálogo (p. ej. "NEGOCIACION" en B14715). */
  sueltas: { valor: string; celda: string }[];
};

export type Nota = { codigoOP: number; nota: string; filaExcel: number | null; razonActual: string | null };
