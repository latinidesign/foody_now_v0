-- Opción alternativa: Crear nueva tabla con nombre diferente
-- Esta opción es más segura y no toca la tabla existente

-- Crear tabla user_subscriptions (nuevo nombre)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Usuario asociado
  user_id UUID NOT NULL,
  
  -- Información de MercadoPago
  mercadopago_subscription_id TEXT,
  mercadopago_preapproval_id TEXT UNIQUE,
  mercadopago_payer_id TEXT,
  
  -- Estado de la suscripción
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'trial', 'active', 'suspended', 'cancelled')),
  
  -- Información del plan
  plan_id TEXT NOT NULL DEFAULT 'premium',
  price DECIMAL(10,2) NOT NULL DEFAULT 36000.00,
  currency TEXT NOT NULL DEFAULT 'ARS',
  
  -- Fechas importantes
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  subscription_start_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Información adicional
  auto_renewal BOOLEAN DEFAULT true,
  payment_method_id TEXT,
  
  UNIQUE(user_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Habilitar RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own user_subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_subscription" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Función para updated_at
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger
CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_user_subscriptions_updated_at();
