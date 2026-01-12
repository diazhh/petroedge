-- =====================================================
-- SEED: MAGNITUDES Y UNIDADES PETROLERAS
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CATEGORÍAS DE MAGNITUDES
-- =====================================================

INSERT INTO magnitude_categories (code, name, description, icon, color) VALUES
('LENGTH', 'Longitud', 'Medidas de distancia y profundidad', 'ruler', '#3b82f6'),
('MASS', 'Masa', 'Medidas de masa y peso', 'weight', '#8b5cf6'),
('PRESSURE', 'Presión', 'Medidas de presión', 'gauge', '#ef4444'),
('TEMPERATURE', 'Temperatura', 'Medidas de temperatura', 'thermometer', '#f59e0b'),
('VOLUME', 'Volumen', 'Medidas de volumen', 'box', '#10b981'),
('FLOW_RATE', 'Caudal', 'Medidas de flujo volumétrico y másico', 'droplet', '#06b6d4'),
('VELOCITY', 'Velocidad', 'Medidas de velocidad', 'zap', '#6366f1'),
('DENSITY', 'Densidad', 'Medidas de densidad', 'layers', '#ec4899'),
('VISCOSITY', 'Viscosidad', 'Medidas de viscosidad dinámica y cinemática', 'droplets', '#14b8a6'),
('ENERGY', 'Energía', 'Medidas de energía', 'battery', '#f97316'),
('POWER', 'Potencia', 'Medidas de potencia', 'zap-off', '#eab308'),
('TORQUE', 'Torque', 'Medidas de momento de fuerza', 'rotate-cw', '#a855f7'),
('ANGLE', 'Ángulo', 'Medidas angulares', 'circle-slash', '#64748b'),
('TIME', 'Tiempo', 'Medidas de tiempo', 'clock', '#0ea5e9');

-- =====================================================
-- 2. MAGNITUDES
-- =====================================================

-- LONGITUD
INSERT INTO magnitudes (category_id, code, name, symbol) 
SELECT id, 'LENGTH', 'Longitud', 'L' FROM magnitude_categories WHERE code = 'LENGTH';

-- MASA
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'MASS', 'Masa', 'M' FROM magnitude_categories WHERE code = 'MASS';

-- PRESIÓN
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'PRESSURE', 'Presión', 'P' FROM magnitude_categories WHERE code = 'PRESSURE';

-- TEMPERATURA
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'TEMPERATURE', 'Temperatura', 'T' FROM magnitude_categories WHERE code = 'TEMPERATURE';

-- VOLUMEN
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'VOLUME', 'Volumen', 'V' FROM magnitude_categories WHERE code = 'VOLUME';

-- CAUDAL VOLUMÉTRICO
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'FLOW_RATE_VOLUME', 'Caudal Volumétrico', 'Q' FROM magnitude_categories WHERE code = 'FLOW_RATE';

-- CAUDAL MÁSICO
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'FLOW_RATE_MASS', 'Caudal Másico', 'Qm' FROM magnitude_categories WHERE code = 'FLOW_RATE';

-- VELOCIDAD
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'VELOCITY', 'Velocidad', 'v' FROM magnitude_categories WHERE code = 'VELOCITY';

-- DENSIDAD
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'DENSITY', 'Densidad', 'ρ' FROM magnitude_categories WHERE code = 'DENSITY';

-- VISCOSIDAD DINÁMICA
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'DYNAMIC_VISCOSITY', 'Viscosidad Dinámica', 'μ' FROM magnitude_categories WHERE code = 'VISCOSITY';

-- VISCOSIDAD CINEMÁTICA
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'KINEMATIC_VISCOSITY', 'Viscosidad Cinemática', 'ν' FROM magnitude_categories WHERE code = 'VISCOSITY';

-- ENERGÍA
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'ENERGY', 'Energía', 'E' FROM magnitude_categories WHERE code = 'ENERGY';

-- POTENCIA
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'POWER', 'Potencia', 'P' FROM magnitude_categories WHERE code = 'POWER';

-- TORQUE
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'TORQUE', 'Torque', 'τ' FROM magnitude_categories WHERE code = 'TORQUE';

-- ÁNGULO
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'ANGLE', 'Ángulo', 'θ' FROM magnitude_categories WHERE code = 'ANGLE';

-- TIEMPO
INSERT INTO magnitudes (category_id, code, name, symbol)
SELECT id, 'TIME', 'Tiempo', 't' FROM magnitude_categories WHERE code = 'TIME';

-- =====================================================
-- 3. UNIDADES - LONGITUD
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'METER', 'Metro', 'm', true, 1.0 FROM magnitudes WHERE code = 'LENGTH';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'FOOT', 'Pie', 'ft', 0.3048 FROM magnitudes WHERE code = 'LENGTH';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'INCH', 'Pulgada', 'in', 0.0254 FROM magnitudes WHERE code = 'LENGTH';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'CENTIMETER', 'Centímetro', 'cm', 0.01 FROM magnitudes WHERE code = 'LENGTH';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'MILLIMETER', 'Milímetro', 'mm', 0.001 FROM magnitudes WHERE code = 'LENGTH';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'KILOMETER', 'Kilómetro', 'km', 1000.0 FROM magnitudes WHERE code = 'LENGTH';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'MILE', 'Milla', 'mi', 1609.344 FROM magnitudes WHERE code = 'LENGTH';

-- =====================================================
-- 4. UNIDADES - MASA
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'KILOGRAM', 'Kilogramo', 'kg', true, 1.0 FROM magnitudes WHERE code = 'MASS';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'POUND', 'Libra', 'lb', 0.45359237 FROM magnitudes WHERE code = 'MASS';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'TON_METRIC', 'Tonelada Métrica', 't', 1000.0 FROM magnitudes WHERE code = 'MASS';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'GRAM', 'Gramo', 'g', 0.001 FROM magnitudes WHERE code = 'MASS';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'OUNCE', 'Onza', 'oz', 0.028349523125 FROM magnitudes WHERE code = 'MASS';

-- =====================================================
-- 5. UNIDADES - PRESIÓN
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'PASCAL', 'Pascal', 'Pa', true, 1.0 FROM magnitudes WHERE code = 'PRESSURE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'PSI', 'Libra por pulgada cuadrada', 'psi', 6894.757293168 FROM magnitudes WHERE code = 'PRESSURE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'BAR', 'Bar', 'bar', 100000.0 FROM magnitudes WHERE code = 'PRESSURE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'KILOPASCAL', 'Kilopascal', 'kPa', 1000.0 FROM magnitudes WHERE code = 'PRESSURE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'MEGAPASCAL', 'Megapascal', 'MPa', 1000000.0 FROM magnitudes WHERE code = 'PRESSURE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'ATMOSPHERE', 'Atmósfera', 'atm', 101325.0 FROM magnitudes WHERE code = 'PRESSURE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'KG_CM2', 'Kilogramo por centímetro cuadrado', 'kg/cm²', 98066.5 FROM magnitudes WHERE code = 'PRESSURE';

-- =====================================================
-- 6. UNIDADES - TEMPERATURA
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor, conversion_offset)
SELECT id, 'KELVIN', 'Kelvin', 'K', true, 1.0, 0.0 FROM magnitudes WHERE code = 'TEMPERATURE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor, conversion_offset)
SELECT id, 'CELSIUS', 'Celsius', '°C', 1.0, 273.15 FROM magnitudes WHERE code = 'TEMPERATURE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor, conversion_offset)
SELECT id, 'FAHRENHEIT', 'Fahrenheit', '°F', 0.555555555556, 255.372222222222 FROM magnitudes WHERE code = 'TEMPERATURE';

-- =====================================================
-- 7. UNIDADES - VOLUMEN
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'CUBIC_METER', 'Metro cúbico', 'm³', true, 1.0 FROM magnitudes WHERE code = 'VOLUME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'BARREL', 'Barril', 'bbl', 0.158987294928 FROM magnitudes WHERE code = 'VOLUME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'GALLON', 'Galón', 'gal', 0.003785411784 FROM magnitudes WHERE code = 'VOLUME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'LITER', 'Litro', 'L', 0.001 FROM magnitudes WHERE code = 'VOLUME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'CUBIC_FOOT', 'Pie cúbico', 'ft³', 0.028316846592 FROM magnitudes WHERE code = 'VOLUME';

-- =====================================================
-- 8. UNIDADES - CAUDAL VOLUMÉTRICO
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'CUBIC_METER_PER_SECOND', 'Metro cúbico por segundo', 'm³/s', true, 1.0 FROM magnitudes WHERE code = 'FLOW_RATE_VOLUME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'BARREL_PER_DAY', 'Barril por día', 'bbl/d', 0.000001840130728333 FROM magnitudes WHERE code = 'FLOW_RATE_VOLUME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'CUBIC_METER_PER_DAY', 'Metro cúbico por día', 'm³/d', 0.000011574074074074 FROM magnitudes WHERE code = 'FLOW_RATE_VOLUME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'LITER_PER_SECOND', 'Litro por segundo', 'L/s', 0.001 FROM magnitudes WHERE code = 'FLOW_RATE_VOLUME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'GALLON_PER_MINUTE', 'Galón por minuto', 'gpm', 0.00006309019639 FROM magnitudes WHERE code = 'FLOW_RATE_VOLUME';

-- =====================================================
-- 9. UNIDADES - CAUDAL MÁSICO
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'KILOGRAM_PER_SECOND', 'Kilogramo por segundo', 'kg/s', true, 1.0 FROM magnitudes WHERE code = 'FLOW_RATE_MASS';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'POUND_PER_HOUR', 'Libra por hora', 'lb/h', 0.00012599788888889 FROM magnitudes WHERE code = 'FLOW_RATE_MASS';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'TON_PER_DAY', 'Tonelada por día', 't/d', 0.011574074074074 FROM magnitudes WHERE code = 'FLOW_RATE_MASS';

-- =====================================================
-- 10. UNIDADES - VELOCIDAD
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'METER_PER_SECOND', 'Metro por segundo', 'm/s', true, 1.0 FROM magnitudes WHERE code = 'VELOCITY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'FOOT_PER_SECOND', 'Pie por segundo', 'ft/s', 0.3048 FROM magnitudes WHERE code = 'VELOCITY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'KILOMETER_PER_HOUR', 'Kilómetro por hora', 'km/h', 0.277777777778 FROM magnitudes WHERE code = 'VELOCITY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'MILE_PER_HOUR', 'Milla por hora', 'mph', 0.44704 FROM magnitudes WHERE code = 'VELOCITY';

-- =====================================================
-- 11. UNIDADES - DENSIDAD
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'KILOGRAM_PER_CUBIC_METER', 'Kilogramo por metro cúbico', 'kg/m³', true, 1.0 FROM magnitudes WHERE code = 'DENSITY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'POUND_PER_CUBIC_FOOT', 'Libra por pie cúbico', 'lb/ft³', 16.0184633739601 FROM magnitudes WHERE code = 'DENSITY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'GRAM_PER_CUBIC_CENTIMETER', 'Gramo por centímetro cúbico', 'g/cm³', 1000.0 FROM magnitudes WHERE code = 'DENSITY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor, description)
SELECT id, 'API_GRAVITY', 'Gravedad API', '°API', 1.0, 'Escala API: °API = (141.5/SG@60°F) - 131.5' FROM magnitudes WHERE code = 'DENSITY';

-- =====================================================
-- 12. UNIDADES - VISCOSIDAD DINÁMICA
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'PASCAL_SECOND', 'Pascal segundo', 'Pa·s', true, 1.0 FROM magnitudes WHERE code = 'DYNAMIC_VISCOSITY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'CENTIPOISE', 'Centipoise', 'cP', 0.001 FROM magnitudes WHERE code = 'DYNAMIC_VISCOSITY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'POISE', 'Poise', 'P', 0.1 FROM magnitudes WHERE code = 'DYNAMIC_VISCOSITY';

-- =====================================================
-- 13. UNIDADES - VISCOSIDAD CINEMÁTICA
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'SQUARE_METER_PER_SECOND', 'Metro cuadrado por segundo', 'm²/s', true, 1.0 FROM magnitudes WHERE code = 'KINEMATIC_VISCOSITY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'CENTISTOKE', 'Centistoke', 'cSt', 0.000001 FROM magnitudes WHERE code = 'KINEMATIC_VISCOSITY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'STOKE', 'Stoke', 'St', 0.0001 FROM magnitudes WHERE code = 'KINEMATIC_VISCOSITY';

-- =====================================================
-- 14. UNIDADES - ENERGÍA
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'JOULE', 'Joule', 'J', true, 1.0 FROM magnitudes WHERE code = 'ENERGY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'KILOWATT_HOUR', 'Kilovatio hora', 'kWh', 3600000.0 FROM magnitudes WHERE code = 'ENERGY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'BTU', 'British Thermal Unit', 'BTU', 1055.05585262 FROM magnitudes WHERE code = 'ENERGY';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'CALORIE', 'Caloría', 'cal', 4.184 FROM magnitudes WHERE code = 'ENERGY';

-- =====================================================
-- 15. UNIDADES - POTENCIA
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'WATT', 'Watt', 'W', true, 1.0 FROM magnitudes WHERE code = 'POWER';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'KILOWATT', 'Kilovatio', 'kW', 1000.0 FROM magnitudes WHERE code = 'POWER';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'HORSEPOWER', 'Caballo de fuerza', 'HP', 745.699871582 FROM magnitudes WHERE code = 'POWER';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'BTU_PER_HOUR', 'BTU por hora', 'BTU/h', 0.29307107017 FROM magnitudes WHERE code = 'POWER';

-- =====================================================
-- 16. UNIDADES - TORQUE
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'NEWTON_METER', 'Newton metro', 'N·m', true, 1.0 FROM magnitudes WHERE code = 'TORQUE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'POUND_FOOT', 'Libra pie', 'lb·ft', 1.3558179483314 FROM magnitudes WHERE code = 'TORQUE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'KILOGRAM_METER', 'Kilogramo metro', 'kg·m', 9.80665 FROM magnitudes WHERE code = 'TORQUE';

-- =====================================================
-- 17. UNIDADES - ÁNGULO
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'RADIAN', 'Radián', 'rad', true, 1.0 FROM magnitudes WHERE code = 'ANGLE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'DEGREE', 'Grado', 'deg', 0.0174532925199433 FROM magnitudes WHERE code = 'ANGLE';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'GRADIAN', 'Gradián', 'grad', 0.015707963267949 FROM magnitudes WHERE code = 'ANGLE';

-- =====================================================
-- 18. UNIDADES - TIEMPO
-- =====================================================

INSERT INTO units (magnitude_id, code, name, symbol, is_si_unit, conversion_factor)
SELECT id, 'SECOND', 'Segundo', 's', true, 1.0 FROM magnitudes WHERE code = 'TIME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'MINUTE', 'Minuto', 'min', 60.0 FROM magnitudes WHERE code = 'TIME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'HOUR', 'Hora', 'h', 3600.0 FROM magnitudes WHERE code = 'TIME';

INSERT INTO units (magnitude_id, code, name, symbol, conversion_factor)
SELECT id, 'DAY', 'Día', 'd', 86400.0 FROM magnitudes WHERE code = 'TIME';

-- =====================================================
-- 19. ACTUALIZAR SI_UNIT_ID EN MAGNITUDES
-- =====================================================

UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'METER') WHERE code = 'LENGTH';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'KILOGRAM') WHERE code = 'MASS';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'PASCAL') WHERE code = 'PRESSURE';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'KELVIN') WHERE code = 'TEMPERATURE';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'CUBIC_METER') WHERE code = 'VOLUME';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'CUBIC_METER_PER_SECOND') WHERE code = 'FLOW_RATE_VOLUME';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'KILOGRAM_PER_SECOND') WHERE code = 'FLOW_RATE_MASS';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'METER_PER_SECOND') WHERE code = 'VELOCITY';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'KILOGRAM_PER_CUBIC_METER') WHERE code = 'DENSITY';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'PASCAL_SECOND') WHERE code = 'DYNAMIC_VISCOSITY';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'SQUARE_METER_PER_SECOND') WHERE code = 'KINEMATIC_VISCOSITY';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'JOULE') WHERE code = 'ENERGY';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'WATT') WHERE code = 'POWER';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'NEWTON_METER') WHERE code = 'TORQUE';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'RADIAN') WHERE code = 'ANGLE';
UPDATE magnitudes SET si_unit_id = (SELECT id FROM units WHERE code = 'SECOND') WHERE code = 'TIME';

COMMIT;
