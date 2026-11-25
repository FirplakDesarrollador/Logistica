---
status: active
version: 0.1
updated: 2026-11-09
sources:
  - ../.claude/skills/migrar-excel/SKILL.md
  - ../scripts/excel-a-json.mjs
---

# Playbook de migración de Excel

**Modelo de cada migración (decisión del desarrollador, 2026-11-06): cada Excel se convierte en un módulo con (1) un formulario que reemplaza la captura en Excel y hace cumplir sus reglas, y (2) una visualización de todos los datos (histórico migrado + registros nuevos). No se replican indicadores de BI: es manejo de datos tipo Excel.**

El paso a paso **vivo**. La skill `migrar-excel` fija las fases; este documento acumula lo que se aprende para que cada Excel nuevo cueste menos. El agente `migrador-excel` lo actualiza en la retrospectiva de cada migración.

## Madurez

| Indicador | Valor |
|---|---|
| Excel migrados | 0 |
| Pasos automatizados (comando o plantilla) | 2 (perfilado, ficha) |
| Pasos todavía manuales | Análisis de hojas, reglas, KPIs, módulo, conciliación |
| Tiempo medio por migración | `pendiente` (sin datos) |
| Preguntas medias al área | `pendiente` (sin datos) |

Meta: que el análisis y la conciliación también tengan plantilla o script, y que el módulo se arme casi solo con piezas reutilizables.

## Paso a paso actual (v0.1)

### 0. Recepción
1. Acordar el slug. **Ubicar el Excel en SharePoint** con el conector de Microsoft 365 (`sharepoint_search` / `sharepoint_folder_search`; usa los permisos del desarrollador). Si hay varias copias, confirmar con el desarrollador cuál es la vigente (fecha de modificación y sitio).
   - **Traerlo** sin que el desarrollador lo descargue: la biblioteca «LOGISTICA - Documentos» está sincronizada con OneDrive en el equipo del desarrollador. `npm run excel:traer -- <slug> "<ruta dentro de LOGISTICA - Documentos>"` copia el Excel a `excels-origen/<slug>/` (solo lectura en OneDrive) y escribe `origen.json` con fecha, tamaño y SHA-256; si la versión ya estaba, no duplica.
   - Para otros sitios: agregar su carpeta a OneDrive («Agregar acceso directo a Mis archivos») y definir `LOGISTICA_ONEDRIVE` o usar la ruta completa.
   - `scripts/descargar-sharepoint.mjs` (Graph) queda en reserva: hoy lo bloquea una política de la organización (ver log 2026-11-20).
   - Si no hay acceso por SharePoint, el desarrollador lo deja a mano en `excels-origen/<slug>/`.
2. Copiar la [plantilla de ficha](../.claude/skills/migrar-excel/plantilla-ficha-excel.md) a `llm-wiki/excels/<slug>.md` y llenar la sección 0.

### 1. Perfilado
```bash
npm run excel:perfil -- excels-origen/<slug>/<archivo>.xlsx <slug>
# si una hoja detecta mal el encabezado:
npm run excel:perfil -- excels-origen/<slug>/<archivo>.xlsx <slug> --encabezado "NombreHoja=3"
```
3. Pegar `data/<slug>/perfil.md` en la ficha.
4. Recorrer [lecciones.md](lecciones.md) y marcar qué problemas conocidos aparecen.
   - Leer la sección "Salud del archivo": validaciones y formato condicional son reglas de negocio aunque el Excel no tenga fórmulas; un filtro guardado indica la vista que más usa el área; estilos inflados explican parte de la lentitud.
   - En `npm run` con rutas que tienen espacios, encerrar la ruta entre comillas (funcionó así en Windows/Git Bash).

### 2. Análisis
5. Clasificar cada hoja (dato / catálogo / cálculo / resumen / notas). **Regla del desarrollador (2026-11-06): se migra todo el Excel; nada se excluye ni se corrige. Las anomalías se marcan y se muestran.**
6. Traducir fórmulas relevantes a reglas con nombre de negocio.
7. Definir KPIs, filtros y vistas; listar preguntas abiertas. **Aprobación.**

### 3. Modelo
8. `src/lib/<slug>/types.ts` + reglas en `src/lib/<slug>/`. Documentar la tabla futura.
   - Patrón usado en razones-incumplimiento-lib (copiar la estructura): `types.ts`, `reglas.ts` (puras, sirven al formulario y al servidor), `datos.ts` (server-only: carga con `leerJsonCacheado`, fusión histórico + `registros.json`, filtros, resumen), `filtros.ts` (searchParams → filtros), `formulario.ts`.
   - Si se decide "no corregir, marcar", usar los sidecars `<hoja>.originales.json` del perfilador para mostrar el valor original.

### 4. Módulo
9. Skill `crear-modulo` + reglas de `disenador-firplak`. Registrar en `src/lib/modulos.ts`.
   - Estructura: `src/app/<slug>/layout.tsx` con `AppShell` (iconos como elementos), `loading.tsx`, `error.tsx`, una página por vista y `acciones.ts` (Server Action con sesión y validación). Contenido dentro de `.modulo-pagina`; tablas en `.modulo-tabla-panel` (no `.billing-table-panel`).
   - Formulario + vistas: tabla completa paginada en el servidor con `FiltrosBorrador` + `Paginacion`, resumen con `MetricCard` + `GraficoBarras`, calidad del registro, catálogo.
   - Verificación: `npm run lint`, `npm run build`, `next start -p 3021`, curl con la cookie `logistica_demo_session` (base64url del usuario) y Chrome headless por CDP para el formulario y capturas a 375/820/1440. Dejar `registros.json` en `[]`.

### 5. Conciliación
10. Tabla Excel vs app por KPI y corte. **Aprobación.**

### 6. Cierre y retrospectiva
11. Catálogo en `migrado`, ficha completa, log, lecciones, este playbook (versión + historial + madurez).

## Piezas reutilizables

| Pieza | Archivo | Qué resuelve |
|---|---|---|
| Perfilador de Excel | [`scripts/excel-a-json.mjs`](../scripts/excel-a-json.mjs) | Hojas, encabezado, tipos, vacíos, fórmulas, combinadas, valores atípicos en columnas mixtas y **salud del archivo** (tamaño, estilos inflados, tablas, filtros guardados, validaciones, nombres definidos, formato condicional) → JSON + `perfil.md`. Lee el valor real de cada celda (sin reinterpretar textos como fechas). |
| Lector de datos | [`src/lib/datos.ts`](../src/lib/datos.ts) | `leerHoja(slug, hoja)`; punto único a reemplazar por la base de datos. |
| Shell de módulo | [`src/components/AppShell.tsx`](../src/components/AppShell.tsx) | Barra lateral, migas, perfil y cierre de sesión. |
| Tarjeta KPI | [`src/components/MetricCard.tsx`](../src/components/MetricCard.tsx) | KPI con icono, valor y detalle. |
| Formatos es-CO | [`src/lib/format.ts`](../src/lib/format.ts) | Moneda, millones, porcentaje, fechas; `formatDateLong` ("27 oct 2026") y `formatMonthYear` ("oct 2026"). |
| Diálogo de confirmación | [`src/components/formulario/Dialogo.tsx`](../src/components/formulario/Dialogo.tsx) | Modal accesible (<dialog> nativo: foco atrapado, Esc, devuelve el foco) para acciones destructivas; estilos `.dialogo`, `.boton-peligro` en `datos.css`. |
| Borrado lógico | tabla `<prefijo>_eliminadas` + filtro en la fusión de datos | Eliminar sin tocar el histórico del Excel; quién/cuándo por trigger; volver a guardar restaura. Ver `razones_lib_eliminadas`. |
| Datos con caché y registros | [`src/lib/datos.ts`](../src/lib/datos.ts) | `leerJsonCacheado` (procesa un JSON grande una vez por fecha de modificación), `leerOriginales` (sidecar), `leerRegistros` / `actualizarRegistros` (escritura atómica y en cola en `data/<slug>/registros.json`). |
| Consulta por URL | [`src/lib/consulta.ts`](../src/lib/consulta.ts) | `parametro`, `paginar`, `construirQuery`, `textoComparable` (sin tildes ni mayúsculas), `esFechaIso`, `hoyColombia`, `sumarDias`. |
| Filtros en borrador | [`src/components/datos/FiltrosBorrador.tsx`](../src/components/datos/FiltrosBorrador.tsx) | Barra configurable (búsqueda, selects, fechas, dependencias "deshabilitado si"), Aplicar/Limpiar, chips eliminables, panel plegable en móvil; escribe en la URL. |
| Paginación por URL | [`src/components/datos/Paginacion.tsx`](../src/components/datos/Paginacion.tsx) | "Página 2 de 14 · 683 registros" con enlaces que conservan los filtros. |
| Estado vacío | [`src/components/datos/EstadoVacio.tsx`](../src/components/datos/EstadoVacio.tsx) | Pico de marca, título, texto y acción. |
| Gráfico de barras | [`src/components/graficos/GraficoBarras.tsx`](../src/components/graficos/GraficoBarras.tsx) | Recharts horizontal/vertical de una serie, agrupa "Otras" con `maxBarras`, tabla de datos accesible. |
| Campo de formulario | [`src/components/formulario/Campo.tsx`](../src/components/formulario/Campo.tsx) | Etiqueta, ayuda y error con `aria-describedby`; estilos `form-*` en `src/app/styles/datos.css`. |
| Estilos de datos | [`src/app/styles/datos.css`](../src/app/styles/datos.css) | Filtros, chips, paginación, gráficos, estado vacío, formularios y avisos. |
| Shell con ruta activa automática | [`src/components/AppShell.tsx`](../src/components/AppShell.tsx) | `activeHref` opcional (usa la ruta actual); los iconos de navegación se pasan como elementos para usarlo desde un layout de servidor. |

## Historial

| Versión | Fecha | Cambio | Origen |
|---|---|---|---|
| 0.1 | 2026-11-06 | Versión inicial: fases, perfilador y plantilla de ficha. | Creación de la app |
| 0.1 (sin cambio de versión) | 2026-11-09 | Pasos 3 y 4 con la estructura del primer módulo; 9 piezas reutilizables nuevas; perfilador con sidecar `*.originales.json`. La versión sube en la fase 6. | [razones-incumplimiento-lib](excels/razones-incumplimiento-lib.md) fases 3–4 |
| 0.1 (sin cambio de versión) | 2026-11-06 | Perfilador: corregido "Invalid time value" con textos en celdas con formato fecha; nuevas secciones de atípicos y salud del archivo. Nota en el paso 4. La versión sube en la retrospectiva (fase 6). | [razones-incumplimiento-lib](excels/razones-incumplimiento-lib.md) fase 1 |
