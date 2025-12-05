-- Actualizar registros existentes para calcular los valores de comisión
-- Solo ejecutar este UPDATE, no el ALTER TABLE

-- Actualizar registros que no tienen los campos de comisión poblados
UPDATE public.proposals 
SET 
    monto_sin_comision = COALESCE(monto_sin_comision, monto),
    porcentaje_comision = COALESCE(porcentaje_comision, 10.0),
    monto_comision = COALESCE(monto_comision, ROUND(monto * 0.10)),
    monto_con_comision = COALESCE(monto_con_comision, ROUND(monto * 1.10))
WHERE monto_sin_comision IS NULL OR monto_comision IS NULL OR monto_con_comision IS NULL OR porcentaje_comision IS NULL;

-- Verificar cuántos registros se actualizaron
SELECT 
    COUNT(*) as total_propuestas,
    COUNT(monto_sin_comision) as con_monto_sin_comision,
    COUNT(monto_comision) as con_monto_comision,
    COUNT(monto_con_comision) as con_monto_con_comision
FROM public.proposals;