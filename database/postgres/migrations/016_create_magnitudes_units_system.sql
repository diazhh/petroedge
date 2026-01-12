-- SISTEMA DE MAGNITUDES Y UNIDADES

-- 1. Tabla de Categorías de Magnitudes
CREATE TABLE IF NOT EXISTS magnitude_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_magnitude_categories_code ON magnitude_categories(code);
CREATE INDEX idx_magnitude_categories_is_active ON magnitude_categories(is_active);

-- 2. Tabla de Magnitudes
CREATE TABLE IF NOT EXISTS magnitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES magnitude_categories(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  symbol VARCHAR(20),
  si_unit_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_magnitudes_code ON magnitudes(code);
CREATE INDEX idx_magnitudes_category_id ON magnitudes(category_id);
CREATE INDEX idx_magnitudes_is_active ON magnitudes(is_active);

-- 3. Tabla de Unidades
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  magnitude_id UUID NOT NULL REFERENCES magnitudes(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  description TEXT,
  is_si_unit BOOLEAN DEFAULT false,
  conversion_factor DECIMAL(30, 15),
  conversion_offset DECIMAL(30, 15) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_units_code ON units(code);
CREATE INDEX idx_units_magnitude_id ON units(magnitude_id);
CREATE INDEX idx_units_is_active ON units(is_active);
CREATE INDEX idx_units_is_si_unit ON units(is_si_unit);

-- 4. Foreign key para si_unit_id en magnitudes
ALTER TABLE magnitudes 
  ADD CONSTRAINT fk_magnitudes_si_unit 
  FOREIGN KEY (si_unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- 5. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_magnitude_categories_updated_at
  BEFORE UPDATE ON magnitude_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_magnitudes_updated_at
  BEFORE UPDATE ON magnitudes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Comentarios
COMMENT ON TABLE magnitude_categories IS 'Categorías de magnitudes físicas';
COMMENT ON TABLE magnitudes IS 'Magnitudes físicas específicas';
COMMENT ON TABLE units IS 'Unidades de medida con factores de conversión';
COMMENT ON COLUMN units.conversion_factor IS 'Factor para convertir a unidad SI';
COMMENT ON COLUMN units.conversion_offset IS 'Offset para conversiones no lineales';
