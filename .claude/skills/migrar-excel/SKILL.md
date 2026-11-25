---
name: migrar-excel
description: Coordina la migración de un Excel de Logística a un módulo de la app, fase por fase y con aprobación del desarrollador entre fases. Úsala cuando alguien entregue un Excel para migrar, pida pasar un Excel a la app, o pregunte en qué fase va una migración.
---

# Migrar un Excel a la app de Logística

Punto de entrada del proceso. **El paso a paso vivo está en [`llm-wiki/playbook-migracion.md`](../../../llm-wiki/playbook-migracion.md)**: esta skill define las fases fijas y las reglas; el playbook acumula los atajos, comandos y piezas reutilizables que se van aprendiendo. Si se contradicen, manda el playbook más reciente (y corrige esta skill).

## Reparto de responsabilidades

- **IA (agente `migrador-excel`):** perfila, analiza, escribe código, documentación y conciliaciones.
- **Desarrollador:** entrega el Excel, valida con el área de Logística, aprueba cada fase y presenta al director.

## Antes de empezar

1. Lee `AGENTS.md`, `llm-wiki/index.md`, `llm-wiki/playbook-migracion.md` y `llm-wiki/lecciones.md`.
2. Acuerda el **slug** (minúsculas con guiones, por ejemplo `despachos-nacionales`). Si existe `llm-wiki/excels/<slug>.md`, retoma desde su `fase`.
3. Confirma que el Excel esté en `excels-origen/<slug>/`. Si te dieron otra ruta, cópialo ahí (nunca lo muevas ni lo edites).

## Fases

| # | Fase | Termina cuando… |
|---|---|---|
| 0 | **Recepción**: ficha nueva con [`plantilla-ficha-excel.md`](plantilla-ficha-excel.md); dueño del Excel, usuarios, frecuencia de actualización y dolor actual (lentitud, bloqueos, tamaño). | La ficha tiene dueño, usuarios y el dolor descrito. |
| 1 | **Perfilado**: `npm run excel:perfil -- excels-origen/<slug>/<archivo>.xlsx <slug>`. Pega `data/<slug>/perfil.md` en la sección 1 de la ficha. Revisa `lecciones.md` y marca qué problemas conocidos aparecen. | Cada hoja tiene encabezado correcto (si no, se reejecuta con `--encabezado`). |
| 2 | **Análisis**: para cada hoja, clasifícala (dato, catálogo, cálculo, resumen o notas). Se migra todo: nada se excluye ni se corrige; las anomalías se marcan. Traduce cada fórmula relevante a una regla de negocio. Define KPIs, filtros y vistas a partir de cómo usa el área el Excel hoy. Lista las preguntas abiertas. | **APROBACIÓN:** el desarrollador (con el área) valida hojas, reglas, KPIs y filtros. |
| 3 | **Modelo**: tipos en `src/lib/<slug>/types.ts`, normalización y reglas en `src/lib/<slug>/`. Si la limpieza es pesada, un script `scripts/<slug>-limpiar.mjs` que lee el JSON del perfil y escribe el limpio. Documenta en la ficha la tabla futura (columnas, tipos, claves). | `npm run build` compila y las reglas devuelven los mismos totales que el Excel en una muestra. |
| 4 | **Módulo**: skill [`crear-modulo`](../crear-modulo/SKILL.md) con las reglas del agente `disenador-firplak`. Registro en `src/lib/modulos.ts`. | Lint y build sin errores; revisión a 375, 820 y 1440 px. |
| 5 | **Conciliación**: tabla en la ficha con cada KPI: valor en el Excel, valor en la app, diferencia. Al menos un total general y dos cortes (por ejemplo, por mes y por cliente). | **APROBACIÓN:** cifras iguales, o cada diferencia explicada en la ficha. |
| 6 | **Cierre y retrospectiva**: estado `migrado` en el catálogo, ficha completa, `log.md`, y la **retrospectiva** obligatoria (ver abajo). | Playbook con versión nueva y `lecciones.md` actualizado. |

En cada fase: plan corto → ejecutar → actualizar `fase` y la sección de la ficha → resumen (qué se hizo, qué se validó, qué falta) → **detenerse** si hay APROBACIÓN.

## Retrospectiva (fase 6, no se salta)

1. `lecciones.md`: agregar o sumar ocurrencia a cada problema del Excel y cada patrón de diseño nuevo.
2. `playbook-migracion.md`: convertir en paso fijo lo que se repitió; quitar lo que sobró; registrar piezas reutilizables; subir versión e historial; actualizar la tabla de madurez.
3. Ficha, sección 7: tiempo por fase y número de preguntas al área.
4. `llm-wiki/index.md`: enlazar la ficha.
5. Si una regla de esta skill quedó obsoleta, corrígela aquí también.

## Reglas

- Excel original inmutable; datos sensibles fuera de la wiki.
- Nada de datos, metas ni tendencias inventadas; lo no verificado es `pendiente`.
- Toda fórmula que se traduce queda documentada junto a su función TypeScript.
- Sin base de datos en esta etapa: los datos salen de `data/<slug>/` por `src/lib/datos.ts`.
- Sin elementos de interfaz que no hagan nada.
