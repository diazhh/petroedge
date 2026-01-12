# Sistema de Magnitudes y Unidades con Conversiones Automáticas

## 📋 Visión General

Sistema completo para gestionar magnitudes físicas, unidades de medida y conversiones automáticas en el SCADA+ERP petrolero. Permite definir atributos con magnitudes estándar y realizar conversiones transparentes entre unidades.

## 🎯 Objetivos

1. **Gestión centralizada** de magnitudes y unidades
2. **Conversiones automáticas** entre unidades de la misma magnitud
3. **Validación** de compatibilidad de unidades
4. **Extensibilidad** para agregar nuevas magnitudes/unidades
5. **Integración** con Asset Types, Digital Twins y telemetría

## 📊 Modelo de Datos

### 1. Tabla `magnitude_categories`

Categorías de magnitudes físicas.

```sql
CREATE TABLE magnitude_categories (
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
```

### 2. Tabla `magnitudes`

Magnitudes físicas específicas.

```sql
CREATE TABLE magnitudes (
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
```

### 3. Tabla `units`

Unidades de medida.

```sql
CREATE TABLE units (
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
```

### 4. Actualizar `asset_types`

Modificar schema para usar magnitude_id en lugar de unit string.

```sql
ALTER TABLE asset_types 
  ADD COLUMN fixed_schema_v2 JSONB,
  ADD COLUMN attribute_schema_v2 JSONB,
  ADD COLUMN telemetry_schema_v2 JSONB;
```

## 🔄 Fórmulas de Conversión

### Conversión Lineal (mayoría de casos)

```
valor_destino = (valor_origen * factor_origen / factor_destino) + offset
```

### Conversión de Temperatura

```
Celsius → Kelvin: K = C + 273.15
Fahrenheit → Celsius: C = (F - 32) × 5/9
```

## 📦 Magnitudes Petroleras Prioritarias

### Categoría: LONGITUD
- **Magnitud**: LENGTH
  - Unidades: m, ft, in, cm, mm, km, mi

### Categoría: MASA
- **Magnitud**: MASS
  - Unidades: kg, lb, ton, g, oz

### Categoría: PRESIÓN
- **Magnitud**: PRESSURE
  - Unidades: psi, bar, Pa, kPa, MPa, atm, kg/cm²

### Categoría: TEMPERATURA
- **Magnitud**: TEMPERATURE
  - Unidades: °C, °F, K

### Categoría: VOLUMEN
- **Magnitud**: VOLUME
  - Unidades: m³, bbl, gal, L, ft³

### Categoría: CAUDAL
- **Magnitud**: FLOW_RATE_VOLUME
  - Unidades: bbl/d, m³/d, L/s, gpm

- **Magnitud**: FLOW_RATE_MASS
  - Unidades: kg/s, lb/h, ton/d

### Categoría: VELOCIDAD
- **Magnitud**: VELOCITY
  - Unidades: m/s, ft/s, km/h, mph

### Categoría: DENSIDAD
- **Magnitud**: DENSITY
  - Unidades: kg/m³, lb/ft³, g/cm³, API

### Categoría: VISCOSIDAD
- **Magnitud**: DYNAMIC_VISCOSITY
  - Unidades: Pa·s, cP, P

- **Magnitud**: KINEMATIC_VISCOSITY
  - Unidades: m²/s, cSt, St

### Categoría: ENERGÍA
- **Magnitud**: ENERGY
  - Unidades: J, kWh, BTU, cal

### Categoría: POTENCIA
- **Magnitud**: POWER
  - Unidades: W, kW, HP, BTU/h

### Categoría: TORQUE
- **Magnitud**: TORQUE
  - Unidades: N·m, lb·ft, kg·m

### Categoría: ÁNGULO
- **Magnitud**: ANGLE
  - Unidades: deg, rad, grad

### Categoría: TIEMPO
- **Magnitud**: TIME
  - Unidades: s, min, h, d

## 🏗️ Arquitectura del Sistema

### Backend (Node.js + Fastify)

```
src/backend/src/modules/
├── magnitude-categories/
│   ├── magnitude-categories.controller.ts
│   ├── magnitude-categories.service.ts
│   ├── magnitude-categories.repository.ts
│   ├── magnitude-categories.schema.ts
│   ├── magnitude-categories.types.ts
│   └── magnitude-categories.routes.ts
├── magnitudes/
│   ├── magnitudes.controller.ts
│   ├── magnitudes.service.ts
│   ├── magnitudes.repository.ts
│   ├── magnitudes.schema.ts
│   ├── magnitudes.types.ts
│   └── magnitudes.routes.ts
├── units/
│   ├── units.controller.ts
│   ├── units.service.ts
│   ├── units.repository.ts
│   ├── units.schema.ts
│   ├── units.types.ts
│   └── units.routes.ts
└── unit-converter/
    ├── unit-converter.service.ts
    └── unit-converter.types.ts
```

### Frontend (React + TypeScript)

```
src/frontend/src/features/
├── magnitude-categories/
│   ├── api/magnitude-categories.api.ts
│   ├── components/
│   ├── pages/
│   │   ├── MagnitudeCategoryList.tsx
│   │   ├── MagnitudeCategoryDetail.tsx
│   │   └── MagnitudeCategoryForm.tsx
│   └── types/magnitude-categories.types.ts
├── magnitudes/
│   ├── api/magnitudes.api.ts
│   ├── components/
│   ├── pages/
│   │   ├── MagnitudeList.tsx
│   │   ├── MagnitudeDetail.tsx
│   │   └── MagnitudeForm.tsx
│   └── types/magnitudes.types.ts
└── units/
    ├── api/units.api.ts
    ├── components/
    │   ├── UnitSelector.tsx
    │   └── UnitConverter.tsx
    ├── pages/
    │   ├── UnitList.tsx
    │   ├── UnitDetail.tsx
    │   └── UnitForm.tsx
    └── types/units.types.ts
```

## 🔌 APIs REST

### Magnitude Categories

```
GET    /api/v1/magnitude-categories
GET    /api/v1/magnitude-categories/:id
POST   /api/v1/magnitude-categories
PUT    /api/v1/magnitude-categories/:id
DELETE /api/v1/magnitude-categories/:id
```

### Magnitudes

```
GET    /api/v1/magnitudes
GET    /api/v1/magnitudes/:id
GET    /api/v1/magnitudes/by-category/:categoryId
POST   /api/v1/magnitudes
PUT    /api/v1/magnitudes/:id
DELETE /api/v1/magnitudes/:id
```

### Units

```
GET    /api/v1/units
GET    /api/v1/units/:id
GET    /api/v1/units/by-magnitude/:magnitudeId
POST   /api/v1/units
PUT    /api/v1/units/:id
DELETE /api/v1/units/:id
```

### Unit Converter

```
POST   /api/v1/unit-converter/convert
Body: {
  value: number,
  fromUnitId: string,
  toUnitId: string
}
Response: {
  originalValue: number,
  convertedValue: number,
  fromUnit: Unit,
  toUnit: Unit
}
```

## 🎨 Componentes UI

### 1. MagnitudeSelector

Selector de magnitud con búsqueda y agrupación por categoría.

```tsx
<MagnitudeSelector
  value={selectedMagnitudeId}
  onChange={setSelectedMagnitudeId}
  categoryFilter="PRESSURE"
  placeholder="Selecciona una magnitud..."
/>
```

### 2. UnitSelector

Selector de unidad filtrado por magnitud.

```tsx
<UnitSelector
  magnitudeId={magnitudeId}
  value={selectedUnitId}
  onChange={setSelectedUnitId}
  placeholder="Selecciona una unidad..."
/>
```

### 3. UnitConverter

Widget para conversión interactiva de unidades.

```tsx
<UnitConverter
  magnitudeId={magnitudeId}
  initialValue={100}
  initialUnitId={psiUnitId}
/>
```

### 4. SchemaFieldEditor (actualizado)

Editor de campos de schema con selector de magnitud.

```tsx
<SchemaFieldEditor
  field={{
    type: 'number',
    magnitudeId: 'pressure-uuid',
    unitId: 'psi-uuid',
    required: true,
    min: 0,
    max: 10000
  }}
  onChange={handleFieldChange}
/>
```

## 📝 Ejemplo de Uso

### Definir Asset Type con Magnitudes

```typescript
const wellAssetType = {
  code: 'WELL',
  name: 'Pozo Petrolero',
  attributeSchema: {
    depth: {
      type: 'number',
      magnitudeId: 'length-uuid',
      unitId: 'ft-uuid',
      required: true,
      min: 0
    },
    pressure: {
      type: 'number',
      magnitudeId: 'pressure-uuid',
      unitId: 'psi-uuid',
      required: true,
      min: 0
    },
    temperature: {
      type: 'number',
      magnitudeId: 'temperature-uuid',
      unitId: 'fahrenheit-uuid',
      required: true
    }
  }
};
```

### Conversión Automática

```typescript
const converter = new UnitConverterService();

const result = await converter.convert({
  value: 1000,
  fromUnitId: 'psi-uuid',
  toUnitId: 'bar-uuid'
});

console.log(result.convertedValue);
```

## 🚀 Plan de Implementación

### Fase 1: Fundamentos (1 semana)

**Objetivo**: Base de datos y backend básico

- [ ] Crear migraciones para tablas
- [ ] Crear seeds con magnitudes petroleras
- [ ] Implementar módulos backend (CRUD)
- [ ] Implementar UnitConverterService
- [ ] Tests unitarios de conversiones

### Fase 2: Frontend Gestión (1 semana)

**Objetivo**: UIs de administración

- [ ] Módulo Magnitude Categories (List, Detail, Form)
- [ ] Módulo Magnitudes (List, Detail, Form)
- [ ] Módulo Units (List, Detail, Form)
- [ ] Agregar al menú de administración
- [ ] Permisos RBAC

### Fase 3: Componentes Reutilizables (3 días)

**Objetivo**: Selectores y conversores

- [ ] MagnitudeSelector component
- [ ] UnitSelector component
- [ ] UnitConverter widget
- [ ] Integración con formularios

### Fase 4: Integración Asset Types (2 días)

**Objetivo**: Actualizar SchemaEditor

- [ ] Modificar SchemaEditor para usar magnitudes
- [ ] Migración de datos existentes
- [ ] Actualizar validaciones
- [ ] Tests de integración

### Fase 5: Integración Digital Twins (3 días)

**Objetivo**: Conversiones en tiempo real

- [ ] Actualizar telemetry service
- [ ] Conversión automática en dashboards
- [ ] Preferencias de unidades por usuario
- [ ] Cache de conversiones

### Fase 6: Optimización (2 días)

**Objetivo**: Performance y UX

- [ ] Cache Redis de magnitudes/unidades
- [ ] Lazy loading de selectores
- [ ] Validación de rangos por unidad
- [ ] Documentación completa

## 🔐 Permisos RBAC

```typescript
const permissions = [
  'magnitude-categories:read',
  'magnitude-categories:create',
  'magnitude-categories:update',
  'magnitude-categories:delete',
  'magnitudes:read',
  'magnitudes:create',
  'magnitudes:update',
  'magnitudes:delete',
  'units:read',
  'units:create',
  'units:update',
  'units:delete',
  'unit-converter:use',
];
```

## 📊 Métricas de Éxito

- ✅ 100+ unidades predefinidas
- ✅ 20+ magnitudes petroleras
- ✅ Conversiones < 1ms
- ✅ 0 errores de conversión
- ✅ Cobertura de tests > 90%

## 🔮 Futuras Mejoras

1. **Unidades compuestas**: kg/m³, bbl/d/psi
2. **Fórmulas personalizadas**: Para conversiones no lineales
3. **Validación dimensional**: Verificar compatibilidad en cálculos
4. **Historial de conversiones**: Auditoría
5. **API pública**: Para integraciones externas
6. **Machine Learning**: Sugerir unidades según contexto

## 📚 Referencias

- ISO 80000: Quantities and units
- API Standards (American Petroleum Institute)
- SI Units (International System of Units)
- NIST Guide to SI Units
