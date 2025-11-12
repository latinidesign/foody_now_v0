-- Script de migración para actualizar tabla subscriptions existente
-- IMPORTANTE: Este script modifica la estructura existente

-- PASO 1: Hacer backup de datos existentes (si los hay)
CREATE TABLE IF NOT EXISTS subscriptions_backup AS 
SELECT * FROM public.subscriptions;

-- PASO 2: Ver cuántos registros tenemos antes
SELECT 'Registros antes de migración:', COUNT(*) FROM public.subscriptions;

-- PASO 3: Agregar la columna user_id que necesitamos
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- PASO 4: Crear índice para user_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- PASO 5: Modificar el status para que sea compatible
-- Primero, agregar nueva columna status_text
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS status_text TEXT DEFAULT 'pending';

-- PASO 6: Migrar datos de status enum a status_text
UPDATE public.subscriptions 
SET status_text = CASE 
  WHEN status::text = 'trial' THEN 'active'
  WHEN status::text = 'active' THEN 'active' 
  WHEN status::text = 'cancelled' THEN 'cancelled'
  WHEN status::text = 'suspended' THEN 'suspended'
  ELSE 'pending'
END;

-- PASO 7: Agregar columnas faltantes para compatibilidad
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 48900.00;

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ARS';

-- PASO 8: Renombrar plan_id a plan_id_uuid para mantener compatibilidad
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS plan_id_text TEXT DEFAULT 'premium';

-- PASO 9: Habilitar RLS y crear políticas para user_id
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que puedan causar conflicto
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- Crear nuevas políticas basadas en user_id
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- PASO 10: Verificar resultado
SELECT 'Migración completada. Estructura final:';
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
