-- 🔍 INVESTIGAR ESTRUCTURA DE TABLAS
-- Ejecutar primero para ver qué columnas existen

-- 1. Ver estructura de la tabla user_subscriptions
SELECT 
  'user_subscriptions' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver una muestra de user_subscriptions
SELECT * FROM user_subscriptions LIMIT 3;

-- 3. Ver estructura de stores nuevamente
SELECT 
  'stores' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'stores' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
