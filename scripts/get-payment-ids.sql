-- ===================================================================
-- SCRIPT PARA OBTENER PAYMENT IDS DE SUPABASE
-- ===================================================================
-- Este script te permite buscar payment IDs almacenados en la base de datos
-- Descomenta las consultas que necesites usar

-- 1. OBTENER TODOS LOS PAYMENT IDS RECIENTES (últimos 50)
-- ===================================================================
SELECT 
  p.id as payment_uuid,
  p.provider_payment_id,
  p.mp_payment_id,
  p.preference_id,
  p.provider,
  p.status,
  p.transaction_amount,
  p.currency,
  p.payer_email,
  o.customer_name,
  o.total as order_total,
  s.name as store_name,
  p.created_at
FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
LEFT JOIN stores s ON p.store_id = s.id
ORDER BY p.created_at DESC
LIMIT 50;

-- 2. BUSCAR PAYMENT ID POR ORDER ID (reemplaza 'ORDER_ID_AQUI')
-- ===================================================================
-- SELECT 
--   p.id as payment_uuid,
--   p.provider_payment_id,
--   p.mp_payment_id,
--   p.preference_id,
--   p.status,
--   p.transaction_amount,
--   o.id as order_id,
--   o.customer_name,
--   o.payment_id as order_payment_id_field,
--   p.created_at
-- FROM payments p
-- LEFT JOIN orders o ON p.order_id = o.id
-- WHERE o.id = 'ORDER_ID_AQUI';

-- 3. BUSCAR PAYMENT ID POR CUSTOMER EMAIL (reemplaza 'email@example.com')
-- ===================================================================
-- SELECT 
--   p.id as payment_uuid,
--   p.provider_payment_id,
--   p.mp_payment_id,
--   p.preference_id,
--   p.status,
--   p.transaction_amount,
--   p.payer_email,
--   o.customer_name,
--   o.customer_email,
--   s.name as store_name,
--   p.created_at
-- FROM payments p
-- LEFT JOIN orders o ON p.order_id = o.id
-- LEFT JOIN stores s ON p.store_id = s.id
-- WHERE p.payer_email = 'email@example.com' 
--    OR o.customer_email = 'email@example.com'
-- ORDER BY p.created_at DESC;

-- 4. BUSCAR PAYMENT ID POR STORE SLUG (reemplaza 'store-slug')
-- ===================================================================
-- SELECT 
--   p.id as payment_uuid,
--   p.provider_payment_id,
--   p.mp_payment_id,
--   p.preference_id,
--   p.status,
--   p.transaction_amount,
--   s.slug as store_slug,
--   s.name as store_name,
--   o.customer_name,
--   p.created_at
-- FROM payments p
-- LEFT JOIN orders o ON p.order_id = o.id
-- LEFT JOIN stores s ON p.store_id = s.id
-- WHERE s.slug = 'store-slug'
-- ORDER BY p.created_at DESC;

-- 5. BUSCAR PAYMENT ID POR CUSTOMER NAME (reemplaza 'Juan Pérez')
-- ===================================================================
-- SELECT 
--   p.id as payment_uuid,
--   p.provider_payment_id,
--   p.mp_payment_id,
--   p.preference_id,
--   p.status,
--   p.transaction_amount,
--   o.customer_name,
--   o.customer_phone,
--   s.name as store_name,
--   p.created_at
-- FROM payments p
-- LEFT JOIN orders o ON p.order_id = o.id
-- LEFT JOIN stores s ON p.store_id = s.id
-- WHERE o.customer_name ILIKE '%Juan Pérez%'
-- ORDER BY p.created_at DESC;

-- 6. BUSCAR PAYMENT ID POR MERCADOPAGO PAYMENT ID (reemplaza 'MP_PAYMENT_ID')
-- ===================================================================
-- SELECT 
--   p.id as payment_uuid,
--   p.provider_payment_id,
--   p.mp_payment_id,
--   p.preference_id,
--   p.status,
--   p.transaction_amount,
--   o.customer_name,
--   s.name as store_name,
--   p.created_at
-- FROM payments p
-- LEFT JOIN orders o ON p.order_id = o.id
-- LEFT JOIN stores s ON p.store_id = s.id
-- WHERE p.mp_payment_id = 'MP_PAYMENT_ID'
--    OR p.provider_payment_id = 'MP_PAYMENT_ID';

-- 7. BUSCAR PAYMENT IDS POR RANGO DE FECHAS (últimos 7 días)
-- ===================================================================
-- SELECT 
--   p.id as payment_uuid,
--   p.provider_payment_id,
--   p.mp_payment_id,
--   p.preference_id,
--   p.status,
--   p.transaction_amount,
--   o.customer_name,
--   s.name as store_name,
--   p.created_at
-- FROM payments p
-- LEFT JOIN orders o ON p.order_id = o.id
-- LEFT JOIN stores s ON p.store_id = s.id
-- WHERE p.created_at >= NOW() - INTERVAL '7 days'
-- ORDER BY p.created_at DESC;

-- 8. BUSCAR PAYMENT IDS POR STATUS (reemplaza 'approved' por el status que necesites)
-- ===================================================================
-- SELECT 
--   p.id as payment_uuid,
--   p.provider_payment_id,
--   p.mp_payment_id,
--   p.preference_id,
--   p.status,
--   p.transaction_amount,
--   o.customer_name,
--   s.name as store_name,
--   p.created_at
-- FROM payments p
-- LEFT JOIN orders o ON p.order_id = o.id
-- LEFT JOIN stores s ON p.store_id = s.id
-- WHERE p.status = 'approved'
-- ORDER BY p.created_at DESC;

-- 9. BUSCAR PAYMENT ID POR MONTO ESPECÍFICO (reemplaza 1500.00)
-- ===================================================================
-- SELECT 
--   p.id as payment_uuid,
--   p.provider_payment_id,
--   p.mp_payment_id,
--   p.preference_id,
--   p.status,
--   p.transaction_amount,
--   o.customer_name,
--   s.name as store_name,
--   p.created_at
-- FROM payments p
-- LEFT JOIN orders o ON p.order_id = o.id
-- LEFT JOIN stores s ON p.store_id = s.id
-- WHERE p.transaction_amount = 1500.00
-- ORDER BY p.created_at DESC;

-- 10. PAYMENT IDS CON INFORMACIÓN COMPLETA DE LA ORDEN
-- ===================================================================
-- SELECT 
--   p.id as payment_uuid,
--   p.provider_payment_id,
--   p.mp_payment_id,
--   p.preference_id,
--   p.status as payment_status,
--   p.transaction_amount,
--   p.currency,
--   p.payer_email,
--   o.id as order_id,
--   o.customer_name,
--   o.customer_phone,
--   o.customer_email,
--   o.total as order_total,
--   o.status as order_status,
--   o.payment_status as order_payment_status,
--   o.delivery_type,
--   s.name as store_name,
--   s.slug as store_slug,
--   p.created_at as payment_created,
--   o.created_at as order_created
-- FROM payments p
-- LEFT JOIN orders o ON p.order_id = o.id
-- LEFT JOIN stores s ON p.store_id = s.id
-- ORDER BY p.created_at DESC
-- LIMIT 20;

-- ===================================================================
-- NOTAS DE USO:
-- ===================================================================
-- 1. Descomenta la consulta que necesites (quita los -- al inicio)
-- 2. Reemplaza los valores placeholder (como 'ORDER_ID_AQUI') con valores reales
-- 3. Los campos más importantes son:
--    - provider_payment_id: ID del proveedor de pago (MercadoPago, etc.)
--    - mp_payment_id: ID específico de MercadoPago 
--    - preference_id: ID de preferencia de MercadoPago
--    - id: UUID interno de Supabase para el payment
-- 4. Para buscar por múltiples criterios, combina las condiciones WHERE con AND/OR
--
-- EJEMPLO DE BÚSQUEDA COMBINADA:
-- SELECT * FROM payments p 
-- LEFT JOIN orders o ON p.order_id = o.id 
-- WHERE p.status = 'approved' 
--   AND p.transaction_amount > 1000 
--   AND p.created_at >= '2024-01-01';
