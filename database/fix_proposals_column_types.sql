-- Script para corregir los tipos de datos en la tabla proposals
-- Problema: Varios campos están definidos como DECIMAL(4,2) cuando deberían ser INTEGER

-- 1. Cambiar tipos de datos de campos de monto de DECIMAL(4,2) a INTEGER
ALTER TABLE public.proposals 
ALTER COLUMN monto TYPE INTEGER USING monto::INTEGER;

ALTER TABLE public.proposals 
ALTER COLUMN monto_sin_comision TYPE INTEGER USING monto_sin_comision::INTEGER;

ALTER TABLE public.proposals 
ALTER COLUMN monto_comision TYPE INTEGER USING monto_comision::INTEGER;

ALTER TABLE public.proposals 
ALTER COLUMN monto_con_comision TYPE INTEGER USING monto_con_comision::INTEGER;

-- 2. Cambiar horas_duracion de DECIMAL(4,2) a INTEGER
ALTER TABLE public.proposals 
ALTER COLUMN horas_duracion TYPE INTEGER USING horas_duracion::INTEGER;

-- 3. Mantener porcentaje_comision como DECIMAL(4,2) para valores como 0.10
-- (Este campo está correcto, no necesita cambio)

-- 4. Verificar los cambios
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'proposals' 
    AND table_schema = 'public'
    AND column_name IN (
        'monto', 
        'monto_sin_comision', 
        'monto_comision', 
        'monto_con_comision', 
        'horas_duracion', 
        'porcentaje_comision'
    )
ORDER BY column_name;