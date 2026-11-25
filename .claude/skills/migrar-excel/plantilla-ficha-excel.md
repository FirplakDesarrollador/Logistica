---
status: en-migracion
fase: 0
updated: AAAA-MM-DD
playbook: v0.1
sources:
  - ../../excels-origen/<slug>/
  - ../../data/<slug>/perfil.md
---

# Excel: <Nombre del archivo>

## 0. Recepción

| Campo | Valor |
|---|---|
| Archivo original | `excels-origen/<slug>/<archivo>.xlsx` |
| Dueño (valida las cifras) | |
| Usuarios y frecuencia de uso | |
| Frecuencia de actualización y quién la hace | |
| Dolor actual (lentitud, bloqueos, tamaño, errores) | |
| Tamaño del archivo / filas aproximadas | |

## 1. Perfil

<!-- Pegar data/<slug>/perfil.md y marcar los problemas conocidos de lecciones.md que aparecen. -->

Problemas conocidos detectados (de `lecciones.md`):

- [ ]

## 2. Análisis

### Hojas

| Hoja | Tipo (dato / catálogo / cálculo / resumen / notas) | Cómo se muestra | Observaciones |
|---|---|---|---|

### Reglas de negocio (fórmulas)

| Regla | Fórmula original (celda) | Función TypeScript | Validada |
|---|---|---|---|

### Indicadores, filtros y vistas

| Indicador | Cálculo | Fuente (hoja/columna) |
|---|---|---|

Filtros:

-

Vistas (qué consulta hoy el área y cómo):

-

### Preguntas abiertas

-

## 3. Modelo

- Tipos: `src/lib/<slug>/types.ts`
- Reglas: `src/lib/<slug>/`
- Limpieza: `scripts/<slug>-limpiar.mjs` (si aplica)

Tabla futura (para cuando haya base de datos):

| Columna | Tipo | Nulo | Origen en el Excel |
|---|---|---|---|

## 4. Módulo

- Ruta: `/<slug>`
- Archivos:
- Revisión visual (375 / 820 / 1440):

## 5. Conciliación

| Indicador | Corte | Excel | App | Diferencia | Explicación |
|---|---|---|---|---|---|

## 6. Cierre

- Fecha de cierre:
- Aprobado por:

## 7. Métricas de la migración

| Fase | Tiempo | Preguntas al área | Notas |
|---|---|---|---|
| 0 Recepción | | | |
| 1 Perfilado | | | |
| 2 Análisis | | | |
| 3 Modelo | | | |
| 4 Módulo | | | |
| 5 Conciliación | | | |
| 6 Cierre | | | |

Lecciones nuevas que dejó este Excel:

-
