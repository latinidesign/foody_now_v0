# 🔧 QUERIES SQL PARA AUDITORÍA Y LIMPIEZA - Supabase FoodyNow

**Fecha:** 29 de marzo de 2026  
**Propósito:** Queries reutilizables para investigación y limpieza de schema

---

## 📋 TABLA DE CONTENIDOS

1. [Queries de Investigación (FASE 1)](#fase-1-investigación)
2. [Queries de Validación (FASE 6)](#fase-6-validación)
3. [Queries de Diagnóstico](#diagnóstico)
4. [Queries de Limpieza](#limpieza)

---

## FASE 1: INVESTIGACIÓN

### 1.1 Investigar user_subscriptions

```sql
-- Ver estructura
DESC user_subscriptions;

-- Ver datos completos
SELECT * FROM user_subscriptions;

-- Ver conteo
SELECT COUNT(*) as total_registros FROM user_subscriptions;

-- Ver fechas
SELECT 
  MIN(created_at) as created_min,
  MAX(created_at) as created_max,
  MIN(updated_at) as updated_min,
  MAX(updated_at) as updated_max
FROM user_subscriptions;

-- Ver distribución de status
SELECT status, COUNT(*) as cantidad
FROM user_subscriptions
GROUP BY status;

-- Comparar con subscriptions (por tienda)
SELECT 
  COUNT(*) as user_subs_count,
  (SELECT COUNT(*) FROM subscriptions) as store_subs_count;

-- Ver si hay FKs hacia auth.users
SELECT 
  constraint_name, 
  table_name, 
  column_name,
  referenced_table
FROM information_schema.key_column_usage
WHERE table_name='user_subscriptions';
```

---

### 1.2 Revisar stores.subdomain

```sql
-- Ver columnas slug y subdomain
SELECT 
  id,
  name,
  slug,
  subdomain,
  CASE 
    WHEN slug = subdomain THEN 'IGUALES'
    WHEN slug IS NULL THEN 'slug NULL'
    WHEN subdomain IS NULL THEN 'subdomain NULL'
    ELSE 'DIFERENTES'
  END as comparacion
FROM stores;

-- Contar nulos
SELECT 
  COUNT(*) as total,
  COUNT(slug) as slug_no_null,
  COUNT(subdomain) as subdomain_no_null,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as slug_nulls,
  COUNT(CASE WHEN subdomain IS NULL THEN 1 END) as subdomain_nulls
FROM stores;

-- Ver índices en ambas columnas
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename='stores' 
  AND (indexname LIKE '%slug%' OR indexname LIKE '%subdomain%');

-- Buscar diferencias
SELECT 
  id, name, slug, subdomain
FROM stores
WHERE slug != subdomain
  OR (slug IS NULL AND subdomain IS NOT NULL)
  OR (slug IS NOT NULL AND subdomain IS NULL);
```

---

### 1.3 Revisar triggers duplicados en subscriptions

```sql
-- Ver todos los triggers de subscriptions
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table='subscriptions'
ORDER BY trigger_name;

-- Ver qué función ejecuta cada uno
SELECT 
  trigger_name,
  action_statement,
  SUBSTRING(action_statement, 'FUNCTION (.*)\(\)') as function_name
FROM information_schema.triggers
WHERE event_object_table='subscriptions';

-- Ver definición de funciones
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name IN (
  SELECT SUBSTRING(action_statement, 'FUNCTION (.*)\(\)')
  FROM information_schema.triggers
  WHERE event_object_table='subscriptions'
);

-- Contar triggers UPDATE en subscriptions
SELECT COUNT(*) as update_triggers
FROM information_schema.triggers
WHERE event_object_table='subscriptions' 
  AND event_manipulation='UPDATE';
```

---

### 1.4 Revisar checkout_sessions en uso

```sql
-- Resumen general
SELECT 
  COUNT(*) as total_sesiones,
  COUNT(DISTINCT store_id) as tiendas_con_sesiones,
  COUNT(DISTINCT order_id) as ordenes_con_sesion,
  MIN(created_at) as sesion_mas_vieja,
  MAX(created_at) as sesion_mas_nueva
FROM checkout_sessions;

-- Sesiones sin orden asociada
SELECT 
  COUNT(*) as sesiones_sin_order,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM checkout_sessions) as porcentaje
FROM checkout_sessions
WHERE order_id IS NULL;

-- Órdenes sin sesión de checkout
SELECT 
  COUNT(*) as ordenes_sin_sesion_checkout
FROM orders
WHERE id NOT IN (
  SELECT DISTINCT order_id 
  FROM checkout_sessions 
  WHERE order_id IS NOT NULL
);

-- Ver tamaño de cada sesión (JSONB)
SELECT 
  id,
  octet_length(items::text) as items_bytes,
  octet_length(order_data::text) as order_data_bytes,
  octet_length(preference_payload::text) as preference_payload_bytes,
  created_at
FROM checkout_sessions
ORDER BY (
  octet_length(items::text) + 
  octet_length(order_data::text) + 
  octet_length(preference_payload::text)
) DESC
LIMIT 10;

-- Edad de las sesiones
SELECT 
  DATE_TRUNC('month', created_at)::DATE as mes,
  COUNT(*) as sesiones,
  ROUND(AVG(pg_column_size(to_json(checkout_sessions)))/1024.0, 2) as tamaño_promedio_kb
FROM checkout_sessions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- Relación con payments
SELECT 
  COUNT(*) as total_checkout,
  COUNT(DISTINCT cs.payment_id) as checkout_con_payment_id,
  COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as checkout_con_payment_en_tabla
FROM checkout_sessions cs
LEFT JOIN payments p ON cs.payment_id = p.provider_payment_id;
```

---

## FASE 6: VALIDACIÓN

### 6.1 Post-eliminación: Verificar tablas

```sql
-- Listar todas las tablas (debe ser 17 después de eliminar 3)
SELECT 
  COUNT(*) as total_tablas,
  array_agg(table_name ORDER BY table_name) as tablas
FROM information_schema.tables
WHERE table_schema='public';

-- Tabla por tabla
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema='public' AND table_name=t.table_name) as num_columnas,
  pg_size_pretty(pg_total_relation_size(table_name::regclass)) as tamaño
FROM information_schema.tables t
WHERE table_schema='public'
ORDER BY table_name;

-- Verificar que no existen las eliminadas
SELECT 
  'subscription_usage' as tabla,
  EXISTS(SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='subscription_usage') as existe
UNION ALL
SELECT 
  'whatsapp_message_queue',
  EXISTS(SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='whatsapp_message_queue')
UNION ALL
SELECT 
  'user_subscriptions (si aplica)',
  EXISTS(SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='user_subscriptions');
```

---

### 6.2 Post-eliminación: Verificar Foreign Keys

```sql
-- Ver todas las FKs (debe ser 21 después de eliminar 3)
SELECT 
  COUNT(*) as total_fks
FROM information_schema.referential_constraints
WHERE constraint_schema='public';

-- Listar todas las FKs
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type='FOREIGN KEY'
  AND tc.table_schema='public'
ORDER BY tc.table_name;

-- Verificar integridad referencial
SELECT 
  constraint_name,
  table_name,
  'EXISTE' as status
FROM information_schema.table_constraints
WHERE constraint_type='FOREIGN KEY'
  AND table_schema='public'
ORDER BY table_name;
```

---

### 6.3 Post-eliminación: Verificar Índices

```sql
-- Contar índices (debe ser menos después de eliminación)
SELECT COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname='public';

-- Verificar que no hay índices huérfanos
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname='public'
ORDER BY tablename;

-- Índices de tablas eliminadas (debe retornar 0)
SELECT *
FROM pg_indexes
WHERE schemaname='public'
  AND (tablename='subscription_usage'
    OR tablename='whatsapp_message_queue'
    OR tablename='user_subscriptions');
```

---

### 6.4 Post-eliminación: Verificar Triggers

```sql
-- Contar triggers (debe ser 10 después de eliminación)
SELECT COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE trigger_schema='public';

-- Listar triggers
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema='public'
ORDER BY event_object_table;

-- Triggers de tablas eliminadas (debe retornar 0)
SELECT *
FROM information_schema.triggers
WHERE trigger_schema='public'
  AND (event_object_table='subscription_usage'
    OR event_object_table='whatsapp_message_queue'
    OR event_object_table='user_subscriptions');
```

---

## DIAGNÓSTICO

### D.1 Análisis completo de espacio

```sql
-- Tamaño de todas las tablas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
  ROUND(100.0 * pg_total_relation_size(schemaname||'.'||tablename) / 
    (SELECT pg_total_relation_size(schemaname||'.'||tablename)
     FROM pg_tables WHERE schemaname='public'), 2) as porcentaje
FROM pg_tables
WHERE schemaname='public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Total de BD
SELECT 
  pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) as total_bd
FROM pg_tables
WHERE schemaname='public';
```

---

### D.2 Análisis de relaciones rotas

```sql
-- Buscar órfanos: orders sin store
SELECT COUNT(*) as ordenes_sin_store
FROM orders
WHERE store_id NOT IN (SELECT id FROM stores);

-- Buscar órfanos: order_items sin order
SELECT COUNT(*) as items_sin_orden
FROM order_items
WHERE order_id NOT IN (SELECT id FROM orders);

-- Buscar órfanos: products sin category
SELECT COUNT(*) as productos_sin_categoria
FROM products
WHERE category_id NOT IN (SELECT id FROM categories)
  AND category_id IS NOT NULL;

-- Buscar órfanos: subscriptions sin plan
SELECT COUNT(*) as suscripciones_sin_plan
FROM subscriptions
WHERE plan_id NOT IN (SELECT id FROM subscription_plans);
```

---

### D.3 Análisis de integridad de datos

```sql
-- Ver si hay valores NULL inesperados
SELECT 
  'orders' as tabla,
  COUNT(*) as total_null
FROM orders
WHERE store_id IS NULL OR customer_name IS NULL
UNION ALL
SELECT 
  'products',
  COUNT(*)
FROM products
WHERE store_id IS NULL OR name IS NULL
UNION ALL
SELECT 
  'categories',
  COUNT(*)
FROM categories
WHERE store_id IS NULL;

-- Ver distribución de datos críticos
SELECT 
  'stores' as tabla,
  COUNT(*) as total
FROM stores
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'subscription_plans', COUNT(*) FROM subscription_plans;
```

---

## LIMPIEZA

### L.1 Eliminar subscription_usage (SEGURO)

```sql
-- 1️⃣ VERIFICAR QUE ESTÁ VACÍA
SELECT COUNT(*) FROM subscription_usage;
-- Debe retornar: 0

-- 2️⃣ ELIMINAR TRIGGERS
DROP TRIGGER IF EXISTS subscription_payments_updated_at ON subscription_usage;

-- 3️⃣ ELIMINAR FUNCIÓN (si es exclusiva de esta tabla)
DROP FUNCTION IF EXISTS update_subscription_updated_at() CASCADE;

-- 4️⃣ ELIMINAR TABLA
DROP TABLE IF EXISTS subscription_usage CASCADE;

-- 5️⃣ VERIFICAR (debe fallar con error)
SELECT * FROM subscription_usage;
-- ERROR: relation "public.subscription_usage" does not exist
```

---

### L.2 Eliminar whatsapp_message_queue (SEGURO)

```sql
-- 1️⃣ VERIFICAR QUE ESTÁ VACÍA
SELECT COUNT(*) FROM whatsapp_message_queue;
-- Debe retornar: 0

-- 2️⃣ ELIMINAR TRIGGERS
DROP TRIGGER IF EXISTS update_whatsapp_queue_updated_at ON whatsapp_message_queue;

-- 3️⃣ ELIMINAR FUNCIÓN (si es exclusiva)
DROP FUNCTION IF EXISTS update_whatsapp_queue_updated_at() CASCADE;

-- 4️⃣ ELIMINAR TABLA
DROP TABLE IF EXISTS whatsapp_message_queue CASCADE;

-- 5️⃣ VERIFICAR (debe fallar con error)
SELECT * FROM whatsapp_message_queue;
-- ERROR: relation "public.whatsapp_message_queue" does not exist
```

---

### L.3 Eliminar user_subscriptions (CONDICIONADO)

```sql
-- SOLO EJECUTAR SI DECIDISTE ELIMINAR

-- 1️⃣ BACKUP (antes de eliminar)
CREATE TABLE user_subscriptions_backup AS SELECT * FROM user_subscriptions;

-- 2️⃣ VERIFICAR CONTENIDO
SELECT * FROM user_subscriptions;

-- 3️⃣ BUSCAR REFERENCIAS EN BD
SELECT *
FROM information_schema.referential_constraints
WHERE table_name='user_subscriptions'
   OR referenced_table_name='user_subscriptions';

-- 4️⃣ ELIMINAR TRIGGERS
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;

-- 5️⃣ ELIMINAR FUNCIÓN
DROP FUNCTION IF EXISTS update_user_subscriptions_updated_at() CASCADE;

-- 6️⃣ ELIMINAR TABLA
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- 7️⃣ LIMPIAR BACKUP
-- DROP TABLE user_subscriptions_backup;  -- ejecutar después de validar todo
```

---

### L.4 Eliminar índice subdomain (CONDICIONADO)

```sql
-- SOLO EJECUTAR SI DECIDISTE QUE NO SE USA

-- 1️⃣ VERIFICAR QUE NO SE USA
SELECT COUNT(*) FROM stores WHERE subdomain IS NOT NULL;
-- Si retorna 0, es seguro eliminar

-- 2️⃣ ELIMINAR ÍNDICE
DROP INDEX IF EXISTS stores_subdomain_idx;

-- 3️⃣ OPCIONAL: ELIMINAR COLUMNA
ALTER TABLE stores DROP COLUMN IF EXISTS subdomain;

-- 4️⃣ VERIFICAR
SELECT column_name FROM information_schema.columns
WHERE table_name='stores' AND column_name='subdomain';
-- Debe retornar 0 filas
```

---

## 🎯 ORDEN RECOMENDADO DE EJECUCIÓN

```sql
-- PASO 1: Verificar estado inicial
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';
-- Retorna: 20

-- PASO 2: Crear backups (opcional pero recomendado)
CREATE TABLE subscription_usage_backup AS SELECT * FROM subscription_usage;
CREATE TABLE whatsapp_message_queue_backup AS SELECT * FROM whatsapp_message_queue;

-- PASO 3: Eliminar subscription_usage
DROP TRIGGER IF EXISTS subscription_payments_updated_at ON subscription_usage;
DROP TABLE IF EXISTS subscription_usage CASCADE;

-- PASO 4: Eliminar whatsapp_message_queue
DROP TRIGGER IF EXISTS update_whatsapp_queue_updated_at ON whatsapp_message_queue;
DROP FUNCTION IF EXISTS update_whatsapp_queue_updated_at() CASCADE;
DROP TABLE IF EXISTS whatsapp_message_queue CASCADE;

-- PASO 5: Verificar estado final
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';
-- Retorna: 17 ✅

-- PASO 6: Validar integridad
SELECT COUNT(*) as total_fks FROM information_schema.referential_constraints;
SELECT COUNT(*) as total_triggers FROM information_schema.triggers WHERE trigger_schema='public';

-- PASO 7: Eliminar backups (después de validar)
-- DROP TABLE subscription_usage_backup;
-- DROP TABLE whatsapp_message_queue_backup;
```

---

## 📝 NOTAS IMPORTANTES

1. **SIEMPRE hacer backup primero** - Exportar CSV desde Supabase UI
2. **Ejecutar una query a la vez** - No correr todo de golpe
3. **Validar después de cada cambio** - Usar queries de validación
4. **Leer los errores** - Si algo falla, rollback inmediatamente
5. **Documentar decisiones** - Crear `DECISIONES-LIMPIEZA-SCHEMA.md`

---

**Última actualización:** 29 de marzo de 2026
