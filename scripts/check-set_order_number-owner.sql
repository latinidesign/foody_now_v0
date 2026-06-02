-- Verifica el propietario y permisos de la función set_order_number
-- en la base de datos Supabase.

SELECT
  p.proname AS function_name,
  pg_get_userbyid(p.proowner) AS owner_role,
  p.prosecdef AS security_definer,
  p.prosrc AS source_code
FROM pg_proc p
WHERE p.proname = 'set_order_number';

SELECT
  r.rolname,
  r.rolsuper,
  r.rolcreaterole,
  r.rolcreatedb,
  r.rolbypassrls,
  r.rolcanlogin
FROM pg_roles r
WHERE r.rolname = (
  SELECT pg_get_userbyid(p.proowner)
  FROM pg_proc p
  WHERE p.proname = 'set_order_number'
);
