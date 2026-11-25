---
status: reemplazada por ADR-002 (datos y login)
updated: 2026-11-06
---

# ADR-001: demo sin base de datos

## Contexto

La app sirve para convencer a dirección de migrar los Excel de Logística. Conectar una base de datos antes de la aprobación agrega permisos, infraestructura y tiempo que no aportan a la demostración.

## Decisión

- El login usa usuarios definidos en código y una cookie de sesión (`src/lib/auth/demo.ts`).
- Los datos salen de los Excel convertidos a JSON (`scripts/excel-a-json.mjs` → `data/<slug>/`) y se leen solo desde el servidor con `src/lib/datos.ts`.
- Cada ficha documenta cómo sería su tabla real (sección 3), para que pasar a base de datos sea mecánico.

## Consecuencias

- La demo funciona sin credenciales ni red interna.
- Los datos no se actualizan solos: para refrescarlos se reejecuta el perfilador con el Excel nuevo.
- La sesión **no es segura** (cookie sin firmar). No se publica en internet con datos reales sin antes cambiar a Supabase + Microsoft 365.

## Para pasar a producción

1. Reemplazar `src/lib/auth/` y `src/proxy.ts` por el patrón Supabase de IndicadoresFirplak.
2. Crear las tablas documentadas en cada ficha y cambiar la implementación de `leerHoja`.
3. Definir quién carga los datos y con qué frecuencia (carga del Excel desde la app o integración con SAP).
