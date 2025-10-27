-- Script para verificar la configuración actual de WhatsApp
-- Ejecutar en Supabase SQL Editor

SELECT 
  'CONFIGURACIÓN DE WHATSAPP POR TIENDA:' as status;

SELECT 
  s.name as tienda,
  s.slug as slug,
  ss.wa_phone_number_id as phone_number_id,
  CASE 
    WHEN ss.wa_access_token IS NOT NULL 
    THEN CONCAT('***', RIGHT(ss.wa_access_token, 4))
    ELSE NULL 
  END as access_token_hidden,
  ss.wa_business_account_id as business_account_id,
  ss.wa_api_version as api_version,
  ss.whatsapp_number as whatsapp_personal
FROM stores s
LEFT JOIN store_settings ss ON s.id = ss.store_id
ORDER BY s.name;

SELECT 'CAMPOS FALTANTES:' as status;

SELECT 
  s.name as tienda,
  CASE WHEN ss.wa_phone_number_id IS NULL THEN '❌ Phone Number ID faltante' ELSE '✅ Phone Number ID ok' END as phone_check,
  CASE WHEN ss.wa_access_token IS NULL THEN '❌ Access Token faltante' ELSE '✅ Access Token ok' END as token_check,
  CASE WHEN ss.wa_business_account_id IS NULL THEN '⚠️ Business Account ID faltante' ELSE '✅ Business Account ID ok' END as business_check
FROM stores s
LEFT JOIN store_settings ss ON s.id = ss.store_id
ORDER BY s.name;
