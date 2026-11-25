// Trae un Excel desde la biblioteca de SharePoint de Logística sincronizada con OneDrive (solo lectura).
//
// Uso:  npm run excel:traer -- <slug> "<ruta dentro de LOGISTICA - Documentos>"
//   p. ej. npm run excel:traer -- razones-incumplimiento-lib "07. PLANEACIÓN DE PXN Y ABASTECIMIENTO PTC/1. PLANEACIÓN DE PRODUCCIÓN/Razones incumplimiento lib.xlsx"
//
// - La carpeta base sale de LOGISTICA_ONEDRIVE en .env.local o, si no está, de la ruta estándar de OneDrive de Firplak.
// - Nunca escribe en OneDrive. Copia a excels-origen/<slug>/ y no pisa una copia anterior: si cambió, guarda la nueva con la fecha.
// - Escribe origen.json con la ruta en SharePoint, fecha de modificación, tamaño y huella SHA-256 (para saber si cambió).
// - Si el archivo está "solo en la nube", OneDrive lo descarga al leerlo.

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(path.join(raiz, ".env.local"))) process.loadEnvFile(path.join(raiz, ".env.local"));

const base = process.env.LOGISTICA_ONEDRIVE || path.join(os.homedir(), "OneDrive - FIRPLAK SA", "LOGISTICA - Documentos");
const [, , slug, relativa] = process.argv;

if (!slug || !relativa) { console.error('Uso: npm run excel:traer -- <slug> "<ruta dentro de LOGISTICA - Documentos>"'); process.exit(1); }
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) { console.error("El slug debe ir en minúsculas con guiones, p. ej. despachos-nacionales"); process.exit(1); }
if (!existsSync(base)) { console.error(`No encuentro la biblioteca sincronizada en: ${base}\nAgrega el acceso directo de «LOGISTICA - Documentos» a OneDrive o define LOGISTICA_ONEDRIVE en .env.local.`); process.exit(1); }

const origen = path.resolve(base, relativa);
if (!origen.startsWith(path.resolve(base))) { console.error("La ruta debe estar dentro de la biblioteca de Logística."); process.exit(1); }
if (!existsSync(origen) || !statSync(origen).isFile()) { console.error(`No existe el archivo: ${relativa}`); process.exit(1); }
if (!/\.(xlsx|xlsm|xls)$/i.test(origen)) { console.error("El archivo no es un Excel."); process.exit(1); }

const huella = (archivo) => createHash("sha256").update(readFileSync(archivo)).digest("hex");
const info = statSync(origen);
const sha = huella(origen);

const carpeta = path.join(raiz, "excels-origen", slug);
mkdirSync(carpeta, { recursive: true });

// ¿Ya tenemos esta misma versión (cualquier copia con la misma huella)?
const igual = readdirSync(carpeta).filter((n) => /\.(xlsx|xlsm|xls)$/i.test(n)).find((n) => huella(path.join(carpeta, n)) === sha);
let destino = path.join(carpeta, igual ?? path.basename(origen));
if (!igual) {
  if (existsSync(destino)) destino = path.join(carpeta, path.basename(origen).replace(/(\.[^.]+)$/, ` (${info.mtime.toISOString().slice(0, 10)})$1`));
  copyFileSync(origen, destino);
}

writeFileSync(path.join(carpeta, "origen.json"), JSON.stringify({
  archivo: path.basename(destino),
  sharepoint: `LOGISTICA - Documentos/${relativa.split(path.sep).join("/")}`,
  modificado: info.mtime.toISOString(),
  tamanoBytes: info.size,
  sha256: sha,
  traido: new Date().toISOString(),
}, null, 2));

const rel = path.relative(raiz, destino).split(path.sep).join("/");
console.log(igual ? `= Sin cambios: la versión de OneDrive ya estaba en ${rel}` : `✓ Copiado: ${rel}`);
console.log(`  Modificado en SharePoint: ${info.mtime.toLocaleString("es-CO", { timeZone: "America/Bogota" })} · ${(info.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Siguiente paso: npm run excel:perfil -- "${rel}" ${slug}`);
