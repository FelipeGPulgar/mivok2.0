-- ============================================================================
-- 🎛️ SQL PARA AGREGAR EQUIPAMIENTO A DJ_PROFILES
-- ============================================================================

-- 1. Agregar columnas a la tabla dj_profiles si no existen
ALTER TABLE dj_profiles 
ADD COLUMN IF NOT EXISTS cuenta_con_equipamiento VARCHAR(10) DEFAULT 'No',
ADD COLUMN IF NOT EXISTS equipamiento TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. Actualizar comentarios para documentación
COMMENT ON COLUMN dj_profiles.cuenta_con_equipamiento IS 'Indica si el DJ cuenta con equipamiento: Si, No, Parcial';
COMMENT ON COLUMN dj_profiles.equipamiento IS 'Array de nombres de equipamiento disponible';

-- 3. Verificar que la tabla tiene las columnas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'dj_profiles'
ORDER BY ordinal_position;
