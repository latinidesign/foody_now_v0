-- Add gallery_images column to products table
ALTER TABLE products 
ADD COLUMN gallery_images TEXT[];

-- Add comment to explain the column
COMMENT ON COLUMN products.gallery_images IS 'Array of image URLs for product gallery, optimized for 800x450px';
