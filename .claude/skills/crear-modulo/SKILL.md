---
name: crear-modulo
description: Construye la pantalla de un módulo de Logística a partir de un Excel ya analizado (fase 4 de migrar-excel), con identidad Firplak, filtros, KPIs, tabla y detalle. Adaptada de la skill crear-dashboard de IndicadoresFirplak para datos locales sin base de datos.
---

# Crear un módulo

**Lee antes de escribir:** `docs/manual-identidad-web.md`, `.claude/agents/disenador-firplak.md`, la sección 2 (aprobada) de `llm-wiki/excels/<slug>.md` y la sección "Piezas reutilizables" de `llm-wiki/playbook-migracion.md`.

## Pasos

1. **Datos (servidor):** `src/app/<slug>/page.tsx` es un Server Component que obtiene el usuario con `getSessionUser()` y lee las filas con `leerHoja(slug, hoja)` de `src/lib/datos.ts`. Aplica las reglas de `src/lib/<slug>/`. Nunca leas `data/` desde el cliente.
2. **Interactividad (cliente):** un componente `src/components/<slug>/<Nombre>Modulo.tsx` con `"use client"` recibe las filas ya normalizadas. Si el volumen supera ~20.000 filas, filtra y pagina en el servidor (Route Handler `src/app/api/<slug>/route.ts` o `searchParams`) en lugar de mandar todo al navegador.
3. **Shell:** envuelve la página en `AppShell` con su navegación (vista principal y detalle).
4. **Filtros en borrador:** no se aplican hasta pulsar **Aplicar filtros** o Enter; **Limpiar** restablece todo. Opciones construidas desde los datos reales. Listas dependientes se limpian al cambiar el padre.
5. **Indicadores:** solo los aprobados en la ficha, calculados con las reglas de `src/lib/<slug>/`. Sin tendencias ni metas inventadas.
6. **Formatos `es-CO`:** `src/lib/format.ts`.
7. **Estilos:** tokens de `globals.css`; clases de `shell.css` (`billing-metric-card`, `billing-panel`, `billing-data-table`, `billing-filterbar`…); estilos propios en `src/app/styles/<slug>.css` importado en `layout.tsx`. Colores de gráficos desde `src/lib/brand.ts` (Recharts).
8. **Estados:** vacío ("No hay registros con estos filtros" + Limpiar), error con "Reintentar".
9. **Accesibilidad:** foco visible, filas clicables operables con teclado, `aria-label` en botones de solo icono, 44 px táctiles.
10. **Catálogo:** agrega el módulo en `src/lib/modulos.ts` (slug, título, descripción de negocio, Excel de origen, estado, ruta, icono Lucide).

## Verificación

1. `npm run lint` y `npm run build` sin errores.
2. Revisión visual a 375, 820 y 1440 px.
3. Cambia filtros y comprueba que KPIs y tabla coinciden con lo que da el Excel con el mismo filtro.
4. Actualiza la sección 4 de la ficha y `llm-wiki/log.md`. Si construiste una pieza reutilizable, regístrala en el playbook.
