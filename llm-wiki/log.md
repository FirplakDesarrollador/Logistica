# Registro de mantenimiento

Formato: `## [AAAA-MM-DD] tipo | título` (tipos: migracion, playbook, leccion, ux, fix, decision).

## [2026-11-06] decision | Creación de la app de Logística

- App de demostración con el stack del ecosistema Firplak (Next.js 16, React 19, TypeScript, Lucide, Recharts, SheetJS) y la identidad visual de IndicadoresFirplak.
- Login de demostración sin base de datos (ver [ADR-001](decisiones/ADR-001-demo-sin-base-de-datos.md)).
- Agentes `migrador-excel` y `disenador-firplak`; skills `migrar-excel` y `crear-modulo`; playbook v0.1 y catálogo de lecciones inicial.
- Pendiente: recibir el primer Excel.

## [2026-11-06] migracion | razones-incumplimiento-lib: respuestas de recepción

- Área dueña: Logística. Responsable: Kevin Julian Hernandez Ramos. Actualización diaria.
- Dolor confirmado: no es lentitud sino **volumen de información**. El mensaje para dirección se enfoca en consulta y análisis rápido sobre mucho volumen.
- Pregunta 2 de la ficha resuelta (salvo quién más lo consulta).

## [2026-11-06] migracion | razones-incumplimiento-lib: el Excel no reproduce el indicador oficial

- Comparado contra la gráfica "Indicador de Liberación" (Power BI, octubre 2026): el BI da ~88 % diario; el Excel solo, 0–6 %.
- El Excel es la tabla de **razones** por orden; el universo de órdenes liberadas sale de otra fuente (pendiente: el .pbix o su origen).
- "lib" confirmado: liberación de órdenes de producción.

## [2026-11-06] decision | razones-incumplimiento-lib: migrar todo el Excel

- El desarrollador decide migrar el Excel completo: todas las filas y hojas, sin excluir ni corregir. Las anomalías se marcan, no se ocultan.
- Sin % de cumplimiento propio mientras no exista la fuente del total de órdenes.

## [2026-11-06] decision | Modelo de módulo: formulario + visualización

- Cada Excel migrado se convierte en un formulario de captura (reemplaza escribir en el Excel) más una vista de datos.
- razones-incumplimiento-lib: No Orden es solo el número de la orden (pregunta 4 resuelta).

## [2026-11-06] migracion | razones-incumplimiento-lib: reglas del formulario

- FECHA = fecha programada de la orden (selector obligatorio).
- No Orden repetido → se edita el registro existente; el histórico migrado se conserva intacto y la edición prevalece.

## [2026-11-06] migracion | razones-incumplimiento-lib: cumple con cambio de fecha

- Se distingue "cumple con cambio de fecha": casilla en el formulario y detección en el histórico (6.718 de 12.751 CUMPLE).

## [2026-11-06] migracion | razones-incumplimiento-lib: grupos de razones

- Aprobada la agrupación de razones por área responsable (provisional). Solo para análisis.

## [2026-11-06] decision | Roles y permisos aplazados

- Por ahora todos los usuarios de la demo pueden registrar, editar y ver. Los roles se definirán más adelante con el desarrollador.

## [2026-11-06] decision | Sin BI en la app

- La app es manejo de datos tipo Excel: formulario + previsualizaciones. Nada de indicadores de Power BI ni % de cumplimiento.
- razones-incumplimiento-lib: preguntas abiertas cerradas; análisis listo para aprobación.

## [2026-11-09] migracion | razones-incumplimiento-lib: fases 3 y 4

- Fase 2 aprobada por el desarrollador. Modelo en `src/lib/razones-incumplimiento-lib/` y módulo en `/razones-incumplimiento-lib`: resumen, formulario de registro/edición, tabla completa paginada en el servidor, calidad del registro, catálogo y notas.
- Registros nuevos y editados en `data/razones-incumplimiento-lib/registros.json` (Server Action); el histórico no se toca y la edición prevalece. Se entrega vacío (`[]`).
- Perfilador: nuevo sidecar `<hoja>.originales.json` (fila real del Excel y textos originales con espacios). `obs.json` no cambió (comparado byte a byte).
- Corrección de cifra de la fase 2: las razones fuera del catálogo son **43 filas**, no 46. Las filas con espacios sobrantes son 2.172.
- AppShell: `activeHref` opcional e iconos de navegación como elementos (antes fallaba al usarse desde un layout de servidor).
- Login y portal: el mensaje pasa de "Excel saturado/lento" a "mucho volumen de información".
- Verificado con lint, build, curl y Chrome headless. Falta la revisión humana a 375/820/1440 y la conciliación (fase 5).

## [2026-11-09] ux | razones-incumplimiento-lib: vacío específico al filtrar por razón

- Reporte del desarrollador: al filtrar por una razón sin órdenes parecía quedarse cargando. No se reprodujo (Chrome automatizado contra next start y next dev: el vacío aparece en <1 s), pero se mejoró el mensaje.
- Ahora el vacío distingue: razón del catálogo sin uso («Ninguna orden tiene la razón …»), razón con órdenes que no cumplen los demás filtros (dice cuántas tiene), y el caso general.
- La lista de razones muestra el conteo de órdenes de cada una, p. ej. «SALDOS (0)».

## [2026-11-20] decision | Supabase (Manufactura, schema logistica) y login Microsoft 365

- Schema `logistica` creado en Manufactura con las tablas `razones_lib_catalogo`, `razones_lib_historico`, `razones_lib_notas` y `razones_lib_registros`, todas con RLS (solo @firplak.com; anon sin acceso). Migración: `supabase/migrations/20261120_logistica_razones_lib.sql`.
- Login de demostración reemplazado por Microsoft 365 (Supabase Auth, Azure) con validación de dominio en callback, proxy y RLS. Ver [ADR-002](decisiones/ADR-002-supabase-manufactura.md).
- La app lee de Supabase (`src/lib/datos.ts`); el formulario guarda con upsert y la base pone usuario y fechas.
- Pendiente del desarrollador: exponer `logistica` en la Data API, habilitar Azure y agregar la URL de retorno. Después: cargar el histórico con `scripts/cargar-supabase.mjs` y conciliar conteos.
- MCP de Supabase configurado con `scripts/mcp-supabase.mjs` (token en `.env.local`, limitado al proyecto Manufactura).

## [2026-11-20] migracion | razones-incumplimiento-lib: histórico cargado en Supabase

- `scripts/cargar-supabase.mjs`: 47 filas de catálogo, 40.277 órdenes y 15 notas en `logistica`; conteos iguales al Excel.
- Conciliación en SQL: CUMPLE 12.751, NO MEDIR 1.336, fuera de catálogo 43, textos con espacios 2.172, fecha como texto 12, sin fecha 27.317 (+12 texto = 27.329 que muestra la app).
- Corrección: el valor suelto "NEGOCIACION" está en Razones!B14715 (fin del rango inflado), no en B48.
- Next.js actualizado de 16.4.2 a 16.4.6 (avisos de seguridad); `npm audit` sin vulnerabilidades.

## [2026-11-20] fix | Login Microsoft: URL de retorno y error 431

- La URL de retorno iba con `?next=`; Supabase exige coincidencia exacta con *Redirect URLs* y, si no, manda al Site URL del proyecto (app de FlutterFlow de Manufactura). Ahora se envía `/auth/callback` sin parámetros y la ruta de destino viaja en la cookie `logistica_siguiente`.
- HTTP 431 tras iniciar sesión: en localhost las cookies se comparten entre puertos (sesiones de Supabase de otras apps locales) y la sesión de Azure es grande. `npm run dev`/`start` suben el límite de cabeceras de Node a 64 KB.

## [2026-11-20] ux | Login Microsoft probado y carga del histórico más rápida

- El desarrollador entró con Microsoft 365 (`/auth/callback` → portal → módulo) y el módulo leyó las 40.277 órdenes desde Supabase.
- `leerTabla` ahora cuenta y pide las páginas de 1.000 en paralelo (de a 8): la carga inicial del histórico bajó de 8,5 s a 2,3 s (medido).
- Aviso de consola «This library called use() to suspend…» al navegar a Registrar: viene de Next.js en desarrollo (todos los frames internos); la app no llama a `use()`. No afecta producción.

## [2026-11-20] migracion | razones-incumplimiento-lib: prueba de punta a punta en Supabase

- El desarrollador registró la orden de prueba 99000001 desde el formulario; quedó en `razones_lib_registros` con `creado_por` = su correo y apareció en Órdenes como "Nuevo en la plataforma".
- Orden de prueba borrada. Estado final: 0 registros de la app, 40.277 del histórico.

## [2026-11-20] migracion | razones-incumplimiento-lib: eliminar orden con confirmación

- Pedido del desarrollador. Borrado lógico en `logistica.razones_lib_eliminadas` (no_orden, motivo opcional ≤300, eliminado, eliminado_por puestos por trigger; RLS solo @firplak.com). Migración `supabase/migrations/20261120_logistica_razones_lib_eliminadas.sql`.
- La orden eliminada desaparece de todas las vistas y conteos; la fila del histórico y el registro se conservan. Volver a guardar el mismo número la restaura ("Orden N restaurada").
- UI: botón "Eliminar orden" al editar una orden existente → diálogo de confirmación (`src/components/formulario/Dialogo.tsx`, `<dialog>` nativo) con motivo opcional y botón de peligro.
- Verificado en SQL con sesiones simuladas (firplak elimina/restaura; gmail rechazado). Pendiente: prueba en navegador por el desarrollador.

## [2026-11-20] migracion | razones-incumplimiento-lib: vista de órdenes eliminadas con restaurar

- Nueva ruta `/razones-incumplimiento-lib/eliminadas` (menú: «Órdenes eliminadas»): número, razón, fecha programada, origen, motivo, cuándo y quién la eliminó, y botón «Restaurar».
- Restaurar quita la marca de `razones_lib_eliminadas` (acción `restaurarOrden`); la orden vuelve con los datos que tenía. Sin confirmación porque no destruye nada.
- El aviso de «orden eliminada» del formulario enlaza a esta vista.

## [2026-11-20] playbook | Excel desde SharePoint sin descarga manual

- Conector de Microsoft 365 (ya conectado, permisos del desarrollador) para buscar Excel y carpetas en SharePoint. Llega al sitio Logística Seguimiento.
- `scripts/descargar-sharepoint.mjs` (`npm run excel:descargar`): flujo de código de dispositivo con la app de Entra de Logística, permiso delegado `Files.Read.All`, sin secreto; sesión en `.cache/` (fuera de git). Escribe `origen.json` con URL, eTag y fecha.
- Hallazgo: existe una copia vieja de «Razones incumplimiento lib.xlsx» en Dirección Manufactura › Documents PC Hector › 04. PLANEACION (modificada 2025-09-03).

## [2026-11-20] playbook | Descarga desde SharePoint bloqueada por política (pendiente TI)

- Con la app de Entra «Logistica» (delegado Files.Read.All + Sites.Read.All, consentimiento de administrador, MFA): Graph ve el sitio LOGISTICA y su biblioteca, pero el contenido sale vacío, la ruta da 404 y `/search/query` da 0 resultados. El conector de Microsoft 365 sí ve los archivos con la misma cuenta.
- Hipótesis: acceso condicional o política de SharePoint para apps nuevas/dispositivos no administrados (el token no trae deviceid). Pendiente revisar con TI los registros de inicio de sesión de la app.
- Mientras tanto: el conector sirve para ubicar y revisar Excel; el archivo .xlsx se descarga a mano.

## [2026-11-20] playbook | Excel desde OneDrive sincronizado (sin descarga manual)

- El desarrollador agregó «LOGISTICA - Documentos» a OneDrive. `scripts/traer-excel.mjs` (`npm run excel:traer`) copia el Excel a `excels-origen/<slug>/` con `origen.json` (fecha, tamaño, SHA-256); nunca escribe en OneDrive.
- razones-incumplimiento-lib: versión del 2026-11-20 09:55 traída. Frente a la del 2026-11-06: 40.492 órdenes (+215 nuevas al final, 0 modificadas, 0 quitadas). 9 de las nuevas usan «RETRASOS PLANTA», que no está en el catálogo (antes era 1 fila).
- Pendiente de decisión: cargar las 215 nuevas al histórico de Supabase.

## [2026-11-20] migracion | razones-incumplimiento-lib: 215 órdenes nuevas y RETRASOS PLANTA al catálogo

- Perfil regenerado con la versión del 2026-11-20 (las 40.277 filas previas idénticas y en la misma posición; nuevas en filas 40.279–40.493). Carga a Supabase: 40.492 órdenes, 47 filas de catálogo del Excel, 15 notas.
- «RETRASOS PLANTA» agregada al catálogo como razón de la plataforma (decisión del desarrollador): el catálogo admite `origen = plataforma` (fila_excel nulo, llave `id`). Grupo: Capacidad de planta. Deja de ser variante. Migración `20261120_logistica_razones_lib_catalogo_plataforma.sql`.
- Fuera de catálogo ahora: ERROR DE LIBERACIÓN 35, CAPACIAD DEL DIA FULL 5, CAMBIO SKU 2 y una nueva, «SOBREDEMANDA FV» 2 (filas 40.492–40.493, del 2026-11-20). Pendiente de decisión del desarrollador.
- Para actualizar el histórico mientras se use el Excel: `npm run excel:traer` → `npm run excel:perfil` → `node scripts/cargar-supabase.mjs <slug>` → reiniciar el servidor.

## [2026-11-20] migracion | razones-incumplimiento-lib: SOBREDEMANDA FV al catálogo

- Agregada desde la plataforma por decisión del desarrollador; grupo Comercial / pedido (igual que SOBREDEMANDA STOCK; ajustable). Migración `20261120_logistica_razones_lib_sobredemanda_fv.sql`.
- Fuera de catálogo quedan solo variantes de digitación: ERROR DE LIBERACIÓN 35, CAPACIAD DEL DIA FULL 5, CAMBIO SKU 2.

## [2026-11-20] migracion | razones-incumplimiento-lib: envío de razones al portal de Indicadores

- El BI de Liberación (IndicadoresFirplak, `llm-wiki/bi/liberacion.md`) toma las razones de aquí. Decisión del desarrollador: Supabase empuja las razones a la Reporting API; no se instala nada en SQL Server.
- Migración `supabase/migrations/20261120_logistica_razones_lib_envio_liberacion.sql`:
  - Vista `logistica.razones_lib_vigentes`: la razón vigente de cada orden, con las mismas reglas de `cargarOrdenes`, `normalizarRazon` y `detectarCambioFecha`. **Si cambian esas reglas en la app, hay que cambiar la vista.**
  - `logistica.liberacion_enviar_razones()` y `pg_cron` cada 15 minutos: envía con `pg_net` a `POST https://api.firplak.com:8443/api/v1/liberacion/razones` solo si cambió la huella. Bitácora en `logistica.liberacion_envios`.
  - Requiere `pg_cron`, `pg_net` y dos secretos en Vault (`liberacion_api_url`, `liberacion_api_token`).
- Vista probada en PGlite con un caso por regla. `pendiente`: aplicar la migración (desarrollador), después de desplegar la API.
- 2026-11-20: migración aplicada por el desarrollador, con los secretos en Vault. Primer envío forzado: la API respondió 200 con 40 492 razones recibidas. Job `liberacion-enviar-razones` activo cada 15 minutos.

## [2026-11-24] migracion | razones-incumplimiento-lib: recarga del histórico (versión del 2026-11-23)

- Pedido del desarrollador, para la conciliación del BI de Liberación en IndicadoresFirplak: noviembre no cuadraba porque el Power BI lee el Excel en vivo y Supabase tenía la carga del 2026-11-20.
- `excel:traer` trajo la versión modificada el 2026-11-23 12:44. Comparada fila por fila con la del 20 antes de cargar: las 40 492 filas previas siguen en su posición, 1 editada (OP 10076471: FALTA O PROBLEMAS DE MP → FECHA ENTREGA ERRADA) y 48 nuevas al final (38 CUMPLE, 4 NO MEDIR, 6 con otras razones). Sin OP repetidas.
- `cargar-supabase`: 40 540 órdenes, 47 filas de catálogo, 15 notas. El envío a Indicadores sale solo en la siguiente corrida de `liberacion-enviar-razones` (cada 15 min). La app de Logística necesita reiniciarse para leer el histórico nuevo (se guarda en memoria por proceso).

## [2026-11-24] playbook | Recarga automática de razones-incumplimiento-lib

- Pedido del desarrollador: mientras Logística siga usando el Excel, recargar Supabase solo, para que el BI de Liberación no se atrase.
- `scripts/recargar-razones.mjs`: `traer-excel` → si cambió, `excel-a-json` → verificación → `cargar-supabase`. Solo carga si las filas que ya existían siguen en su posición con la misma OP y las nuevas van al final, sin OP repetidas. Si no, restaura el perfil anterior, no toca Supabase y lo anota. Conserva las últimas 10 copias fechadas del Excel. Bitácora en `logs/recarga-razones.log` (fuera de git).
- Probado: sin cambios → no recarga; perfiles reales del 20 y del 23 de noviembre → 48 nuevas y 1 editada (igual que la revisión manual); Excel reordenado, fila borrada y OP repetida → rechazados.
- Programador de tareas de Windows, equipo del desarrollador: «Logistica - Recarga razones liberacion», lunes a viernes 16:30, solo con la sesión iniciada (lee el Excel de OneDrive). Primera corrida manual: resultado 0.
- Rollback: `Unregister-ScheduledTask -TaskName "Logistica - Recarga razones liberacion"`.

## [2026-11-25] decision | Repositorio en GitHub y flujo de ramas

- Repo `FirplakDesarrollador/Logistica` con ramas `main` → `Dev` → `Milton`. Se trabaja y se hace push solo en `Milton`; el desarrollador hace los merge en GitHub.
- Fuera de git: `.env*` (salvo `.env.example`), `excels-origen/`, `data/` (órdenes con comentarios que traen nombres), `.cache/`, `logs/`, `.claude/settings.local.json`. Revisado antes del primer push: sin secretos ni datos del Excel.
