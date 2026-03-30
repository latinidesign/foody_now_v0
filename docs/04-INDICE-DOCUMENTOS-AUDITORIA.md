# 📑 ÍNDICE DE DOCUMENTOS - Auditoría Supabase FoodyNow

**Generado:** 29 de marzo de 2026  
**Basado en:** Análisis real de datos en Supabase

---

## 🎯 ¿POR DÓNDE EMPEZAR?

### Si tienes 5 minutos:
👉 Lee: **RESUMEN-EJECUTIVO-AUDITORIA.md**

### Si tienes 30 minutos:
👉 Lee: **RESUMEN-EJECUTIVO-AUDITORIA.md** + primeras secciones de **AUDITORIA-SCHEMA-REAL-COMPLETA.md**

### Si necesitas detalles completos:
👉 Lee en orden:
1. RESUMEN-EJECUTIVO-AUDITORIA.md
2. AUDITORIA-SCHEMA-REAL-COMPLETA.md
3. PLAN-LIMPIEZA-Y-REORGANIZACION.md
4. QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md

---

## 📚 DOCUMENTOS DISPONIBLES

### 1. 📊 RESUMEN-EJECUTIVO-AUDITORIA.md
**Tiempo de lectura:** 10 minutos  
**Para:** Ejecutivos, product managers, decision makers

**Contiene:**
- Síntesis en 60 segundos
- Datos clave en tablas
- Hallazgos críticos (3 principales)
- Hallazgos secundarios (3 puntos)
- Fortalezas del schema
- Plan de acción recomendado
- Preguntas frecuentes
- Lecciones aprendidas

**Deberías leer esto si:** Necesitas entender rápidamente el estado de la BD

---

### 2. 📋 AUDITORIA-SCHEMA-REAL-COMPLETA.md
**Tiempo de lectura:** 45 minutos  
**Para:** Desarrolladores, DBAs, técnicos

**Contiene:**
- Análisis detallado de cada tabla (20 tablas analizadas)
- Columnas, tipos, relaciones
- Tamaño real de datos
- Índices y triggers
- Enums definidos
- Problemas encontrados
- Recomendaciones específicas
- Queries de validación

**Deberías leer esto si:** Necesitas entender en profundidad qué hay en tu BD

**Estructura:**
```
Parte 1: Tablas core ecommerce (9 tablas)
Parte 2: Tablas de pagos (3 tablas + análisis)
Parte 3: Tablas de notificaciones (3 tablas)
Parte 4: Tablas de suscripciones tiendas (3 tablas)
Parte 5: Tabla suscripciones usuario (conflictiva)
Parte 6: Enums (8 tipos)
Parte 7: Triggers y funciones (24 totales)
Parte 8: Índices (80+)
Parte 9: Estadísticas de espacio
Parte 10: Resumen de decisiones
Parte 11: Scripts duplicados
Parte 12: Problemas y recomendaciones
```

---

### 3. 🧹 PLAN-LIMPIEZA-Y-REORGANIZACION.md
**Tiempo de lectura:** 30 minutos  
**Para:** Personas que van a ejecutar los cambios

**Contiene:**
- Estado actual vs meta
- FASE 1: Investigación (con búsquedas en código)
- FASE 2: Documentación
- FASE 3: Limpieza tablas muertas (bajo riesgo)
- FASE 4: Limpieza condicionada (investigar primero)
- FASE 5: Limpieza scripts
- FASE 6: Validación
- Checklist completo
- Timeline estimado
- Rollback plan

**Deberías leer esto si:** Vas a ejecutar la limpieza de la BD

**Fases principales:**
```
Fase 1: Investigación - 30 min (preguntas a responder)
Fase 2: Documentación - 20 min (crear decisiones.md)
Fase 3: Limpieza muertas - 5 min (subscription_usage, whatsapp_message_queue)
Fase 4: Limpieza condicionada - 15 min (user_subscriptions, subdomain, checkout_sessions)
Fase 5: Limpiar scripts - 10 min (archivar en deprecated/)
Fase 6: Validación - 15 min (verificar que todo funciona)
TOTAL: 95 minutos
```

---

### 4. 🔧 QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md
**Tiempo de lectura:** 20 minutos  
**Para:** Todos (es referencia, no para leer completo)

**Contiene:**
- Queries de investigación (FASE 1)
- Queries de validación (FASE 6)
- Queries de diagnóstico (ad-hoc)
- Queries de limpieza (listas para copiar-pegar)
- Orden recomendado de ejecución
- Notas importantes

**Deberías usar esto si:** Necesitas queries SQL para investigar o limpiar

**Secciones principales:**
```
1. Queries de Investigación
   - user_subscriptions
   - stores.subdomain
   - triggers duplicados
   - checkout_sessions

2. Queries de Validación (post-limpieza)
   - Verificar tablas
   - Verificar FKs
   - Verificar índices
   - Verificar triggers

3. Diagnóstico
   - Análisis de espacio
   - Búsqueda de relaciones rotas
   - Análisis de integridad de datos

4. Limpieza
   - Eliminar subscription_usage
   - Eliminar whatsapp_message_queue
   - Eliminar user_subscriptions (condicionado)
   - Eliminar índice subdomain (condicionado)

5. Orden recomendado de ejecución
```

---

## 🗺️ MAPA DE CONTENIDOS

```
RESUMEN-EJECUTIVO-AUDITORIA.md
├─ Síntesis en 60 seg
├─ Datos clave
├─ 3 hallazgos críticos
├─ 3 hallazgos secundarios
├─ Fortalezas
├─ Plan de acción
├─ FAQ
└─ Lecciones aprendidas

AUDITORIA-SCHEMA-REAL-COMPLETA.md
├─ Resumen ejecutivo (tablas/datos)
├─ Tablas CORE (9) ✅
├─ Tablas de PAGOS (3) 🟡
├─ Tablas de NOTIFICACIONES (3) ✅
├─ Tablas de SUSCRIPCIONES TIENDA (3) ✅
├─ Tabla de SUSCRIPCIONES USUARIO (1) 🔴
├─ ENUMS (8) ✅
├─ TRIGGERS Y FUNCIONES (24) ✅
├─ ÍNDICES (80+) ✅
├─ ESTADÍSTICAS DE ESPACIO
├─ RESUMEN DE DECISIONES
├─ SCRIPTS DUPLICADOS
└─ PROBLEMAS Y RECOMENDACIONES

PLAN-LIMPIEZA-Y-REORGANIZACION.md
├─ FASE 1: Investigación
│  ├─ user_subscriptions (qué buscar)
│  ├─ stores.subdomain (qué buscar)
│  ├─ triggers duplicados (qué verificar)
│  └─ checkout_sessions (análisis)
├─ FASE 2: Documentación
├─ FASE 3: Eliminar muertas (SEGURO)
│  ├─ subscription_usage
│  └─ whatsapp_message_queue
├─ FASE 4: Eliminar condicionadas
│  ├─ user_subscriptions (si decide)
│  ├─ stores.subdomain (si decide)
│  └─ checkout_sessions (si decide)
├─ FASE 5: Limpiar scripts
├─ FASE 6: Validación
├─ CHECKLIST
├─ TIMELINE
└─ ROLLBACK PLAN

QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md
├─ FASE 1: Investigación
│  ├─ user_subscriptions (5 queries)
│  ├─ stores.subdomain (4 queries)
│  ├─ triggers duplicados (4 queries)
│  └─ checkout_sessions (6 queries)
├─ FASE 6: Validación
│  ├─ Verificar tablas (3 queries)
│  ├─ Verificar FKs (3 queries)
│  ├─ Verificar índices (3 queries)
│  └─ Verificar triggers (3 queries)
├─ DIAGNÓSTICO
│  ├─ Análisis de espacio (2 queries)
│  ├─ Relaciones rotas (4 queries)
│  └─ Integridad de datos (2 queries)
├─ LIMPIEZA
│  ├─ subscription_usage (5 pasos)
│  ├─ whatsapp_message_queue (5 pasos)
│  ├─ user_subscriptions (7 pasos)
│  └─ stores.subdomain (4 pasos)
└─ Orden recomendado
```

---

## 🎯 FLUJOS DE TRABAJO

### Flujo 1: Entender el estado actual
```
1. Leer: RESUMEN-EJECUTIVO-AUDITORIA.md (5 min)
2. Leer: AUDITORIA-SCHEMA-REAL-COMPLETA.md (45 min)
3. Resultado: Entiendes qué hay y dónde
```

### Flujo 2: Ejecutar la limpieza
```
1. Leer: PLAN-LIMPIEZA-Y-REORGANIZACION.md - FASE 1 (5 min)
2. Ejecutar: FASE 1 - Investigación (30 min)
   └─ Usar: QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md - Investigación (10 min)
3. Documentar: Decisiones en docs/DECISIONES-LIMPIEZA-SCHEMA.md (20 min)
4. Ejecutar: FASE 3-5 de PLAN (limpieza + scripts) (40 min)
   └─ Usar: QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md - Limpieza (copiar-pegar)
5. Validar: FASE 6 de PLAN (15 min)
   └─ Usar: QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md - Validación (15 min)
TOTAL: 95 minutos
```

### Flujo 3: Buscar información específica
```
Pregunta: "¿Qué es la tabla X?"
Respuesta: Busca en AUDITORIA-SCHEMA-REAL-COMPLETA.md

Pregunta: "¿Cómo eliminar la tabla X?"
Respuesta: Busca en QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md

Pregunta: "¿Cuál es el riesgo de esto?"
Respuesta: Busca en PLAN-LIMPIEZA-Y-REORGANIZACION.md

Pregunta: "¿Qué debería priorizar?"
Respuesta: Lee RESUMEN-EJECUTIVO-AUDITORIA.md
```

---

## 📊 ESTADÍSTICAS DE DOCUMENTOS

| Documento | Líneas | Palabras | Tiempo lectura | Tipo |
|-----------|--------|----------|-----------------|------|
| RESUMEN-EJECUTIVO | ~300 | 2,500 | 10 min | Ejecutivo |
| AUDITORIA-SCHEMA | ~800 | 8,000 | 45 min | Técnico |
| PLAN-LIMPIEZA | ~600 | 5,500 | 30 min | Guía |
| QUERIES-SQL | ~700 | 4,500 | 20 min | Referencia |
| **TOTAL** | ~2,400 | ~20,500 | 105 min | Mix |

---

## ✅ DECISIONES QUE NECESITAS TOMAR

Después de leer estos documentos, necesitarás decidir:

1. **¿Eliminar user_subscriptions?**
   - Información en: AUDITORIA-SCHEMA (Parte 5)
   - Plan en: PLAN-LIMPIEZA (Fase 4)
   - Queries en: QUERIES-SQL (Investigación + Limpieza)

2. **¿Mantener stores.subdomain?**
   - Información en: AUDITORIA-SCHEMA (Parte 12)
   - Plan en: PLAN-LIMPIEZA (Fase 4)
   - Queries en: QUERIES-SQL (Investigación)

3. **¿Deprecar checkout_sessions?**
   - Información en: AUDITORIA-SCHEMA (Parte 2)
   - Plan en: PLAN-LIMPIEZA (Fase 4)
   - Queries en: QUERIES-SQL (Investigación)

4. **¿Consolidar triggers duplicados?**
   - Información en: AUDITORIA-SCHEMA (Parte 7)
   - Plan en: PLAN-LIMPIEZA (Fase 1)
   - Queries en: QUERIES-SQL (Investigación)

---

## 🔍 TABLA DE BÚSQUEDA RÁPIDA

| Tema | Documento | Sección | Líneas aproximadas |
|------|-----------|---------|-------------------|
| Tablas core | AUDITORIA | Parte 1 | 150-250 |
| Pagos | AUDITORIA | Parte 2 | 250-350 |
| Notificaciones | AUDITORIA | Parte 3 | 150-200 |
| Suscripciones tienda | AUDITORIA | Parte 4 | 200-280 |
| Suscripciones usuario | AUDITORIA | Parte 5 | 100-150 |
| Enums | AUDITORIA | Parte 6 | 80-120 |
| Triggers | AUDITORIA | Parte 7 | 100-150 |
| Índices | AUDITORIA | Parte 8 | 80-120 |
| Problemas | AUDITORIA | Parte 12 | 150-200 |
| Investigación | PLAN | Fase 1 | 200-300 |
| Limpieza muertas | PLAN | Fase 3 | 100-150 |
| Limpieza condicionada | PLAN | Fase 4 | 200-300 |
| Validación | PLAN | Fase 6 | 100-150 |

---

## 💾 ARCHIVOS RELACIONADOS

Además de estos 4 documentos nuevos, ya existen en `/docs/`:

```
📁 docs/
├─ 📊 CSVs con datos (si necesitas referencia)
│  ├─ 1-Todas las tablas.csv
│  ├─ 2-Columnas tablas con tipos.csv
│  ├─ 3-Foreign key.csv
│  ├─ 4-Indexes.csv
│  ├─ 5-Enums.csv
│  ├─ 6-Tamaño de tablas.csv
│  ├─ 7-Filas en tablas sospechosas.csv
│  ├─ 8-Verificar extensiones.csv
│  ├─ 9-Triggers.csv
│  └─ 10-Stored Functions.csv
│
└─ 📄 NUEVOS DOCUMENTOS
   ├─ RESUMEN-EJECUTIVO-AUDITORIA.md ← Empieza aquí
   ├─ AUDITORIA-SCHEMA-REAL-COMPLETA.md ← Detalles
   ├─ PLAN-LIMPIEZA-Y-REORGANIZACION.md ← Ejecutar
   ├─ QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md ← Referencia
   └─ INDICE-DOCUMENTOS-AUDITORIA.md ← Este archivo
```

---

## 🚀 PRÓXIMOS PASOS

1. **Ahora (5 min):**
   - [ ] Lee RESUMEN-EJECUTIVO-AUDITORIA.md

2. **Hoy (30 min):**
   - [ ] Lee AUDITORIA-SCHEMA-REAL-COMPLETA.md
   - [ ] Ejecuta búsquedas en código (FASE 1 del PLAN)

3. **Mañana (20 min):**
   - [ ] Documentar decisiones en docs/DECISIONES-LIMPIEZA-SCHEMA.md
   - [ ] Revisar PLAN-LIMPIEZA-Y-REORGANIZACION.md

4. **En 2-3 días (60 min):**
   - [ ] Ejecutar limpieza usando QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md
   - [ ] Validar cambios
   - [ ] Hacer commit

---

## 📞 PREGUNTAS?

- **General:** Leer RESUMEN-EJECUTIVO-AUDITORIA.md
- **Técnica:** Leer AUDITORIA-SCHEMA-REAL-COMPLETA.md
- **Ejecución:** Leer PLAN-LIMPIEZA-Y-REORGANIZACION.md
- **SQL:** Buscar en QUERIES-SQL-AUDITORIA-Y-LIMPIEZA.md

---

**Última actualización:** 29 de marzo de 2026  
**Autor:** Análisis automático basado en queries reales a Supabase
