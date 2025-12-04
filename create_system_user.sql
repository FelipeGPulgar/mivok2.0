-- ============================================================================
-- CREAR USUARIO DE SISTEMA (KushkiPagos)
-- ============================================================================

-- Este script inserta un usuario "dummy" en auth.users para que
-- los mensajes del sistema no violen la restricción de clave foránea.

-- 1. Insertar en auth.users (usando el ID 0000...)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- instance_id (dummy)
  '00000000-0000-0000-0000-000000000000', -- UUID del sistema
  'authenticated',
  'authenticated',
  'system@kushkipagos.com',
  '$2a$10$SYSTEMPASSWORDHASHPLACEHOLDER000000000000000000', -- Password dummy
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"KushkiPagos System"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Insertar en user_profiles para que tenga nombre y foto
INSERT INTO public.user_profiles (
  user_id,
  first_name,
  last_name,
  email,
  is_dj,
  foto_url,
  descripcion
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'KushkiPagos',
  'System',
  'system@kushkipagos.com',
  false,
  'https://ui-avatars.com/api/?name=Kushki+Pagos&background=10B981&color=fff', -- Avatar verde
  'Sistema de pagos automatizado'
) ON CONFLICT (user_id) DO NOTHING;

-- 3. Asegurar que el RPC funcione (re-grant por si acaso)
GRANT EXECUTE ON FUNCTION send_system_message(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_system_message(UUID, TEXT) TO service_role;
