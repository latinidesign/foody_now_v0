-- Update product_options table to support quantity type
ALTER TABLE product_options 
ALTER COLUMN type TYPE VARCHAR(50);

-- Update the type constraint to include 'quantity'
COMMENT ON COLUMN product_options.type IS 'Type of option: single, multiple, or quantity';

-- Add index for better performance on type queries
CREATE INDEX IF NOT EXISTS idx_product_options_type ON product_options(type);
