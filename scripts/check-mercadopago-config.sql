-- Script para verificar la configuración REAL de MercadoPago
-- Para Checkout Pro, ambos ambientes (TEST y PROD) usan formato APP_USR-
-- La diferencia está en los collector_id específicos

SELECT 
  'CREDENCIALES ACTUALES DE MERCADOPAGO:' as status;

SELECT 
  s.name as tienda,
  s.slug as slug,
  ss.mercadopago_access_token as access_token_completo,
  ss.mercadopago_public_key as public_key_completo,
  -- Extraer los collector_id de las credenciales para compararlos
  CASE 
    WHEN ss.mercadopago_access_token LIKE 'APP_USR-%' THEN 
      SPLIT_PART(SPLIT_PART(ss.mercadopago_access_token, 'APP_USR-', 2), '-', 1)
    ELSE 'NO_COLLECTOR_ID'
  END as access_token_collector_id,
  CASE 
    WHEN ss.mercadopago_public_key LIKE 'APP_USR-%' THEN 
      SPLIT_PART(ss.mercadopago_public_key, 'APP_USR-', 2)
    ELSE 'NO_COLLECTOR_ID'
  END as public_key_collector_id
FROM stores s
LEFT JOIN store_settings ss ON s.id = ss.store_id
WHERE s.slug = 'pizzeria-don-mario';

-- Información adicional para identificar ambiente
SELECT 
  'GUÍA PARA IDENTIFICAR AMBIENTE REAL:' as status;

SELECT 
  'Para MercadoPago Checkout Pro:' as info,
  '1. TEST: Access token comienza con TEST-' as test_format,
  '2. PRODUCTION: Access token comienza con APP_USR- (mismo que tu Public Key)' as prod_format,
  '3. Si ambos empiezan con APP_USR-, revisar collector_id en respuestas de API' as verification_method,
  '4. TEST collector_id: números específicos de sandbox (ej: 123456789)' as test_collector,
  '5. PROD collector_id: tu collector_id real de producción' as prod_collector;


