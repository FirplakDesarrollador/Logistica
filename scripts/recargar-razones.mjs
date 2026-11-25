// Recarga automática del Excel «Razones incumplimiento lib.xlsx» a Supabase (mientras Logística siga usando el Excel).
//
// Uso:  node scripts/recargar-razones.mjs
// Programado en el Programador de tareas de Windows del equipo del desarrollador (lunes a viernes 16:30);
// ver llm-wiki/log.md (2026-11-24). Escribe su bitácora en logs/recarga-razones.log.
//
// Pasos: traer-excel (desde OneDrive) → si cambió, excel-a-json → verificación → cargar-supabase.
// La verificación protege la carga, que hace upsert por fila del Excel: solo carga si las filas que ya existían
// siguen en su posición con la misma OP (pueden estar editadas) y las nuevas van al final, sin OP repetidas.
// Si Logística reordena, borra filas o repite una OP, no carga nada, restaura el perfil anterior y lo anota.
// Supabase envía después las razones al portal de Indicadores por su cuenta (job liberacion-enviar-razones).

import { appendFileSync, copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = "razones-incumplimiento-lib";
const rutaSharePoint = "07. PLANEACIÓN DE PXN Y ABASTECIMIENTO PTC/1. PLANEACIÓN DE PRODUCCIÓN/Razones incumplimiento lib.xlsx";
const datos = path.join(raiz, "data", slug);
const origenes = path.join(raiz, "excels-origen", slug);
const respaldo = path.join(raiz, ".cache", `${slug}-perfil-anterior`);
const bitacora = path.join(raiz, "logs", "recarga-razones.log");
const copiasQueSeGuardan = 10;

mkdirSync(path.dirname(bitacora), { recursive: true });
const anotar = (texto) => {
  const linea = `[${new Date().toLocaleString("sv-SE", { timeZone: "America/Bogota" })}] ${texto}`;
  console.log(linea);
  appendFileSync(bitacora, `${linea}\n`);
};

const correr = (script, args) => execFileSync(process.execPath, [path.join(raiz, "scripts", script), ...args], { cwd: raiz, encoding: "utf8" });

// Filas de la hoja «Obs» del perfil: número de fila del Excel, OP, razón, comentario y fecha.
export function leerObs(carpeta) {
  const obs = JSON.parse(readFileSync(path.join(carpeta, "obs.json"), "utf8"));
  const { filasExcel } = JSON.parse(readFileSync(path.join(carpeta, "obs.originales.json"), "utf8"));
  return obs.map((fila, i) => ({ fila: filasExcel[i], op: fila["No Orden"], datos: JSON.stringify(fila) }));
}

export function verificar(anteriores, nuevas) {
  const porFila = new Map(nuevas.map((f) => [f.fila, f]));
  const problemas = [];
  let editadas = 0;
  for (const anterior of anteriores) {
    const nueva = porFila.get(anterior.fila);
    if (!nueva) problemas.push(`la fila ${anterior.fila} (OP ${anterior.op}) ya no está`);
    else if (nueva.op !== anterior.op) problemas.push(`la fila ${anterior.fila} cambió de OP (${anterior.op} → ${nueva.op})`);
    else if (nueva.datos !== anterior.datos) editadas++;
    if (problemas.length >= 5) break;
  }
  const filasAnteriores = new Set(anteriores.map((f) => f.fila));
  const agregadas = nuevas.filter((f) => !filasAnteriores.has(f.fila)).length;
  const ops = new Set(nuevas.map((f) => f.op));
  if (ops.size !== nuevas.length) problemas.push(`${nuevas.length - ops.size} OP repetidas`);
  return { problemas, editadas, agregadas };
}

// Conserva las últimas copias fechadas que deja traer-excel; nunca toca el archivo original sin fecha.
function podarCopias() {
  const copias = readdirSync(origenes)
    .filter((n) => /^Razones incumplimiento lib \(\d{4}-\d{2}-\d{2}\)(?: \(\d+\))?\.xlsx$/.test(n))
    .map((n) => ({ n, t: statSync(path.join(origenes, n)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const { n } of copias.slice(copiasQueSeGuardan)) rmSync(path.join(origenes, n));
}

// Solo corre al ejecutarse como script (las pruebas importan leerObs y verificar).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) try {
  const traido = correr("traer-excel.mjs", [slug, rutaSharePoint]);
  if (traido.includes("Sin cambios")) {
    anotar("Sin cambios en el Excel; no se recarga.");
    process.exit(0);
  }
  const { archivo, modificado } = JSON.parse(readFileSync(path.join(origenes, "origen.json"), "utf8"));

  mkdirSync(respaldo, { recursive: true });
  for (const n of readdirSync(datos)) copyFileSync(path.join(datos, n), path.join(respaldo, n));
  const anteriores = leerObs(respaldo);

  correr("excel-a-json.mjs", [path.join("excels-origen", slug, archivo), slug]);
  const nuevas = leerObs(datos);
  const { problemas, editadas, agregadas } = verificar(anteriores, nuevas);

  if (problemas.length) {
    for (const n of readdirSync(respaldo)) copyFileSync(path.join(respaldo, n), path.join(datos, n));
    anotar(`NO SE CARGÓ «${archivo}» (modificado ${modificado}): ${problemas.join("; ")}. Revisar el Excel y cargar a mano.`);
    process.exit(2);
  }

  const carga = correr("cargar-supabase.mjs", [slug]).trim().split("\n").join(" | ");
  anotar(`Cargado «${archivo}» (modificado ${modificado}): ${agregadas} filas nuevas, ${editadas} editadas. ${carga}`);
  podarCopias();
} catch (error) {
  anotar(`ERROR: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`);
  process.exit(1);
}
