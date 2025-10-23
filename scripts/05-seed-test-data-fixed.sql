-- Script para agregar datos de prueba al sistema Foody Now
-- Incluye tiendas, categorías, productos, usuarios y pedidos de ejemplo

-- Usar NULL para owner_id para evitar violación de clave foránea
-- Insertar tienda de ejemplo
INSERT INTO stores (id, owner_id, name, slug, description, logo_url, header_image_url, primary_color, phone, email, address, delivery_radius, delivery_fee, min_order_amount, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', NULL, 'Pizzería Don Mario', 'pizzeria-don-mario', 'Las mejores pizzas artesanales de la ciudad con ingredientes frescos y masa madre tradicional', '/placeholder.svg?height=100&width=100', '/placeholder.svg?height=300&width=800', '#2D5016', '+5491123456789', 'contacto@pizzeriadonmario.com', 'Av. Corrientes 1234, CABA', 5000, 350, 1500, true),
('550e8400-e29b-41d4-a716-446655440002', NULL, 'Café Central', 'cafe-central', 'Café de especialidad, desayunos y meriendas en el corazón de la ciudad', '/placeholder.svg?height=100&width=100', '/placeholder.svg?height=300&width=800', '#4A7C59', '+5491198765432', 'hola@cafecentral.com', 'San Martín 567, CABA', 3000, 250, 800, true);

-- Insertar categorías para Pizzería Don Mario
INSERT INTO categories (id, store_id, name, description, image_url, sort_order, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Pizzas Clásicas', 'Nuestras pizzas tradicionales con los sabores de siempre', '/placeholder.svg?height=200&width=300', 1, true),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Pizzas Gourmet', 'Creaciones especiales con ingredientes premium', '/placeholder.svg?height=200&width=300', 2, true),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Empanadas', 'Empanadas caseras horneadas', '/placeholder.svg?height=200&width=300', 3, true),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Bebidas', 'Gaseosas, aguas y jugos', '/placeholder.svg?height=200&width=300', 4, true);

-- Insertar categorías para Café Central
INSERT INTO categories (id, store_id, name, description, image_url, sort_order, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Cafés', 'Café de especialidad, espressos y blends únicos', '/placeholder.svg?height=200&width=300', 1, true),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Desayunos', 'Desayunos completos y saludables', '/placeholder.svg?height=200&width=300', 2, true),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Pastelería', 'Tortas, muffins y dulces caseros', '/placeholder.svg?height=200&width=300', 3, true);

-- Insertar productos para Pizzería Don Mario
INSERT INTO products (id, store_id, category_id, name, description, price, image_url, is_available, sort_order) VALUES
-- Pizzas Clásicas
('770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'Pizza Margherita', 'Salsa de tomate, mozzarella, albahaca fresca y aceite de oliva', 2800, '/placeholder.svg?height=300&width=300', true, 1),
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'Pizza Napolitana', 'Salsa de tomate, mozzarella, tomate en rodajas, ajo y orégano', 3200, '/placeholder.svg?height=300&width=300', true, 2),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'Pizza Fugazzeta', 'Mozzarella, cebolla caramelizada y orégano', 3500, '/placeholder.svg?height=300&width=300', true, 3),
-- Pizzas Gourmet
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'Pizza Cuatro Quesos', 'Mozzarella, roquefort, parmesano y provolone', 4200, '/placeholder.svg?height=300&width=300', true, 1),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'Pizza Prosciutto', 'Salsa de tomate, mozzarella, jamón crudo, rúcula y parmesano', 4800, '/placeholder.svg?height=300&width=300', true, 2),
-- Empanadas
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', 'Empanadas de Carne', 'Carne cortada a cuchillo, cebolla, huevo y aceitunas (docena)', 3600, '/placeholder.svg?height=300&width=300', true, 1),
('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', 'Empanadas de Jamón y Queso', 'Jamón cocido y queso mozzarella (docena)', 3200, '/placeholder.svg?height=300&width=300', true, 2),
-- Bebidas
('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440003', 'Coca Cola 1.5L', 'Gaseosa Coca Cola botella 1.5 litros', 800, '/placeholder.svg?height=300&width=300', true, 1),
('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440003', 'Agua Mineral', 'Agua mineral sin gas 500ml', 400, '/placeholder.svg?height=300&width=300', true, 2);

-- Insertar productos para Café Central
INSERT INTO products (id, store_id, category_id, name, description, price, image_url, is_available, sort_order) VALUES
-- Cafés
('770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 'Espresso', 'Café espresso tradicional italiano', 650, '/placeholder.svg?height=300&width=300', true, 1),
('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 'Cappuccino', 'Espresso con leche vaporizada y espuma', 950, '/placeholder.svg?height=300&width=300', true, 2),
('770e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 'Latte', 'Espresso con leche vaporizada y arte latte', 1100, '/placeholder.svg?height=300&width=300', true, 3),
-- Desayunos
('770e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', 'Tostadas Integrales', 'Pan integral con palta, tomate y semillas', 1400, '/placeholder.svg?height=300&width=300', true, 1),
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', 'Granola Bowl', 'Yogur griego, granola casera, frutas de estación y miel', 1800, '/placeholder.svg?height=300&width=300', true, 2),
-- Pastelería
('770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440006', 'Muffin de Arándanos', 'Muffin casero con arándanos frescos', 850, '/placeholder.svg?height=300&width=300', true, 1),
('770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440006', 'Cheesecake', 'Porción de cheesecake con frutos rojos', 1200, '/placeholder.svg?height=300&width=300', true, 2);

-- Insertar pedidos de ejemplo con diferentes estados
INSERT INTO orders (id, store_id, customer_name, customer_phone, customer_email, delivery_type, delivery_address, subtotal, delivery_fee, total, status, payment_status, estimated_delivery_time, notes) VALUES
('880e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'María González', '+5491123456789', 'maria.gonzalez@email.com', 'delivery', 'Av. Santa Fe 1234, Piso 5, Depto A', 6000, 350, 6350, 'confirmed', 'completed', 45, 'Sin cebolla en la pizza napolitana'),
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Carlos Rodríguez', '+5491198765432', 'carlos.rodriguez@email.com', 'pickup', NULL, 3200, 0, 3200, 'preparing', 'completed', 20, NULL),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Ana Martínez', '+5491156789012', 'ana.martinez@email.com', 'delivery', 'Callao 567, 2do piso', 4200, 350, 4550, 'ready', 'completed', 15, 'Timbre 2B'),
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Juan Pérez', '+5491134567890', 'juan.perez@email.com', 'pickup', NULL, 2750, 0, 2750, 'delivered', 'completed', NULL, NULL),
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Laura Silva', '+5491187654321', 'laura.silva@email.com', 'delivery', 'Rivadavia 890, PB', 1950, 250, 2200, 'pending', 'pending', 35, 'Café sin azúcar');

-- Insertar items de pedidos
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES
-- Pedido 1: María González (Pizzería)
('990e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440001', 1, 3200, 3200), -- Pizza Napolitana
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 1, 2800, 2800), -- Pizza Margherita
-- Pedido 2: Carlos Rodríguez (Pizzería)
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 1, 3200, 3200), -- Pizza Napolitana
-- Pedido 3: Ana Martínez (Pizzería)
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', 1, 4200, 4200), -- Pizza Cuatro Quesos
-- Pedido 4: Juan Pérez (Café)
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440010', 2, 950, 1900), -- 2 Cappuccinos
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440014', 1, 850, 850), -- Muffin de Arándanos
-- Pedido 5: Laura Silva (Café)
('990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440011', 1, 1100, 1100), -- Latte
('990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440014', 1, 850, 850); -- Muffin de Arándanos

-- Insertar configuraciones de tienda
INSERT INTO store_settings (id, store_id, whatsapp_number, is_open, welcome_message, order_confirmation_message) VALUES
('aa0e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '+5491123456789', true, '¡Bienvenido a Pizzería Don Mario! 🍕 Las mejores pizzas artesanales te esperan.', 'Gracias por tu pedido. Lo estamos preparando con mucho cariño. Te avisaremos cuando esté listo.'),
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '+5491198765432', true, '☕ Bienvenido a Café Central. El mejor café de especialidad de la ciudad.', 'Tu pedido está confirmado. Nuestros baristas están preparando tu café perfecto.');
