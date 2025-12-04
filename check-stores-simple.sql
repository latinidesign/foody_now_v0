-- 📊 REPORTE SIMPLE DE TIENDAS - VERSIÓN BÁSICA
-- Ejecutar primero para ver qué columnas existen

-- 1. Ver estructura de la tabla stores
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'stores' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver todas las tiendas con todas sus columnas
SELECT * FROM stores LIMIT 5;

-- 3. Si las columnas existen, mostrar resumen básico
SELECT 
  name as tienda,
  email,
  is_active,
  created_at,
  updated_at
FROM stores
ORDER BY created_at DESC;
