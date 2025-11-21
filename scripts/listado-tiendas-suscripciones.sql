-- ===============================================
-- LISTADO COMPLETO DE TIENDAS Y SUS SUSCRIPCIONES
-- Script único para ver el estado de todas las tiendas
-- ===============================================

-- LISTADO PRINCIPAL: TODAS LAS TIENDAS CON ESTADO DE SUSCRIPCIÓN
SELECT 
    -- Información de la tienda
    COALESCE(s.name, 'Sin nombre') as tienda,
    COALESCE(s.slug, 'sin-slug') as url_tienda,
    u.email as propietario,
    
    -- Estado de suscripción
    COALESCE(us.status, 'SIN_SUSCRIPCION') as estado_suscripcion,
    
    -- Indicador visual del estado
    CASE 
        WHEN us.status IS NULL THEN '❌ NO SUSCRITO'
        WHEN us.status = 'trial' AND us.trial_end_date >= NOW() THEN '🟢 TRIAL ACTIVO'
        WHEN us.status = 'trial' AND us.trial_end_date < NOW() THEN '🔴 TRIAL EXPIRADO'
        WHEN us.status = 'active' THEN '✅ PAGANDO'
        WHEN us.status = 'cancelled' THEN '❌ CANCELADO'
        WHEN us.status = 'suspended' THEN '⏸️ SUSPENDIDO'
        WHEN us.status = 'pending' THEN '⏳ PENDIENTE'
        ELSE '⚠️ ESTADO DESCONOCIDO'
    END as estado_visual,
    
    -- Información de fechas
    s.created_at as tienda_creada,
    us.created_at as suscripcion_creada,
    us.trial_start_date as inicio_trial,
    us.trial_end_date as fin_trial,
    us.subscription_start_date as inicio_pago,
    
    -- Información financiera
    COALESCE(us.price, 0) as precio_mensual,
    us.currency as moneda,
    
    -- Días restantes de trial (solo si aplica)
    CASE 
        WHEN us.status = 'trial' AND us.trial_end_date IS NOT NULL THEN
            GREATEST(0, EXTRACT(days FROM (us.trial_end_date - NOW()))::integer)
        ELSE NULL 
    END as dias_trial_restantes,
    
    -- Tiempo como cliente pagador (solo si aplica)
    CASE 
        WHEN us.status = 'active' AND us.subscription_start_date IS NOT NULL THEN
            EXTRACT(days FROM (NOW() - us.subscription_start_date))::integer
        ELSE NULL 
    END as dias_como_cliente_pago,
    
    -- IDs para referencia
    s.id as store_id,
    u.id as user_id,
    us.id as subscription_id

FROM stores s
LEFT JOIN auth.users u ON s.user_id = u.id
LEFT JOIN user_subscriptions us ON u.id = us.user_id
ORDER BY 
    -- Ordenar por estado: activos primero, luego trials, luego sin suscripción
    CASE 
        WHEN us.status = 'active' THEN 1
        WHEN us.status = 'trial' AND us.trial_end_date >= NOW() THEN 2
        WHEN us.status = 'trial' AND us.trial_end_date < NOW() THEN 3
        WHEN us.status = 'pending' THEN 4
        WHEN us.status = 'cancelled' THEN 5
        WHEN us.status = 'suspended' THEN 6
        WHEN us.status IS NULL THEN 7
        ELSE 8
    END,
    s.created_at DESC;

-- RESUMEN POR ESTADOS
SELECT '=============== RESUMEN POR ESTADOS ===============' as separador;

SELECT 
    'RESUMEN' as tipo,
    
    -- Conteos por estado
    COUNT(*) as total_tiendas,
    COUNT(CASE WHEN us.status = 'active' THEN 1 END) as tiendas_pagando,
    COUNT(CASE WHEN us.status = 'trial' AND us.trial_end_date >= NOW() THEN 1 END) as trials_activos,
    COUNT(CASE WHEN us.status = 'trial' AND us.trial_end_date < NOW() THEN 1 END) as trials_expirados,
    COUNT(CASE WHEN us.status = 'cancelled' THEN 1 END) as cancelados,
    COUNT(CASE WHEN us.status = 'suspended' THEN 1 END) as suspendidos,
    COUNT(CASE WHEN us.status IS NULL THEN 1 END) as sin_suscripcion,
    
    -- Ingresos
    SUM(CASE WHEN us.status = 'active' THEN us.price ELSE 0 END) as ingresos_mensuales_ars,
    
    -- Porcentajes
    ROUND(COUNT(CASE WHEN us.status = 'active' THEN 1 END) * 100.0 / COUNT(*), 1) as porcentaje_pagando,
    ROUND(COUNT(CASE WHEN us.status = 'trial' THEN 1 END) * 100.0 / COUNT(*), 1) as porcentaje_en_trial

FROM stores s
LEFT JOIN auth.users u ON s.user_id = u.id
LEFT JOIN user_subscriptions us ON u.id = us.user_id;

-- ALERTAS IMPORTANTES
SELECT '=============== ALERTAS IMPORTANTES ===============' as separador;

SELECT 
    'ALERTAS' as tipo,
    tienda,
    propietario,
    estado_visual,
    fin_trial,
    dias_trial_restantes,
    CASE 
        WHEN dias_trial_restantes = 0 THEN '🚨 EXPIRA HOY'
        WHEN dias_trial_restantes = 1 THEN '⚠️ EXPIRA MAÑANA'
        WHEN dias_trial_restantes <= 3 THEN '⏰ EXPIRA EN ' || dias_trial_restantes || ' DÍAS'
        WHEN dias_trial_restantes < 0 THEN '🔴 EXPIRADO HACE ' || ABS(dias_trial_restantes) || ' DÍAS'
        ELSE 'OK'
    END as urgencia
FROM (
    SELECT 
        COALESCE(s.name, 'Sin nombre') as tienda,
        u.email as propietario,
        CASE 
            WHEN us.status = 'trial' AND us.trial_end_date >= NOW() THEN '🟢 TRIAL ACTIVO'
            WHEN us.status = 'trial' AND us.trial_end_date < NOW() THEN '🔴 TRIAL EXPIRADO'
            ELSE us.status
        END as estado_visual,
        us.trial_end_date as fin_trial,
        CASE 
            WHEN us.status = 'trial' AND us.trial_end_date IS NOT NULL THEN
                EXTRACT(days FROM (us.trial_end_date - NOW()))::integer
            ELSE NULL 
        END as dias_trial_restantes
    FROM stores s
    LEFT JOIN auth.users u ON s.user_id = u.id
    LEFT JOIN user_subscriptions us ON u.id = us.user_id
    WHERE us.status = 'trial'
) alerts
WHERE dias_trial_restantes IS NOT NULL AND dias_trial_restantes <= 3
ORDER BY dias_trial_restantes ASC;

-- INFORMACIÓN FINAL
SELECT '=================== REPORTE COMPLETADO ===================' as fin,
       NOW() as fecha_generacion,
       'Listado de todas las tiendas y sus suscripciones' as descripcion;
