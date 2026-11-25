---
status: active
updated: 2026-11-06
sources:
  - ../README.md
  - ../package.json
---

# Índice de la wiki de Logística

## Propósito

App de demostración para convencer a dirección de migrar los Excel que Logística actualiza a mano (lentos, que se saturan) a una plataforma web. En esta etapa **no hay base de datos**: cada Excel se convierte a JSON y la app lo consulta. Ver [ADR-001](decisiones/ADR-001-demo-sin-base-de-datos.md).

## Mapa del sistema

```text
Excel original (excels-origen/<slug>/, inmutable, no versionado)
  │ npm run excel:perfil
  ▼
data/<slug>/*.json + perfil.md
  │ src/lib/datos.ts (único punto que cambia al conectar una base de datos)
  ▼
Next.js 16 (Server Components) ─ src/app/<slug>/ ─ login demo (cookie) + proxy.ts
```

## Páginas

### Proceso de migración (el corazón de la wiki)

- [Playbook de migración](playbook-migracion.md): el paso a paso vivo. Se mejora después de cada Excel.
- [Lecciones](lecciones.md): problemas de Excel y patrones de diseño encontrados, con frecuencia y solución.
- [Log](log.md): bitácora cronológica.

### Fichas de Excel migrados

Cada Excel tiene su ficha en `excels/<slug>.md` ([plantilla](../.claude/skills/migrar-excel/plantilla-ficha-excel.md)).

| Excel | Slug | Fase | Estado |
|---|---|---|---|
| [Razones incumplimiento lib.xlsx](excels/razones-incumplimiento-lib.md) | `razones-incumplimiento-lib` | 4 (módulo construido; falta conciliación) | en-migracion |

### Arquitectura y decisiones

- [Arquitectura](arquitectura.md): stack, carpetas y de dónde viene cada pieza.
- [ADR-001: demo sin base de datos](decisiones/ADR-001-demo-sin-base-de-datos.md) (reemplazada).
- [ADR-002: Supabase Manufactura, schema logistica y Microsoft 365](decisiones/ADR-002-supabase-manufactura.md).

### Diseño

- [Manual de identidad web](../docs/manual-identidad-web.md) (copia de IndicadoresFirplak v0.3) y el agente [`disenador-firplak`](../.claude/agents/disenador-firplak.md).

## Agentes y skills

| Pieza | Para qué |
|---|---|
| [`migrador-excel`](../.claude/agents/migrador-excel.md) | Migra Excel y mantiene esta wiki. |
| [`disenador-firplak`](../.claude/agents/disenador-firplak.md) | Diseña y audita pantallas con la identidad Firplak. |
| [`migrar-excel`](../.claude/skills/migrar-excel/SKILL.md) | Fases fijas de la migración. |
| [`crear-modulo`](../.claude/skills/crear-modulo/SKILL.md) | Construcción de la pantalla de un módulo. |
