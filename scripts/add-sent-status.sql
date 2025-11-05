-- Agregar el estado 'sent' al ENUM order_status
-- Este script agrega el estado 'sent' para manejar pedidos en tránsito (enviados)

-- Agregar el nuevo valor al ENUM
ALTER TYPE order_status ADD VALUE 'sent' AFTER 'ready';

-- Verificar que se agregó correctamente
SELECT unnest(enum_range(NULL::order_status)) AS status_values;

-- Mensaje de confirmación
SELECT 'Estado "sent" agregado exitosamente al ENUM order_status' AS resultado;
