import "server-only";
import { leerInmutable, leerTabla } from "@/lib/datos";
import { textoComparable } from "@/lib/consulta";
import { anomaliasHistorico, cumpleLiberacion, detectarCambioFecha, esFechaAtipicaHistorico, grupoRazon, leerFechaHistorico, normalizarRazon, RAZON_NO_MEDIR } from "./reglas";
import { ANOMALIAS, GRUPOS, TABLAS, type Anomalia, type Catalogo, type FilaCatalogoDb, type FilaHistoricoDb, type FilaNotaDb, type FilaEliminadaDb, type FilaRegistroDb, type Eliminacion, type GrupoRazon, type Nota, type Orden, type Origen, type RegistroOrden } from "./types";

// ── Catálogo («Razones»), inmutable ──

export async function cargarCatalogo(): Promise<Catalogo> {
  return leerInmutable("razones-lib:catalogo", async () => {
    const filas = await leerTabla<FilaCatalogoDb>(TABLAS.catalogo, "fila_excel, razon, valor_suelto", "fila_excel");
    const razones: string[] = [];
    const sueltas: Catalogo["sueltas"] = [];
    for (const fila of filas) {
      if (fila.razon && !razones.includes(fila.razon)) razones.push(fila.razon);
      if (fila.valor_suelto) sueltas.push({ valor: fila.valor_suelto, celda: `B${fila.fila_excel}` });
    }
    return { razones, sueltas };
  });
}

// ── Histórico («Obs»), inmutable: se lee y procesa una vez por proceso del servidor ──

async function cargarHistorico(): Promise<Orden[]> {
  return leerInmutable("razones-lib:historico", async () => {
    const [catalogo, filas] = await Promise.all([
      cargarCatalogo(),
      leerTabla<FilaHistoricoDb>(TABLAS.historico, "fila_excel, no_orden, razon, comentario, fecha_excel, originales", "fila_excel"),
    ]);
    return filas.map((fila): Orden => {
      const razon = fila.razon ?? "";
      const { fecha, texto } = leerFechaHistorico(fila.fecha_excel);
      const recortados = fila.originales ?? {};
      const razonNormalizada = normalizarRazon(razon, catalogo.razones);
      const cambioFecha = detectarCambioFecha(fila.comentario);
      return {
        noOrden: Number(fila.no_orden),
        razon,
        razonNormalizada,
        grupo: grupoRazon(razonNormalizada),
        comentario: fila.comentario,
        fechaProgramada: fecha,
        fechaTexto: texto,
        cambioFecha,
        cambioFechaFuente: cambioFecha ? "comentario" : null,
        origen: "historico",
        filaExcel: fila.fila_excel,
        anomalias: anomaliasHistorico({ razon, fechaValida: fecha, fechaTexto: texto, conEspacios: Object.keys(recortados).length > 0 }, catalogo.razones),
        originales: recortados,
        actualizado: null,
        usuario: null,
      };
    });
  });
}

// ── Órdenes eliminadas desde la app (borrado lógico): se leen en cada petición ──

async function cargarEliminadas(): Promise<Map<number, Omit<Eliminacion, "orden">>> {
  const filas = await leerTabla<FilaEliminadaDb>(TABLAS.eliminadas, "no_orden, motivo, eliminado, eliminado_por", "no_orden");
  return new Map(filas.map((fila) => [Number(fila.no_orden), { noOrden: Number(fila.no_orden), motivo: fila.motivo, eliminado: fila.eliminado, eliminadoPor: fila.eliminado_por }]));
}

// ── Registros de la plataforma: se leen en cada petición (pocas filas, cambian con cada guardado) ──

async function cargarRegistros(): Promise<RegistroOrden[]> {
  const filas = await leerTabla<FilaRegistroDb>(TABLAS.registros, "no_orden, razon, fecha_programada, cambio_fecha, comentario, creado, actualizado, actualizado_por", "no_orden");
  return filas.map((fila) => ({
    noOrden: Number(fila.no_orden),
    razon: fila.razon,
    fechaProgramada: fila.fecha_programada,
    cambioFecha: fila.cambio_fecha,
    comentario: fila.comentario,
    creado: fila.creado,
    actualizado: fila.actualizado,
    usuario: fila.actualizado_por,
  }));
}

function desdeRegistro(registro: RegistroOrden, base: Orden | undefined, catalogo: readonly string[]): Orden {
  const razonNormalizada = normalizarRazon(registro.razon, catalogo);
  return {
    noOrden: registro.noOrden,
    razon: registro.razon,
    razonNormalizada,
    grupo: grupoRazon(razonNormalizada),
    comentario: registro.comentario,
    fechaProgramada: registro.fechaProgramada,
    fechaTexto: null,
    cambioFecha: registro.cambioFecha,
    cambioFechaFuente: "formulario",
    origen: base ? "editado" : "nuevo",
    filaExcel: base?.filaExcel ?? null,
    anomalias: [],
    originales: {},
    actualizado: registro.actualizado,
    usuario: registro.usuario,
  };
}

let fusion: { historico: Orden[]; firma: string; ordenes: Orden[]; porNumero: Map<number, Orden>; eliminadas: Eliminacion[] } | null = null;

/**
 * Histórico + registros de la plataforma. La edición prevalece sobre la fila migrada (que no se toca).
 * Orden: primero lo capturado en la plataforma (más reciente arriba), luego el histórico de la última fila del Excel a la primera.
 */
export async function cargarOrdenes(): Promise<{ ordenes: Orden[]; porNumero: Map<number, Orden>; eliminadas: Eliminacion[] }> {
  const [historico, registros, eliminadas, catalogo] = await Promise.all([cargarHistorico(), cargarRegistros(), cargarEliminadas(), cargarCatalogo()]);
  const firma = `${registros.map((r) => `${r.noOrden}@${r.actualizado}`).join("|")}#${[...eliminadas.values()].map((e) => `${e.noOrden}@${e.eliminado}`).sort().join(",")}`;
  if (fusion && fusion.historico === historico && fusion.firma === firma) return fusion;

  const historicoPorNumero = new Map(historico.map((orden) => [orden.noOrden, orden]));
  const registroPorNumero = new Map(registros.map((registro) => [registro.noOrden, registro]));
  const capturadas = [...registroPorNumero.values()]
    .sort((a, b) => b.actualizado.localeCompare(a.actualizado))
    .map((registro) => desdeRegistro(registro, historicoPorNumero.get(registro.noOrden), catalogo.razones));
  const restantes = historico.filter((orden) => !registroPorNumero.has(orden.noOrden)).reverse();
  // Las eliminadas (borrado lógico) no se muestran ni cuentan en ninguna vista.
  const todas = [...capturadas, ...restantes];
  const ordenes = todas.filter((orden) => !eliminadas.has(orden.noOrden));
  const todasPorNumero = new Map(todas.map((orden) => [orden.noOrden, orden]));
  // Eliminadas con la versión vigente de la orden (editada si tenía edición), la más reciente primero.
  const eliminadasDetalle = [...eliminadas.values()]
    .map((e) => ({ ...e, orden: todasPorNumero.get(e.noOrden) ?? null }))
    .sort((a, b) => b.eliminado.localeCompare(a.eliminado));
  fusion = { historico, firma, ordenes, porNumero: new Map(ordenes.map((orden) => [orden.noOrden, orden])), eliminadas: eliminadasDetalle };
  return fusion;
}

/** Orden vigente (editada si existe edición) y, si es histórica, la fila original del Excel. */
export async function buscarOrden(noOrden: number): Promise<{ orden: Orden | null; historica: Orden | null }> {
  const [{ porNumero }, historico] = await Promise.all([cargarOrdenes(), cargarHistorico()]);
  return { orden: porNumero.get(noOrden) ?? null, historica: historico.find((orden) => orden.noOrden === noOrden) ?? null };
}

// ── Filtros ──

export type FiltrosOrdenes = {
  q: string;
  razon: string;
  grupo: string;
  fecha: "todas" | "con" | "sin";
  desde: string;
  hasta: string;
  cambio: "todos" | "si" | "no";
  comentario: "todos" | "con" | "sin";
  origen: "todos" | Origen;
  anomalia: "todas" | "con" | Anomalia;
};

export function filtrarOrdenes(ordenes: Orden[], f: FiltrosOrdenes): Orden[] {
  const q = textoComparable(f.q);
  const qNumerica = /^\d+$/.test(f.q.trim());
  return ordenes.filter((o) => {
    if (q && !((qNumerica && String(o.noOrden).includes(f.q.trim())) || (o.comentario && textoComparable(o.comentario).includes(q)))) return false;
    if (f.razon && o.razonNormalizada !== f.razon) return false;
    if (f.grupo && o.grupo !== f.grupo) return false;
    if (f.fecha === "sin" && o.fechaProgramada) return false;
    if (f.fecha !== "sin") {
      if (f.fecha === "con" && !o.fechaProgramada) return false;
      if ((f.desde || f.hasta) && !o.fechaProgramada) return false;
      if (f.desde && o.fechaProgramada! < f.desde) return false;
      if (f.hasta && o.fechaProgramada! > f.hasta) return false;
    }
    if (f.cambio === "si" && !o.cambioFecha) return false;
    if (f.cambio === "no" && o.cambioFecha) return false;
    if (f.comentario === "con" && !o.comentario) return false;
    if (f.comentario === "sin" && o.comentario) return false;
    if (f.origen !== "todos" && o.origen !== f.origen) return false;
    if (f.anomalia === "con" && o.anomalias.length === 0) return false;
    if (f.anomalia !== "todas" && f.anomalia !== "con" && !o.anomalias.includes(f.anomalia)) return false;
    return true;
  });
}

// ── Resumen (solo conteos de lo registrado) ──

export type Conteo = { etiqueta: string; valor: number };

export type Resumen = {
  total: number;
  cumple: number;
  cumpleConCambio: number;
  cumpleConCambioDetectado: number;
  noMedir: number;
  noCumplen: number;
  sinFecha: number;
  fechaAtipica: number;
  nuevos: number;
  editados: number;
  porGrupo: Conteo[];
  porRazon: Conteo[];
  porMes: Conteo[];
  conFechaEnGrafico: number;
  anomalias: Record<Anomalia, number>;
  filasConAnomalia: number;
};

export function resumir(ordenes: Orden[]): Resumen {
  const porGrupo = new Map<GrupoRazon, number>(GRUPOS.map((g) => [g, 0]));
  const porRazon = new Map<string, number>();
  const porMes = new Map<string, number>();
  const anomalias = Object.fromEntries(ANOMALIAS.map((a) => [a, 0])) as Record<Anomalia, number>;
  const r = { total: ordenes.length, cumple: 0, cumpleConCambio: 0, cumpleConCambioDetectado: 0, noMedir: 0, noCumplen: 0, sinFecha: 0, fechaAtipica: 0, nuevos: 0, editados: 0, conFechaEnGrafico: 0, filasConAnomalia: 0 };

  for (const o of ordenes) {
    if (o.origen === "nuevo") r.nuevos++;
    if (o.origen === "editado") r.editados++;
    if (o.anomalias.length) r.filasConAnomalia++;
    for (const a of o.anomalias) anomalias[a]++;
    if (cumpleLiberacion(o.razonNormalizada)) {
      r.cumple++;
      if (o.cambioFecha) {
        r.cumpleConCambio++;
        if (o.cambioFechaFuente === "comentario") r.cumpleConCambioDetectado++;
      }
    } else if (o.razonNormalizada === RAZON_NO_MEDIR) {
      r.noMedir++;
    } else {
      r.noCumplen++;
      porGrupo.set(o.grupo, (porGrupo.get(o.grupo) ?? 0) + 1);
      porRazon.set(o.razonNormalizada, (porRazon.get(o.razonNormalizada) ?? 0) + 1);
    }
    if (!o.fechaProgramada) r.sinFecha++;
    else if (o.origen === "historico" && esFechaAtipicaHistorico(o.fechaProgramada)) r.fechaAtipica++;
    else {
      const mes = o.fechaProgramada.slice(0, 7);
      porMes.set(mes, (porMes.get(mes) ?? 0) + 1);
      r.conFechaEnGrafico++;
    }
  }

  const ordenar = (mapa: Map<string, number>) => [...mapa].filter(([, valor]) => valor > 0).map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor);
  return {
    ...r,
    porGrupo: ordenar(porGrupo),
    porRazon: ordenar(porRazon),
    porMes: [...porMes].sort(([a], [b]) => a.localeCompare(b)).map(([etiqueta, valor]) => ({ etiqueta, valor })),
    anomalias,
  };
}

/** Uso de cada razón del catálogo (por razón normalizada) en las órdenes vigentes. */
export function usoPorRazon(ordenes: Orden[]): Map<string, number> {
  const uso = new Map<string, number>();
  for (const o of ordenes) uso.set(o.razonNormalizada, (uso.get(o.razonNormalizada) ?? 0) + 1);
  return uso;
}

/** Variantes fuera del catálogo con su razón normalizada y cuántas filas las usan. */
export function variantesFueraDeCatalogo(ordenes: Orden[]): { original: string; normalizada: string; filas: number }[] {
  const mapa = new Map<string, { normalizada: string; filas: number }>();
  for (const o of ordenes) {
    if (!o.anomalias.includes("razon-fuera-catalogo")) continue;
    const actual = mapa.get(o.razon) ?? { normalizada: o.razonNormalizada, filas: 0 };
    actual.filas++;
    mapa.set(o.razon, actual);
  }
  return [...mapa].map(([original, v]) => ({ original, ...v })).sort((a, b) => b.filas - a.filas);
}

// ── Notas («Hoja1», oculta) ──

export async function cargarNotas(): Promise<Nota[]> {
  const [filas, { porNumero }] = await Promise.all([
    leerInmutable("razones-lib:notas", () => leerTabla<FilaNotaDb>(TABLAS.notas, "fila_excel, codigo_op, nota", "fila_excel")),
    cargarOrdenes(),
  ]);
  return filas.flatMap((fila) => {
    if (fila.codigo_op === null) return [];
    const codigo = Number(fila.codigo_op);
    return [{ codigoOP: codigo, nota: fila.nota ?? "", filaExcel: fila.fila_excel, razonActual: porNumero.get(codigo)?.razon ?? null }];
  });
}
