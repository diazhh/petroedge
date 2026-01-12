# Plan de Implementación - Sistema de Magnitudes y Unidades

## 📋 Estado Actual

### ✅ Completado

1. **Roadmap Detallado** (`16_SISTEMA_MAGNITUDES_UNIDADES.md`)
   - Modelo de datos completo
   - Arquitectura backend y frontend
   - APIs REST definidas
   - Componentes UI planificados
   - Plan de implementación en 6 fases

2. **Migración de Base de Datos** (`016_create_magnitudes_units_system.sql`)
   - Tabla `magnitude_categories` (categorías de magnitudes)
   - Tabla `magnitudes` (magnitudes específicas)
   - Tabla `units` (unidades con factores de conversión)
   - Índices y foreign keys
   - Triggers para updated_at

3. **Seeds de Datos** (`magnitudes_units_seed.sql`)
   - 14 categorías de magnitudes
   - 16 magnitudes específicas
   - 80+ unidades petroleras
   - Factores de conversión configurados
   - Unidades SI identificadas

4. **Frontend - SchemaEditor Actualizado**
   - Interface `SchemaField` modificada
   - Campos `magnitudeId` y `unitId` agregados
   - Campo `unit` (string) removido

## 🚧 Pendiente de Implementación

### Fase 1: Backend Módulos CRUD (Prioridad Alta)

**Duración estimada**: 2-3 días

#### 1.1 Módulo Magnitude Categories

```bash
src/backend/src/modules/magnitude-categories/
├── magnitude-categories.controller.ts
├── magnitude-categories.service.ts
├── magnitude-categories.repository.ts
├── magnitude-categories.schema.ts
├── magnitude-categories.types.ts
└── magnitude-categories.routes.ts
```

**Endpoints**:
- `GET /api/v1/magnitude-categories` - Listar todas
- `GET /api/v1/magnitude-categories/:id` - Obtener por ID
- `POST /api/v1/magnitude-categories` - Crear
- `PUT /api/v1/magnitude-categories/:id` - Actualizar
- `DELETE /api/v1/magnitude-categories/:id` - Eliminar

#### 1.2 Módulo Magnitudes

```bash
src/backend/src/modules/magnitudes/
├── magnitudes.controller.ts
├── magnitudes.service.ts
├── magnitudes.repository.ts
├── magnitudes.schema.ts
├── magnitudes.types.ts
└── magnitudes.routes.ts
```

**Endpoints**:
- `GET /api/v1/magnitudes` - Listar todas
- `GET /api/v1/magnitudes/:id` - Obtener por ID
- `GET /api/v1/magnitudes/by-category/:categoryId` - Por categoría
- `POST /api/v1/magnitudes` - Crear
- `PUT /api/v1/magnitudes/:id` - Actualizar
- `DELETE /api/v1/magnitudes/:id` - Eliminar

#### 1.3 Módulo Units

```bash
src/backend/src/modules/units/
├── units.controller.ts
├── units.service.ts
├── units.repository.ts
├── units.schema.ts
├── units.types.ts
└── units.routes.ts
```

**Endpoints**:
- `GET /api/v1/units` - Listar todas
- `GET /api/v1/units/:id` - Obtener por ID
- `GET /api/v1/units/by-magnitude/:magnitudeId` - Por magnitud
- `POST /api/v1/units` - Crear
- `PUT /api/v1/units/:id` - Actualizar
- `DELETE /api/v1/units/:id` - Eliminar

#### 1.4 Servicio de Conversión de Unidades

```bash
src/backend/src/modules/unit-converter/
├── unit-converter.service.ts
└── unit-converter.types.ts
```

**Funcionalidad**:
```typescript
class UnitConverterService {
  async convert(params: {
    value: number;
    fromUnitId: string;
    toUnitId: string;
  }): Promise<{
    originalValue: number;
    convertedValue: number;
    fromUnit: Unit;
    toUnit: Unit;
  }>;
  
  async validateCompatibility(
    unitId1: string,
    unitId2: string
  ): Promise<boolean>;
}
```

**Endpoint**:
- `POST /api/v1/unit-converter/convert`

### Fase 2: Frontend Gestión (Prioridad Alta)

**Duración estimada**: 3-4 días

#### 2.1 Módulo Magnitude Categories

```bash
src/frontend/src/features/magnitude-categories/
├── api/magnitude-categories.api.ts
├── components/
├── pages/
│   ├── MagnitudeCategoryList.tsx
│   ├── MagnitudeCategoryDetail.tsx
│   └── MagnitudeCategoryForm.tsx
└── types/magnitude-categories.types.ts
```

#### 2.2 Módulo Magnitudes

```bash
src/frontend/src/features/magnitudes/
├── api/magnitudes.api.ts
├── components/
├── pages/
│   ├── MagnitudeList.tsx
│   ├── MagnitudeDetail.tsx
│   └── MagnitudeForm.tsx
└── types/magnitudes.types.ts
```

#### 2.3 Módulo Units

```bash
src/frontend/src/features/units/
├── api/units.api.ts
├── components/
├── pages/
│   ├── UnitList.tsx
│   ├── UnitDetail.tsx
│   └── UnitForm.tsx
└── types/units.types.ts
```

#### 2.4 Agregar al Menú

Ubicación: `src/frontend/src/components/layout/Sidebar.tsx`

```typescript
{
  title: 'Configuración',
  href: '#',
  icon: Settings,
  children: [
    { title: 'Categorías de Magnitudes', href: '/magnitude-categories', icon: Layers },
    { title: 'Magnitudes', href: '/magnitudes', icon: Ruler },
    { title: 'Unidades', href: '/units', icon: Scale },
  ],
}
```

### Fase 3: Componentes Reutilizables (Prioridad Media)

**Duración estimada**: 2 días

#### 3.1 MagnitudeSelector

```tsx
<MagnitudeSelector
  value={selectedMagnitudeId}
  onChange={setSelectedMagnitudeId}
  categoryFilter="PRESSURE"
  placeholder="Selecciona una magnitud..."
/>
```

#### 3.2 UnitSelector

```tsx
<UnitSelector
  magnitudeId={magnitudeId}
  value={selectedUnitId}
  onChange={setSelectedUnitId}
  placeholder="Selecciona una unidad..."
/>
```

#### 3.3 UnitConverter Widget

```tsx
<UnitConverter
  magnitudeId={magnitudeId}
  initialValue={100}
  initialUnitId={psiUnitId}
/>
```

### Fase 4: Integración con SchemaEditor (Prioridad Alta)

**Duración estimada**: 1 día

Actualizar `SchemaEditor.tsx` para:
- Mostrar `MagnitudeSelector` en lugar de input de texto
- Mostrar `UnitSelector` filtrado por magnitud seleccionada
- Guardar `magnitudeId` y `unitId` en el schema

```tsx
{editedField.type === 'number' && (
  <>
    <TableCell>
      <MagnitudeSelector
        value={editedField.magnitudeId}
        onChange={(id) => setEditedField({ ...editedField, magnitudeId: id })}
      />
    </TableCell>
    <TableCell>
      <UnitSelector
        magnitudeId={editedField.magnitudeId}
        value={editedField.unitId}
        onChange={(id) => setEditedField({ ...editedField, unitId: id })}
      />
    </TableCell>
  </>
)}
```

### Fase 5: Integración con Digital Twins (Prioridad Media)

**Duración estimada**: 2 días

- Actualizar formularios de Digital Twins
- Mostrar unidades en dashboards
- Conversión automática según preferencias de usuario
- Validación de compatibilidad de unidades

### Fase 6: Sistema de Conversiones Avanzado (Prioridad Baja)

**Duración estimada**: 2 días

- Cache de conversiones en Redis
- Preferencias de unidades por usuario
- Conversión automática en telemetría
- Validación de rangos por unidad

## 📝 Comandos para Aplicar Cambios

### 1. Aplicar Migración

```bash
cd src/backend
PGPASSWORD=scadaerp_dev_password psql -h localhost -p 15432 -U scadaerp -d scadaerp -f ../../database/postgres/migrations/016_create_magnitudes_units_system.sql
```

### 2. Cargar Seeds

```bash
PGPASSWORD=scadaerp_dev_password psql -h localhost -p 15432 -U scadaerp -d scadaerp -f ../../database/seeds/magnitudes_units_seed.sql
```

### 3. Verificar Datos

```sql
-- Contar registros
SELECT 
  (SELECT COUNT(*) FROM magnitude_categories) as categories,
  (SELECT COUNT(*) FROM magnitudes) as magnitudes,
  (SELECT COUNT(*) FROM units) as units;

-- Ver categorías
SELECT code, name FROM magnitude_categories ORDER BY name;

-- Ver magnitudes con su categoría
SELECT m.code, m.name, mc.name as category
FROM magnitudes m
JOIN magnitude_categories mc ON m.category_id = mc.id
ORDER BY mc.name, m.name;

-- Ver unidades por magnitud
SELECT m.name as magnitude, u.symbol, u.name as unit_name, u.is_si_unit
FROM units u
JOIN magnitudes m ON u.magnitude_id = m.id
WHERE m.code = 'PRESSURE'
ORDER BY u.is_si_unit DESC, u.name;
```

## 🎯 Próximos Pasos Inmediatos

1. **Aplicar migración y seeds** a la base de datos
2. **Crear módulo backend** para magnitude-categories (CRUD completo)
3. **Crear módulo backend** para magnitudes (CRUD completo)
4. **Crear módulo backend** para units (CRUD completo)
5. **Implementar UnitConverterService** con lógica de conversión
6. **Crear módulos frontend** para gestión de magnitudes
7. **Crear componentes reutilizables** (MagnitudeSelector, UnitSelector)
8. **Integrar con SchemaEditor** en Asset Types
9. **Probar flujo completo** de creación de Asset Type con magnitudes

## 📊 Estimación Total

- **Fase 1 (Backend)**: 2-3 días
- **Fase 2 (Frontend Gestión)**: 3-4 días
- **Fase 3 (Componentes)**: 2 días
- **Fase 4 (Integración)**: 1 día
- **Fase 5 (Digital Twins)**: 2 días
- **Fase 6 (Avanzado)**: 2 días

**Total**: 12-16 días de desarrollo

## 🔗 Referencias

- Roadmap completo: `/roadmap/01_arquitectura/16_SISTEMA_MAGNITUDES_UNIDADES.md`
- Migración: `/database/postgres/migrations/016_create_magnitudes_units_system.sql`
- Seeds: `/database/seeds/magnitudes_units_seed.sql`
- SchemaEditor: `/src/frontend/src/features/asset-types/components/SchemaEditor.tsx`
