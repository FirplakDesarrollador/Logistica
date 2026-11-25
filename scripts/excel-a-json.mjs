// Perfila un Excel y lo convierte a JSON para la demo (paso 2 del playbook de migración).
//
// Uso:  npm run excel:perfil -- excels-origen/<slug>/<archivo>.xlsx <slug> [--encabezado Hoja=fila ...]
//
// Genera en data/<slug>/:
//   - <hoja>.json  filas de cada hoja, con las claves del encabezado detectado
//   - <hoja>.originales.json  fila real del Excel de cada fila + textos originales que se recortaron
//   - perfil.json  estructura completa (hojas, columnas, tipos, vacíos, fórmulas, combinadas)
//   - perfil.md    resumen legible para pegar en la ficha llm-wiki/excels/<slug>.md
//                  (incluye "Salud del archivo": tamaño, estilos, tablas, validaciones)
//
// El Excel original nunca se modifica. Si la detección de encabezado falla en una hoja,
// pásalo a mano: --encabezado "Despachos=3" (fila 1-based del Excel).

import * as fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

XLSX.set_fs(fs);

const [, , archivo, slug, ...resto] = process.argv;
if (!archivo || !slug) {
  console.error("Uso: npm run excel:perfil -- <ruta.xlsx> <slug> [--encabezado Hoja=fila]");
  process.exit(1);
}

const encabezadosManuales = {};
for (let i = 0; i < resto.length; i++) {
  if (resto[i] === "--encabezado" && resto[i + 1]) {
    const [hoja, fila] = resto[i + 1].split("=");
    encabezadosManuales[hoja] = Number(fila) - 1;
    i++;
  }
}

const slugify = (texto) => String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "hoja";
const claveColumna = (texto, indice) => {
  const limpio = String(texto ?? "").replace(/\s+/g, " ").trim();
  return limpio || `columna_${indice + 1}`;
};

const libro = XLSX.readFile(archivo, { cellDates: true, cellFormula: true, cellNF: true, cellStyles: false });
const salida = path.join("data", slug);
fs.mkdirSync(salida, { recursive: true });

// Encabezado = la fila (entre las 20 primeras) con más celdas de texto no vacías.
function detectarEncabezado(matriz) {
  let mejor = 0;
  let mejorPuntaje = -1;
  matriz.slice(0, 20).forEach((fila, indice) => {
    const textos = fila.filter((celda) => typeof celda === "string" && celda.trim() !== "").length;
    if (textos > mejorPuntaje) { mejorPuntaje = textos; mejor = indice; }
  });
  return mejor;
}

// Matriz fila × columna con el valor real de cada celda; índice 0 = fila 1 y columna A del Excel.
// No se usa sheet_to_json: con formato de fecha en la celda convierte textos a Date y produce
// "Invalid Date" (p. ej. el encabezado "FECHA" o un texto "09/12/20214"). Aquí un texto sigue siendo
// texto, para que el perfil lo muestre como tipo mixto. Lección: "Fechas escritas como texto".
function matrizDe(hoja, rango) {
  const { e } = XLSX.utils.decode_range(rango);
  const matriz = Array.from({ length: e.r + 1 }, () => Array(e.c + 1).fill(null));
  for (const ref of Object.keys(hoja)) {
    if (ref.startsWith("!")) continue;
    const celda = hoja[ref];
    const { r, c } = XLSX.utils.decode_cell(ref);
    if (r > e.r || c > e.c) continue;
    if (celda.t === "e") matriz[r][c] = celda.w ?? "#ERROR";
    else if (celda.v instanceof Date && Number.isNaN(celda.v.getTime())) matriz[r][c] = celda.w ?? null;
    else matriz[r][c] = celda.v ?? null;
  }
  return matriz;
}

function tipoDe(valor) {
  if (valor === null || valor === undefined || valor === "") return "vacio";
  if (valor instanceof Date) return "fecha";
  if (typeof valor === "number") return "numero";
  if (typeof valor === "boolean") return "booleano";
  return "texto";
}

function normalizar(valor) {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor.toISOString().slice(0, 10);
  if (typeof valor === "string") return valor.trim() === "" ? null : valor.trim();
  return valor ?? null;
}

const perfil = { archivo: path.basename(archivo), slug, generado: new Date().toISOString(), hojas: [] };

for (const nombre of libro.SheetNames) {
  const hoja = libro.Sheets[nombre];
  const info = libro.Workbook?.Sheets?.find((s) => s.name === nombre);
  const rango = hoja["!ref"] ?? "A1";
  const matriz = matrizDe(hoja, rango);

  const celdas = Object.keys(hoja).filter((k) => !k.startsWith("!"));
  const formulas = celdas.filter((k) => hoja[k].f);
  const combinadas = (hoja["!merges"] ?? []).map((m) => XLSX.utils.encode_range(m));

  const filaEncabezado = encabezadosManuales[nombre] ?? detectarEncabezado(matriz);
  const encabezado = (matriz[filaEncabezado] ?? []).map(claveColumna);
  const vistas = new Map();
  const claves = encabezado.map((clave) => {
    const n = (vistas.get(clave) ?? 0) + 1;
    vistas.set(clave, n);
    return n > 1 ? `${clave} (${n})` : clave;
  });

  // Se conserva el número de fila real del Excel de cada fila de datos (trazabilidad en la app).
  const conFila = matriz.map((fila, indice) => ({ fila, filaExcel: indice + 1 })).slice(filaEncabezado + 1).filter(({ fila }) => fila.some((c) => c !== null && c !== ""));
  const cuerpo = conFila.map(({ fila }) => fila);
  const filas = cuerpo.map((fila) => Object.fromEntries(claves.map((clave, i) => [clave, normalizar(fila[i])])));

  const columnas = claves.map((clave, i) => {
    const valores = cuerpo.map((fila) => fila[i]);
    const conteo = {};
    for (const v of valores) { const t = tipoDe(v); conteo[t] = (conteo[t] ?? 0) + 1; }
    const noVacios = valores.filter((v) => tipoDe(v) !== "vacio");
    const tipos = Object.keys(conteo).filter((t) => t !== "vacio");
    const distintos = new Set(noVacios.map((v) => String(normalizar(v))));
    const numeros = noVacios.filter((v) => typeof v === "number");
    const letra = XLSX.utils.encode_col(i);
    // En columnas de tipo mixto, muestra los valores del tipo minoritario (p. ej. fechas escritas como texto).
    const mayoritario = tipos.sort((a, b) => conteo[b] - conteo[a])[0];
    const minoritarios = tipos.length > 1 ? [...new Set(noVacios.filter((v) => tipoDe(v) !== mayoritario).map((v) => JSON.stringify(v)))].slice(0, 5) : [];
    return {
      columna: clave,
      letra,
      tipo: tipos.length === 0 ? "vacia" : tipos.length === 1 ? tipos[0] : `mixto (${tipos.join(", ")})`,
      vaciosPct: valores.length ? Math.round(((conteo.vacio ?? 0) / valores.length) * 1000) / 10 : 0,
      distintos: distintos.size,
      ejemplos: [...distintos].slice(0, 5),
      ...(numeros.length ? { min: Math.min(...numeros), max: Math.max(...numeros), suma: numeros.reduce((a, b) => a + b, 0) } : {}),
      formulas: formulas.filter((ref) => ref.replace(/\d+/g, "") === letra).length,
      ...(minoritarios.length ? { atipicos: `${noVacios.filter((v) => tipoDe(v) !== mayoritario).length} de tipo distinto a ${mayoritario}: ${minoritarios.join(" · ")}` } : {}),
    };
  });

  const archivoHoja = `${slugify(nombre)}.json`;
  fs.writeFileSync(path.join(salida, archivoHoja), JSON.stringify(filas, null, 1));

  // Sidecar <hoja>.originales.json: fila real del Excel de cada fila y los textos que normalizar() cambió
  // (espacios al inicio/final o celdas con solo espacios). Así la app puede mostrar el valor original
  // y marcarlo sin que el JSON principal deje de estar limpio. Lección: "Espacios al inicio o al final".
  const recortados = {};
  cuerpo.forEach((fila, indice) => claves.forEach((clave, i) => {
    const valor = fila[i];
    if (typeof valor === "string" && valor !== valor.trim()) (recortados[indice] ??= {})[clave] = valor;
  }));
  fs.writeFileSync(path.join(salida, archivoHoja.replace(/.json$/, ".originales.json")), JSON.stringify({ filasExcel: conFila.map(({ filaExcel }) => filaExcel), recortados }));

  perfil.hojas.push({
    nombre,
    archivo: archivoHoja,
    oculta: Boolean(info?.Hidden),
    rango,
    filaEncabezado: filaEncabezado + 1,
    filas: filas.length,
    totalFormulas: formulas.length,
    ejemplosFormulas: formulas.slice(0, 8).map((ref) => ({ celda: ref, formula: `=${hoja[ref].f}` })),
    celdasCombinadas: combinadas.slice(0, 20),
    totalCombinadas: combinadas.length,
    columnas,
  });
}

// Salud del archivo: lee el .xlsx como zip (solo lectura) para delatar lo que lo hace lento.
// Lección: "Estilos de celda inflados" (62.492 estilos en razones-incumplimiento-lib).
function saludDelArchivo() {
  const salud = { tamanoMB: Math.round((fs.statSync(archivo).size / 1048576) * 10) / 10, partesGrandes: [], tablas: [], nombresDefinidos: [], validaciones: [], formatosCondicionales: 0 };
  try {
    const zip = XLSX.CFB.read(fs.readFileSync(archivo), { type: "buffer" });
    const texto = (i) => Buffer.from(zip.FileIndex[i].content ?? []).toString("utf8");
    zip.FullPaths.forEach((ruta, i) => {
      const parte = ruta.replace(/^Root Entry\//, "");
      const tamano = zip.FileIndex[i].size ?? 0;
      if (tamano > 1048576) salud.partesGrandes.push({ parte, MB: Math.round((tamano / 1048576) * 10) / 10 });
      if (parte === "xl/styles.xml") {
        const xml = texto(i);
        salud.estilosCelda = Number(xml.match(/<cellStyleXfs count="(\d+)"/)?.[1] ?? 0);
        salud.formatosCelda = Number(xml.match(/<cellXfs count="(\d+)"/)?.[1] ?? 0);
      }
      if (/^xl\/tables\/table\d+\.xml$/.test(parte)) {
        const xml = texto(i);
        salud.tablas.push({ nombre: xml.match(/ displayName="([^"]+)"/)?.[1], rango: xml.match(/ ref="([^"]+)"/)?.[1], filtroGuardado: /<filterColumn/.test(xml) });
      }
      if (parte === "xl/workbook.xml") {
        salud.nombresDefinidos = [...texto(i).matchAll(/<definedName name="([^"]+)"[^>]*>([^<]*)</g)].map((m) => `${m[1]} = ${m[2]}`);
      }
      if (/^xl\/worksheets\/sheet\d+\.xml$/.test(parte)) {
        const xml = texto(i);
        for (const m of xml.matchAll(/<dataValidation [^>]*type="(\w+)"[^>]*sqref="([^"]+)"[^>]*>\s*<formula1>([^<]*)</g)) {
          salud.validaciones.push({ parte, tipo: m[1], celdas: m[2].split(" ").length > 3 ? `${m[2].split(" ").slice(0, 3).join(" ")} …` : m[2], origen: m[3] });
        }
        salud.formatosCondicionales += (xml.match(/<cfRule /g) ?? []).length;
      }
    });
  } catch (error) {
    salud.error = String(error.message ?? error);
  }
  return salud;
}
perfil.salud = saludDelArchivo();

fs.writeFileSync(path.join(salida, "perfil.json"), JSON.stringify(perfil, null, 2));

const md = [
  `# Perfil de ${perfil.archivo}`,
  "",
  `Generado: ${perfil.generado} · Hojas: ${perfil.hojas.length}`,
  "",
  "## Salud del archivo",
  "",
  `- Tamaño: ${perfil.salud.tamanoMB} MB${perfil.salud.error ? ` (no se pudo inspeccionar por dentro: ${perfil.salud.error})` : ""}`,
  ...(perfil.salud.estilosCelda !== undefined ? [`- Estilos de celda: ${perfil.salud.estilosCelda} · formatos de celda: ${perfil.salud.formatosCelda}${perfil.salud.estilosCelda > 1000 ? " **(inflado: causa típica de lentitud)**" : ""}`] : []),
  ...(perfil.salud.partesGrandes.length ? [`- Partes internas > 1 MB: ${perfil.salud.partesGrandes.map((p) => `${p.parte} (${p.MB} MB)`).join(" · ")}`] : []),
  ...(perfil.salud.tablas.length ? [`- Tablas: ${perfil.salud.tablas.map((t) => `${t.nombre} ${t.rango}${t.filtroGuardado ? " (con filtro guardado)" : ""}`).join(" · ")}`] : []),
  ...(perfil.salud.nombresDefinidos.length ? [`- Nombres definidos: ${perfil.salud.nombresDefinidos.join(" · ")}`] : []),
  ...(perfil.salud.validaciones.length ? [`- Validaciones: ${perfil.salud.validaciones.map((v) => `${v.tipo} en ${v.celdas} desde ${v.origen}`).join(" · ")}`] : []),
  `- Reglas de formato condicional: ${perfil.salud.formatosCondicionales}`,
  "",
  ...perfil.hojas.flatMap((h) => [
    `## Hoja «${h.nombre}»${h.oculta ? " (oculta)" : ""}`,
    "",
    `Rango ${h.rango} · encabezado en la fila ${h.filaEncabezado} · ${h.filas} filas de datos · ${h.totalFormulas} fórmulas · ${h.totalCombinadas} rangos combinados`,
    "",
    "| Col | Columna | Tipo | % vacíos | Distintos | Ejemplos | Fórmulas |",
    "|---|---|---|---|---|---|---|",
    ...h.columnas.map((c) => `| ${c.letra} | ${c.columna} | ${c.tipo} | ${c.vaciosPct} | ${c.distintos} | ${c.ejemplos.map((e) => String(e).slice(0, 30)).join(" · ")} | ${c.formulas} |`),
    "",
    ...(h.columnas.some((c) => c.atipicos) ? ["Valores atípicos en columnas mixtas:", "", ...h.columnas.filter((c) => c.atipicos).map((c) => `- ${c.letra} ${c.columna}: ${c.atipicos}`), ""] : []),
    ...(h.ejemplosFormulas.length ? ["Fórmulas de ejemplo:", "", ...h.ejemplosFormulas.map((f) => `- \`${f.celda}\`: \`${f.formula}\``), ""] : []),
  ]),
].join("\n");
fs.writeFileSync(path.join(salida, "perfil.md"), md);

console.log(`Listo: ${perfil.hojas.length} hojas en ${salida}/`);
for (const h of perfil.hojas) console.log(`  - ${h.nombre}: ${h.filas} filas, ${h.columnas.length} columnas, encabezado fila ${h.filaEncabezado}${h.oculta ? " (oculta)" : ""}`);
