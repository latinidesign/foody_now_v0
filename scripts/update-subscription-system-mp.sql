-- ============================================================================
-- ACTUALIZACIÓN: Sistema de Suscripciones con Planes Asociados de MercadoPago
-- ============================================================================

-- Agregar campos para integración con MercadoPago
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS mercadopago_plan_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mercadopago_preapproval_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mercadopago_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP;

-- Actualizar el tipo de estado para incluir nuevos estados
DO $$ 
BEGIN
    ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'past_due';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Primero verificar qué columnas existen y agregar las faltantes
DO $$
BEGIN
    -- Agregar trial_period_days si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' AND column_name = 'trial_period_days') THEN
        ALTER TABLE subscription_plans ADD COLUMN trial_period_days INTEGER DEFAULT 30;
    END IF;
    
    -- Agregar billing_frequency si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' AND column_name = 'billing_frequency') THEN
        ALTER TABLE subscription_plans ADD COLUMN billing_frequency VARCHAR(20) DEFAULT 'monthly';
    END IF;
END $$;

-- Actualizar plan existente con nuevos datos ($36000, 15 días trial) - SIN LA "a" EXTRA
UPDATE subscription_plans 
SET 
  price = 36000,
  trial_period_days = 15,
  display_name = 'Plan Básico Mensual',
  billing_frequency = 'monthly'
WHERE name = 'monthly';

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval ON subscriptions(mercadopago_preapproval_id);
CREATE INDEX IF NOT EXISTS idx_plans_mp_plan ON subscription_plans(mercadopago_plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- Actualizar función para verificar suscripción activa
CREATE OR REPLACE FUNCTION is_subscription_active(sub_status subscription_status, trial_end TIMESTAMP, paid_end TIMESTAMP)
RETURNS BOOLEAN AS $$
BEGIN
  CASE sub_status
    WHEN 'trial' THEN
      RETURN trial_end > NOW();
    WHEN 'active' THEN
      RETURN paid_end > NOW() OR paid_end IS NULL; -- NULL significa suscripción sin límite
    WHEN 'past_due' THEN
      RETURN paid_end > NOW() - INTERVAL '7 days'; -- Gracia de 7 días
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar estado de tienda con suscripción
CREATE OR REPLACE FUNCTION sync_store_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stores 
  SET 
    subscription_status = NEW.status,
    subscription_expires_at = COALESCE(NEW.next_billing_date, NEW.trial_ends_at)
  WHERE subscription_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_subscription_status ON subscriptions;
CREATE TRIGGER trigger_sync_subscription_status
  AFTER UPDATE OF status, next_billing_date, trial_ends_at
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_store_subscription_status();

-- Añadir columna para tracking de pagos en subscription_payments
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS billing_period_start TIMESTAMP;
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS billing_period_end TIMESTAMP;

-- Mostrar resumen de cambios
SELECT 'Base de datos actualizada para Suscripciones con Planes Asociados' AS resultado;

-- Mostrar plan actualizado
SELECT 
    name,
    display_name,
    price,
    trial_period_days,
    billing_frequency,
    mercadopago_plan_id
FROM subscription_plans 
WHERE name = 'monthly';