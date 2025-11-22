-- ============================================================================
-- Crear tabla dj_gallery_images para almacenar fotos de galería de DJs
-- ============================================================================

-- Crear tabla
CREATE TABLE IF NOT EXISTS dj_gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_dj_gallery_user_id ON dj_gallery_images(user_id);
CREATE INDEX IF NOT EXISTS idx_dj_gallery_order ON dj_gallery_images(user_id, "order");

-- Habilitar RLS (Row Level Security)
ALTER TABLE dj_gallery_images ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Políticas RLS (Row Level Security)
-- ============================================================================

-- Permitir que los usuarios vean las fotos de cualquier DJ
CREATE POLICY "Anyone can view DJ gallery images" ON dj_gallery_images
  FOR SELECT
  USING (true);

-- Permitir que los DJs inserten sus propias fotos
CREATE POLICY "Users can insert their own gallery images" ON dj_gallery_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir que los DJs actualicen sus propias fotos
CREATE POLICY "Users can update their own gallery images" ON dj_gallery_images
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir que los DJs eliminen sus propias fotos
CREATE POLICY "Users can delete their own gallery images" ON dj_gallery_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Comentarios para documentación
-- ============================================================================

COMMENT ON TABLE dj_gallery_images IS 'Almacena fotos de galería de los DJs para que los clientes vean al buscar';
COMMENT ON COLUMN dj_gallery_images.id IS 'ID único de la foto en galería';
COMMENT ON COLUMN dj_gallery_images.user_id IS 'ID del usuario DJ propietario de la foto (referencia a auth.users)';
COMMENT ON COLUMN dj_gallery_images.image_url IS 'URL pública de la imagen en Supabase Storage';
COMMENT ON COLUMN dj_gallery_images."order" IS 'Orden de visualización (0 = primera, 1 = segunda, etc)';
COMMENT ON COLUMN dj_gallery_images.created_at IS 'Fecha de creación';
COMMENT ON COLUMN dj_gallery_images.updated_at IS 'Fecha de última actualización';
