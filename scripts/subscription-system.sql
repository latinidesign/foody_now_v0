-- ============================================================================
-- SISTEMA DE SUSCRIPCIONES FOODYNOW
-- ============================================================================
-- Este script crea toda la estructura de base de datos para el sistema de 
-- suscripciones con prueba gratuita y pagos con MercadoPago
-- ============================================================================

-- Crear tipos ENUM para suscripciones
CREATE TYPE subscription_status AS ENUM (
  'trial',        -- Período de prueba gratuito (30 días)
  'active',       -- Suscripción activa y pagada
  'expired',      -- Suscripción vencida
  'cancelled',    -- Suscripción cancelada por el usuario
  'suspended'     -- Suscripción suspendida por admin
);

CREATE TYPE payment_frequency AS ENUM (
  'monthly',      -- Pago mensual
  'yearly',       -- Pago anual (con descuento)
  'one_time'      -- Pago único
);

CREATE TYPE subscription_payment_status AS ENUM (
  'pending',      -- Pago pendiente
  'approved',     -- Pago aprobado
  'rejected',     -- Pago rechazado
  'refunded',     -- Pago reembolsado
  'cancelled'     -- Pago cancelado
);

-- ============================================================================
-- TABLA: subscription_plans
-- Define los diferentes planes de suscripción disponibles
-- ============================================================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,                    -- 'trial', 'basic_monthly', 'basic_yearly'
  display_name VARCHAR(100) NOT NULL,           -- 'Período de Prueba', 'Plan Básico Mensual'
  description TEXT,                             -- Descripción del plan
  price DECIMAL(10,2) NOT NULL DEFAULT 0,      -- Precio del plan (0 para trial)
  currency VARCHAR(3) DEFAULT 'ARS',           -- Moneda
  frequency payment_frequency NOT NULL,         -- Frecuencia de pago
  duration_days INTEGER NOT NULL,              -- Duración en días (30, 365, etc.)
  trial_days INTEGER DEFAULT 0,                -- Días de prueba incluidos
  is_trial BOOLEAN DEFAULT false,              -- Si es un plan de prueba
  is_active BOOLEAN DEFAULT true,              -- Si el plan está disponible
  features JSONB DEFAULT '[]',                 -- Características incluidas
  max_products INTEGER,                        -- Límite de productos (NULL = ilimitado)
  max_orders_per_month INTEGER,               -- Límite de pedidos por mes
  priority INTEGER DEFAULT 0,                  -- Orden de visualización
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TABLA: subscriptions
-- Gestiona las suscripciones de cada tienda
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'trial',
  
  -- Fechas del período de prueba
  trial_started_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  
  -- Fechas de suscripción pagada
  paid_started_at TIMESTAMP,
  paid_ends_at TIMESTAMP,
  
  -- Integración con MercadoPago
  mercadopago_subscription_id VARCHAR(255),    -- ID de suscripción en MP
  mercadopago_preapproval_id VARCHAR(255),     -- ID de preapproval en MP
  
  -- Configuración de renovación
  auto_renewal BOOLEAN DEFAULT true,           -- Renovación automática
  cancelled_at TIMESTAMP,                      -- Fecha de cancelación
  cancellation_reason TEXT,                    -- Motivo de cancelación
  
  -- Metadatos
  metadata JSONB DEFAULT '{}',                 -- Información adicional
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices y restricciones
  UNIQUE(store_id),                            -- Una suscripción por tienda
  CONSTRAINT valid_trial_dates CHECK (
    (trial_started_at IS NULL AND trial_ends_at IS NULL) OR
    (trial_started_at IS NOT NULL AND trial_ends_at IS NOT NULL AND trial_ends_at > trial_started_at)
  ),
  CONSTRAINT valid_paid_dates CHECK (
    (paid_started_at IS NULL AND paid_ends_at IS NULL) OR
    (paid_started_at IS NOT NULL AND paid_ends_at IS NOT NULL AND paid_ends_at > paid_started_at)
  )
);

-- ============================================================================
-- TABLA: subscription_payments
-- Registra todos los pagos relacionados con suscripciones
-- ============================================================================
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Información del pago
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  status subscription_payment_status NOT NULL DEFAULT 'pending',
  
  -- Integración con MercadoPago
  mercadopago_payment_id VARCHAR(255),         -- ID del pago en MP
  mercadopago_preference_id VARCHAR(255),      -- ID de preferencia en MP
  mercadopago_merchant_order_id VARCHAR(255),  -- ID de merchant order en MP
  
  -- Fechas importantes
  payment_date TIMESTAMP,                      -- Fecha de pago exitoso
  due_date TIMESTAMP,                          -- Fecha de vencimiento
  processed_at TIMESTAMP,                      -- Fecha de procesamiento
  
  -- Período que cubre este pago
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Metadatos
  payment_method VARCHAR(50),                  -- Método de pago usado
  payer_email VARCHAR(255),                    -- Email del pagador
  external_reference VARCHAR(255),             -- Referencia externa
  metadata JSONB DEFAULT '{}',                 -- Información adicional del webhook
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Restricciones
  CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- ============================================================================
-- TABLA: subscription_usage
-- Registra el uso de recursos por suscripción (para límites)
-- ============================================================================
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Período de medición
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Métricas de uso
  products_count INTEGER DEFAULT 0,            -- Productos creados
  orders_count INTEGER DEFAULT 0,              -- Pedidos procesados
  api_calls_count INTEGER DEFAULT 0,           -- Llamadas a API
  storage_used_mb INTEGER DEFAULT 0,           -- Almacenamiento usado en MB
  
  -- Metadatos
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Índice único por suscripción y período
  UNIQUE(subscription_id, period_start, period_end)
);

-- ============================================================================
-- MODIFICAR TABLA STORES
-- Agregar campos relacionados con suscripciones
-- ============================================================================
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'trial';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- ============================================================================
-- DATOS INICIALES - PLANES DE SUSCRIPCIÓN
-- ============================================================================
INSERT INTO subscription_plans (
  name, 
  display_name, 
  description, 
  price, 
  frequency, 
  duration_days, 
  trial_days,
  is_trial, 
  features,
  max_products,
  max_orders_per_month,
  priority
) VALUES 
-- Plan de prueba gratuito
(
  'trial',
  'Período de Prueba Gratuito',
  'Prueba FoodyNow gratis por 30 días. Accede a todas las funciones sin restricciones.',
  0.00,
  'one_time',
  30,
  30,
  true,
  '[
    "Tienda online completa",
    "Gestión de pedidos ilimitados",
    "WhatsApp Business integrado",
    "Estadísticas básicas",
    "Productos ilimitados",
    "Soporte por email"
  ]',
  NULL,
  NULL,
  1
),
-- Plan básico mensual
(
  'basic_monthly',
  'Plan Básico Mensual',
  'Plan ideal para empezar. Todas las funciones esenciales para tu tienda online.',
  29.99,
  'monthly',
  30,
  0,
  false,
  '[
    "Tienda online completa",
    "Gestión de pedidos ilimitados",
    "WhatsApp Business integrado",
    "Estadísticas avanzadas",
    "Productos ilimitados",
    "Soporte prioritario",
    "Personalización de marca",
    "Analytics detallados"
  ]',
  NULL,
  NULL,
  2
),
-- Plan básico anual (con descuento)
(
  'basic_yearly',
  'Plan Básico Anual',
  'Ahorra 20% pagando anualmente. Todas las funciones del plan mensual.',
  287.90,
  'yearly',
  365,
  0,
  false,
  '[
    "Tienda online completa",
    "Gestión de pedidos ilimitados",
    "WhatsApp Business integrado",
    "Estadísticas avanzadas",
    "Productos ilimitados",
    "Soporte prioritario",
    "Personalización de marca",
    "Analytics detallados",
    "Ahorro de 20% vs plan mensual"
  ]',
  NULL,
  NULL,
  3
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================
CREATE INDEX idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_trial_ends_at ON subscriptions(trial_ends_at);
CREATE INDEX idx_subscriptions_paid_ends_at ON subscriptions(paid_ends_at);
CREATE INDEX idx_subscriptions_mercadopago_id ON subscriptions(mercadopago_subscription_id);

CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX idx_subscription_payments_mercadopago_payment_id ON subscription_payments(mercadopago_payment_id);
CREATE INDEX idx_subscription_payments_payment_date ON subscription_payments(payment_date);

CREATE INDEX idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX idx_subscription_usage_period ON subscription_usage(period_start, period_end);

CREATE INDEX idx_stores_subscription_status ON stores(subscription_status);
CREATE INDEX idx_stores_subscription_expires_at ON stores(subscription_expires_at);

-- ============================================================================
-- FUNCIONES UTILITARIAS
-- ============================================================================

-- Función para verificar si una suscripción está activa
CREATE OR REPLACE FUNCTION is_subscription_active(subscription_row subscriptions)
RETURNS BOOLEAN AS $$
BEGIN
  -- Trial activo
  IF subscription_row.status = 'trial' AND 
     subscription_row.trial_ends_at > NOW() THEN
    RETURN TRUE;
  END IF;
  
  -- Suscripción pagada activa
  IF subscription_row.status = 'active' AND 
     subscription_row.paid_ends_at > NOW() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener días restantes de suscripción
CREATE OR REPLACE FUNCTION get_subscription_days_left(subscription_row subscriptions)
RETURNS INTEGER AS $$
BEGIN
  -- Si está en trial
  IF subscription_row.status = 'trial' AND subscription_row.trial_ends_at > NOW() THEN
    RETURN EXTRACT(DAY FROM subscription_row.trial_ends_at - NOW())::INTEGER;
  END IF;
  
  -- Si está en suscripción pagada
  IF subscription_row.status = 'active' AND subscription_row.paid_ends_at > NOW() THEN
    RETURN EXTRACT(DAY FROM subscription_row.paid_ends_at - NOW())::INTEGER;
  END IF;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- ============================================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plans_updated_at 
  BEFORE UPDATE ON subscription_plans 
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER subscription_payments_updated_at 
  BEFORE UPDATE ON subscription_payments 
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

-- Trigger para sincronizar estado de stores con subscriptions
CREATE OR REPLACE FUNCTION sync_store_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stores SET 
    subscription_status = NEW.status,
    subscription_expires_at = COALESCE(NEW.paid_ends_at, NEW.trial_ends_at)
  WHERE id = NEW.store_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_store_subscription_after_update
  AFTER UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_store_subscription_status();

CREATE TRIGGER sync_store_subscription_after_insert
  AFTER INSERT ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_store_subscription_status();

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================
COMMENT ON TABLE subscription_plans IS 'Planes de suscripción disponibles en FoodyNow';
COMMENT ON TABLE subscriptions IS 'Suscripciones activas de cada tienda';
COMMENT ON TABLE subscription_payments IS 'Historial de pagos de suscripciones';
COMMENT ON TABLE subscription_usage IS 'Métricas de uso por suscripción para control de límites';

COMMENT ON COLUMN subscriptions.status IS 'Estado actual de la suscripción';
COMMENT ON COLUMN subscriptions.trial_started_at IS 'Inicio del período de prueba gratuito';
COMMENT ON COLUMN subscriptions.trial_ends_at IS 'Fin del período de prueba gratuito';
COMMENT ON COLUMN subscriptions.paid_started_at IS 'Inicio de la suscripción pagada';
COMMENT ON COLUMN subscriptions.paid_ends_at IS 'Fin de la suscripción pagada';

-- ============================================================================
-- PERMISOS RLS (Row Level Security) - OPCIONAL
-- ============================================================================
-- Habilitar RLS para las nuevas tablas si es necesario
-- ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SCRIPT COMPLETADO
-- ============================================================================
SELECT 'Sistema de suscripciones creado exitosamente' AS resultado;
