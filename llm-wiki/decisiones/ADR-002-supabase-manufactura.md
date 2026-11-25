---
status: aceptada
updated: 2026-11-20
reemplaza: ADR-001 (en datos y login)
sources:
  - ../../supabase/migrations/20261120_logistica_razones_lib.sql
  - ../../src/lib/supabase/
  - ../../src/proxy.ts
---

# ADR-002: datos y login en Supabase (proyecto Manufactura, schema `logistica`)

## Contexto

La demo (ADR-001) guardaba los datos en JSON locales y usaba un login de prueba. El desarrollador decidió conectar Supabase.

## Decisión

- **Dónde:** organización Firplak SA › proyecto **Manufactura** (`vuiuorjzonpyobpelyld`), schema propio **`logistica`**. Las tablas de cada módulo llevan prefijo (`razones_lib_…`) porque el schema recibirá más Excel.
- **Login:** Supabase Auth con **Microsoft 365** (proveedor Azure), mismo patrón que IndicadoresFirplak.
- **Solo `@firplak.com`**, validado en tres capas: `auth/callback` (cierra la sesión y avisa), `src/proxy.ts` (en cada petición) y RLS del schema (`logistica.es_firplak()`). No se usa un hook de Auth para todo el proyecto: Manufactura tiene otras apps con usuarios de otros dominios (al 2026-11-20: 74 de 76 usuarios son @firplak.com, todos con correo y contraseña).
- **Permisos:** `anon` sin acceso. `authenticated` con correo Firplak lee todo y solo inserta/actualiza en `razones_lib_registros`. El histórico, el catálogo y las notas se cargan con la clave de servicio (`scripts/cargar-supabase.mjs`) y son de solo lectura para la app.
- **Integridad en la base:** trigger que exige que la razón exista en el catálogo y que pone `creado/actualizado/…_por` desde la sesión (el navegador no los puede falsear).
- **Lectura:** el histórico (inmutable) se lee una vez por proceso del servidor y queda en memoria; los registros se leen en cada petición. Filtros, resumen y paginación siguen en el servidor de Next.js.

## Configuración que hace el desarrollador en el panel de Supabase

1. *Project Settings › Data API › Exposed schemas*: agregar `logistica` (sin quitar los existentes).
2. *Authentication › Sign In / Providers › Azure*: habilitar con el Client ID, Secret y Tenant URL de la app de Entra ID; en Entra ID agregar la URI de redirección `https://vuiuorjzonpyobpelyld.supabase.co/auth/v1/callback`.
3. *Authentication › URL Configuration › Redirect URLs*: agregar `http://localhost:3020/auth/callback` (y la URL de producción cuando exista).

## Consecuencias

- La app ya no funciona sin red ni sin una cuenta Firplak.
- Los datos quedan en la misma base que otras apps de Manufactura, aislados por schema y RLS.
- Roles y permisos por usuario siguen aplazados (todos los @firplak.com registran, editan y ven).
- `data/<slug>/` queda solo como insumo del perfilador y del script de carga.

## Rollback

`drop schema logistica cascade;` elimina solo lo de esta app. Quitar `logistica` de *Exposed schemas*. El proveedor Azure se puede dejar: no afecta el login por correo de las otras apps.
