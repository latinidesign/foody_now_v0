-- ===============================================
-- SCRIPT DE VERIFICACIÓN DE SUSCRIPCIONES
-- Ejecutar en Supabase SQL Editor
-- ===============================================

-- 1. RESUMEN GENERAL DE SUSCRIPCIONES
SELECT 
    'RESUMEN GENERAL' as seccion,
    status,
    COUNT(*) as cantidad,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as porcentaje
FROM user_subscriptions 
GROUP BY status
ORDER BY cantidad DESC;

-- Separador visual
SELECT '================================================' as separador;

-- 2. DETALLE COMPLETO DE TODAS LAS SUSCRIPCIONES
SELECT 
    'DETALLE COMPLETO' as seccion,
    us.id as subscription_id,
    u.email as user_email,
    s.name as store_name,
    s.slug as store_slug,
    us.status,
    us.plan_id,
    us.price,
    us.currency,
    
    -- Información de trial
    CASE 
        WHEN us.status = 'trial' AND us.trial_end_date IS NOT NULL THEN
            EXTRACT(days FROM (us.trial_end_date::timestamp - NOW()::timestamp))::integer
        ELSE NULL 
    END as dias_trial_restantes,
    
    us.trial_start_date,
    us.trial_end_date,
    
    -- Estado del trial
    CASE 
        WHEN us.status = 'trial' AND us.trial_end_date < NOW() THEN '🔴 TRIAL EXPIRADO'
        WHEN us.status = 'trial' AND us.trial_end_date >= NOW() THEN '🟢 TRIAL ACTIVO'
        WHEN us.status = 'active' THEN '✅ SUSCRIPCIÓN ACTIVA'
        WHEN us.status = 'cancelled' THEN '❌ CANCELADA'
        WHEN us.status = 'suspended' THEN '⏸️ SUSPENDIDA'
        ELSE '⚠️ ESTADO DESCONOCIDO'
    END as estado_visual,
    
    -- Información de fechas
    us.subscription_start_date,
    us.created_at as fecha_registro,
    us.updated_at as ultima_actualizacion,
    
    -- Información de MercadoPago
    us.mercadopago_preapproval_id,
    us.mercadopago_subscription_id

FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
LEFT JOIN stores s ON s.user_id = u.id
ORDER BY us.created_at DESC;

-- Separador visual
SELECT '================================================' as separador;

-- 3. USUARIOS SIN SUSCRIPCIÓN (SOLO REGISTRADOS)
SELECT 
    'USUARIOS SIN SUSCRIPCIÓN' as seccion,
    u.id as user_id,
    u.email,
    u.created_at as fecha_registro,
    s.name as store_name,
    s.slug as store_slug,
    CASE 
        WHEN s.id IS NOT NULL THEN '🏪 TIENE TIENDA'
        ELSE '❌ SIN TIENDA'
    END as estado_tienda
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN stores s ON s.user_id = u.id
WHERE us.id IS NULL
ORDER BY u.created_at DESC;

-- Separador visual
SELECT '================================================' as separador;

-- 4. TRIALS QUE EXPIRAN PRONTO (PRÓXIMOS 3 DÍAS)
SELECT 
    'TRIALS POR EXPIRAR (3 DÍAS)' as seccion,
    u.email,
    s.name as store_name,
    us.trial_end_date,
    EXTRACT(days FROM (us.trial_end_date::timestamp - NOW()::timestamp))::integer as dias_restantes,
    EXTRACT(hours FROM (us.trial_end_date::timestamp - NOW()::timestamp))::integer as horas_restantes,
    '⚠️ EXPIRA PRONTO' as alerta
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
LEFT JOIN stores s ON s.user_id = u.id
WHERE us.status = 'trial' 
    AND us.trial_end_date IS NOT NULL 
    AND us.trial_end_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
ORDER BY us.trial_end_date ASC;

-- Separador visual
SELECT '================================================' as separador;

-- 5. TRIALS EXPIRADOS QUE NECESITAN ACTUALIZACIÓN
SELECT 
    'TRIALS EXPIRADOS' as seccion,
    u.email,
    s.name as store_name,
    us.trial_end_date,
    EXTRACT(days FROM (NOW()::timestamp - us.trial_end_date::timestamp))::integer as dias_expirado,
    '🔴 REQUIERE ACTUALIZACIÓN' as accion_requerida
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
LEFT JOIN stores s ON s.user_id = u.id
WHERE us.status = 'trial' 
    AND us.trial_end_date IS NOT NULL 
    AND us.trial_end_date < NOW()
ORDER BY us.trial_end_date ASC;

-- Separador visual
SELECT '================================================' as separador;

-- 6. ESTADÍSTICAS DE CONVERSIÓN
WITH conversion_stats AS (
    SELECT 
        COUNT(CASE WHEN status = 'trial' THEN 1 END) as trials_activos,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as suscripciones_activas,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspendidas,
        COUNT(*) as total_suscripciones
    FROM user_subscriptions
)
SELECT 
    'ESTADÍSTICAS DE CONVERSIÓN' as seccion,
    trials_activos,
    suscripciones_activas,
    canceladas,
    suspendidas,
    total_suscripciones,
    ROUND(suscripciones_activas * 100.0 / NULLIF(total_suscripciones, 0), 2) as porcentaje_conversion_total,
    ROUND(suscripciones_activas * 100.0 / NULLIF(suscripciones_activas + canceladas, 0), 2) as porcentaje_conversion_finalizados
FROM conversion_stats;

-- Separador visual
SELECT '================================================' as separador;

-- 7. INGRESOS PROYECTADOS (SUSCRIPCIONES ACTIVAS)
SELECT 
    'INGRESOS PROYECTADOS' as seccion,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as suscripciones_activas,
    SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) as ingreso_mensual_ars,
    ROUND(SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) / 1000.0, 2) as ingreso_mensual_miles_ars,
    ROUND(SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) * 12 / 1000.0, 2) as ingreso_anual_proyectado_miles_ars
FROM user_subscriptions;

-- Separador visual
SELECT '================================================' as separador;

-- 8. ANÁLISIS TEMPORAL (ÚLTIMAS 4 SEMANAS)
SELECT 
    'REGISTROS POR SEMANA (ÚLTIMAS 4)' as seccion,
    DATE_TRUNC('week', created_at) as semana,
    COUNT(*) as nuevas_suscripciones,
    COUNT(CASE WHEN status = 'trial' THEN 1 END) as trials_iniciados,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as activas_desde_inicio
FROM user_subscriptions
WHERE created_at >= NOW() - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY semana DESC;

-- Separador visual
SELECT '================================================' as separador;

-- 9. VERIFICACIÓN DE INTEGRIDAD DE DATOS
SELECT 
    'VERIFICACIÓN DE INTEGRIDAD' as seccion,
    'Suscripciones sin usuario' as tipo_error,
    COUNT(*) as cantidad
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'VERIFICACIÓN DE INTEGRIDAD' as seccion,
    'Trials sin fecha de fin' as tipo_error,
    COUNT(*) as cantidad
FROM user_subscriptions
WHERE status = 'trial' AND trial_end_date IS NULL

UNION ALL

SELECT 
    'VERIFICACIÓN DE INTEGRIDAD' as seccion,
    'Precios inconsistentes' as tipo_error,
    COUNT(*) as cantidad
FROM user_subscriptions
WHERE price != 36000.00 AND plan_id = 'premium'

UNION ALL

SELECT 
    'VERIFICACIÓN DE INTEGRIDAD' as seccion,
    'Sin MercadoPago ID' as tipo_error,
    COUNT(*) as cantidad
FROM user_subscriptions
WHERE mercadopago_preapproval_id IS NULL;

-- Separador visual
SELECT '================================================' as separador;

-- 10. COMANDO PARA LIMPIAR TRIALS EXPIRADOS (SOLO MOSTRAR, NO EJECUTAR)
SELECT 
    'COMANDO DE LIMPIEZA (NO SE EJECUTA)' as seccion,
    'UPDATE user_subscriptions SET status = ''cancelled'', updated_at = NOW() WHERE status = ''trial'' AND trial_end_date < NOW();' as comando_sql,
    COUNT(*) as registros_afectados
FROM user_subscriptions
WHERE status = 'trial' AND trial_end_date < NOW();

-- FIN DEL SCRIPT
SELECT '===============================================' as fin_script,
       'Verificación completada' as mensaje,
       NOW() as timestamp_ejecucion;
