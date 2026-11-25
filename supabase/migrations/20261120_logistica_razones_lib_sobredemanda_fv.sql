-- «SOBREDEMANDA FV» agregada al catálogo desde la plataforma (decisión del desarrollador 2026-11-20).
-- Apareció en las 2 últimas órdenes del Excel del 2026-11-20 (filas 40.492 y 40.493). Grupo en la app: Comercial / pedido.
insert into logistica.razones_lib_catalogo (razon, origen, agregado, agregado_por)
select 'SOBREDEMANDA FV', 'plataforma', now(), 'decisión del desarrollador (migración)'
where not exists (select 1 from logistica.razones_lib_catalogo where razon = 'SOBREDEMANDA FV');
