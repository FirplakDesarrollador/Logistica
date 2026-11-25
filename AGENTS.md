# Instrucciones para agentes de IA

App de Logística Firplak: migra Excel manuales a módulos web (formulario + vistas). Datos y login en Supabase: proyecto Manufactura, schema `logistica`, Microsoft 365 solo @firplak.com (ver `llm-wiki/decisiones/ADR-002-supabase-manufactura.md`). Toda tabla nueva va en `supabase/migrations/` y con RLS.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Antes de trabajar

1. Lee [`llm-wiki/index.md`](llm-wiki/index.md) y abre solo las páginas relacionadas con la tarea.
2. **Para migrar un Excel**, usa el agente [`migrador-excel`](.claude/agents/migrador-excel.md) y la skill [`migrar-excel`](.claude/skills/migrar-excel/SKILL.md). Lee siempre el [playbook](llm-wiki/playbook-migracion.md) y las [lecciones](llm-wiki/lecciones.md) antes de empezar.
3. **Para cualquier pantalla**, aplica el agente [`disenador-firplak`](.claude/agents/disenador-firplak.md) y el [manual de identidad web](docs/manual-identidad-web.md).
4. Comprueba el código real antes de afirmar que algo existe.

## Fuentes de verdad

1. Código ejecutable y scripts.
2. Perfil generado (`data/<slug>/perfil.md`) y el Excel original.
3. Fichas y páginas de `llm-wiki/`, que enlazan a la evidencia.

## Reglas

- El Excel original (`excels-origen/`) es inmutable y no se versiona.
- Nada de datos, KPIs, metas ni tendencias inventadas.
- Sin datos personales ni valores sensibles en la wiki.
- Documentación en español; nombres de código conservan su forma.
- Toda decisión que cambie comportamiento va a la ficha y a `llm-wiki/log.md`.
- Verificación: `npm run lint` y `npm run build` sin errores.
