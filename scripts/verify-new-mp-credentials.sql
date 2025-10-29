-- Script para verificar las nuevas credenciales de MercadoPago
-- Verificar si están correctamente emparejadas

SELECT 'ANÁLISIS DE NUEVAS CREDENCIALES:' as status;

-- Nuevas credenciales proporcionadas
WITH new_credentials AS (
  SELECT 
    'APP_USR-67473974-b1df-4579-8f57-6f5879f2acfa' as public_key,
    'APP_USR-4543118004929687-102909-8b4281c83e08e131f0c4c4c51305fe0f-2933430096' as access_token
)
SELECT 
  public_key,
  access_token,
  -- Extraer collector_id del public key (es todo después de APP_USR-)
  SPLIT_PART(public_key, 'APP_USR-', 2) as public_key_collector_id,
  -- Extraer collector_id del access token (último número después del último guión)
  RIGHT(access_token, 10) as access_token_final_id,
  -- Para access token, el collector_id está en diferentes posiciones según el formato
  SPLIT_PART(SPLIT_PART(access_token, 'APP_USR-', 2), '-', 1) as access_token_first_part,
  -- Verificar si coinciden (para MercadoPago, pueden tener formatos diferentes pero pertenecer a la misma cuenta)
  CASE 
    WHEN SPLIT_PART(public_key, 'APP_USR-', 2) = RIGHT(access_token, 10) THEN 'MATCH DIRECTO'
    WHEN SPLIT_PART(public_key, 'APP_USR-', 2) = SPLIT_PART(SPLIT_PART(access_token, 'APP_USR-', 2), '-', 1) THEN 'POSIBLE MATCH'
    ELSE 'NO MATCH - VERIFICAR EN PANEL MP'
  END as credential_match_status
FROM new_credentials;

-- Comparar con credenciales actuales en BD
SELECT 'COMPARACIÓN CON CREDENCIALES ACTUALES:' as status;

SELECT 
  'ACTUAL' as tipo,
  ss.mercadopago_public_key as public_key,
  ss.mercadopago_access_token as access_token,
  SPLIT_PART(ss.mercadopago_public_key, 'APP_USR-', 2) as public_key_collector_id,
  SPLIT_PART(SPLIT_PART(ss.mercadopago_access_token, 'APP_USR-', 2), '-', 1) as access_token_collector_id
FROM stores s
LEFT JOIN store_settings ss ON s.id = ss.store_id
WHERE s.slug = 'pizzeria-don-mario'

UNION ALL

SELECT 
  'NUEVO' as tipo,
  'APP_USR-67473974-b1df-4579-8f57-6f5879f2acfa' as public_key,
  'APP_USR-4543118004929687-102909-8b4281c83e08e131f0c4c4c51305fe0f-2933430096' as access_token,
  '67473974-b1df-4579-8f57-6f5879f2acfa' as public_key_collector_id,
  '4543118004929687' as access_token_collector_id;
