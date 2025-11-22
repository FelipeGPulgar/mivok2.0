-- ============================================================================
-- INSTRUCCIONES: Ejecuta este código en el SQL Editor de Supabase
-- ============================================================================

-- 1. Copiar TODO el código de abajo
-- 2. Ir a Supabase Dashboard → Tu Proyecto → SQL Editor
-- 3. Click en "New Query"
-- 4. Pegar el código
-- 5. Click en "Run"

-- ============================================================================
-- CREAR TABLA dj_gallery_images
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dj_gallery_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  "order" integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_dj_gallery_user_id 
  ON public.dj_gallery_images(user_id);

CREATE INDEX IF NOT EXISTS idx_dj_gallery_order 
  ON public.dj_gallery_images(user_id, "order");

-- ============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.dj_gallery_images ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREAR POLÍTICAS RLS
-- ============================================================================

-- Política 1: Permitir que cualquiera VEA las fotos de galería
DROP POLICY IF EXISTS "Anyone can view DJ gallery images" ON public.dj_gallery_images;
CREATE POLICY "Anyone can view DJ gallery images" 
  ON public.dj_gallery_images 
  FOR SELECT 
  USING (true);

-- Política 2: Permitir que los usuarios CREEN sus propias fotos
DROP POLICY IF EXISTS "Users can insert their own gallery images" ON public.dj_gallery_images;
CREATE POLICY "Users can insert their own gallery images" 
  ON public.dj_gallery_images 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política 3: Permitir que los usuarios ACTUALICEN sus propias fotos
DROP POLICY IF EXISTS "Users can update their own gallery images" ON public.dj_gallery_images;
CREATE POLICY "Users can update their own gallery images" 
  ON public.dj_gallery_images 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Política 4: Permitir que los usuarios ELIMINEN sus propias fotos
DROP POLICY IF EXISTS "Users can delete their own gallery images" ON public.dj_gallery_images;
CREATE POLICY "Users can delete their own gallery images" 
  ON public.dj_gallery_images 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- CREAR STORAGE BUCKET (si aún no existe)
-- ============================================================================

-- Ir a Supabase Dashboard → Storage → Create new bucket
-- Nombre: dj_gallery
-- Public: SI (marcar "Make it public")

-- ============================================================================
-- POLÍTICAS PARA STORAGE (opcional, si las quieres)
-- ============================================================================

-- Nota: Las políticas de storage se configuran en el dashboard de Supabase
-- bajo Storage → dj_gallery → Policies

-- Política 1: Permitir lectura pública
-- Target roles: Public
-- Allowed operations: SELECT
-- With expression: true

-- Política 2: Permitir crear solo a usuarios autenticados
-- Target roles: Authenticated  
-- Allowed operations: INSERT
-- With expression: auth.uid() = CAST(storage.foldername(name) AS uuid)

-- Política 3: Permitir actualizar solo dueño
-- Target roles: Authenticated
-- Allowed operations: UPDATE
-- With expression: auth.uid() = CAST(storage.foldername(name) AS uuid)

-- Política 4: Permitir eliminar solo dueño
-- Target roles: Authenticated
-- Allowed operations: DELETE
-- With expression: auth.uid() = CAST(storage.foldername(name) AS uuid)

-- ============================================================================
-- ✅ LISTO! La tabla está creada y lista para usar
-- ============================================================================
