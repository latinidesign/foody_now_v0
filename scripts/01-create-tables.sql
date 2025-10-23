-- Database schema for Foody Now multi-tenant ecommerce system

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE delivery_type AS ENUM ('pickup', 'delivery');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Stores table (each business/restaurant)
CREATE TABLE IF NOT EXISTS stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- for subdomain/url
    description TEXT,
    logo_url TEXT,
    header_image_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#2D5016',
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    delivery_radius INTEGER DEFAULT 5, -- km
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product options (size, extras, etc.)
CREATE TABLE IF NOT EXISTS product_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g., "Size", "Extras"
    type VARCHAR(50) DEFAULT 'single', -- single, multiple
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product option values
CREATE TABLE IF NOT EXISTS product_option_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    option_id UUID REFERENCES product_options(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g., "Large", "Extra cheese"
    price_modifier DECIMAL(10,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    delivery_type delivery_type NOT NULL,
    delivery_address TEXT,
    delivery_notes TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_id VARCHAR(255), -- MercadoPago payment ID
    estimated_delivery_time INTEGER, -- minutes
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    selected_options JSONB, -- Store selected options as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checkout sessions to coordinate MercadoPago flow
CREATE TABLE IF NOT EXISTS checkout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_reference UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    items JSONB,
    order_data JSONB,
    subtotal DECIMAL(10,2),
    delivery_fee DECIMAL(10,2),
    total DECIMAL(10,2),
    preference_id TEXT,
    preference_payload JSONB,
    init_point TEXT,
    status TEXT DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_id TEXT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store settings
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
    whatsapp_number VARCHAR(20),
    mercadopago_access_token TEXT,
    mercadopago_public_key TEXT,
    business_hours JSONB, -- Store opening hours as JSON
    is_open BOOLEAN DEFAULT true,
    welcome_message TEXT,
    order_confirmation_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
CREATE POLICY "Store owners can manage their stores" ON stores
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view active stores" ON stores
    FOR SELECT USING (is_active = true);

-- RLS Policies for categories
CREATE POLICY "Store owners can manage their categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = categories.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view categories of active stores" ON categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = categories.store_id 
            AND stores.is_active = true
        )
    );

-- RLS Policies for products
CREATE POLICY "Store owners can manage their products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = products.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view available products of active stores" ON products
    FOR SELECT USING (
        is_available = true AND
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = products.store_id
            AND stores.is_active = true
        )
    );

CREATE POLICY "Store owners can manage their checkout sessions" ON checkout_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = checkout_sessions.store_id
            AND stores.owner_id = auth.uid()
        )
    );

-- Similar policies for other tables...
-- (Additional RLS policies would be added for complete security)

-- Create indexes for better performance
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_categories_store ON categories(store_id);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_checkout_sessions_store ON checkout_sessions(store_id);
CREATE INDEX idx_checkout_sessions_external_reference ON checkout_sessions(external_reference);
CREATE INDEX idx_checkout_sessions_preference ON checkout_sessions(preference_id);

-- Ejecutando script para crear todas las tablas necesarias
