-- Activa pgvector (si ya está activo, no hace nada)
CREATE EXTENSION IF NOT EXISTS vector;

-- Cada fila = un trozo (chunk) de documentación
CREATE TABLE IF NOT EXISTS chunks (
  id        SERIAL PRIMARY KEY,   -- número único que se pone solo: 1, 2, 3...
  source    TEXT NOT NULL,        -- archivo de origen, ej: "react/rendering-lists.md"
  content   TEXT NOT NULL,        -- el texto del trozo
  embedding VECTOR(768) NOT NULL  -- sus 768 números (nomic-embed-text da 768)
);
