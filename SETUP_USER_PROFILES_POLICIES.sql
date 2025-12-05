-- POLÍTICAS PARA user_profiles
-- Ejecuta este script en Supabase SQL Editor para permitir registro de usuarios

-- Habilitar Row Level Security en user_profiles
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Crear constraint único en email si no existe (necesario para upsert)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'user_profiles_email_unique'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
    END IF;
END $$;

-- Política para permitir INSERT a todos (anon y authenticated)
DROP POLICY IF EXISTS "Users can create profiles" ON public.user_profiles;
CREATE POLICY "Users can create profiles"
  ON public.user_profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para permitir SELECT a todos
DROP POLICY IF EXISTS "Users can read profiles" ON public.user_profiles;
CREATE POLICY "Users can read profiles"
  ON public.user_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política para permitir UPDATE a todos
DROP POLICY IF EXISTS "Users can update profiles" ON public.user_profiles;
CREATE POLICY "Users can update profiles"
  ON public.user_profiles
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir DELETE a todos
DROP POLICY IF EXISTS "Users can delete profiles" ON public.user_profiles;
CREATE POLICY "Users can delete profiles"
  ON public.user_profiles
  FOR DELETE
  TO anon, authenticated
  USING (true);