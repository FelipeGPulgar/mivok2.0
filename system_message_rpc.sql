-- ============================================================================
-- FUNCIÓN RPC PARA ENVIAR MENSAJES DE SISTEMA (BYPASS RLS)
-- ============================================================================

-- Esta función permite insertar mensajes desde el "Sistema" (ID 0000...)
-- sin que las políticas RLS del usuario actual lo bloqueen.
-- Se debe ejecutar en el SQL Editor de Supabase.

CREATE OR REPLACE FUNCTION send_system_message(
  p_receiver_id UUID,
  p_content TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANTE: Esto permite que la función se ejecute con permisos de admin/creador
AS $$
DECLARE
  v_msg JSONB;
  v_system_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Insertar el mensaje
  INSERT INTO messages (sender_id, receiver_id, content, content_type, metadata, is_read)
  VALUES (
    v_system_id,
    p_receiver_id,
    p_content,
    'text',
    '{"system": true}',
    false
  )
  RETURNING to_jsonb(messages.*) INTO v_msg;
  
  -- Opcional: Crear también la notificación en message_notifications si tu sistema lo usa
  -- (Depende de si tienes triggers automáticos o no)
  
  RETURN v_msg;
END;
$$;

-- Asegurar que los usuarios autenticados puedan llamar a esta función
GRANT EXECUTE ON FUNCTION send_system_message(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_system_message(UUID, TEXT) TO service_role;

-- ============================================================================
-- OPCIÓN ALTERNATIVA: RELAX RLS (Si no quieres usar RPC)
-- ============================================================================
-- Si prefieres modificar las políticas en lugar de usar una función:

-- DROP POLICY IF EXISTS "Users can insert system messages" ON public.messages;
-- CREATE POLICY "Users can insert system messages" ON public.messages 
-- FOR INSERT WITH CHECK (
--   sender_id = '00000000-0000-0000-0000-000000000000'::uuid
-- );
