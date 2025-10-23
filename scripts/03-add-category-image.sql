-- Agregando campo de imagen a la tabla categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Agregando comentario para documentar el campo
COMMENT ON COLUMN categories.image_url IS 'URL de la imagen destacada de la categoría';
