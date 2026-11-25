-- Envío de las razones de liberación al portal de Indicadores (BI Liberación).
-- Decisión del desarrollador 2026-11-20 (IndicadoresFirplak, llm-wiki/bi/liberacion.md, sección 2):
-- el indicador de liberación se calcula en SQL Server; las razones viven aquí. Supabase empuja la razón
-- vigente de cada orden a la Reporting API, que reemplaza Planos_Symphony.dbo.Informe_liberacion_razones.
--
--   vista logistica.razones_lib_vigentes
--     │ pg_cron cada 15 min → logistica.liberacion_enviar_razones() (solo si cambió algo)
--     ▼ pg_net POST https://api.firplak.com:8443/api/v1/liberacion/razones  (token propio, en Vault)
--   Reporting API → dbo.sp_Cargar_Informe_liberacion_razones
--
-- Reglas de la vista: las mismas de la app (src/lib/razones-incumplimiento-lib/datos.ts y reglas.ts):
-- - El registro de la plataforma prevalece sobre la fila del histórico con el mismo no_orden.
-- - Las órdenes eliminadas (borrado lógico) no se envían.
-- - razon_normalizada = normalizarRazon(): la razón del catálogo equivalente sin tildes, mayúsculas ni
--   espacios, o la variante conocida (CAPACIAD DEL DIA FULL, CAMBIO SKU); si no, la razón tal cual.
-- - cambio_fecha del histórico = detectarCambioFecha(comentario): CAMBIO (DE) FECHA o REPROGRAM.
-- - fecha_programada del histórico solo si fecha_excel es una fecha AAAA-MM-DD válida; si no, el texto
--   original va en fecha_texto.
-- Si cambian esas reglas en la app, hay que cambiarlas aquí también.
--
-- Antes de programar el job, el desarrollador crea los dos secretos en Vault (no van en este archivo):
--   select vault.create_secret('https://api.firplak.com:8443/api/v1/liberacion/razones', 'liberacion_api_url');
--   select vault.create_secret('<valor de LIBERACION_RAZONES_TOKEN de la Reporting API>', 'liberacion_api_token');
--
-- Rollback:
--   select cron.unschedule('liberacion-enviar-razones');
--   drop function logistica.liberacion_enviar_razones(boolean);
--   drop table logistica.liberacion_envios;
--   drop view logistica.razones_lib_vigentes;
--   drop function logistica.texto_comparable(text);
--   drop function logistica.fecha_iso(text);
--   delete from vault.secrets where name in ('liberacion_api_url', 'liberacion_api_token');
-- (pg_cron y pg_net se pueden dejar: no afectan a las demás apps de Manufactura.)

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- ── Funciones de apoyo (equivalentes a textoComparable y esFechaIso de la app) ──

create or replace function logistica.texto_comparable(texto text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(btrim(regexp_replace(
    translate(texto, 'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑáéíóúàèìòùäëïöüâêîôûñ', 'AEIOUAEIOUAEIOUAEIOUNaeiouaeiouaeiouaeioun'),
    '\s+', ' ', 'g')))
$$;

create or replace function logistica.fecha_iso(valor text)
returns date
language plpgsql
immutable
set search_path = ''
as $$
begin
  if valor is null or valor !~ '^\d{4}-\d{2}-\d{2}$' then
    return null;
  end if;
  return valor::date;
exception when others then
  return null;  -- p. ej. 2025-02-30
end;
$$;

-- ── Razón vigente de cada orden ──

create or replace view logistica.razones_lib_vigentes
with (security_invoker = true)
as
with catalogo_todo as (
  select distinct c.razon from logistica.razones_lib_catalogo c where c.razon is not null
),
catalogo as (
  -- Primera aparición de cada razón comparable, en el orden del Excel (las de la plataforma al final), como la app.
  select distinct on (logistica.texto_comparable(c.razon))
         c.razon, logistica.texto_comparable(c.razon) as comparable
  from logistica.razones_lib_catalogo c
  where c.razon is not null
  order by logistica.texto_comparable(c.razon), c.fila_excel nulls last, c.id
),
variantes (variante, destino) as (
  values ('CAPACIAD DEL DIA FULL', 'CAPACIDAD DEL DIA FULL'),
         ('CAMBIO SKU', 'CAMBIO DE SKU')
),
base as (
  select r.no_orden,
         btrim(r.razon) as razon,
         r.cambio_fecha,
         r.fecha_programada,
         null::text as fecha_texto,
         r.comentario,
         case when h.no_orden is null then 'nuevo' else 'editado' end as origen,
         r.actualizado
  from logistica.razones_lib_registros r
  left join logistica.razones_lib_historico h on h.no_orden = r.no_orden
  union all
  select h.no_orden,
         btrim(coalesce(h.razon, '')),
         coalesce(logistica.texto_comparable(h.comentario) ~ 'CAMBIO (DE )?FECHA|REPROGRAM', false),
         logistica.fecha_iso(btrim(h.fecha_excel)),
         case when nullif(btrim(h.fecha_excel), '') is not null and logistica.fecha_iso(btrim(h.fecha_excel)) is null
              then h.fecha_excel end,
         h.comentario,
         'historico',
         null::timestamptz
  from logistica.razones_lib_historico h
  where not exists (select 1 from logistica.razones_lib_registros r where r.no_orden = h.no_orden)
)
select b.no_orden,
       b.razon,
       coalesce(exacta.razon, equivalente.razon, variante.razon, b.razon) as razon_normalizada,
       b.cambio_fecha,
       b.fecha_programada,
       b.fecha_texto,
       left(b.comentario, 4000) as comentario,  -- Límite de la columna en SQL Server
       b.origen,
       b.actualizado
from base b
left join catalogo_todo exacta on exacta.razon = b.razon
left join catalogo equivalente on equivalente.comparable = logistica.texto_comparable(b.razon)
left join variantes v on v.variante = logistica.texto_comparable(b.razon)
left join catalogo_todo variante on variante.razon = v.destino
where not exists (select 1 from logistica.razones_lib_eliminadas e where e.no_orden = b.no_orden);

comment on view logistica.razones_lib_vigentes is 'Razón vigente de cada orden (registro de la plataforma o, si no hay, fila del histórico; sin las eliminadas). La envía logistica.liberacion_enviar_razones() al portal de Indicadores.';

grant select on logistica.razones_lib_vigentes to authenticated;  -- RLS de las tablas: solo @firplak.com

-- ── Bitácora de envíos ──

create table logistica.liberacion_envios (
  id bigint generated always as identity primary key,
  solicitud bigint not null,                -- id de net.http_post (net._http_response.id)
  huella text not null,                     -- md5 de la vista enviada: si no cambia, no se vuelve a enviar
  filas integer not null,
  enviado timestamptz not null default now(),
  estado_http integer,                      -- Copiado de net._http_response (pg_net lo borra a las 6 h)
  error text,
  respuesta text,
  recibido timestamptz
);
comment on table logistica.liberacion_envios is 'Envíos de razones a la Reporting API (BI Liberación). estado_http 200 = SQL Server recibió las razones.';

alter table logistica.liberacion_envios enable row level security;
revoke all on logistica.liberacion_envios from anon, authenticated;
-- Sin políticas: solo la lee el SQL Editor o el MCP (rol postgres / service_role).

-- ── Envío ──

create or replace function logistica.liberacion_enviar_razones(p_forzar boolean default false)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url       text;
  v_token     text;
  v_huella    text;
  v_filas     integer;
  v_cuerpo    jsonb;
  v_solicitud bigint;
  v_ultimo    logistica.liberacion_envios%rowtype;
begin
  -- 1. Resultado de los envíos anteriores (pg_net responde de forma asíncrona).
  update logistica.liberacion_envios e
  set estado_http = r.status_code,
      error = coalesce(r.error_msg, case when r.timed_out then 'Tiempo de espera agotado' end),
      respuesta = left(r.content, 1000),
      recibido = r.created
  from net._http_response r
  where r.id = e.solicitud
    and e.estado_http is null
    and e.error is null;

  delete from logistica.liberacion_envios where enviado < now() - interval '30 days';

  -- 2. ¿Cambió algo desde el último envío correcto?
  select md5(string_agg(concat_ws('|', v.no_orden, v.razon, v.razon_normalizada, v.cambio_fecha, v.fecha_programada,
                                  v.fecha_texto, v.comentario, v.origen, v.actualizado), E'\n' order by v.no_orden)),
         count(*)
  into v_huella, v_filas
  from logistica.razones_lib_vigentes v;

  select * into v_ultimo from logistica.liberacion_envios order by id desc limit 1;

  if not p_forzar and v_ultimo.id is not null and v_ultimo.huella = v_huella then
    if v_ultimo.estado_http = 200 then
      return null;  -- Ya está en SQL Server
    end if;
    if v_ultimo.estado_http is null and v_ultimo.error is null and v_ultimo.enviado > now() - interval '10 minutes' then
      return null;  -- En camino
    end if;
    -- Falló o no respondió: se reintenta.
  end if;

  -- 3. Enviar.
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'liberacion_api_url';
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'liberacion_api_token';
  if v_url is null or v_token is null then
    raise exception 'Faltan los secretos liberacion_api_url o liberacion_api_token en Vault.';
  end if;

  select jsonb_build_object(
           'version', 1,
           'huella', v_huella,
           'total', v_filas,
           'generado', now(),
           'columnas', jsonb_build_array('noOrden', 'razon', 'razonNormalizada', 'cambioFecha', 'fechaProgramada',
                                         'fechaTexto', 'comentario', 'origen', 'actualizado'),
           'filas', coalesce(jsonb_agg(jsonb_build_array(v.no_orden, v.razon, v.razon_normalizada, v.cambio_fecha,
                                                         v.fecha_programada, v.fecha_texto, v.comentario, v.origen,
                                                         v.actualizado) order by v.no_orden), '[]'::jsonb))
  into v_cuerpo
  from logistica.razones_lib_vigentes v;

  v_solicitud := net.http_post(
    url := v_url,
    body := v_cuerpo,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_token),
    timeout_milliseconds := 120000
  );

  insert into logistica.liberacion_envios (solicitud, huella, filas) values (v_solicitud, v_huella, v_filas);
  return v_solicitud;
end;
$$;

comment on function logistica.liberacion_enviar_razones(boolean) is 'Envía logistica.razones_lib_vigentes a la Reporting API si cambió desde el último envío correcto (p_forzar = true lo envía siempre). Devuelve el id de la solicitud de pg_net o null si no envió.';

revoke all on function logistica.liberacion_enviar_razones(boolean) from public, anon, authenticated;

-- ── Programación: cada 15 minutos, todos los días (solo envía si hubo cambios) ──

select cron.schedule('liberacion-enviar-razones', '*/15 * * * *', 'select logistica.liberacion_enviar_razones()');

-- ── Validación (solo lectura, en el SQL Editor) ──
-- Filas: deben ser las órdenes que muestra la app (histórico + nuevas − eliminadas).
--   select origen, count(*) from logistica.razones_lib_vigentes group by origen;
-- Por razón: comparar con la consulta 5.2 de IndicadoresFirplak sql/liberacion/02_razones_liberacion.sql.
--   select razon_normalizada, count(*) as ordenes, count(*) filter (where cambio_fecha) as con_cambio_fecha
--   from logistica.razones_lib_vigentes group by 1 order by 2 desc;
-- Últimos envíos (estado_http 200 = recibido en SQL Server):
--   select id, enviado, filas, estado_http, error, left(respuesta, 200) from logistica.liberacion_envios order by id desc limit 10;
-- Envío manual de prueba (forzado) y su respuesta:
--   select logistica.liberacion_enviar_razones(true);
--   select * from net._http_response order by id desc limit 1;
-- Ejecuciones del job:
--   select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'liberacion-enviar-razones') order by start_time desc limit 10;
