---
status: en-migracion
fase: 4
updated: 2026-11-09
playbook: v0.1
sources:
  - ../../excels-origen/razones-incumplimiento-lib/
  - ../../data/razones-incumplimiento-lib/perfil.md
---

# Excel: Razones incumplimiento lib.xlsx

> Fase 2 aprobada por el desarrollador (2026-11-09). Fases 3 (modelo) y 4 (módulo) terminadas el 2026-11-09. Siguiente: fase 5 (conciliación), pendiente de autorización.

## 0. Recepción

| Campo | Valor |
|---|---|
| Archivo original | `excels-origen/razones-incumplimiento-lib/Razones incumplimiento lib.xlsx` (copia; el desarrollador lo dejó suelto en `excels-origen/`, sin tocar) |
| Slug | `razones-incumplimiento-lib` |
| Significado de "lib" | **Confirmado 2026-11-06: liberación de órdenes de producción.** "CUMPLE" = la orden se liberó a tiempo (en la fecha programada). Evidencia original: Evidencia: razones "ERROR DE LIBERACION" y "NO SE LIBERO X RETRASOS PROD.", comentarios "SE LIBERÓ TARDE…", "SI CUMPLIO LA LIBERACION", "REVISAR QUE SE LIBERE BIEN". |
| Área dueña | **Logística** (confirmado por el desarrollador, 2026-11-06). Ubicación: SharePoint *Logística Seguimiento › 07. Planeación de PxN y abastecimiento PTC › 1. Planeación de producción*. |
| Responsable del Excel (valida las cifras) | **Kevin Julian Hernandez Ramos** (Logística), confirmado por el desarrollador 2026-11-06. |
| Usuarios y permisos | Aplazado por el desarrollador (2026-11-06): en la demo todos los usuarios registran, editan y ven. Los roles se definirán después. |
| Frecuencia de actualización y quién la hace | **Diaria**, la hace el responsable (confirmado 2026-11-06). Coincide con las fechas de lunes a viernes (12.919 de 12.948) y las filas agregadas al final; se edita en Excel Online. |
| Dolor actual | Confirmado 2026-11-06: **no es tan lento; el problema es el volumen de información** (40.277 órdenes en una sola hoja, difícil de consultar y analizar). Dato técnico de apoyo: 62.492 estilos de celda (`styles.xml` de 12,9 MB, más que los datos). El argumento para dirección es **consulta y análisis rápido sobre mucho volumen** (filtros, Pareto, búsqueda), no velocidad del archivo. |
| Tamaño del archivo / filas aproximadas | 3 MB comprimido (~20 MB descomprimido); 40.277 filas en `Obs`. Creado 2022-03-28. |

## 1. Perfil

Comando: `npm run excel:perfil -- "excels-origen/razones-incumplimiento-lib/Razones incumplimiento lib.xlsx" razones-incumplimiento-lib` (sin `--encabezado`: las tres hojas tienen el encabezado en la fila 1). La primera ejecución falló por un bug del perfilador (ver lección "Formato de fecha sobre celdas de texto"); se corrigió y se agregó la sección "Salud del archivo".

### Salud del archivo

- Tamaño: 3 MB · Estilos de celda: 62.492 (formatos de celda: 58) **inflado**.
- Partes internas > 1 MB: `xl/worksheets/sheet1.xml` (6,9 MB) · `xl/styles.xml` (12,9 MB).
- Tablas: `Obs_Plan` A1:D40278 (con **filtro guardado** por razón = "FALTA O PROBLEMAS DE MP" y una vista con nombre "Vista 1") · `ObsPlan4` A1:A47 (catálogo).
- Nombre definido: `OBSERVACIONES_PLANEACIÓN = ObsPlan4[OBSERVACIONES PLANEACIÓN]`.
- Validación de lista en `Obs!B2:B38884` (+ celdas sueltas) desde `OBSERVACIONES_PLANEACIÓN`. **No cubre las filas 38885–40278.**
- Formato condicional: 1 regla `duplicateValues` en `Obs!A` (resalta No Orden repetidos).
- 0 fórmulas, 0 celdas combinadas.

### Hoja «Obs»

Rango A1:D40423 · encabezado fila 1 · 40.277 filas de datos (145 filas vacías al final del rango) · 0 fórmulas.

| Col | Columna | Tipo | % vacíos | Distintos | Ejemplos |
|---|---|---|---|---|---|
| A | No Orden | numero | 0 | 40.277 (único) | 7 u 8 dígitos |
| B | OBSERVACIONES PLANEACIÓN | texto | 0 | 46 | MOLDE EN REP/FAB · FALTA PLANO · URGENCIA CIAL |
| C | COMENTARIOS | texto (libre) | 43,7 | 1.188 | DIFERENCIA DE INVENTARIO · TABLERO BOREAL · FALTA PLATERO |
| D | FECHA | mixto (fecha, texto) | 67,8 | 607 | 2024-03-04 · 2024-04-03 |

Atípicos en D: 12 × `"09/12/20214"` (texto) y 1 × `" "`.

### Hoja «Hoja1» (oculta)

A1:B16 · 15 filas · `Código OP` (8 dígitos) + columna B sin encabezado con notas de revisión. Las 15 OP existen en `Obs` y su razón ya refleja la nota (p. ej. "no es por falta de canto, la razón es ventas" → `VENTAS`).

### Hoja «Razones»

Rango A1:B14715 (rango inflado: solo 48 filas usadas) · 46 razones en A2:A47 (tabla `ObsPlan4`) + un "NEGOCIACION" suelto en B14715.

### Problemas conocidos detectados (de `lecciones.md`)

- [ ] Encabezado que no está en la fila 1 — no aparece (fila 1 en las 3 hojas; dos columnas sin título → `columna_2`).
- [ ] Celdas combinadas — no aparece (0).
- [x] Tipos mixtos en una columna — `FECHA`: 13 textos entre 12.948 fechas.
- [ ] Filas de totales — no aparece (0 filas con "total").
- [ ] Códigos con ceros a la izquierda — no aparece (No Orden numérico sin ceros iniciales).
- Nuevos (agregados a `lecciones.md`): formato de fecha sobre celdas de texto, fechas con año mal digitado, catálogo con variantes fuera de la lista, espacios al inicio/final, rango usado inflado, estilos de celda inflados, columna de código con varias series, columna agregada tarde (cobertura desigual), texto libre con datos personales, hoja oculta de notas.

## 2. Análisis

> **Decisión del desarrollador (2026-11-06): se migra TODO el Excel, sin excluir nada.** Consecuencias:
> - Las 40.277 filas de `Obs` entran completas, incluidas `CUMPLE`, `NO MEDIR`, filas sin fecha y filas con anomalías.
> - Las 3 hojas se migran: `Obs` (registros), `Razones` (catálogo completo, incluidas las 4 razones sin uso y "NEGOCIACION" de B14715) y `Hoja1` (notas de reclasificación).
> - Nunca se reemplaza el valor original: razones fuera de catálogo, fechas con año atípico y fechas como texto se muestran tal cual y se **marcan** (indicador de calidad), sin corregirlas ni ocultarlas. La normalización (`normalizarRazon`, `familiaRazon`) solo agrupa en análisis, guardando el original al lado.
> - Comentarios: se muestran completos, como en el Excel (inferido de la decisión; app interna con login).
> - **Sin BI (desarrollador, 2026-11-06):** la app es manejo de datos tipo Excel (formulario + previsualizaciones). No se calcula ni se replica el % de cumplimiento ni nada del Power BI. Las visualizaciones son conteos y distribuciones de lo registrado.
> - Esta decisión reemplaza las propuestas de "descartar" o "excluir" de las tablas siguientes.

> **Alcance aclarado por el desarrollador (2026-11-06): la app reemplaza el Excel, no solo lo consulta.** El módulo tiene dos partes:
> 1. **Formulario** donde el responsable registra cada orden (No Orden, razón, comentario, fecha) en lugar de escribir en el Excel. El formulario aplica las reglas que el Excel no logra hacer cumplir: razón solo del catálogo (lista), fecha válida (selector, sin años imposibles), No Orden numérico y aviso de duplicado.
> 2. **Visualización** de todos los datos: histórico migrado completo + registros nuevos.
> - Sin base de datos: los registros nuevos se guardan en el servidor en `data/razones-incumplimiento-lib/registros.json` (ADR-001); el histórico migrado no se toca.
> - **FECHA = fecha programada de la orden** (confirmado 2026-11-06). En el formulario es un selector de fecha obligatorio; no se autollena con hoy.
> - **No Orden existente → se edita** el registro (confirmado 2026-11-06). Aplica también a órdenes del histórico: la edición queda en `registros.json` y prevalece sobre la fila migrada, que se conserva intacta.
> - **Cumple con cambio de fecha** (confirmado 2026-11-06): la orden se liberó en la fecha nueva después de reprogramarse. Se distingue de "cumple en la fecha original".
>   - Formulario: casilla "¿Se cambió la fecha de la OP?".
>   - Histórico: se deriva del comentario con `detectarCambioFecha(comentario)` (sin tildes, mayúsculas; patrón `CAMBIO (DE)? FECHA` o `REPROGRAM`). Resultado: 6.761 órdenes, de ellas **6.718 CUMPLE (52,7 % de las 12.751 que cumplen)**. Variantes: "CAMBIO DE FECHA EN LA OP" 6.217, "CAMBIO DE FECHA OP" 185, "CAMBIO FECHA OP" 158 y otras con detalle del pedido. El comentario original se conserva; el valor derivado se marca "detectado del comentario".
> - **Grupos de razones por área responsable** (aprobados por el desarrollador 2026-11-06, provisionales hasta revisarlos con el responsable del Excel). Solo para análisis; la razón original no cambia. Implementación: `grupoRazon(razon)` con un mapa explícito.
>   - Capacidad de planta: CAPACIDAD DEL DIA FULL, CAPACIDAD DEL DIA FULL-RETRASOS PLANTA, MOLDE EN REP/FAB, CAPACIDAD AGOTADA DEL MOLDE, INVENTARIO/MTTO DE PLANTAS, NO SE LIBERO X RETRASOS PROD., TAMAÑO LOTE INFERIOR A LA PROGRAMACION, BAJA OCUPACION DE PLANTA.
>   - Materia prima: FALTA O PROBLEMAS DE MP, MP DEFECTUOSA, RESERVA SIN DISPONIBILIDAD, DIFERENCIA DE INVENTARIO.
>   - Planeación: DEFINICION POR PRIORIDADES, ACUMULACIÓN DE NOVEDAD, ERROR DE LIBERACION, CAPACIDAD DEL DIA FULL-PLANEACIÓN, ERROR EN EL LOTEO, OP SIN CREAR, ERROR PROGRAMACION DE FECHA, DESMONTE DE ORDEN, BALANCEO DE BODEGAS.
>   - I+D: CAPACIDAD DEL DIA FULL-I+D, FALTA ESPECIFICACIONES I+D, FALTA PLANO, ITEM SIN TIPO TOC, CAMBIO EN EL TIPO TOC.
>   - Comercial / pedido: FECHA ENTREGA ERRADA, URGENCIA CIAL, PEDIDOS DE SODIMAC ORGANIZADOS TARDE, CAMBIO DE SKU, VENTAS, SOBREDEMANDA STOCK, ADICION AL PEDIDO, PEDIDO STOCK -ANTICIPADO, CAMBIO DE FECHA A LA O.V, TIPO PEDIDO ERRADO, NEGOCIACION.
>   - Calidad y sistemas: CALIDAD, PROBLEMAS EN EL SISTEMA, ERROR DE RECIBO.
>   - Sin grupo: CUMPLE, NO MEDIR, SALDOS, SOBRANTES DE PRODUCCION, SUAVISAR, NO CUMPLE CANTIDAD OPTIMA.
>   - Variantes fuera de catálogo: se agrupan con su razón normalizada; `RETRASOS PLANTA` (1 fila) cae en Capacidad de planta con cualquiera de sus dos lecturas posibles.
> - **No Orden** es solo el número de la orden (confirmado con captura: mezcla 100xxxxx y 22xxxxx en filas seguidas). No se clasifica por serie; se elimina la regla `tipoOrden`.

### Hojas

| Hoja | Tipo | Se migra | Observaciones |
|---|---|---|---|
| Obs | dato (hechos) | Sí | Una fila por orden (No Orden único) con su razón de cumplimiento/incumplimiento, comentario libre y fecha opcional. |
| Razones | catálogo | Sí | 46 razones válidas (fuente de la validación de lista). B14715 "NEGOCIACION" se ignora (duplicado de A26). 4 razones sin uso: SALDOS, SOBRANTES DE PRODUCCION, SUAVISAR, NO CUMPLE CANTIDAD OPTIMA. |
| Hoja1 | descartar (notas de trabajo) | No | 15 notas de reclasificación ya aplicadas en `Obs`. Confirmar descarte. |

### Calidad de datos (cifras reales)

| Problema | Filas | Detalle |
|---|---|---|
| Razón fuera del catálogo | 43 (corregido 2026-11-09: en la fase 2 se sumó mal como 46) | `ERROR DE LIBERACIÓN` (35, con tilde), `CAPACIAD DEL DIA FULL` (5), `CAMBIO SKU` (2), `RETRASOS PLANTA` (1). Las de las filas 39169+ están fuera del rango validado; las demás entraron pegando. |
| Espacios al inicio/final | 47 textos distintos, **2.172 filas** (razón 2.032, comentario 156, fecha 1; medido 2026-11-09 con `obs.originales.json`) | Incluye razones ("DEFINICION POR PRIORIDADES ", "DESMONTE DE ORDEN "). El perfilador ya recorta. |
| FECHA como texto | 13 | 12 × "09/12/20214" (vecina: 2024-12-06 → probable 2024-12-09, `pendiente`) y 1 espacio. |
| FECHA con año atípico | 27 | 2029-10-28 (7, entre filas de 2024-10-29), 2023-01-22 (12, entre filas de 2025-01-23), 2027-11-27 (5, entre filas de 2025-11-26/27), 2023-12-18 (1, entre filas de 2025-12), 2026-12-09 (2, futura). Probable año mal digitado; `pendiente` confirmar. |
| FECHA vacía | 27.317 (67,8 %, incluye 1 celda con solo un espacio) | Las primeras 98 filas y casi todas las `CUMPLE` (12.041 de 12.751) no tienen fecha. Fechas reales: 12.948 (27 con año atípico); las demás van de 2024-03-04 a 2026-11-05. |
| Comentarios con variantes | 1.188 → 1.172 | Tras normalizar mayúsculas/tildes/espacios ("OPTIMIZACIÓN DE CORTES" / "optimizacion de corte"…). |
| Datos personales en comentarios | ≥ 1 patrón | Hay comentarios con nombres de personas: no se copian a la wiki; decidir si se muestran en la app. |

### Reglas de negocio

El Excel **no tiene fórmulas**. Las reglas salen de su estructura (validación, formato condicional, catálogo) y de patrones de los datos. Ninguna está validada por el área todavía.

| Regla | Origen en el Excel | Función TypeScript (propuesta, fase 3) | Validada |
|---|---|---|---|
| La razón debe pertenecer al catálogo | Validación de lista `Obs!B2:B38884` ← `OBSERVACIONES_PLANEACIÓN = ObsPlan4[...]` | `normalizarRazon(texto)`: recorta, compara sin tildes contra el catálogo y aplica mapa de variantes (`ERROR DE LIBERACIÓN`→`ERROR DE LIBERACION`, `CAPACIAD…`→`CAPACIDAD DEL DIA FULL`, `CAMBIO SKU`→`CAMBIO DE SKU`, `RETRASOS PLANTA`→`pendiente`) | `pendiente` |
| Una orden aparece una sola vez | Formato condicional `duplicateValues` en `Obs!A` | `ordenesDuplicadas(filas)` (hoy 0 duplicados) | Dato verificado; regla `pendiente` |
| Orden cumplida | Valor `CUMPLE` en la razón | `cumpleLiberacion(razon) = razon === "CUMPLE"` | `pendiente` |
| Orden que no se mide | Valor `NO MEDIR` (comentarios: "CANCELADA", "OP POR CORREGIR FECHA"…) | `esMedible(razon) = razon !== "NO MEDIR"` | `pendiente` (hipótesis) |
| % de cumplimiento | No existe en el Excel | `porcentajeCumplimiento = CUMPLE / medibles` → hoy 12.751 / 38.941 = 32,7 % (31,7 % sobre el total) | `pendiente`: el área debe confirmar la definición y si coincide con lo que reporta |
| Familia de razón | Prefijo común en el catálogo | `familiaRazon(razon)`: agrupa `CAPACIDAD DEL DIA FULL` y sus variantes `-I+D`, `-PLANEACIÓN`, `-RETRASOS PLANTA` | `pendiente` |
| Tipo de orden por serie | Patrón de No Orden | `tipoOrden(no)`: `100xxxxx` = OP (confirmado parcialmente: `Hoja1` las llama "Código OP"); 7 dígitos (21xxxxx/22xxxxx) y `200xxxxx` = `pendiente` | `pendiente` |
| Fecha válida | Formato `m/d/yy` de la columna D | `fechaValida(f)`: fecha real entre 2024-03-01 y hoy; si no, se marca como anomalía | `pendiente` |

### Indicadores, filtros y vistas (propuesta)

Solo con datos que existen en el Excel. Las cifras son las del corte entregado.

| Indicador | Cálculo | Fuente | Valor actual |
|---|---|---|---|
| Órdenes registradas | conteo de filas | Obs!A | 40.277 |
| Órdenes que cumplen | razón = CUMPLE | Obs!B | 12.751 |
| Órdenes que incumplen | medibles − CUMPLE | Obs!B | 26.190 |
| Órdenes no medidas | razón = NO MEDIR | Obs!B | 1.336 |
| % de cumplimiento | CUMPLE / medibles (definición `pendiente`) | Obs!B | 32,7 % |
| Pareto de razones de incumplimiento | conteo por razón normalizada / incumplen | Obs!B + Razones | CAPACIDAD DEL DIA FULL 37,2 %; FALTA O PROBLEMAS DE MP 14,5 %; …; 8 razones = 85,1 % |
| Peso de la familia "Capacidad del día full" | conteo familia / incumplen | Obs!B | 13.209 (50,4 %) si se aprueba la agrupación |
| Incumplimientos con fecha por mes | conteo por mes de FECHA válida | Obs!D | 2024-03 a 2026-11. **No** se propone % mensual: CUMPLE casi nunca tiene fecha y el % saldría sesgado |
| Calidad del registro | filas con anomalías (razón fuera de catálogo, fecha texto/atípica, sin fecha) | Obs | 43 / 40 (13 texto + 27 año atípico) / 27.317 |

Filtros:

- Razón (normalizada) y familia de razón.
- Resultado: cumple / incumple / no medir.
- Tipo de orden (serie de No Orden), cuando el área confirme las series.
- Rango de FECHA, con opción explícita "sin fecha".
- Con / sin comentario; búsqueda por No Orden y por texto en comentario.

Vistas:

- **Resumen para dirección**: tarjetas (registradas, cumplen, incumplen, % cumplimiento si se aprueba) + Pareto de razones + barras mensuales de incumplimientos con fecha (con nota de cobertura).
- **Detalle de órdenes**: tabla filtrable; reemplaza el filtro de tabla que hoy usan en Excel (el archivo quedó guardado filtrado por "FALTA O PROBLEMAS DE MP").
- **Calidad del registro**: lista de filas con anomalías para que el área las corrija (argumento de venta: en Excel no se ven).
- **Catálogo de razones**: las 46 razones con su uso (4 sin uso).

### Preguntas abiertas (para el área)

1. ~~¿"lib" significa liberación?~~ Resuelta 2026-11-06: sí, liberación de órdenes de producción; CUMPLE = liberada a tiempo.
2. ~~Dueño, quién lo actualiza, cada cuánto y dolor~~ Resuelta 2026-11-06: Logística, Kevin Julian Hernandez Ramos, diario, el dolor es el volumen. Queda abierto: ¿quién más lo consulta?
3. **FECHA resuelta 2026-11-06: es la fecha programada de la orden.** **Hallazgo 2026-11-06 (gráfica "Indicador de Liberación" de Power BI, octubre 2026, compartida por el desarrollador):** el Power BI muestra ~88 % diario de cumplimiento con meta ~98 % (lectura de la línea, `pendiente`). Con solo este Excel, los mismos días dan 0–6 %, y el total implícito por día (incumplidas del Excel ÷ % incumple del BI) no es entero en varios días (p. ej. 07/10: 53,3; 09/10: 21,3). Conclusión: **el BI no usa la columna FECHA de este Excel como denominador; toma el universo de órdenes (y probablemente la fecha) de otra fuente** y este Excel solo aporta la razón por No Orden. El % oficial no se puede reproducir sin esa fuente. En octubre no hay filas "NO MEDIR", así que la gráfica no permite decidir si se excluyen. ¿Qué representa FECHA (fecha de liberación real, nueva fecha programada, fecha del registro)? ¿Por qué casi solo la tienen las órdenes que incumplen y no las primeras filas?
4. ~~Series de No Orden~~ Resuelta 2026-11-06: es solo el número de la orden; no se clasifica.
5. ~~% de cumplimiento / NO MEDIR / % oficial~~ Fuera de alcance (desarrollador, 2026-11-06): la app no replica indicadores de BI.
6. ~~Cumple con cambio de fecha~~ Resuelta 2026-11-06: sí se distingue (casilla en el formulario; en el histórico se detecta del comentario).
7. ~~Mapeo de variantes~~ Resuelta 2026-11-06: se agrupan con su razón normalizada; el valor original se muestra marcado.
8. ~~Fechas atípicas~~ Resuelta 2026-11-06 (decisión migrar todo): se muestran tal cual y se marcan; no se corrigen.
9. ~~Agrupación~~ Resuelta 2026-11-06: por área responsable (provisional, revisar con el responsable del Excel).
10. ~~Razones sin uso, NEGOCIACION, Hoja1~~ Resuelta 2026-11-06 (decisión migrar todo): todo se migra.
11. ~~¿Historial o última razón?~~ Resuelta 2026-11-06: si el No Orden ya existe, el formulario **edita el registro existente** (no duplica, no guarda historial).
12. ~~Comentarios con nombres~~ Resuelta 2026-11-06 (inferida de migrar todo): se muestran completos, como en el Excel.
13. ~~Otra fuente para cruzar~~ Fuera de alcance (desarrollador, 2026-11-06).

## 3. Modelo

Implementado el 2026-11-09. No hay script de limpieza aparte: el histórico se lee del JSON del perfil y las reglas se aplican al cargar (una vez por proceso, cacheado en memoria mientras el archivo no cambie).

| Pieza | Archivo |
|---|---|
| Tipos | `src/lib/razones-incumplimiento-lib/types.ts` |
| Reglas (puras; cliente y servidor) | `src/lib/razones-incumplimiento-lib/reglas.ts` |
| Carga, fusión histórico + registros, filtros, resumen | `src/lib/razones-incumplimiento-lib/datos.ts` (server-only) |
| Lectura de filtros desde la URL | `src/lib/razones-incumplimiento-lib/filtros.ts` |
| Datos para editar una orden | `src/lib/razones-incumplimiento-lib/formulario.ts` |
| Guardar (Server Action) | `src/app/razones-incumplimiento-lib/acciones.ts` |
| Consultar una orden (Route Handler) | `src/app/api/razones-incumplimiento-lib/orden/route.ts` |

Fuentes: `data/razones-incumplimiento-lib/obs.json`, `razones.json` y `hoja1.json`, más sus sidecars `*.originales.json` (fila real del Excel y textos originales con espacios, generados por el perfilador). `registros.json` guarda las capturas de la plataforma y se entrega vacío (`[]`). El histórico nunca se modifica.

### Reglas implementadas

| Regla | Origen | Función | Verificación |
|---|---|---|---|
| Razón del catálogo | Validación de lista `Obs!B2:B38884` | `normalizarRazon`, `esRazonDelCatalogo` | 43 filas fuera del catálogo; 4 variantes agrupadas (página Calidad) |
| Variante `RETRASOS PLANTA` | Decisión 2026-11-06 (cae en el mismo grupo con ambas lecturas) | mapa `VARIANTES` → `CAPACIDAD DEL DIA FULL-RETRASOS PLANTA` | **Por revisar** con el responsable |
| Grupo por área | Mapa aprobado 2026-11-06 | `grupoRazon` | No cumplen: Capacidad de planta 13.695 · Materia prima 4.050 · Planeación 3.555 · Comercial / pedido 2.505 · I+D 2.190 · Calidad y sistemas 195 (suma 26.190) |
| Cumple | Valor `CUMPLE` | `cumpleLiberacion` | 12.751 |
| Cumple con cambio de fecha | Comentario (histórico) / casilla (formulario) | `detectarCambioFecha` | 6.761 órdenes, de ellas 6.718 CUMPLE (igual que en la fase 2) |
| Fecha del histórico | Columna FECHA | `leerFechaHistorico`, `esFechaAtipicaHistorico` (fuera de 2024-03-01 – 2026-11-06, el corte del Excel) | 12 como texto, 27 atípicas, 27.329 sin fecha válida (27.317 vacías + 12 de texto) |
| Marcas de calidad | Decisión "migrar todo y marcar" | `anomaliasHistorico` | 2.254 filas con alguna marca |
| Formulario | Decisiones 2026-11-06 | `validarFormulario` (cliente y Server Action): No. de orden de 1 a 10 dígitos sin cero inicial; razón del catálogo; fecha obligatoria entre `FECHA_MINIMA` (2024-01-01) y hoy + 90 días; comentario de máximo 500 caracteres | Probada con entradas inválidas |
| La edición prevalece | Decisión 2026-11-06 | `cargarOrdenes` (fusión por No. de orden) | Prueba: al editar la 2140956 su origen pasa a "Histórico editado" |

Tabla futura (para cuando haya base de datos):

| Tabla.columna | Tipo | Nulo | Origen |
|---|---|---|---|
| ordenes.no_orden | bigint (PK) | No | Obs!A / formulario |
| ordenes.razon | text | No | Obs!B tal cual / formulario |
| ordenes.razon_normalizada | text (FK razones.nombre) | No | `normalizarRazon` |
| ordenes.fecha_programada | date | Sí | Obs!D válida / formulario |
| ordenes.fecha_texto | text | Sí | Obs!D cuando no es fecha |
| ordenes.cambio_fecha | boolean | No | `detectarCambioFecha` / casilla |
| ordenes.cambio_fecha_fuente | text (comentario, formulario) | Sí | derivado |
| ordenes.comentario | text | Sí | Obs!C / formulario |
| ordenes.origen | text (historico, nuevo, editado) | No | derivado |
| ordenes.fila_excel | int | Sí | sidecar |
| ordenes.anomalias | text[] | No | `anomaliasHistorico` |
| ordenes.originales | jsonb | No | sidecar (valores con espacios) |
| ordenes.creado / actualizado | timestamptz | Sí | formulario |
| ordenes.usuario | text | Sí | sesión |
| razones.nombre | text (PK) | No | Razones!A |
| razones.grupo | text | No | `grupoRazon` |
| notas.codigo_op / nota / fila_excel | bigint / text / int | No | Hoja1 |

Con base de datos conviene guardar la fila migrada y la edición por separado (o un historial), igual que hoy se separan el histórico y `registros.json`.

## 4. Módulo

- Ruta: `/razones-incumplimiento-lib`, registrada en `src/lib/modulos.ts` con estado `en-migracion`. El shell vive en `layout.tsx`, con `loading.tsx` (skeleton) y `error.tsx` (botón Reintentar).
- Vistas:
  - `/` **Resumen**: 6 conteos (registradas, cumplen, cumplen con cambio de fecha, no cumplen, no medir, sin fecha); barras por área y por razón (las 8 primeras más "Otras"); barras por mes de fecha programada, explicando cuántas órdenes quedan fuera. Sin porcentajes ni metas.
  - `/registrar` **Formulario**: busca la orden mientras se escribe (Route Handler). Si existe, carga sus datos y muestra "Estás editando…". Razón solo del catálogo, fecha obligatoria con rango, casilla de cambio de fecha y comentario. Muestra una confirmación al guardar. Con `?orden=N` abre esa orden para editarla.
  - `/ordenes` **Tabla completa**, paginada en el servidor (50 por página), con búsqueda y filtros en borrador por URL: razón, área, con/sin fecha, rango de fechas, cambio de fecha, comentario, origen y marca de calidad.
  - `/calidad` **Calidad del registro**: conteos por marca, cómo se agrupa cada variante y las filas marcadas con su valor original (espacios visibles como ␣).
  - `/catalogo` **Catálogo**: las 46 razones con su área y uso (4 sin uso), más el «NEGOCIACION» suelto de B14715.
  - `/notas` **Notas de revisión** (Hoja1), con la razón actual de cada OP.
- Archivos: `src/app/razones-incumplimiento-lib/` (layout, páginas, acciones, loading, error), `src/components/razones-incumplimiento-lib/` (`RegistroForm`, `TablaOrdenes`) y `src/app/styles/razones-incumplimiento-lib.css`. Las piezas reutilizables están en el playbook.
- Verificación (2026-11-09):
  - `npm run lint` y `npm run build` sin errores.
  - `next start -p 3021` + curl con cookie: las 7 vistas responden 200 (24–150 ms). Sin sesión, las vistas redirigen a /login y la API responde 401.
  - Filtros probados: razón FALTA O PROBLEMAS DE MP → 3.806; área Materia prima → 4.050; sin fecha → 27.329; octubre 2026 → 109; con cambio de fecha → 6.761; sin comentario → 17.610; con alguna marca → 2.254; búsqueda "amortiguador" → 1.612.
  - Chrome headless (CDP): alta de una orden nueva; edición de una histórica (exige fecha porque no la tenía); error por fecha fuera de rango; filtros en borrador con chip eliminable. Sin errores de consola. `registros.json` quedó en `[]`.
- Revisión visual (375 / 820 / 1440): capturas con Chrome headless de las 6 vistas y el portal en los tres anchos. No hay scroll horizontal de página y cada vista tiene un solo h1. Falta: revisión humana en un navegador real, navegación con teclado y lector de pantalla.

## 5. Conciliación

_(Fase 5.)_

## 6. Cierre

_(Fase 6.)_

## 7. Métricas de la migración

| Fase | Tiempo | Preguntas al área | Notas |
|---|---|---|---|
| 0 Recepción | ~2 min | 1 (pregunta 2 agrupa dueño, usuarios, frecuencia y dolor) | Copia verificada con SHA-1 idéntico al original. |
| 1 Perfilado | ~5 min | 0 | Incluye corregir el bug de fechas del perfilador y agregar "Salud del archivo" y atípicos. |
| 2 Análisis | ~10 min | 13 | Análisis con scripts de solo lectura sobre `data/…/obs.json` y el zip del xlsx. |
| 3 Modelo | ~25 min | 0 | Tipos, reglas, carga cacheada, fusión, filtros; sidecar de originales en el perfilador. |
| 4 Módulo | ~50 min | 0 | 6 vistas + formulario; 6 piezas reutilizables nuevas; pruebas con curl y Chrome headless. Las 13 preguntas se resolvieron con el desarrollador antes de la fase 3 (sección 2). |
| 5 Conciliación | | | |
| 6 Cierre | | | |

Lecciones nuevas que dejó este Excel:

- Formato de fecha sobre celdas de texto rompe `sheet_to_json` (corregido en el perfilador).
- Estilos de celda inflados como causa de lentitud (detección automática agregada).
- Validación de lista que no cubre todas las filas → variantes fuera de catálogo.
- Columna agregada tarde: no sirve para tendencias de toda la población.
- Si la decisión es "no corregir, marcar", el perfilador debe conservar los textos originales (sidecar `*.originales.json`).
- Los iconos Lucide no se pueden pasar como función desde un layout de servidor a un componente cliente (`AppShell`): se pasan como elemento.
- `shell.css` oculta `.billing-table-panel` fuera de la vista de detalle y reordena bloques con `order`: los módulos usan `.modulo-pagina` y `.modulo-tabla-panel`.
