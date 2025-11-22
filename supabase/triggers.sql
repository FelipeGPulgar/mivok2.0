-- supabase/triggers.sql
-- Trigger: al insertar en `messages`, crear una fila en `message_notifications`
-- Esto evita problemas con RLS desde el cliente y garantiza consistencia.

-- Función que inserta la notificación (usa SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.fn_create_message_notification()
RETURNS trigger AS $$
BEGIN
  -- Insertar notificación usando los datos del mensaje recién insertado
  INSERT INTO public.message_notifications (
    sender_id,
    receiver_id,
    sender_name,
    message_preview,
    message_id,
    is_read,
    created_at,
    updated_at
  ) VALUES (
    NEW.sender_id,
    NEW.receiver_id,
    -- Intentar extraer nombre desde metadata si existe
    COALESCE((NEW.metadata->'sender_name')::text, NULL),
    LEFT(NEW.content::text, 100),
    NEW.id,
    false,
    now(),
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que llame a la función despues de INSERT en messages
DROP TRIGGER IF EXISTS messages_create_notification ON public.messages;
CREATE TRIGGER messages_create_notification
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.fn_create_message_notification();

-- Nota: Para aplicar, pega este archivo en SQL Editor de Supabase y ejecútalo.
-- Asegúrate de revisar permisos y que el role que crea la función tenga los privilegios necesarios.
