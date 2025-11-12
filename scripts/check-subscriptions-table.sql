-- Script para verificar el estado actual de la tabla subscriptions
-- Ejecutar en la consola SQL de Supabase

-- PASO 2: Ver estructura detallada de la tabla existente
-- Ejecuta ESTA consulta ahora:
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASO 3: Ver constraints y claves
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'subscriptions'
AND tc.table_schema = 'public';

-- PASO 4: Verificar datos existentes (si los hay)
SELECT COUNT(*) as total_records FROM public.subscriptions;
