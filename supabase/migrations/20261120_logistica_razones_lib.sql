-- Schema de Logística en el proyecto Supabase "Manufactura" (Firplak SA).
-- Primer módulo: Razones de incumplimiento de liberación (Excel: Razones incumplimiento lib.xlsx).
-- Ficha: llm-wiki/excels/razones-incumplimiento-lib.md · Decisión: llm-wiki/decisiones/ADR-002-supabase-manufactura.md
--
-- Reglas:
-- - Solo sesiones de Supabase Auth con correo @firplak.com leen o escriben (RLS). anon no tiene acceso.
--   La restricción es del schema, no del proyecto: Manufactura tiene otras apps con usuarios de otros dominios.
-- - El histórico migrado del Excel es de solo lectura para la app (se carga con la clave de servicio).
-- - Lo capturado en la app va a razones_lib_registros; si el No. de orden ya existe, se edita (sin historial).
-- - La razón de un registro debe existir en el catálogo (trigger).
-- - Tablas de cada módulo con prefijo (razones_lib_) porque el schema recibirá más Excel migrados.

create schema if not exists logistica;
comment on schema logistica is 'App de Logística (Excel migrados a formulario + vistas). Repo local: Desktop/Logistica.';

grant usage on schema logistica to authenticated, service_role;

-- ── Sesión ──

create or replace function logistica.correo_sesion()
returns text
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function logistica.es_firplak()
returns boolean
language sql
stable
set search_path = ''
as $$
  select logistica.correo_sesion() like '%@firplak.com'
$$;

-- ── Tablas migradas del Excel (inmutables para la app) ──

create table logistica.razones_lib_catalogo (
  fila_excel integer primary key,
  razon text,
  valor_suelto text,
  check (razon is not null or valor_suelto is not null)
);
comment on table logistica.razones_lib_catalogo is 'Hoja «Razones» del Excel: catálogo de razones (columna A) y valores sueltos (columna B, p. ej. NEGOCIACION en B14715).';

create table logistica.razones_lib_historico (
  fila_excel integer primary key,
  no_orden bigint not null unique,
  razon text,
  comentario text,
  fecha_excel text,
  originales jsonb not null default '{}'::jsonb
);
comment on table logistica.razones_lib_historico is 'Hoja «Obs» del Excel tal cual (sin correcciones). fecha_excel guarda el valor original: fecha ISO o el texto escrito (p. ej. 09/12/20214). originales = textos con espacios sobrantes antes de recortar.';

create table logistica.razones_lib_notas (
  fila_excel integer primary key,
  codigo_op bigint,
  nota text
);
comment on table logistica.razones_lib_notas is 'Hoja oculta «Hoja1» del Excel: notas de reclasificación de OP.';

-- ── Registros capturados en la app ──

create table logistica.razones_lib_registros (
  no_orden bigint primary key check (no_orden > 0),
  razon text not null,
  fecha_programada date not null,
  cambio_fecha boolean not null default false,
  comentario text check (comentario is null or char_length(comentario) <= 500),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  creado_por text not null default logistica.correo_sesion(),
  actualizado_por text not null default logistica.correo_sesion()
);
comment on table logistica.razones_lib_registros is 'Órdenes registradas o editadas desde el formulario. Prevalecen sobre la fila del histórico con el mismo no_orden.';

create index razones_lib_registros_actualizado_idx on logistica.razones_lib_registros (actualizado desc);

-- La razón debe existir en el catálogo; las fechas y el usuario los pone la base, no el navegador.
create or replace function logistica.razones_lib_registros_antes_de_guardar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Primero el dominio: así una cuenta ajena recibe el motivo real (no ve el catálogo por RLS).
  if not logistica.es_firplak() and current_user <> 'service_role' then
    raise exception 'Solo las cuentas @firplak.com pueden registrar órdenes.' using errcode = '42501';
  end if;
  if not exists (select 1 from logistica.razones_lib_catalogo c where c.razon = new.razon) then
    raise exception 'La razón «%» no está en el catálogo.', new.razon using errcode = '23514';
  end if;
  if tg_op = 'INSERT' then
    new.creado := now();
    new.creado_por := logistica.correo_sesion();
  else
    new.creado := old.creado;
    new.creado_por := old.creado_por;
  end if;
  new.actualizado := now();
  new.actualizado_por := logistica.correo_sesion();
  return new;
end;
$$;

create trigger razones_lib_registros_antes_de_guardar
before insert or update on logistica.razones_lib_registros
for each row execute function logistica.razones_lib_registros_antes_de_guardar();

-- ── Permisos y RLS ──

alter table logistica.razones_lib_catalogo enable row level security;
alter table logistica.razones_lib_historico enable row level security;
alter table logistica.razones_lib_notas enable row level security;
alter table logistica.razones_lib_registros enable row level security;

grant select on logistica.razones_lib_catalogo, logistica.razones_lib_historico, logistica.razones_lib_notas, logistica.razones_lib_registros to authenticated;
grant insert, update on logistica.razones_lib_registros to authenticated;
grant all on all tables in schema logistica to service_role;
grant execute on function logistica.correo_sesion(), logistica.es_firplak() to authenticated, service_role;

create policy "firplak lee el catálogo" on logistica.razones_lib_catalogo for select to authenticated using ((select logistica.es_firplak()));
create policy "firplak lee el histórico" on logistica.razones_lib_historico for select to authenticated using ((select logistica.es_firplak()));
create policy "firplak lee las notas" on logistica.razones_lib_notas for select to authenticated using ((select logistica.es_firplak()));
create policy "firplak lee los registros" on logistica.razones_lib_registros for select to authenticated using ((select logistica.es_firplak()));
create policy "firplak registra órdenes" on logistica.razones_lib_registros for insert to authenticated with check ((select logistica.es_firplak()));
create policy "firplak edita órdenes" on logistica.razones_lib_registros for update to authenticated using ((select logistica.es_firplak())) with check ((select logistica.es_firplak()));
