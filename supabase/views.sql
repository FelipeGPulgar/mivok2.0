-- supabase/views.sql
-- Vista pensada para exportar eventos sin columnas de reseñas/calificaciones
-- Usar esta vista en Supabase (Editor de tablas -> elegir "Run SQL" o usar la vista para exportar CSV).

CREATE OR REPLACE VIEW public.events_export AS
SELECT
  id,
  proposal_id,
  client_id,
  dj_id,
  monto_final,
  fecha,
  hora_inicio,
  hora_fin,
  ubicacion,
  generos_confirmados,
  descripcion,
  estado,
  created_at,
  updated_at,
  cancelada_at
FROM public.events;

-- Nota: esta vista excluye intencionadamente las columnas de reseñas y calificaciones
-- (por ejemplo: calificacion_cliente, resena_cliente, calificacion_dj, resena_dj)
-- para que las exportaciones CSV realizadas desde Supabase no muestren columnas
-- vacías antes de que el evento haya ocurrido.
