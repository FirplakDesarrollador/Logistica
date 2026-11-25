-- El catálogo de razones admite razones agregadas desde la plataforma (no solo las de la hoja «Razones» del Excel).
-- Primera: «RETRASOS PLANTA», que el responsable del Excel empezó a usar como razón propia (9 de 215 órdenes
-- nuevas del 2026-11-06 al 2026-11-20). Decisión del desarrollador 2026-11-20.
--
-- - Las filas del Excel siguen identificadas por fila_excel (único); las de la plataforma tienen fila_excel nulo.
-- - Llave nueva `id`; el script de carga sigue haciendo upsert por fila_excel.

alter table logistica.razones_lib_catalogo drop constraint razones_lib_catalogo_pkey;
alter table logistica.razones_lib_catalogo add column id bigint generated always as identity primary key;
alter table logistica.razones_lib_catalogo alter column fila_excel drop not null;
alter table logistica.razones_lib_catalogo add constraint razones_lib_catalogo_fila_excel_key unique (fila_excel);
alter table logistica.razones_lib_catalogo add column origen text not null default 'excel' check (origen in ('excel', 'plataforma'));
alter table logistica.razones_lib_catalogo add column agregado timestamptz;
alter table logistica.razones_lib_catalogo add column agregado_por text;
alter table logistica.razones_lib_catalogo add constraint razones_lib_catalogo_origen_fila check ((origen = 'excel') = (fila_excel is not null));

insert into logistica.razones_lib_catalogo (razon, origen, agregado, agregado_por)
values ('RETRASOS PLANTA', 'plataforma', now(), 'decisión del desarrollador (migración)');

comment on table logistica.razones_lib_catalogo is 'Catálogo de razones: hoja «Razones» del Excel (origen excel, con fila_excel; valores sueltos en valor_suelto, p. ej. NEGOCIACION en B14715) y razones agregadas desde la plataforma (origen plataforma).';
