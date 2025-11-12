-- Crear tabla de suscripciones
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Usuario asociado
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Información de MercadoPago
  mercadopago_subscription_id TEXT UNIQUE,
  mercadopago_preapproval_id TEXT UNIQUE,
  mercadopago_payer_id TEXT,
  
  -- Estado de la suscripción
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  
  -- Información del plan
  plan_id TEXT NOT NULL DEFAULT 'premium',
  price DECIMAL(10,2) NOT NULL DEFAULT 48900.00,
  currency TEXT NOT NULL DEFAULT 'ARS',
  
  -- Fechas importantes
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Información adicional
  auto_renewal BOOLEAN DEFAULT true,
  payment_method_id TEXT,
  
  UNIQUE(user_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mercadopago_id ON public.subscriptions(mercadopago_subscription_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias suscripciones
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propias suscripciones
CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propias suscripciones
CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo (opcional, para testing)
-- INSERT INTO public.subscriptions (user_id, status, trial_start_date, trial_end_date) 
-- VALUES (auth.uid(), 'active', now(), now() + interval '15 days');
