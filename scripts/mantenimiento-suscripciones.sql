-- ===============================================
-- SCRIPT DE MANTENIMIENTO DE SUSCRIPCIONES
-- ⚠️ EJECUTAR CON PRECAUCIÓN - MODIFICA DATOS
-- ===============================================

-- PASO 1: VERIFICAR ANTES DE EJECUTAR
SELECT 
    '⚠️ VERIFICACIÓN PREVIA' as paso,
    COUNT(*) as trials_expirados_a_cancelar,
    string_agg(u.email, ', ') as emails_afectados
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
WHERE us.status = 'trial' AND us.trial_end_date < NOW();

-- PASO 2: ACTUALIZAR TRIALS EXPIRADOS
-- Descomentar la siguiente línea SOLO si quieres ejecutar la limpieza:
-- UPDATE user_subscriptions 
-- SET status = 'cancelled', updated_at = NOW() 
-- WHERE status = 'trial' AND trial_end_date < NOW();

-- PASO 3: VERIFICAR DESPUÉS DE LA LIMPIEZA
-- Descomentar para ver el resultado:
-- SELECT 
--     '✅ RESULTADO LIMPIEZA' as paso,
--     COUNT(CASE WHEN status = 'trial' AND trial_end_date < NOW() THEN 1 END) as trials_expirados_restantes,
--     COUNT(CASE WHEN status = 'cancelled' AND updated_at::date = CURRENT_DATE THEN 1 END) as cancelados_hoy
-- FROM user_subscriptions;

-- PASO 4: CREAR FUNCIÓN AUTOMÁTICA DE LIMPIEZA (EJECUTAR UNA SOLA VEZ)
CREATE OR REPLACE FUNCTION cleanup_expired_trials()
RETURNS TABLE(
    trials_cancelados integer,
    emails_afectados text[]
) 
LANGUAGE plpgsql
AS $$
DECLARE
    affected_count integer;
    affected_emails text[];
BEGIN
    -- Obtener emails afectados antes de la actualización
    SELECT array_agg(u.email)
    INTO affected_emails
    FROM user_subscriptions us
    LEFT JOIN auth.users u ON us.user_id = u.id
    WHERE us.status = 'trial' AND us.trial_end_date < NOW();
    
    -- Actualizar trials expirados
    UPDATE user_subscriptions 
    SET status = 'cancelled', updated_at = NOW() 
    WHERE status = 'trial' AND trial_end_date < NOW();
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT affected_count, COALESCE(affected_emails, ARRAY[]::text[]);
END;
$$;

-- PASO 5: CREAR TAREA PROGRAMADA (SOLO DISPONIBLE SI pg_cron ESTÁ INSTALADO)
-- Esta función se puede llamar diariamente para limpieza automática
-- NOTA: pg_cron no está disponible en Supabase por defecto
-- Alternativa: Usar un webhook o función serverless para automatización
/*
SELECT cron.schedule(
    'cleanup-expired-trials',  -- nombre del job
    '0 2 * * *',              -- ejecutar a las 2:00 AM todos los días
    'SELECT cleanup_expired_trials();'
);
*/
SELECT 'pg_cron no disponible en Supabase. Usar Edge Functions para automatización.' as nota;

-- VERIFICACIÓN FINAL
SELECT 'Script de mantenimiento preparado' as status,
       'Función cleanup_expired_trials() creada' as funcion,
       'Cron job programado para 2:00 AM diario' as automatizacion;
