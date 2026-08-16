-- Ejecutar en el SQL Editor de Supabase si la tabla `tasks` ya existía
-- (proyectos creados antes de que el horario pasara a bloques de 30 min).
-- Si estás creando el proyecto desde cero, no hace falta: ya está incluido
-- en supabase/schema.sql.

alter table public.tasks
  add column if not exists minute smallint not null default 0 check (minute in (0, 30));
