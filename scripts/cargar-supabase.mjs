// Carga el histórico de un Excel ya perfilado (data/<slug>/) al schema `logistica` de Supabase.
//
// Uso:  node scripts/cargar-supabase.mjs razones-incumplimiento-lib
//
// - Lee NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de .env.local (nunca los imprime).
// - Es idempotente: hace upsert por fila_excel, así que se puede volver a correr sin duplicar.
// - No toca la tabla de registros capturados en la app.
// - Al final compara cuántas filas hay en Supabase contra el JSON del perfilador.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(path.join(raiz, ".env.local"))) process.loadEnvFile(path.join(raiz, ".env.local"));

const slug = process.argv[2];
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: clave } = process.env;
if (!url || !clave) { console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"); process.exit(1); }

const leer = (archivo) => JSON.parse(readFileSync(path.join(raiz, "data", slug, archivo), "utf8"));
const supabase = createClient(url, clave, { db: { schema: "logistica" }, auth: { persistSession: false, autoRefreshToken: false } });

// Cada módulo define cómo pasar sus hojas a sus tablas.
const modulos = {
  "razones-incumplimiento-lib": () => {
    const obs = leer("obs.json"), obsOrig = leer("obs.originales.json");
    const razones = leer("razones.json"), razonesOrig = leer("razones.originales.json");
    const notas = leer("hoja1.json"), notasOrig = leer("hoja1.originales.json");
    return [
      {
        tabla: "razones_lib_catalogo",
        filas: razones.map((f, i) => ({ fila_excel: razonesOrig.filasExcel[i], razon: f["OBSERVACIONES PLANEACIÓN"], valor_suelto: f.columna_2 })).filter((f) => f.razon || f.valor_suelto),
      },
      {
        tabla: "razones_lib_historico",
        filas: obs.flatMap((f, i) => typeof f["No Orden"] !== "number" ? [] : [{
          fila_excel: obsOrig.filasExcel[i],
          no_orden: f["No Orden"],
          razon: f["OBSERVACIONES PLANEACIÓN"],
          comentario: f.COMENTARIOS,
          fecha_excel: f.FECHA,
          originales: obsOrig.recortados[String(i)] ?? {},
        }]),
      },
      {
        tabla: "razones_lib_notas",
        filas: notas.map((f, i) => ({ fila_excel: notasOrig.filasExcel[i], codigo_op: f["Código OP"], nota: f.columna_2 })),
      },
    ];
  },
};

if (!modulos[slug]) { console.error(`Módulo desconocido: ${slug}. Disponibles: ${Object.keys(modulos).join(", ")}`); process.exit(1); }

let fallo = false;
for (const { tabla, filas } of modulos[slug]()) {
  for (let i = 0; i < filas.length; i += 1000) {
    const { error } = await supabase.from(tabla).upsert(filas.slice(i, i + 1000), { onConflict: "fila_excel" });
    if (error) { console.error(`✗ ${tabla} (lote desde ${i}): ${error.code ?? ""} ${error.message}`); fallo = true; break; }
  }
  // Solo filas que vienen del Excel (las agregadas desde la plataforma no tienen fila_excel).
  const { count, error } = await supabase.from(tabla).select("*", { count: "exact", head: true }).not("fila_excel", "is", null);
  if (error) { console.error(`✗ ${tabla}: no se pudo contar (${error.message})`); fallo = true; continue; }
  console.log(`${count === filas.length ? "✓" : "✗"} ${tabla}: ${count} en Supabase / ${filas.length} en el Excel`);
  if (count !== filas.length) fallo = true;
}
process.exit(fallo ? 1 : 0);
