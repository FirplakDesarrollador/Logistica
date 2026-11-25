-- Eliminar órdenes con borrado lógico (Razones de incumplimiento de liberación).
-- La orden se marca como eliminada y deja de mostrarse en la app; la fila del histórico del Excel
-- y el registro de la plataforma se conservan intactos (respaldo y trazabilidad).
-- Volver a guardar la misma orden desde el formulario la restaura (la app borra la marca).

create table logistica.razones_lib_eliminadas (
  no_orden bigint primary key check (no_orden > 0),
  motivo text check (motivo is null or char_length(motivo) <= 300),
  eliminado timestamptz not null default now(),
  eliminado_por text not null default logistica.correo_sesion()
);
comment on table logistica.razones_lib_eliminadas is 'Órdenes eliminadas desde la app (borrado lógico). La fila del histórico y el registro se conservan.';

create or replace function logistica.razones_lib_eliminadas_antes_de_guardar() returns trigger language plpgsql set search_path = '' as $$
begin
  if not logistica.es_firplak() and current_user <> 'service_role' then
    raise exception 'Solo las cuentas @firplak.com pueden eliminar órdenes.' using errcode = '42501';
  end if;
  new.eliminado := now();
  new.eliminado_por := logistica.correo_sesion();
  return new;
end;
$$;

create trigger razones_lib_eliminadas_antes_de_guardar
before insert or update on logistica.razones_lib_eliminadas
for each row execute function logistica.razones_lib_eliminadas_antes_de_guardar();

alter table logistica.razones_lib_eliminadas enable row level security;
grant select, insert, update, delete on logistica.razones_lib_eliminadas to authenticated;
grant all on logistica.razones_lib_eliminadas to service_role;

create policy "firplak lee eliminadas" on logistica.razones_lib_eliminadas for select to authenticated using ((select logistica.es_firplak()));
create policy "firplak elimina órdenes" on logistica.razones_lib_eliminadas for insert to authenticated with check ((select logistica.es_firplak()));
create policy "firplak actualiza eliminación" on logistica.razones_lib_eliminadas for update to authenticated using ((select logistica.es_firplak())) with check ((select logistica.es_firplak()));
create policy "firplak restaura órdenes" on logistica.razones_lib_eliminadas for delete to authenticated using ((select logistica.es_firplak()));
