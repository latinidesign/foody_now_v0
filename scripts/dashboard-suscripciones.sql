-- ===============================================
-- SCRIPT RÁPIDO - ESTADO DE SUSCRIPCIONES
-- Para uso diario y monitoreo rápido
-- ===============================================

-- RESUMEN EJECUTIVO
WITH stats AS (
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'trial' THEN 1 END) as trials,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as activas,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspendidas,
        SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) as ingresos_mensuales
    FROM user_subscriptions
),
trial_alerts AS (
    SELECT COUNT(*) as trials_por_expirar
    FROM user_subscriptions 
    WHERE status = 'trial' 
        AND trial_end_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
),
expired_trials AS (
    SELECT COUNT(*) as trials_expirados
    FROM user_subscriptions 
    WHERE status = 'trial' AND trial_end_date < NOW()
)
SELECT 
    '📊 RESUMEN EJECUTIVO' as dashboard,
    s.total as total_suscripciones,
    s.trials as trials_activos,
    s.activas as suscripciones_activas,
    s.canceladas,
    s.suspendidas,
    ta.trials_por_expirar as "⚠️_expiran_3_dias",
    et.trials_expirados as "🔴_trials_expirados",
    CONCAT('$', ROUND(s.ingresos_mensuales)::text) as ingresos_mensuales_ars,
    ROUND(s.activas * 100.0 / NULLIF(s.total, 0), 1) || '%' as conversion_rate
FROM stats s, trial_alerts ta, expired_trials et;

-- ALERTAS CRÍTICAS
SELECT 
    '🚨 ALERTAS CRÍTICAS' as tipo,
    u.email,
    s.name as tienda,
    CASE 
        WHEN us.status = 'trial' AND us.trial_end_date < NOW() THEN 
            '🔴 Trial expirado hace ' || EXTRACT(days FROM (NOW() - us.trial_end_date))::text || ' días'
        WHEN us.status = 'trial' AND us.trial_end_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours' THEN 
            '⚠️ Trial expira en ' || EXTRACT(hours FROM (us.trial_end_date - NOW()))::text || ' horas'
        WHEN us.status = 'trial' AND us.trial_end_date BETWEEN NOW() + INTERVAL '24 hours' AND NOW() + INTERVAL '3 days' THEN 
            '⏰ Trial expira en ' || EXTRACT(days FROM (us.trial_end_date - NOW()))::text || ' días'
    END as alerta,
    us.trial_end_date,
    us.created_at as inicio_trial
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
LEFT JOIN stores s ON s.user_id = u.id
WHERE (
    (us.status = 'trial' AND us.trial_end_date < NOW()) OR
    (us.status = 'trial' AND us.trial_end_date BETWEEN NOW() AND NOW() + INTERVAL '3 days')
)
ORDER BY us.trial_end_date ASC
LIMIT 10;

-- TOP TIENDAS ACTIVAS
SELECT 
    '🏆 TOP TIENDAS ACTIVAS' as categoria,
    s.name as tienda,
    s.slug,
    u.email as propietario,
    us.subscription_start_date as cliente_desde,
    EXTRACT(days FROM (NOW() - us.subscription_start_date))::integer as dias_como_cliente,
    us.price as pago_mensual
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
LEFT JOIN stores s ON s.user_id = u.id
WHERE us.status = 'active'
ORDER BY us.subscription_start_date ASC
LIMIT 5;

-- COMANDO DE LIMPIEZA (SOLO MOSTRAR)
SELECT 
    '🧹 ACCIÓN RECOMENDADA' as tipo,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            'Ejecutar: UPDATE user_subscriptions SET status = ''cancelled'', updated_at = NOW() WHERE status = ''trial'' AND trial_end_date < NOW();'
        ELSE 
            'No hay trials expirados para limpiar'
    END as comando,
    COUNT(*) as trials_expirados_pendientes
FROM user_subscriptions
WHERE status = 'trial' AND trial_end_date < NOW();
