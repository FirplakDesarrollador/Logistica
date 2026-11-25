---
status: active
updated: 2026-11-09
---

# Lecciones de las migraciones

Catálogo de problemas que traen los Excel y de patrones de diseño que funcionaron. Cada entrada cuenta **en cuántos Excel apareció**: lo frecuente se convierte en paso fijo del [playbook](playbook-migracion.md) o en código reutilizable.

Formato de cada entrada:

```
### <Nombre corto>
- Síntoma: cómo se ve en el Excel / en el perfil.
- Detección: qué columna del perfil o qué revisión lo delata.
- Solución: qué se hizo.
- Código: archivo que lo implementa.
- Apariciones: <slug>, <slug>… (N)
```

Excel analizados: 1 ([razones-incumplimiento-lib](excels/razones-incumplimiento-lib.md)).

## Problemas de datos

### Encabezado que no está en la fila 1
- Síntoma: títulos, logos o filtros encima de la tabla; el perfil muestra columnas `columna_N` o nombres raros.
- Detección: `filaEncabezado` del perfil y nombres de columna.
- Solución: el perfilador detecta la fila con más textos entre las 20 primeras; si falla, `--encabezado "Hoja=N"`.
- Código: `scripts/excel-a-json.mjs`.
- Apariciones: esperado, sin confirmar (0). En razones-incumplimiento-lib las 3 hojas tenían el encabezado en la fila 1; solo hubo columnas sin título (`columna_2`), que no es este problema.

### Celdas combinadas
- Síntoma: valores solo en la primera fila de un bloque; el resto queda vacío.
- Detección: `totalCombinadas` > 0 y `vaciosPct` alto en columnas de agrupación.
- Solución: `pendiente` (propagar el valor hacia abajo en la limpieza).
- Código: `pendiente`.
- Apariciones: esperado, sin confirmar (0).

### Tipos mixtos en una columna
- Síntoma: el perfil muestra `mixto (numero, texto)`: fechas escritas como texto, "N/A", guiones o números con espacios.
- Detección: columna `Tipo` del perfil; desde 2026-11-06 el perfil lista además los **valores atípicos** del tipo minoritario.
- Solución: en la limpieza de cada Excel, convertir lo convertible y marcar el resto como anomalía (no descartar en silencio). Implementación genérica `pendiente` (fase 3 del primer Excel).
- Código: detección en `scripts/excel-a-json.mjs`; limpieza `pendiente`.
- Apariciones: razones-incumplimiento-lib (`FECHA`: 12 × "09/12/20214" y 1 espacio entre 12.948 fechas) (1)

### Formato de fecha sobre celdas de texto (rompe la lectura)
- Síntoma: el perfilador fallaba con `RangeError: Invalid time value`. SheetJS `sheet_to_json` convierte a `Date` los **textos** de celdas que tienen formato de fecha (incluido el propio encabezado "FECHA" y textos mal escritos como "09/12/20214").
- Detección: el error al perfilar; la celda tiene `t: "s"` y `z: "m/d/yy"`.
- Solución: el perfilador ya no usa `sheet_to_json`; arma la matriz con el valor real de cada celda (`matrizDe`), de modo que un texto sigue siendo texto y aparece como tipo mixto. Fechas inválidas → `null`. De paso corrige el desfase de columnas si el rango no empieza en A.
- Código: `scripts/excel-a-json.mjs` (`matrizDe`, `normalizar`).
- Apariciones: razones-incumplimiento-lib (1)

### Fechas con año mal digitado
- Síntoma: fechas reales pero imposibles para el contexto (años futuros o anteriores al inicio del registro), en bloques de filas consecutivas.
- Detección: comparar `min`/`max` de la columna con el periodo esperado y con las filas vecinas.
- Solución: marcarlas como anomalía y preguntar al área; no corregir sin confirmación.
- Código: `pendiente` (`fechaValida` en fase 3).
- Apariciones: razones-incumplimiento-lib (27 filas: 2029, 2027, 2023 y una futura de 2026-12) (1)

### Catálogo con variantes fuera de la lista
- Síntoma: una columna que debería tomar valores de un catálogo tiene variantes (tilde, errata, sinónimo).
- Detección: cruzar los valores distintos contra la hoja catálogo; mirar las validaciones en "Salud del archivo" y su rango (`sqref`): la validación no cubre las filas agregadas después, y pegar valores la salta.
- Solución: `normalizarRazon` (recortar, comparar sin tildes y mapa de variantes confirmado por el área); guardar el valor original para trazabilidad. En el formulario nuevo la razón es un select del catálogo, así que ya no puede repetirse.
- Código: `src/lib/razones-incumplimiento-lib/reglas.ts`.
- Apariciones: razones-incumplimiento-lib (4 variantes, 43 filas) (1)

### Espacios al inicio o al final
- Síntoma: "DESMONTE DE ORDEN " y "DESMONTE DE ORDEN" cuentan como valores distintos.
- Detección: contar textos con `t !== t.trim()`.
- Solución: el perfilador recorta todos los textos al normalizar y guarda el original en el sidecar `<hoja>.originales.json`; la app marca la fila y muestra el original con ␣ visibles.
- Código: `scripts/excel-a-json.mjs` (`normalizar`, sidecar), `src/lib/datos.ts` (`leerOriginales`).
- Apariciones: razones-incumplimiento-lib (47 textos distintos, 2.172 filas) (1)

### Rango usado inflado y filas vacías al final
- Síntoma: `rango` del perfil mucho mayor que las filas de datos (Razones: A1:B14715 con 48 filas usadas; Obs: 145 filas vacías al final).
- Detección: comparar `rango` con `filas` en el perfil.
- Solución: el perfilador descarta filas vacías; no hace falta más.
- Código: `scripts/excel-a-json.mjs`.
- Apariciones: razones-incumplimiento-lib (1)

### Estilos de celda inflados (causa de lentitud)
- Síntoma: el archivo es lento o se satura aunque tenga pocos datos; `xl/styles.xml` pesa más que las hojas.
- Detección: sección "Salud del archivo" del perfil (`Estilos de celda` > 1.000 se marca como inflado).
- Solución: no se arrastra a la app (la app no usa estilos del Excel). Sirve como argumento para dirección: parte del dolor es el propio formato del archivo.
- Código: `scripts/excel-a-json.mjs` (`saludDelArchivo`).
- Apariciones: razones-incumplimiento-lib (62.492 estilos, styles.xml 12,9 MB vs. 6,9 MB de datos) (1)

### Una columna de código mezcla varias series
- Síntoma: un "No Orden" con 7 y 8 dígitos y prefijos distintos (cada serie es un tipo de documento diferente).
- Detección: agrupar el código por longitud y prefijo.
- Solución: derivar `tipoOrden` solo cuando el área confirme qué es cada serie.
- Código: `pendiente`.
- Apariciones: razones-incumplimiento-lib (3 series) (1)

### Columna agregada tarde (cobertura desigual)
- Síntoma: una columna (p. ej. FECHA) vacía en las primeras filas y en buena parte de las demás; solo se llena para ciertos casos.
- Detección: `vaciosPct` alto + cruzar vacíos contra la categoría principal.
- Solución: no construir tendencias ni porcentajes sobre esa columna para toda la población; mostrar la cobertura junto a la gráfica.
- Código: `pendiente`.
- Apariciones: razones-incumplimiento-lib (FECHA vacía en 67,8 %; solo 710 de 12.751 "CUMPLE" tienen fecha) (1)

### Texto libre con datos personales
- Síntoma: comentarios con nombres de personas u otros datos sensibles.
- Detección: revisar los comentarios más frecuentes antes de escribir ejemplos en la wiki.
- Solución: no copiarlos a la wiki; preguntar al área si se muestran, ocultan o anonimizan en la app.
- Código: `pendiente`.
- Apariciones: razones-incumplimiento-lib (1)

### Hoja oculta de notas de trabajo
- Síntoma: hoja oculta con pocas filas y una columna sin título con notas.
- Detección: `(oculta)` en el perfil.
- Solución: cruzarla con la hoja de datos; si las notas ya están aplicadas, proponer descartarla.
- Código: no aplica.
- Apariciones: razones-incumplimiento-lib (`Hoja1`, 15 notas ya aplicadas en `Obs`) (1)

### Filas de totales o subtotales mezcladas con los datos
- Síntoma: filas con "Total" en la primera columna; los totales de la app salen duplicados.
- Detección: buscar "total" en las columnas de texto; la suma de una columna es ~2× lo esperado.
- Solución: `pendiente`.
- Código: `pendiente`.
- Apariciones: esperado, sin confirmar (0). No apareció en razones-incumplimiento-lib.

### Códigos con ceros a la izquierda
- Síntoma: códigos de producto, cliente o guía que Excel guardó como número y perdieron ceros.
- Detección: columnas de código con tipo `numero`.
- Solución: `pendiente`.
- Código: `pendiente`.
- Apariciones: esperado, sin confirmar (0). En razones-incumplimiento-lib el código es numérico pero sin ceros iniciales.

## Reglas de negocio

### Excel sin fórmulas: las reglas están en la estructura
- Síntoma: 0 fórmulas, pero el archivo sí tiene reglas: validación de lista, formato condicional de duplicados, tabla catálogo.
- Detección: sección "Salud del archivo" del perfil (validaciones, nombres definidos, formatos condicionales, tablas).
- Solución: traducirlas como reglas con nombre de negocio (`normalizarRazon`, `ordenesDuplicadas`) y documentar su origen en la ficha.
- Apariciones: razones-incumplimiento-lib (1)

### El filtro guardado revela cómo se usa el Excel
- Síntoma: la tabla quedó guardada con un filtro activo (o hay vistas con nombre).
- Detección: "Tablas: … (con filtro guardado)" en "Salud del archivo".
- Solución: usar ese filtro como pista de la vista principal del módulo.
- Apariciones: razones-incumplimiento-lib (filtro por razón) (1)

## Diseño

_(Patrones visuales que funcionaron, registrados por el agente `disenador-firplak`.)_

### Hoja de 40.000 filas: tabla paginada en el servidor + filtros por URL
- Síntoma: mandar todas las filas al navegador hace lenta la vista.
- Solución: el servidor filtra y pagina (50 por página) con `searchParams`; `FiltrosBorrador` escribe la URL; `Paginacion` conserva los filtros. Las respuestas tardan entre 24 y 150 ms con 40.277 filas en caché.
- Código: `src/components/datos/`, `src/lib/consulta.ts`.
- Apariciones: razones-incumplimiento-lib (1)

### Iconos Lucide hacia componentes cliente
- Síntoma: error 500 "Functions cannot be passed directly to Client Components" al pasar `icon: House` desde un layout de servidor a `AppShell`.
- Solución: pasar el icono como elemento (`<House size={17} aria-hidden="true" />`).
- Código: `src/components/AppShell.tsx`.
- Apariciones: razones-incumplimiento-lib (1)

### Clases heredadas de Indicadores con efectos ocultos
- Síntoma: `shell.css` oculta `.billing-table-panel` fuera de `.billing-shell-detail` y reordena los bloques con `order`.
- Solución: los módulos envuelven su contenido en `.modulo-pagina` (orden natural) y usan `.modulo-tabla-panel` para las tablas.
- Código: `src/app/styles/razones-incumplimiento-lib.css` (mover a `datos.css` si el segundo módulo lo repite).
- Apariciones: razones-incumplimiento-lib (1)

### Mostrar anomalías sin corregir
- Patrón: marcas (chips de advertencia) por fila, una vista "Calidad del registro" con conteos por tipo, el valor original entre comillas con ␣ para los espacios y un enlace para corregir la orden en el formulario.
- Apariciones: razones-incumplimiento-lib (1)

### El Excel es solo una parte del indicador oficial
- Síntoma: el % calculado con el Excel no se parece al que reporta el área (Power BI); los totales implícitos por día no son enteros.
- Detección: pedir una captura del indicador oficial al inicio y recalcular 3–5 puntos antes de diseñar KPIs.
- Solución: identificar la otra fuente (pedir el .pbix o el reporte de origen) y cruzar por la llave (No Orden). No publicar un % que contradiga al oficial.
- Código: no aplica.
- Apariciones: razones-incumplimiento-lib (1)

### Filtros de catálogo: mostrar conteo y vacío específico
- Patrón: en selects de catálogo, mostrar el número de registros de cada opción («SALDOS (0)»); si un filtro da 0, el estado vacío dice cuál filtro lo causa (opción sin uso vs. combinación de filtros).
- Por qué: el desarrollador percibió el vacío genérico como «se queda cargando».
- Código: `src/app/razones-incumplimiento-lib/ordenes/page.tsx`.
- Apariciones: razones-incumplimiento-lib (1)

## Autenticación

### Supabase Auth en un proyecto compartido
- Síntoma: tras Microsoft, el usuario termina en otra app (el Site URL del proyecto).
- Causa: `redirectTo` con parámetros no coincide con la lista de Redirect URLs.
- Solución: URL de retorno exacta y sin parámetros; datos de navegación en una cookie corta. Nunca cambiar el Site URL de un proyecto compartido.
- Apariciones: razones-incumplimiento-lib (1)

### HTTP 431 en localhost
- Síntoma: «Esta página no funciona · HTTP ERROR 431» justo después de iniciar sesión.
- Causa: cookies de varias apps locales (todas en localhost) + sesión de Azure grande superan los 16 KB de Node.
- Solución: `node --max-http-header-size=65536` en los scripts de dev/start. Si persiste, borrar las cookies de localhost.
- Apariciones: razones-incumplimiento-lib (1)
