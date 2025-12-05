-- ELIMINAR CONSTRAINT DE FOREIGN KEY EN user_profiles
-- Ejecuta este script en Supabase SQL Editor para permitir user_ids personalizados

-- Eliminar la foreign key constraint que requiere que user_id exista en auth.users
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- Opcional: Re-agregar constraint pero como NO VALID para no validar registros existentes
-- ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) NOT VALID;

-- Verificar que se eliminó correctamente
SELECT 
  conname AS constraint_name,
  confrelid::regclass AS foreign_table,
  confkey AS foreign_columns
FROM pg_constraint 
WHERE conrelid = 'public.user_profiles'::regclass 
  AND contype = 'f';