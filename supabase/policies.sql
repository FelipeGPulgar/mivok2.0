-- supabase/policies.sql
-- Políticas RLS recomendadas para Mivok (ajusta columnas si tu esquema difiere)
-- Instrucciones: Pega bloques en Supabase SQL Editor y ejecútalos.
-- Asegúrate de que Row Level Security esté habilitado para cada tabla en el Table Editor.

-- Habilitar Row Level Security en las tablas objetivo (ejecuta antes de crear policies)
ALTER TABLE IF EXISTS public.message_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- message_notifications
-- =====================================================================
-- Permitir INSERT solo si sender_id coincide con el usuario autenticado
DROP POLICY IF EXISTS "Users can insert message_notifications" ON public.message_notifications;

CREATE POLICY "Users can insert message_notifications"
  ON public.message_notifications
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Permitir SELECT solo para el receptor (ver sus notificaciones)
DROP POLICY IF EXISTS "Users can read their message_notifications" ON public.message_notifications;

CREATE POLICY "Users can read their message_notifications"
  ON public.message_notifications
  FOR SELECT
  USING (receiver_id = auth.uid());

-- Permitir UPDATE para marcar como leída sólo si receiver_id = auth.uid()
DROP POLICY IF EXISTS "Users can update their message_notifications" ON public.message_notifications;

CREATE POLICY "Users can update their message_notifications"
  ON public.message_notifications
  FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- (Opcional) Denegar DELETE por parte del cliente; dejar solo para administradores
-- DROP POLICY IF EXISTS "Deny deletes to clients" ON public.message_notifications;
-- CREATE POLICY "Deny deletes to clients" ON public.message_notifications FOR DELETE USING (false);


-- =====================================================================
-- messages
-- =====================================================================
-- Permitir INSERT si sender_id = auth.uid()
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

CREATE POLICY "Users can insert messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Permitir SELECT para el remitente o receptor
DROP POLICY IF EXISTS "Users can read messages" ON public.messages;

CREATE POLICY "Users can read messages"
  ON public.messages
  FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Permitir UPDATE para marcar como leído (receiver solamente)
DROP POLICY IF EXISTS "Users can update messages (mark read)" ON public.messages;

CREATE POLICY "Users can update messages (mark read)"
  ON public.messages
  FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());


-- =====================================================================
-- proposals
-- =====================================================================
-- Policies mínimas para proposals. Ajusta según tu flujo (quién crea proposals, quién puede verlas)
-- Permitir INSERT si sender_id = auth.uid() (asume que proposals tienen sender_id)
DROP POLICY IF EXISTS "Users can insert proposals" ON public.proposals;

CREATE POLICY "Users can insert proposals"
  ON public.proposals
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Permitir SELECT para las partes implicadas (sender o recipient)
DROP POLICY IF EXISTS "Users can read proposals" ON public.proposals;

CREATE POLICY "Users can read proposals"
  ON public.proposals
  FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Permitir UPDATE para aceptar/rechazar solo si recipient_id = auth.uid() OR sender_id = auth.uid() según tu lógica
DROP POLICY IF EXISTS "Users can update proposals" ON public.proposals;

CREATE POLICY "Users can update proposals"
  ON public.proposals
  FOR UPDATE
  USING (sender_id = auth.uid() OR recipient_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR recipient_id = auth.uid());


-- =====================================================================
-- events
-- =====================================================================
-- Permitir INSERT si client_id o dj_id coincide con auth.uid()
DROP POLICY IF EXISTS "Users can insert events" ON public.events;

CREATE POLICY "Users can insert events"
  ON public.events
  FOR INSERT
  WITH CHECK (client_id = auth.uid() OR dj_id = auth.uid());

-- Permitir SELECT solo a las partes implicadas
DROP POLICY IF EXISTS "Users can read their events" ON public.events;

CREATE POLICY "Users can read their events"
  ON public.events
  FOR SELECT
  USING (client_id = auth.uid() OR dj_id = auth.uid());

-- Permitir UPDATE (por ejemplo para cancelar) solo a las partes implicadas
DROP POLICY IF EXISTS "Users can update events" ON public.events;

CREATE POLICY "Users can update events"
  ON public.events
  FOR UPDATE
  USING (client_id = auth.uid() OR dj_id = auth.uid())
  WITH CHECK (client_id = auth.uid() OR dj_id = auth.uid());


-- =====================================================================
-- Consideraciones y notas
-- =====================================================================
-- 1) Estas policies son ejemplos razonables para un flujo típico. Si tu esquema usa otros nombres
--    de columnas (e.g., user_id en lugar de client_id) adapta las condiciones.
-- 2) Para operaciones administrativas (DELETE, o actualizaciones cruzadas), crea roles/policies
--    específicas o realiza esas operaciones desde un backend con la `service_role` key.
-- 3) Si quieres una política más restrictiva para 'events' que verifique que 'proposal_id' pertenece
--    al mismo client/dj, puedo generar una policy que haga un JOIN a 'proposals' dentro del USING/WITH CHECK.
--    Ejemplo avanzado (descomenta y ajusta si lo necesitas):
--
-- CREATE POLICY "Users can insert events only for their proposals" (CORRECTED)
--   ON public.events
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.proposals p
--       WHERE p.id = proposal_id
--         AND (p.client_id = auth.uid() OR p.dj_id = auth.uid())
--     )
--   );

-- Nota: use `proposal_id` (columna insertada) y las columnas reales `client_id`/`dj_id` del esquema.

-- 4) Pasos para aplicar:
--    - En Supabase Console -> SQL Editor, crea un nuevo query.
--    - Pega los bloques de arriba y ejecútalos.
--    - Verifica en Table Editor -> Policies que las policies estén activas.

-- 5) Pruebas después de aplicar:
--    - Inicia sesión con un usuario de prueba en la app Expo.
--    - Ejecuta el flujo que inserta en `message_notifications` y `events`.
--    - Confirma en Table Editor que las filas se crean.

-- Fin de archivo
