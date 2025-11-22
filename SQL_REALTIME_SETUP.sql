-- ============================================================================
-- 📋 SQL PARA VERIFICAR Y CONFIGURAR SUPABASE REALTIME
-- ============================================================================

-- 1. VERIFICAR QUE LA TABLA MESSAGES EXISTE Y TIENE LA ESTRUCTURA CORRECTA
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- 2. VERIFICAR RLS POLICIES EN LA TABLA MESSAGES
SELECT * FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- 3. HABILITAR REALTIME EN LA TABLA MESSAGES (si no está ya habilitado)
-- Ejecuta esto en la consola de Supabase:
-- ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 4. CREAR POLÍTICA RLS PARA PERMITIR QUE LOS USUARIOS VEAN MENSAJES
-- (si no existe ya)
CREATE POLICY "Usuarios pueden ver sus propios mensajes"
ON public.messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- 5. CREAR POLÍTICA RLS PARA PERMITIR INSERT
CREATE POLICY "Usuarios pueden enviar mensajes"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
);

-- 6. CREAR POLÍTICA RLS PARA PERMITIR UPDATE
CREATE POLICY "Usuarios pueden actualizar sus mensajes"
ON public.messages
FOR UPDATE
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- 7. VERIFICAR QUE RLS ESTÁ HABILITADO EN LA TABLA
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'messages';

-- 8. INSERTA UN MENSAJE DE PRUEBA PARA VERIFICAR
INSERT INTO public.messages (
  sender_id, 
  receiver_id, 
  content, 
  content_type, 
  is_read
)
VALUES (
  'sender-id-aqui', 
  'receiver-id-aqui', 
  'Mensaje de prueba', 
  'text', 
  false
);
