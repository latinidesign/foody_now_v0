-- Script para agregar soporte de trial a tabla existente user_subscriptions
-- Ejecutar este script si la tabla ya existe

-- 1. Agregar 'trial' como status válido
ALTER TABLE public.user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_status_check 
CHECK (status IN ('pending', 'trial', 'active', 'suspended', 'cancelled'));

-- 2. Agregar campos de trial si no existen
DO $$ 
BEGIN
    -- Agregar trial_start_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'trial_start_date'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD COLUMN trial_start_date TIMESTAMPTZ;
    END IF;

    -- Agregar trial_end_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'trial_end_date'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD COLUMN trial_end_date TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Actualizar precio por defecto
ALTER TABLE public.user_subscriptions 
ALTER COLUMN price SET DEFAULT 36000.00;

-- 4. Crear índice para consultas de trial
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_trial_end 
ON public.user_subscriptions(trial_end_date) 
WHERE status = 'trial';

-- 5. Crear función para verificar trial expirado
CREATE OR REPLACE FUNCTION check_trial_expired()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el status es 'trial' y la fecha de fin de trial ha pasado
    IF NEW.status = 'trial' AND NEW.trial_end_date < NOW() THEN
        NEW.status = 'cancelled';
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para verificar automáticamente trial expirado
DROP TRIGGER IF EXISTS trigger_check_trial_expired ON public.user_subscriptions;
CREATE TRIGGER trigger_check_trial_expired
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION check_trial_expired();

-- 7. Comentarios para documentar los cambios
COMMENT ON COLUMN public.user_subscriptions.trial_start_date IS 'Fecha de inicio del período de prueba gratuito';
COMMENT ON COLUMN public.user_subscriptions.trial_end_date IS 'Fecha de fin del período de prueba gratuito';
COMMENT ON CONSTRAINT user_subscriptions_status_check ON public.user_subscriptions IS 'Estados válidos: pending, trial, active, suspended, cancelled';

-- Verificación final
SELECT 'Script ejecutado correctamente. Tabla user_subscriptions actualizada con soporte de trial.' as resultado;
