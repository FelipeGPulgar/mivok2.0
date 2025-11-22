-- ============================================================================
-- POLÍTICAS DE STORAGE PARA BUCKET: dj_gallery
-- ============================================================================
-- Ejecuta este código en Supabase SQL Editor

-- ============================================================================
-- POLÍTICA 1: Permitir lectura pública (cualquiera puede VER las fotos)
-- ============================================================================
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'dj_gallery');

-- ============================================================================
-- POLÍTICA 2: Permitir que usuarios autenticados SUBAN fotos en su carpeta
-- ============================================================================
CREATE POLICY "Authenticated users can upload to their folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'dj_gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- POLÍTICA 3: Permitir que usuarios actualicen sus propias fotos
-- ============================================================================
CREATE POLICY "Authenticated users can update their files" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'dj_gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'dj_gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- POLÍTICA 4: Permitir que usuarios eliminen sus propias fotos
-- ============================================================================
CREATE POLICY "Authenticated users can delete their files" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'dj_gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- ✅ LISTO! Las políticas están creadas
-- ============================================================================
