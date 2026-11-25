---
status: active
updated: 2026-11-06
sources:
  - ../package.json
  - ../src/
---

# Arquitectura

## Stack

Tomado de las apps del escritorio (Inventarios, Nexus, TI, Academia, IndicadoresFirplak):

| Pieza | Elección | De dónde viene |
|---|---|---|
| Framework | Next.js 16 (App Router, `src/`, `proxy.ts`) + React 19 + TypeScript | Inventarios, Nexus, TI |
| Estilos | CSS con tokens (`globals.css`) + hojas por área en `src/app/styles/` | IndicadoresFirplak (manual de identidad). No se usa Tailwind para no duplicar los tokens. |
| Iconos | lucide-react | Todas |
| Gráficos | Recharts, colores desde `src/lib/brand.ts` | IndicadoresFirplak, Nexus, TI |
| Excel | SheetJS (`xlsx` 0.20.3 desde el CDN oficial) | Inventarios, Academia |
| Autenticación | Demo con cookie (`src/lib/auth/`). Futuro: Supabase + Microsoft 365 | IndicadoresFirplak |
| Despliegue | Local (`npm run dev`, puerto 3020). Futuro: Vercel | Ecosistema |

## Carpetas

```text
src/app/            rutas (login, portal, módulos) y estilos
src/components/     AppShell, MetricCard, BrandPeak y componentes de cada módulo
src/lib/            auth demo, datos.ts, format.ts, brand.ts, modulos.ts, reglas por módulo
src/proxy.ts        exige sesión en todas las rutas salvo /login
scripts/            excel-a-json.mjs (perfilador) y limpiezas por módulo
excels-origen/      Excel originales (no versionados)
data/<slug>/        JSON y perfil generados
docs/               manual de identidad web
llm-wiki/           esta wiki
.claude/            agentes y skills
```

## Sesión demo

`src/app/actions.ts` valida contra los usuarios de `src/lib/auth/demo.ts` y guarda una cookie `httpOnly` de 8 horas. `src/proxy.ts` redirige a `/login` sin sesión (o responde 401 JSON en `/api/*`). La cookie no está firmada: **es solo para la demo**.
