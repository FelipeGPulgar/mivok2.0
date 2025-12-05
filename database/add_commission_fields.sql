-- Agregar campos para el cálculo de comisión en proposals
ALTER TABLE public.proposals 
ADD COLUMN monto_sin_comision integer, -- El monto original que pone el usuario
ADD COLUMN porcentaje_comision numeric DEFAULT 10.0, -- Porcentaje de comisión (configurable)
ADD COLUMN monto_comision integer, -- Cuánto se cobra de comisión
ADD COLUMN monto_con_comision integer; -- Monto final que paga el cliente

-- Actualizar registros existentes para mantener compatibilidad
UPDATE public.proposals 
SET 
    monto_sin_comision = COALESCE(monto_sin_comision, monto),
    monto_comision = COALESCE(monto_comision, ROUND(monto * 0.10)),
    monto_con_comision = COALESCE(monto_con_comision, ROUND(monto * 1.10))
WHERE monto_sin_comision IS NULL OR monto_comision IS NULL OR monto_con_comision IS NULL;

-- Comentarios para documentar los campos
COMMENT ON COLUMN public.proposals.monto_sin_comision IS 'Monto base que recibirá el DJ (sin comisión)';
COMMENT ON COLUMN public.proposals.porcentaje_comision IS 'Porcentaje de comisión de la app (por defecto 10%)';
COMMENT ON COLUMN public.proposals.monto_comision IS 'Cantidad en pesos de la comisión';
COMMENT ON COLUMN public.proposals.monto_con_comision IS 'Monto total que paga el cliente (incluye comisión)';
COMMENT ON COLUMN public.proposals.monto IS 'DEPRECATED: usar monto_con_comision en su lugar';