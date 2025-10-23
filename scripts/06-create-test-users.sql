-- Script para crear usuarios de prueba para las tiendas de demostración
-- IMPORTANTE: Estos usuarios deben crearse manualmente en Supabase Auth Dashboard

-- USUARIOS DE PRUEBA PARA CREAR EN SUPABASE AUTH DASHBOARD:
-- 
-- Usuario 1 - Pizzería Don Mario:
-- Email: admin@pizzeriadonmario.com
-- Password: PizzaDonMario2024!
-- User ID: 550e8400-e29b-41d4-a716-446655440001
--
-- Usuario 2 - Café Central:
-- Email: admin@cafecentral.com  
-- Password: CafeCentral2024!
-- User ID: 550e8400-e29b-41d4-a716-446655440003

-- Una vez creados los usuarios en Supabase Auth, ejecutar este script para vincularlos con las tiendas:

-- Actualizar owner_id de Pizzería Don Mario
UPDATE stores 
SET owner_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE slug = 'pizzeria-don-mario';

-- Actualizar owner_id de Café Central  
UPDATE stores 
SET owner_id = '550e8400-e29b-41d4-a716-446655440003'
WHERE slug = 'cafe-central';

-- Insertar perfiles de usuario en la tabla profiles (si existe)
-- INSERT INTO profiles (id, email, full_name, role) VALUES
-- ('550e8400-e29b-41d4-a716-446655440001', 'admin@pizzeriadonmario.com', 'Mario Rossi', 'store_owner'),
-- ('550e8400-e29b-41d4-a716-446655440003', 'admin@cafecentral.com', 'Ana García', 'store_owner');
