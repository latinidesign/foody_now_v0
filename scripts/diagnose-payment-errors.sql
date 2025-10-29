-- Script para simular webhook exitoso de MercadoPago
-- PASO 1: Verificar configuración de notificaciones

SELECT 'CONFIGURACIÓN DE NOTIFICACIONES:' as status;

-- Verificar WhatsApp
SELECT 
  s.name as tienda,
  s.slug,
  ss.wa_phone_number_id,
  ss.wa_access_token IS NOT NULL as wa_token_configured,
  LENGTH(ss.wa_access_token) as wa_token_length,
  ss.whatsapp_message
FROM stores s
LEFT JOIN store_settings ss ON s.id = ss.store_id
WHERE s.slug = 'pizzeria-don-mario';

-- PASO 2: Buscar la orden más reciente para usar en la prueba
SELECT 'ÓRDEN MÁS RECIENTE PARA PRUEBA:' as status;

SELECT 
  o.id as order_id,
  o.created_at,
  o.status,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.total,
  o.delivery_type,
  s.id as store_id,
  s.name as store_name
FROM orders o
JOIN stores s ON o.store_id = s.id
WHERE s.slug = 'pizzeria-don-mario'
  AND o.status = 'pending'
ORDER BY o.created_at DESC
LIMIT 3;


