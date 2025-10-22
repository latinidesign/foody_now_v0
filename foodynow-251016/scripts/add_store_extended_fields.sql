-- Add extended description and gallery fields to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS extended_description TEXT,
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- Add business hours to store_settings if not exists
-- (business_hours already exists in the schema)

-- Update existing stores to have empty gallery
UPDATE stores SET gallery_images = '[]'::jsonb WHERE gallery_images IS NULL;
