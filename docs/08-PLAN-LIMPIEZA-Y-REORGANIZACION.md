# 🧹 PLAN DE LIMPIEZA Y REORGANIZACIÓN - Supabase FoodyNow

**Documento:** Plan de ejecución  
**Fecha:** 29 de marzo de 2026  
**Basado en:** Auditoría real con datos de 29-03-2026

---

## 📊 ESTADO ACTUAL

| Elemento | Cantidad | Estado |
|----------|----------|--------|
| Tablas totales | 20 | ⚠️ Requiere limpieza |
| Tablas útiles | 17 | ✅ Mantener |
| Tablas muertas | 2 | 🔴 Eliminar inmediato |
| Tablas conflictivas | 1 | 🟡 Investigar |
| Scripts duplicados | 5 | 📁 Archivar |

---

## 🎯 PLAN FASE POR FASE

### FASE 1: INVESTIGACIÓN (Hoy - No cambios en BD)

**Objetivo:** Responder preguntas críticas antes de ejecutar cambios

#### 1.1 Investigar user_subscriptions

```bash
# En tu terminal:
grep -r "user_subscriptions" app/ lib/ scripts/
grep -r "user_subscriptions" . --include="*.ts" --include="*.tsx" --include="*.js"
```

**Preguntas a responder:**
- [ ] ¿Aparece en algún archivo .ts/.tsx/.js?
- [ ] ¿Hay código API que la consulta? (grep /api/subscription)
- [ ] ¿Los 2 registros son datos de prueba o producción?
- [ ] ¿Debería este modelo coexistir con subscriptions?

**Decisión requerida:** 
- [ ] Mantener (si se usa)
- [ ] Eliminar (si es redundante)

---

#### 1.2 Revisar stores.subdomain vs stores.slug

```sql
-- En Supabase SQL Editor:
SELECT id, name, slug, subdomain 
FROM stores 
WHERE subdomain IS NOT NULL;

SELECT COUNT(*) as stores_con_subdomain FROM stores WHERE subdomain IS NOT NULL;
SELECT COUNT(*) as stores_con_slug FROM stores WHERE slug IS NOT NULL;
```

**Preguntas a responder:**
- [ ] ¿Cuántos stores tienen subdomain?
- [ ] ¿Cuál se usa en el frontend? (buscar en código)
- [ ] ¿Son iguales? (slug vs subdomain)

**Búsqueda en código:**
```bash
grep -r "subdomain" app/ lib/
grep -r "stores\.slug" app/ lib/
```

**Decisión requerida:**
- [ ] Mantener ambos
- [ ] Eliminar uno de los índices UNIQUE

---

#### 1.3 Revisar triggers duplicados

```sql
-- Ver todos los triggers en subscriptions
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions'
ORDER BY trigger_name;
```

**Triggers a revisar:**
- `sync_store_subscription_after_update`
- `trigger_sync_subscription_status`

**Preguntas:**
- [ ] ¿Ambos necesarios o duplicados?
- [ ] ¿Ejecutan la misma función?

---

#### 1.4 Revisar checkout_sessions en uso

```sql
-- Ver si checkout_sessions tiene datos útiles
SELECT 
  COUNT(*) as total_sesiones,
  COUNT(CASE WHEN order_id IS NOT NULL THEN 1 END) as con_order,
  COUNT(CASE WHEN payment_id IS NOT NULL THEN 1 END) as con_payment,
  MAX(created_at) as ultima_sesion
FROM checkout_sessions;

-- Ver órdenes sin checkout_session
SELECT COUNT(*) FROM orders 
WHERE id NOT IN (SELECT order_id FROM checkout_sessions WHERE order_id IS NOT NULL);
```

**Preguntas:**
- [ ] ¿Todos los órdenes tienen checkout_session?
- [ ] ¿Cuántas sesiones no están asociadas a orders?
- [ ] ¿Es necesario mantener el histórico completo?

---

### FASE 2: DOCUMENTACIÓN (Después de investigación)

**Objetivo:** Documentar decisiones y crear plan específico

#### 2.1 Crear documento de decisiones

**Archivo:** `docs/DECISIONES-LIMPIEZA-SCHEMA.md`

```markdown
# Decisiones de limpieza - Schema FoodyNow

## user_subscriptions
- [ ] ¿Usar?: SÍ / NO
- Hallazgo:
- Decisión:
- Migración requerida:

## stores.subdomain
- [ ] ¿Mantener?: SÍ / NO
- Hallazgo:
- Decisión:
- Índice a eliminar:

## checkout_sessions
- [ ] ¿Deprecar?: SÍ / NO
- Hallazgo:
- Decisión:
- Timeline:

## Triggers duplicados
- [ ] ¿Mantener ambos?: SÍ / NO
- Hallazgo:
- Decisión:
```

---

### FASE 3: LIMPIEZA - TABLAS MUERTAS (Bajo riesgo)

**Objetivo:** Eliminar tablas que están 100% vacías

**Riesgo:** ✅ BAJO (0 filas, no hay código que las use)

#### 3.1 Eliminar subscription_usage

```sql
-- 1️⃣ BACKUP (antes de eliminar)
-- Exportar CSV desde Supabase UI (aunque esté vacía)

-- 2️⃣ VERIFICAR (está realmente vacía)
SELECT COUNT(*) FROM subscription_usage;  -- Debe ser 0

-- 3️⃣ ELIMINAR DEPENDENCIAS
DROP TRIGGER IF EXISTS subscription_payments_updated_at ON subscription_usage;

-- 4️⃣ ELIMINAR TABLA
DROP TABLE IF EXISTS subscription_usage CASCADE;

-- 5️⃣ VERIFICAR
-- Intentar seleccionar (debe fallar)
SELECT * FROM subscription_usage;  -- ERROR: table not found
```

**Tiempo estimado:** 2 minutos  
**Riesgos:** ✅ NINGUNO (tabla muerta)  
**Rollback:** Ejecutar script create-subscription-usage.sql

---

#### 3.2 Eliminar whatsapp_message_queue

```sql
-- 1️⃣ BACKUP
-- Exportar CSV desde Supabase UI (aunque esté vacía)

-- 2️⃣ VERIFICAR
SELECT COUNT(*) FROM whatsapp_message_queue;  -- Debe ser 0

-- 3️⃣ ELIMINAR DEPENDENCIAS
DROP TRIGGER IF EXISTS update_whatsapp_queue_updated_at ON whatsapp_message_queue;
DROP FUNCTION IF EXISTS update_whatsapp_queue_updated_at();

-- 4️⃣ ELIMINAR TABLA
DROP TABLE IF EXISTS whatsapp_message_queue CASCADE;

-- 5️⃣ VERIFICAR
SELECT * FROM whatsapp_message_queue;  -- ERROR: table not found
```

**Tiempo estimado:** 2 minutos  
**Riesgos:** ✅ NINGUNO (tabla muerta)  
**Rollback:** Ejecutar script create-notifications-tables.sql

---

### FASE 4: LIMPIEZA - CONDICIONADA (Después de investigación)

#### 4.1 Si user_subscriptions se decide eliminar

```sql
-- 1️⃣ BACKUP
-- Exportar CSV antes: SELECT * FROM user_subscriptions;

-- 2️⃣ VERIFICAR CONTENIDO
SELECT id, user_id, status, created_at FROM user_subscriptions;

-- 3️⃣ BUSCAR REFERENCIAS EN CÓDIGO
-- En terminal: grep -r "user_subscriptions" app/

-- 4️⃣ ELIMINAR DEPENDENCIAS
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
DROP FUNCTION IF EXISTS update_user_subscriptions_updated_at();

-- 5️⃣ ELIMINAR TABLA
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- 6️⃣ VERIFICAR
SELECT * FROM user_subscriptions;  -- ERROR: table not found
```

**Decisión requerida:** ✅ Después de grep en código

---

#### 4.2 Si stores.subdomain se decide eliminar

```sql
-- 1️⃣ VERIFICAR QUE NO SE USA
SELECT COUNT(*) FROM stores WHERE subdomain IS NOT NULL;

-- 2️⃣ BUSCAR EN CÓDIGO
-- En terminal: grep -r "subdomain" app/ lib/

-- 3️⃣ Si no se usa, eliminar el índice
DROP INDEX IF EXISTS stores_subdomain_idx;

-- 4️⃣ ELIMINAR COLUMNA (opcional, solo si se decide)
ALTER TABLE stores DROP COLUMN IF EXISTS subdomain;

-- 5️⃣ VERIFICAR
SELECT * FROM information_schema.columns 
WHERE table_name='stores' AND column_name='subdomain';
-- Debe retornar 0 filas
```

**Decisión requerida:** ✅ Después de grep en código

---

#### 4.3 Si checkout_sessions se decide deprecar

```sql
-- OPCIÓN A: MANTENER PARA HISTORIAL (Recomendado)
-- Crear tabla histórica de backups
CREATE TABLE IF NOT EXISTS checkout_sessions_archive AS
SELECT * FROM checkout_sessions
WHERE processed_at < NOW() - INTERVAL '90 days';

-- Limpiar sesiones antiguas
DELETE FROM checkout_sessions 
WHERE processed_at < NOW() - INTERVAL '90 days';

-- OPCIÓN B: ELIMINAR INMEDIATO (Solo si no necesitas historial)
DROP TABLE IF EXISTS checkout_sessions CASCADE;
```

**Decisión requerida:** ✅ Después de análisis de negocio

---

### FASE 5: LIMPIEZA - SCRIPTS Y DOCUMENTACIÓN

#### 5.1 Archivar scripts duplicados

```bash
# En terminal desde raíz del proyecto:

# 1️⃣ Crear carpeta deprecated
mkdir -p scripts/deprecated

# 2️⃣ Mover scripts de notificaciones viejos
mv scripts/setup-complete-notifications-v1.sql scripts/deprecated/
mv scripts/setup-complete-notifications-v2.sql scripts/deprecated/
mv scripts/setup-notifications-clean.sql scripts/deprecated/
mv scripts/add-notifications-tables.sql scripts/deprecated/
mv scripts/setup-complete-notifications-custom.sql scripts/deprecated/

# 3️⃣ Crear README en deprecated
cat > scripts/deprecated/README.md << 'EOF'
# Scripts Deprecated

Esta carpeta contiene scripts SQL antiguos que fueron reemplazados.

## Notificaciones (consolidadas en create-notifications-tables.sql)
- setup-complete-notifications-v1.sql
- setup-complete-notifications-v2.sql
- setup-notifications-clean.sql
- add-notifications-tables.sql
- setup-complete-notifications-custom.sql

**NOTA:** No ejecutar estos scripts. Usar `create-notifications-tables.sql` en su lugar.

## User Subscriptions (en revisión)
- create-user-subscriptions-table.sql
- add-trial-support.sql

Estos están en revisión. Ver DECISIONES-LIMPIEZA-SCHEMA.md
EOF

# 4️⃣ Verificar
ls -la scripts/deprecated/
```

---

#### 5.2 Crear documento de decisiones

**Archivo:** `docs/DECISIONES-LIMPIEZA-SCHEMA.md`

```markdown
# Decisiones de Limpieza - Schema FoodyNow
Generado: 29 de marzo de 2026

## Tablas Eliminadas (Sin riesgo)
✅ subscription_usage - Tabla muerta (0 filas)
✅ whatsapp_message_queue - Tabla muerta (0 filas)

## Tablas Archivadas (Histórico)
📦 checkout_sessions - Movidas a checkout_sessions_archive

## Tablas Investigadas
🟡 user_subscriptions - [Decisión pendiente]
🟡 stores.subdomain - [Decisión pendiente]
🟡 Triggers duplicados - [Decisión pendiente]

## Scripts Archivados
📁 scripts/deprecated/
- setup-complete-notifications-v1.sql
- setup-complete-notifications-v2.sql
- etc.

## Timeline
- Fase 1: Investigación (hoy)
- Fase 2: Documentación (mañana)
- Fase 3: Eliminación tablas muertas (día 3)
- Fase 4: Eliminación condicionada (día 4+)
- Fase 5: Limpieza scripts (día 5)
```

---

### FASE 6: VALIDACIÓN POST-LIMPIEZA

#### 6.1 Queries de validación

```sql
-- 1️⃣ VERIFICAR TABLAS
SELECT COUNT(*) as total_tablas FROM information_schema.tables 
WHERE table_schema='public';
-- Debe ser: 17 (20 - 3 eliminadas)

-- 2️⃣ VERIFICAR FOREIGN KEYS
SELECT COUNT(*) as total_fks FROM information_schema.referential_constraints
WHERE constraint_schema='public';
-- Debe ser: 21 (24 - 3 de tablas eliminadas)

-- 3️⃣ VERIFICAR ÍNDICES
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname='public';
-- Debe ser menor (índices de tablas eliminadas)

-- 4️⃣ VERIFICAR TRIGGERS
SELECT COUNT(*) FROM information_schema.triggers 
WHERE trigger_schema='public';
-- Debe ser: 10 (12 - 2 de tablas eliminadas)

-- 5️⃣ VERIFICAR FUNCIONES
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_schema='public' AND routine_type='FUNCTION';
-- Debe ser: 10 (12 - 2 de tablas eliminadas)

-- 6️⃣ VER TODAS LAS TABLAS
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;

-- 7️⃣ VERIFICAR INTEGRIDAD REFERENCIAL
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage
WHERE table_schema='public' AND constraint_name LIKE '%_fkey'
ORDER BY table_name;
```

---

#### 6.2 Búsquedas en código post-limpieza

```bash
# Verificar que no hay código referenciando tablas eliminadas

# Verificar subscription_usage
grep -r "subscription_usage" app/ lib/ scripts/ 
# Debe retornar: 0 matches

# Verificar whatsapp_message_queue
grep -r "whatsapp_message_queue" app/ lib/ scripts/
# Debe retornar: 0 matches

# Verificar user_subscriptions (si fue eliminada)
grep -r "user_subscriptions" app/ lib/ scripts/
# Debe retornar: 0 matches (o documentado si no)
```

---

## 📋 CHECKLIST DE EJECUCIÓN

### PRE-EJECUCIÓN
- [ ] Leer `AUDITORIA-SCHEMA-REAL-COMPLETA.md` completamente
- [ ] Ejecutar búsquedas en FASE 1 (Investigación)
- [ ] Documentar decisiones en `DECISIONES-LIMPIEZA-SCHEMA.md`
- [ ] Hacer backup de la BD (Export en Supabase)
- [ ] Notificar al equipo sobre cambios planificados

### FASE 3: ELIMINAR TABLAS MUERTAS
- [ ] Ejecutar query de BACKUP para subscription_usage
- [ ] Ejecutar query de BACKUP para whatsapp_message_queue
- [ ] Ejecutar DROP de subscription_usage
- [ ] Verificar con SELECT (debe fallar)
- [ ] Ejecutar DROP de whatsapp_message_queue
- [ ] Verificar con SELECT (debe fallar)

### FASE 4: ELIMINAR TABLAS CONDICIONADAS
- [ ] (Si aplica) Ejecutar decisiones sobre user_subscriptions
- [ ] (Si aplica) Ejecutar decisiones sobre stores.subdomain
- [ ] (Si aplica) Ejecutar decisiones sobre checkout_sessions

### FASE 5: LIMPIAR SCRIPTS
- [ ] Crear carpeta scripts/deprecated/
- [ ] Mover scripts viejos
- [ ] Crear README en deprecated
- [ ] Hacer commit: "docs: deprecated old notification scripts"

### FASE 6: VALIDACIÓN
- [ ] Ejecutar todas las queries de validación
- [ ] Ejecutar búsquedas en código
- [ ] Verificar que app sigue funcionando
- [ ] Comprobar tests si existen
- [ ] Documentar cambios en README.md

### POST-EJECUCIÓN
- [ ] Crear PR con cambios
- [ ] Actualizar documentación de schema
- [ ] Notificar al equipo
- [ ] Hacer commit final

---

## ⏱️ TIMELINE ESTIMADO

| Fase | Actividad | Tiempo | Estado |
|------|-----------|--------|--------|
| 1 | Investigación | 30 min | ⏳ TODO |
| 2 | Documentación | 20 min | ⏳ TODO |
| 3 | Eliminar muertas | 5 min | ⏳ TODO |
| 4 | Eliminar condicionadas | 15 min | ⏳ TODO |
| 5 | Limpiar scripts | 10 min | ⏳ TODO |
| 6 | Validación | 15 min | ⏳ TODO |
| 🎯 | **TOTAL** | **95 min** | ⏳ TODO |

---

## 🚨 ROLLBACK PLAN

Si algo sale mal, aquí están los comandos para restaurar:

```sql
-- Restaurar subscription_usage
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  period_start TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  period_end TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  products_count INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Restaurar whatsapp_message_queue
CREATE TABLE whatsapp_message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id),
  order_id UUID REFERENCES orders(id),
  message_type TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  template_data JSONB,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurar índices y triggers si es necesario
-- Ver scripts/create-notifications-tables.sql
```

---

## 📞 SOPORTE

Si tienes preguntas o problemas:

1. Revisar sección correspondiente en `AUDITORIA-SCHEMA-REAL-COMPLETA.md`
2. Ejecutar queries de validación correspondientes
3. Verificar rollback plan
4. Contactar a Gustavo Latini si es necesario

---

**Próxima acción:** Ejecutar FASE 1 (Investigación) y documentar decisiones
