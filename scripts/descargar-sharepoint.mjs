// Descarga un Excel de SharePoint/OneDrive a excels-origen/<slug>/ con la sesión de Microsoft del desarrollador.
//
// Uso:
//   node scripts/descargar-sharepoint.mjs <slug> "<URL de SharePoint del archivo>"
//   node scripts/descargar-sharepoint.mjs <slug> "file:///<driveId>/<itemId>"     (URI del conector de Microsoft 365)
//   node scripts/descargar-sharepoint.mjs --olvidar                                 (borra la sesión guardada)
//
// - Flujo de código de dispositivo (Microsoft Entra, permiso delegado Files.Read.All): el script muestra un código,
//   el desarrollador lo aprueba en https://microsoft.com/devicelogin y el archivo se baja con SUS permisos.
//   (más Sites.Read.All, necesario para bibliotecas de sitios de SharePoint). No hay secreto de aplicación. Lee ENTRA_CLIENT_ID y ENTRA_TENANT_ID de .env.local.
// - Guarda la sesión (refresh token) en .cache/graph-token.json (fuera de git) para no pedir el código cada vez.
// - Junto al Excel escribe origen.json con la URL, fecha de modificación, tamaño y versión del archivo en SharePoint.
// - Nunca sobrescribe un Excel ya descargado: si existe, guarda la nueva versión con la fecha en el nombre.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(path.join(raiz, ".env.local"))) process.loadEnvFile(path.join(raiz, ".env.local"));

const archivoToken = path.join(raiz, ".cache", "graph-token.json");
const SCOPES = "Files.Read.All Sites.Read.All offline_access";
const GRAPH = "https://graph.microsoft.com/v1.0";

if (process.argv[2] === "--olvidar") {
  rmSync(archivoToken, { force: true });
  console.log("Sesión de Microsoft borrada.");
  process.exit(0);
}

const [, , slug, origen] = process.argv;
const { ENTRA_CLIENT_ID: clientId, ENTRA_TENANT_ID: tenantId } = process.env;
if (!slug || !origen) { console.error('Uso: node scripts/descargar-sharepoint.mjs <slug> "<URL o file:///driveId/itemId>"'); process.exit(1); }
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) { console.error("El slug debe ir en minúsculas con guiones, p. ej. despachos-nacionales"); process.exit(1); }
if (!clientId || !tenantId) { console.error("Faltan ENTRA_CLIENT_ID o ENTRA_TENANT_ID en .env.local"); process.exit(1); }

const urlToken = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
const form = (datos) => new URLSearchParams({ client_id: clientId, ...datos });

async function tokenGuardado() {
  if (!existsSync(archivoToken)) return null;
  const { refresh_token } = JSON.parse(readFileSync(archivoToken, "utf8"));
  const r = await fetch(urlToken, { method: "POST", body: form({ grant_type: "refresh_token", refresh_token, scope: SCOPES }) });
  if (!r.ok) { rmSync(archivoToken, { force: true }); return null; }
  return guardar(await r.json());
}

function guardar(respuesta) {
  mkdirSync(path.dirname(archivoToken), { recursive: true });
  writeFileSync(archivoToken, JSON.stringify({ refresh_token: respuesta.refresh_token }), { mode: 0o600 });
  return respuesta.access_token;
}

async function tokenConCodigo() {
  const r = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/devicecode`, { method: "POST", body: form({ scope: SCOPES }) });
  const codigo = await r.json();
  if (!r.ok) throw new Error(`Microsoft rechazó la solicitud: ${codigo.error_description ?? codigo.error}`);
  console.log(`\n>>> Abre ${codigo.verification_uri} e ingresa el código: ${codigo.user_code}`);
  console.log(`>>> (vence en ${Math.round(codigo.expires_in / 60)} minutos)\n`);
  const fin = Date.now() + codigo.expires_in * 1000;
  let espera = (codigo.interval ?? 5) * 1000;
  while (Date.now() < fin) {
    await new Promise((listo) => setTimeout(listo, espera));
    const t = await fetch(urlToken, { method: "POST", body: form({ grant_type: "urn:ietf:params:oauth:grant-type:device_code", device_code: codigo.device_code }) });
    const datos = await t.json();
    if (t.ok) return guardar(datos);
    if (datos.error === "slow_down") espera += 5000;
    else if (datos.error !== "authorization_pending") throw new Error(`No se completó el inicio de sesión: ${datos.error_description ?? datos.error}`);
  }
  throw new Error("El código venció sin aprobarse. Vuelve a correr el script.");
}

function rutaGraph(valor) {
  const uri = valor.match(/^file:\/\/\/([^/]+)\/([^/?#]+)$/);
  if (uri) return `/drives/${uri[1]}/items/${uri[2]}`;
  if (/^https:\/\//.test(valor)) return `/shares/u!${Buffer.from(valor).toString("base64url")}/driveItem`;
  throw new Error("El origen debe ser una URL https de SharePoint o una URI file:///driveId/itemId");
}

const token = (await tokenGuardado()) ?? (await tokenConCodigo());
const cabeceras = { Authorization: `Bearer ${token}` };

const meta = await fetch(`${GRAPH}${rutaGraph(origen)}?$select=id,name,size,webUrl,lastModifiedDateTime,eTag,file,parentReference,lastModifiedBy`, { headers: cabeceras });
const item = await meta.json();
if (!meta.ok) { console.error(`No se pudo leer el archivo (${meta.status}): ${item.error?.message ?? ""}`); process.exit(1); }
if (!item.file) { console.error(`«${item.name}» no es un archivo (¿es una carpeta?).`); process.exit(1); }
if (!/\.(xlsx|xlsm|xls)$/i.test(item.name)) { console.error(`«${item.name}» no es un Excel.`); process.exit(1); }

const contenido = await fetch(`${GRAPH}/drives/${item.parentReference.driveId}/items/${item.id}/content`, { headers: cabeceras });
if (!contenido.ok) { console.error(`No se pudo descargar (${contenido.status}).`); process.exit(1); }
const bytes = Buffer.from(await contenido.arrayBuffer());

const carpeta = path.join(raiz, "excels-origen", slug);
mkdirSync(carpeta, { recursive: true });
let destino = path.join(carpeta, item.name);
if (existsSync(destino)) {
  const fecha = item.lastModifiedDateTime.slice(0, 10);
  destino = path.join(carpeta, item.name.replace(/(\.[^.]+)$/, ` (${fecha})$1`));
}
writeFileSync(destino, bytes);
writeFileSync(path.join(carpeta, "origen.json"), JSON.stringify({
  archivo: path.basename(destino),
  webUrl: item.webUrl,
  driveId: item.parentReference.driveId,
  itemId: item.id,
  modificado: item.lastModifiedDateTime,
  tamanoBytes: item.size,
  eTag: item.eTag,
  descargado: new Date().toISOString(),
}, null, 2));

console.log(`✓ ${item.name} (${(item.size / 1024 / 1024).toFixed(1)} MB, modificado ${item.lastModifiedDateTime})`);
console.log(`  → ${path.relative(raiz, destino)}`);
console.log(`  Siguiente paso: npm run excel:perfil -- "${path.relative(raiz, destino).split(path.sep).join("/")}" ${slug}`);
