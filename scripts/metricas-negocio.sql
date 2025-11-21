-- ===============================================
-- MÉTRICAS DE NEGOCIO Y KPIs
-- Para análisis de rendimiento del SaaS
-- ===============================================

-- 1. KPIs PRINCIPALES
WITH monthly_metrics AS (
    SELECT 
        DATE_TRUNC('month', created_at) as mes,
        COUNT(*) as nuevos_trials,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as conversiones,
        SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) as arr_mensual
    FROM user_subscriptions
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
),
current_metrics AS (
    SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as mrr_subscriptions,
        SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) as mrr_total,
        COUNT(CASE WHEN status = 'trial' THEN 1 END) as active_trials,
        COUNT(*) as total_users
    FROM user_subscriptions
)
SELECT 
    '📈 KPIs ACTUALES' as categoria,
    cm.mrr_subscriptions as suscripciones_activas,
    CONCAT('$', ROUND(cm.mrr_total)::text) as mrr_ars,
    CONCAT('$', ROUND(cm.mrr_total * 12)::text) as arr_proyectado_ars,
    cm.active_trials as trials_activos,
    cm.total_users as usuarios_totales,
    ROUND(cm.mrr_subscriptions * 100.0 / NULLIF(cm.total_users, 0), 2) || '%' as conversion_rate_global
FROM current_metrics cm;

-- 2. ANÁLISIS DE COHORTES (CONVERSIÓN POR MES)
SELECT 
    '📊 COHORTES MENSUALES' as categoria,
    TO_CHAR(mes, 'YYYY-MM') as mes_registro,
    nuevos_trials,
    conversiones,
    ROUND(conversiones * 100.0 / NULLIF(nuevos_trials, 0), 2) || '%' as tasa_conversion,
    CONCAT('$', ROUND(arr_mensual)::text) as arr_mes
FROM monthly_metrics
ORDER BY mes DESC;

-- 3. ANÁLISIS DE CHURN (CANCELACIONES)
WITH churn_analysis AS (
    SELECT 
        DATE_TRUNC('month', updated_at) as mes_cancelacion,
        COUNT(*) as cancelaciones,
        AVG(EXTRACT(days FROM (updated_at - created_at))) as dias_promedio_antes_cancelar
    FROM user_subscriptions
    WHERE status = 'cancelled'
        AND updated_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', updated_at)
)
SELECT 
    '📉 ANÁLISIS DE CHURN' as categoria,
    TO_CHAR(mes_cancelacion, 'YYYY-MM') as mes,
    cancelaciones,
    ROUND(dias_promedio_antes_cancelar, 0) as dias_promedio_vida,
    CASE 
        WHEN dias_promedio_antes_cancelar < 15 THEN '🔴 Abandonan en trial'
        WHEN dias_promedio_antes_cancelar < 45 THEN '🟡 Abandonan primer mes'
        ELSE '🟢 Clientes establecidos'
    END as tipo_churn
FROM churn_analysis
ORDER BY mes_cancelacion DESC;

-- 4. VALOR DE VIDA DEL CLIENTE (LTV)
WITH ltv_calculation AS (
    SELECT 
        AVG(price) as precio_promedio,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::float / 
        NULLIF(COUNT(CASE WHEN status = 'cancelled' THEN 1 END), 0) as retention_ratio,
        AVG(CASE 
            WHEN status IN ('active', 'cancelled') AND subscription_start_date IS NOT NULL THEN 
                EXTRACT(days FROM (COALESCE(updated_at, NOW()) - subscription_start_date))
            ELSE NULL 
        END) as dias_promedio_vida
    FROM user_subscriptions
    WHERE status IN ('active', 'cancelled', 'suspended')
)
SELECT 
    '💰 VALOR DE VIDA CLIENTE' as categoria,
    CONCAT('$', ROUND(precio_promedio)::text) as precio_promedio_mensual,
    ROUND(dias_promedio_vida / 30.0, 1) as meses_promedio_vida,
    ROUND(retention_ratio, 2) as ratio_retencion,
    CONCAT('$', ROUND(precio_promedio * (dias_promedio_vida / 30.0))::text) as ltv_estimado
FROM ltv_calculation;

-- 5. ANÁLISIS DE TRIALS
WITH trial_analysis AS (
    SELECT 
        COUNT(*) as total_trials,
        COUNT(CASE WHEN trial_end_date < NOW() THEN 1 END) as trials_expirados,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as convertidos_a_pago,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelados,
        AVG(EXTRACT(days FROM (trial_end_date - trial_start_date))) as duracion_promedio_trial
    FROM user_subscriptions
    WHERE trial_start_date IS NOT NULL
)
SELECT 
    '🧪 ANÁLISIS DE TRIALS' as categoria,
    total_trials,
    trials_expirados,
    convertidos_a_pago,
    cancelados,
    ROUND(convertidos_a_pago * 100.0 / NULLIF(trials_expirados, 0), 2) || '%' as conversion_rate_trials,
    ROUND(duracion_promedio_trial, 0) as dias_duracion_promedio
FROM trial_analysis;

-- 6. DISTRIBUCIÓN GEOGRÁFICA (SI HAY DATOS)
SELECT 
    '🌍 TOP DOMINIOS EMAIL' as categoria,
    SPLIT_PART(u.email, '@', 2) as dominio,
    COUNT(*) as usuarios,
    COUNT(CASE WHEN us.status = 'active' THEN 1 END) as activos,
    ROUND(COUNT(CASE WHEN us.status = 'active' THEN 1 END) * 100.0 / COUNT(*), 2) || '%' as tasa_conversion
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
GROUP BY SPLIT_PART(u.email, '@', 2)
HAVING COUNT(*) >= 2
ORDER BY usuarios DESC
LIMIT 10;

-- 7. RENDIMIENTO SEMANAL (ÚLTIMAS 8 SEMANAS)
SELECT 
    '📅 TENDENCIAS SEMANALES' as categoria,
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') as semana,
    COUNT(*) as nuevos_registros,
    COUNT(CASE WHEN status = 'trial' THEN 1 END) as trials_iniciados,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as conversiones_semana,
    SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) as ingresos_semana
FROM user_subscriptions
WHERE created_at >= NOW() - INTERVAL '8 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY semana DESC;

-- 8. PROYECCIÓN DE CRECIMIENTO
WITH growth_projection AS (
    SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as base_actual,
        AVG(COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END)) OVER (
            ORDER BY DATE_TRUNC('month', created_at) 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) as promedio_nuevos_mes,
        0.15 as conversion_rate_estimada -- 15%
    FROM user_subscriptions
    WHERE created_at >= NOW() - INTERVAL '3 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at) DESC
    LIMIT 1
)
SELECT 
    '🚀 PROYECCIÓN 6 MESES' as categoria,
    base_actual as suscripciones_actuales,
    ROUND(promedio_nuevos_mes * conversion_rate_estimada) as conversiones_estimadas_mes,
    ROUND(base_actual + (promedio_nuevos_mes * conversion_rate_estimada * 6)) as proyeccion_6_meses,
    CONCAT('$', ROUND((base_actual + (promedio_nuevos_mes * conversion_rate_estimada * 6)) * 36000)::text) as mrr_proyectado
FROM growth_projection;

-- TIMESTAMP DEL REPORTE
SELECT '⏰ REPORTE GENERADO' as info,
       NOW() as timestamp,
       'Métricas SaaS FoodyNow' as sistema;
