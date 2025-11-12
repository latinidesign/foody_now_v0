-- Script simple y seguro para crear tabla de suscripciones
-- Ejecutar paso a paso en la consola SQL de Supabase

-- OPCIÓN A: Si quieres recrear la tabla completamente (borra datos existentes)
-- DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- OPCIÓN B: Crear tabla nueva (recomendado)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Usuario (usar UUID sin referencia por ahora)
  user_id UUID NOT NULL,
  
  -- MercadoPago info
  mercadopago_preapproval_id TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  
  -- Plan info
  plan_id TEXT DEFAULT 'premium' NOT NULL,
  price DECIMAL(10,2) DEFAULT 48900.00 NOT NULL,
  currency TEXT DEFAULT 'ARS' NOT NULL,
  
  -- Fechas
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  
  -- Configuración
  auto_renewal BOOLEAN DEFAULT true,
  
  -- Constraints
  UNIQUE(user_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Habilitar RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Función para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
