# ⚡ REFERENCIA RÁPIDA - Auditoría Supabase FoodyNow

**Última actualización:** 29 de marzo de 2026  
**Propósito:** Consulta rápida sin leer documentos completos

---

## 🎯 ¿QUÉ HACER AHORA?

```
┌─────────────────────────────────────┐
│ PASO 1: Leer (5 minutos)            │
│ RESUMEN-EJECUTIVO-AUDITORIA.md      │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ PASO 2: Investigar (30 minutos)     │
│ Ejecutar búsquedas en código        │
│ grep -r "user_subscriptions" app/   │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ PASO 3: Decidir (20 minutos)        │
│ Crear DECISIONES-LIMPIEZA-SCHEMA.md │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ PASO 4: Ejecutar (40 minutos)       │
│ Usar QUERIES-SQL-AUDITORIA-Y...     │
└─────────────────────────────────────┘
```

---

## 📊 TABLA RESUMEN (TODO DE UNA VEZ)

| Tabla | Filas | Acción | Riesgo | Tiempo |
|-------|-------|--------|--------|--------|
| subscription_usage | 0 | ❌ Eliminar | ✅ Bajo | 2 min |
| whatsapp_message_queue | 0 | ❌ Eliminar | ✅ Bajo | 2 min |
| user_subscriptions | 2 | 🔍 Investigar | 🟡 Medio | 30 min |
| stores.subdomain | 4 | 🔍 Revisar | 🟡 Bajo | 10 min |
| checkout_sessions | 93 | 🔄 Deprecar | 🟡 Bajo | 15 min |
| Triggers dup | - | 🔍 Revisar | 🟡 Bajo | 10 min |
| (14 tablas restantes) | ∞ | ✅ Mantener | ✅ Bajo | 0 min |

---

## 🔍 BÚSQUEDAS RÁPIDAS EN CÓDIGO

### Tabla: user_subscriptions

```bash
# Ejecuta en terminal:
grep -r "user_subscriptions" app/ lib/ scripts/
# Si retorna: 0 matches → Es seguro eliminar
```

### Tabla: stores.subdomain

```bash
grep -r "subdomain" app/ lib/
# Anota cuántas veces aparece y dónde
```

### Tabla: whatsapp_message_queue

```bash
grep -r "whatsapp_message_queue" app/ lib/ scripts/
# Si retorna: 0 matches → Es seguro eliminar
```

### Tabla: checkout_sessions

```bash
grep -r "checkout_sessions" app/ lib/
# Ver si está siendo usado activamente
```

---

## ⚡ COMANDOS SQL MÁS IMPORTANTES

### Verificar qué tablas vacías existen

```sql
SELECT table_name, COUNT(*) as filas
FROM information_schema.columns 
WHERE table_schema='public'
GROUP BY table_name
HAVING COUNT(*) > 0
ORDER BY table_name;
```

### Eliminar una tabla (SEGURA si tiene 0 filas)

```sql
-- VERIFICAR PRIMERO
SELECT COUNT(*) FROM subscription_usage;

-- Si retorna 0, entonces:
DROP TABLE IF EXISTS subscription_usage CASCADE;
```

### Validar después de eliminar

```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema='public';
-- Debe retornar 17 (de 20 originales)
```

---

## 🚨 3 COSAS MÁS IMPORTANTES

1. **HACER BACKUP PRIMERO**
   ```
   Antes de cualquier cambio:
   - Export BD desde Supabase (CSV)
   - O crear snapshot
   ```

2. **EJECUTAR QUERIES UNA POR UNA**
   ```
   No correr todo de golpe
   Validar después de cada cambio
   ```

3. **DOCUMENTAR DECISIONES**
   ```
   Crear: docs/DECISIONES-LIMPIEZA-SCHEMA.md
   Responder: ¿Por qué eliminaste X tabla?
   ```

---

## 📋 CHECKLIST MÍNIMO

- [ ] Leer RESUMEN-EJECUTIVO (5 min)
- [ ] Ejecutar búsquedas en código (30 min)
- [ ] Hacer backup (5 min)
- [ ] Ejecutar eliminaciones seguras (5 min)
- [ ] Validar cambios (10 min)
- [ ] Commit cambios (5 min)

**TOTAL: 60 minutos**

---

## 🎯 SI TIENES POCO TIEMPO

### 5 minutos
→ Lee: RESUMEN-EJECUTIVO-AUDITORIA.md (solo primeras 3 secciones)

### 30 minutos
→ Ejecuta: Fase 1 investigación (grep en código)

### 60 minutos  
→ Ejecuta: Fase 3 limpieza (eliminar tablas muertas)

---

## 📞 PROBLEMAS COMUNES

**P: "¿Qué pasa si elimino algo importante?"**  
R: Ejecuta rollback en 5 minutos (scripts están en `/scripts/`)

**P: "¿Va a afectar a usuarios?"**  
R: No, solo eliminas tablas vacías.

**P: "¿Necesito bajar la app?"**  
R: No, Supabase permite cambios en vivo.

**P: "¿Cuánto tarda?"**  
R: 95 minutos total (30 investigación + 5 eliminación + 60 validación)

---

## 🔗 DOCUMENTOS POR DURACIÓN

| Duración | Documento | Por qué |
|----------|-----------|---------|
| 5 min | RESUMEN-EJECUTIVO | Síntesis completa |
| 15 min | DIAGRAMA-VISUAL | Entender estructura |
| 30 min | PLAN-LIMPIEZA Fase 1 | Investigación |
| 45 min | AUDITORIA-SCHEMA | Detalles técnicos |
| 20 min | QUERIES-SQL | Copiar comandos |
| 10 min | Este documento | Referencia rápida |

---

## 📊 NÚMEROS CLAVE

```
Tablas totales:         20
Tablas útiles:          17
Tablas para eliminar:    2 (100% seguro)
Tablas para revisar:     1 (requiere investigación)
Tablas para deprecar:    1 (gradual)

Filas en tablas muertas: 0
Riesgo de limpieza:      ✅ MUY BAJO
Tiempo estimado:         95 minutos
Impacto negativo:        NINGUNO
```

---

## ✅ DECISIONES RÁPIDAS

```
¿Qué hago con subscription_usage?
→ ELIMINAR (0 filas, nunca usada)

¿Qué hago con whatsapp_message_queue?
→ ELIMINAR (0 filas, nunca usada)

¿Qué hago con user_subscriptions?
→ INVESTIGAR (2 filas, revisar si se usa)

¿Qué hago con checkout_sessions?
→ DEPRECAR GRADUALMENTE (10 MB, pero tiene historial)

¿Qué hago con stores.subdomain?
→ REVISAR (puede ser redundante con slug)
```

---

## 🚀 PRÓXIMAS ACCIONES (ORDEN)

1. ✅ Leer este documento (fin)
2. 📖 Leer RESUMEN-EJECUTIVO-AUDITORIA.md
3. 🔍 Ejecutar búsquedas en código (grep)
4. 📝 Documentar decisiones en DECISIONES-LIMPIEZA-SCHEMA.md
5. 💾 Hacer backup
6. 🧹 Ejecutar limpieza (QUERIES-SQL)
7. ✔️ Validar cambios
8. 📤 Hacer commit

---

## 📚 REFERENCIAS CRUZADAS

Cuando encuentres un término desconocido:

```
"¿Qué es..." → AUDITORIA-SCHEMA-REAL-COMPLETA.md
"¿Cómo ejecuto..." → PLAN-LIMPIEZA-Y-REORGANIZACION.md
"¿Qué query uso..." → QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md
"¿Dónde está..." → DIAGRAMA-VISUAL-SCHEMA.md
"¿Cuál es la prioridad..." → RESUMEN-EJECUTIVO-AUDITORIA.md
"¿Qué documento leer..." → INDICE-DOCUMENTOS-AUDITORIA.md
```

---

## 💡 TIPS IMPORTANTES

- **Siempre:** Hacer backup antes de cambios
- **Nunca:** Correr múltiples queries de eliminación al mismo tiempo
- **Recuerda:** Validar con SELECT después de DROP
- **Documenta:** Por qué eliminaste cada tabla
- **Toma:** Tu tiempo, no es urgente

---

## 🎓 LO QUE APRENDISTE

1. Tu BD tiene **20 tablas** de las cuales 17 son útiles
2. Hay **2 tablas completamente vacías** que ocupan espacio sin propósito
3. Hay **1 tabla conflictiva** que requiere investigación
4. El **schema está bien diseñado** en general
5. La limpieza es **bajo riesgo** y mejora la organización

---

**Estado final:** ✅ Listo para limpiar

**Tiempo invertido para entender:** 60 minutos  
**Tiempo ahorrado a largo plazo:** Mantenimiento más limpio y eficiente

---

📍 Siguiente: Abre `RESUMEN-EJECUTIVO-AUDITORIA.md`
