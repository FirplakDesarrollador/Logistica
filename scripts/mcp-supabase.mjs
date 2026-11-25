// Lanzador del MCP de Supabase para Claude Code (.mcp.json).
// Lee SUPABASE_ACCESS_TOKEN y SUPABASE_PROJECT_REF de .env.local, para que el token
// no quede escrito en .mcp.json ni en la conversación. El servidor queda limitado
// a un solo proyecto (--project-ref): no ve los demás proyectos de la organización.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archivoEnv = path.join(raiz, ".env.local");
if (existsSync(archivoEnv)) process.loadEnvFile(archivoEnv);

const { SUPABASE_ACCESS_TOKEN: token, SUPABASE_PROJECT_REF: proyecto } = process.env;
if (!token || !proyecto) {
  console.error("[mcp-supabase] Falta SUPABASE_ACCESS_TOKEN o SUPABASE_PROJECT_REF en .env.local");
  process.exit(1);
}

if (!/^[a-z0-9]+$/.test(proyecto)) {
  console.error("[mcp-supabase] SUPABASE_PROJECT_REF no tiene el formato esperado (solo letras minúsculas y números)");
  process.exit(1);
}

// En Windows npx es un .cmd y necesita shell; el comando va completo (el ref ya se validó arriba).
const comando = `npx -y @supabase/mcp-server-supabase@latest --project-ref=${proyecto}`;
const hijo = spawn(comando, { stdio: "inherit", shell: true, env: { ...process.env, SUPABASE_ACCESS_TOKEN: token } });
hijo.on("exit", (codigo) => process.exit(codigo ?? 0));
