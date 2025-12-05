-- Crear tabla para trackear el modo actual del usuario (cliente o DJ)
CREATE TABLE IF NOT EXISTS public.user_current_mode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_mode VARCHAR(10) NOT NULL CHECK (current_mode IN ('cliente', 'dj')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_current_mode ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo pueden ver/editar su propio modo
CREATE POLICY "Users can manage own mode" ON public.user_current_mode
    FOR ALL USING (auth.uid() = user_id);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_user_mode_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
CREATE TRIGGER update_user_mode_timestamp
    BEFORE UPDATE ON public.user_current_mode
    FOR EACH ROW
    EXECUTE FUNCTION update_user_mode_timestamp();

-- Comentario
COMMENT ON TABLE public.user_current_mode IS 'Trackea el modo actual del usuario: cliente o dj';