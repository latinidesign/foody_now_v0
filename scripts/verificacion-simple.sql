-- ===============================================
-- SCRIPT SIMPLE DE VERIFICACIÓN - SIN ERRORES
-- Compatible con Supabase PostgreSQL
-- ===============================================

-- 1. RESUMEN BÁSICO
SELECT 
    'ESTADO ACTUAL' as seccion,
    status,
    COUNT(*) as cantidad
FROM user_subscriptions 
GROUP BY status
ORDER BY cantidad DESC;

-- 2. TRIALS CRÍTICOS
SELECT 
    'TRIALS CRÍTICOS' as seccion,
    u.email,
    us.status,
    us.trial_end_date,
    CASE 
        WHEN us.trial_end_date < NOW() THEN 'EXPIRADO'
        WHEN us.trial_end_date < NOW() + INTERVAL '24 hours' THEN 'EXPIRA HOY'
        WHEN us.trial_end_date < NOW() + INTERVAL '3 days' THEN 'EXPIRA PRONTO'
        ELSE 'OK'
    END as urgencia
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
WHERE us.status = 'trial' 
    AND us.trial_end_date IS NOT NULL
ORDER BY us.trial_end_date ASC;

-- 3. INGRESOS ACTUALES
SELECT 
    'INGRESOS' as seccion,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as suscripciones_activas,
    SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) as ingresos_mensuales,
    SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) * 12 as ingresos_anuales_proyectados
FROM user_subscriptions;

-- 4. CONVERSIÓN SIMPLE
SELECT 
    'CONVERSIÓN' as seccion,
    COUNT(CASE WHEN status = 'trial' THEN 1 END) as trials_activos,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as convertidos,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelados,
    ROUND(
        COUNT(CASE WHEN status = 'active' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(*), 0), 2
    ) as porcentaje_conversion
FROM user_subscriptions;

-- 5. ÚLTIMOS REGISTROS
SELECT 
    'ÚLTIMOS REGISTROS' as seccion,
    u.email,
    us.status,
    us.created_at,
    us.trial_end_date
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
ORDER BY us.created_at DESC
LIMIT 5;

-- 6. COMANDO DE LIMPIEZA (SOLO MOSTRAR)
SELECT 
    'LIMPIEZA NECESARIA' as seccion,
    COUNT(*) as trials_expirados,
    'UPDATE user_subscriptions SET status = ''cancelled'', updated_at = NOW() WHERE status = ''trial'' AND trial_end_date < NOW();' as comando_sql
FROM user_subscriptions
WHERE status = 'trial' AND trial_end_date < NOW();

SELECT 'FIN DEL REPORTE' as resultado, NOW() as timestamp;
