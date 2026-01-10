imp# Roadmap: Asset Detail Management Interface - 100% Mejorada

**Fecha**: 2026-01-09  
**Objetivo**: Transformar la página de detalle de Assets en una interfaz completa de gestión con manejo adecuado de tipos de datos para atributos, telemetría y campos calculados.

---

## 📋 Análisis de la Situación Actual

### Estado Actual del Asset Detail Page

**URL**: `http://localhost:5173/infrastructure/assets/{id}`

**Tabs Existentes**:
1. ✅ **Información**: Vista de solo lectura de datos básicos
2. ✅ **Propiedades**: Vista de solo lectura de propiedades fijas
3. ✅ **Atributos**: Editor funcional con tipos de datos (string, number, boolean, date, json)
4. ⚠️ **Telemetría**: Solo visualización, sin gestión
5. ⚠️ **Campos Calculados**: Solo visualización, sin gestión

### Problemas Identificados

1. **Información del Asset**: No se puede editar desde la página de detalle
2. **Propiedades Fijas**: No son editables (correcto, pero falta indicador visual)
3. **Telemetría**: 
   - Solo muestra últimos valores
   - No permite agregar/editar definiciones de telemetría
   - No indica tipo de dato de cada telemetría
   - No se almacena en tabla de series temporales (TimescaleDB)
4. **Campos Calculados**:
   - Solo muestra valores calculados
   - No permite agregar/editar fórmulas
   - No indica tipo de dato
   - No permite recalcular manualmente

---

## 🎯 Objetivos del Roadmap

### Objetivos Principales

1. **Gestión Completa de Información del Asset**
   - Editar información básica desde la página de detalle
   - Botón "Editar Asset" que abre formulario inline o modal

2. **Gestión de Propiedades Fijas**
   - Indicador visual de que son propiedades del schema
   - Mostrar tipo de dato de cada propiedad
   - Edición solo si el schema lo permite

3. **Gestión Completa de Telemetría**
   - Agregar nuevas definiciones de telemetría
   - Especificar tipo de dato (numeric, text, boolean, json)
   - Especificar unidad de medida
   - Especificar frecuencia de muestreo
   - Editar/eliminar definiciones existentes
   - Visualizar histórico (gráficos)
   - Almacenamiento en TimescaleDB hypertable

4. **Gestión Completa de Campos Calculados**
   - Agregar nuevas fórmulas de cálculo
   - Especificar tipo de dato resultante
   - Especificar dependencias (qué telemetrías/atributos usar)
   - Editor de fórmulas con validación
   - Recalcular manualmente
   - Editar/eliminar fórmulas existentes

5. **Manejo Consistente de Tipos de Datos**
   - Todos los datos (atributos, telemetría, campos calculados) deben tener tipo explícito
   - Validación según tipo de dato
   - Visualización apropiada según tipo

---

## 📐 Arquitectura de Datos

### Tipos de Datos Soportados

```typescript
enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  JSON = 'json',
  ENUM = 'enum'
}
```

### Estructura de Datos por Categoría

#### 1. Propiedades Fijas (Properties)
- Definidas en `asset_types.fixed_schema`
- No editables después de crear el asset
- Tienen tipo de dato definido en el schema

```json
{
  "fixedSchema": {
    "wellType": { "type": "enum", "values": ["producer", "injector", "observation"] },
    "totalDepthFt": { "type": "number", "unit": "ft" },
    "completionDate": { "type": "date" }
  }
}
```

#### 2. Atributos Dinámicos (Attributes)
- Definidos en `assets.attributes` (JSONB)
- Editables en cualquier momento
- Tipo de dato inferido o especificado al crear
- Historial de cambios en `asset_attribute_history`

```json
{
  "attributes": {
    "reservoirPressure": { "value": 3500, "type": "number", "unit": "psi" },
    "isProducing": { "value": true, "type": "boolean" },
    "lastIntervention": { "value": "2026-01-01", "type": "date" }
  }
}
```

#### 3. Telemetría (Telemetry)
- Definiciones en `asset_types.telemetry_schema`
- Valores en `asset_telemetry` (TimescaleDB hypertable)
- Tipo de dato especificado en el schema
- Series temporales con timestamp

```json
{
  "telemetrySchema": {
    "oilRate": { 
      "type": "number", 
      "unit": "blpd", 
      "sampleRate": "1m",
      "quality": ["GOOD", "BAD", "UNCERTAIN"]
    },
    "pressure": { "type": "number", "unit": "psi", "sampleRate": "5s" },
    "status": { "type": "enum", "values": ["running", "stopped", "alarm"] }
  }
}
```

#### 4. Campos Calculados (Computed Fields)
- Definidos en `asset_types.computed_fields`
- Valores en `assets.computed_values` (JSONB)
- Fórmulas con dependencias
- Recalculados automáticamente o manualmente

```json
{
  "computedFields": [
    {
      "key": "liquidRate",
      "name": "Tasa Líquida",
      "type": "number",
      "unit": "blpd",
      "formula": "telemetry.oilRate + telemetry.waterRate",
      "recalculateOn": ["telemetry.oilRate", "telemetry.waterRate"]
    },
    {
      "key": "waterCut",
      "name": "Corte de Agua",
      "type": "number",
      "unit": "%",
      "formula": "(telemetry.waterRate / computed.liquidRate) * 100",
      "recalculateOn": ["computed.liquidRate"]
    }
  ]
}
```

---

## 🛠️ Plan de Implementación

### Fase 1: Infraestructura de Tipos de Datos (Backend)

#### 1.1 Actualizar Schema de Base de Datos

**Archivo**: `/database/postgres/schema/06_infrastructure_digital_twins.sql` (crear si no existe)

```sql
-- Enum para tipos de datos
CREATE TYPE data_type AS ENUM (
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'json',
  'enum'
);

-- Actualizar asset_types para incluir schemas tipados
ALTER TABLE asset_types 
  ADD COLUMN IF NOT EXISTS fixed_schema_typed JSONB,
  ADD COLUMN IF NOT EXISTS attribute_schema_typed JSONB,
  ADD COLUMN IF NOT EXISTS telemetry_schema_typed JSONB;

-- Tabla para definiciones de telemetría (alternativa a schema en asset_types)
CREATE TABLE IF NOT EXISTS asset_telemetry_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  data_type data_type NOT NULL,
  unit VARCHAR(50),
  sample_rate INTERVAL,
  min_value NUMERIC,
  max_value NUMERIC,
  enum_values TEXT[],
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, asset_type_id, key)
);

-- Índices
CREATE INDEX idx_telemetry_defs_asset_type ON asset_telemetry_definitions(asset_type_id);
CREATE INDEX idx_telemetry_defs_active ON asset_telemetry_definitions(is_active);
```

#### 1.2 Crear Servicios de Gestión de Schemas

**Archivo**: `/src/backend/src/modules/infrastructure/schemas/schema-management.service.ts`

```typescript
import { z } from 'zod';

// Schema para definición de campo con tipo
const FieldDefinitionSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  type: z.enum(['string', 'number', 'boolean', 'date', 'datetime', 'json', 'enum']),
  unit: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  enumValues: z.array(z.string()).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  pattern: z.string().optional(), // Regex para validación
});

export class SchemaManagementService {
  // Validar valor según tipo de dato
  validateValue(value: any, definition: FieldDefinition): boolean {
    // Implementar validación según tipo
  }

  // Convertir valor al tipo correcto
  coerceValue(value: any, type: DataType): any {
    // Implementar conversión de tipos
  }

  // Validar schema completo
  validateSchema(schema: Record<string, FieldDefinition>): boolean {
    // Implementar validación de schema
  }
}
```

#### 1.3 Actualizar Controllers y Routes

**Archivos**:
- `/src/backend/src/modules/infrastructure/assets/assets.controller.ts`
- `/src/backend/src/modules/infrastructure/assets/assets.routes.ts`

**Nuevos Endpoints**:

```typescript
// Editar información básica del asset
PATCH /api/v1/infrastructure/assets/:id/info

// Gestión de definiciones de telemetría
GET    /api/v1/infrastructure/assets/:id/telemetry/definitions
POST   /api/v1/infrastructure/assets/:id/telemetry/definitions
PUT    /api/v1/infrastructure/assets/:id/telemetry/definitions/:key
DELETE /api/v1/infrastructure/assets/:id/telemetry/definitions/:key

// Gestión de campos calculados
GET    /api/v1/infrastructure/assets/:id/computed/definitions
POST   /api/v1/infrastructure/assets/:id/computed/definitions
PUT    /api/v1/infrastructure/assets/:id/computed/definitions/:key
DELETE /api/v1/infrastructure/assets/:id/computed/definitions/:key
POST   /api/v1/infrastructure/assets/:id/computed/recalculate
```

---

### Fase 2: Componentes de Frontend

#### 2.1 Componente: AssetInfoEditor

**Archivo**: `/src/frontend/src/features/infrastructure/components/AssetInfoEditor.tsx`

**Funcionalidad**:
- Editar información básica del asset (nombre, código, descripción, ubicación, estado)
- Modo inline o modal
- Validación de campos
- Guardado con confirmación

```tsx
interface AssetInfoEditorProps {
  asset: Asset;
  onSave: (data: Partial<Asset>) => Promise<void>;
  isLoading?: boolean;
}

export function AssetInfoEditor({ asset, onSave, isLoading }: AssetInfoEditorProps) {
  // Implementación
}
```

#### 2.2 Componente: PropertiesViewer

**Archivo**: `/src/frontend/src/features/infrastructure/components/PropertiesViewer.tsx`

**Funcionalidad**:
- Mostrar propiedades fijas con tipo de dato
- Indicador visual de que son inmutables
- Tooltip con descripción del schema

```tsx
interface PropertiesViewerProps {
  properties: Record<string, any>;
  schema?: Record<string, FieldDefinition>;
}

export function PropertiesViewer({ properties, schema }: PropertiesViewerProps) {
  // Implementación
}
```

#### 2.3 Componente: TelemetryManager

**Archivo**: `/src/frontend/src/features/infrastructure/components/TelemetryManager.tsx`

**Funcionalidad**:
- Listar definiciones de telemetría
- Agregar nueva definición con tipo de dato
- Editar definición existente
- Eliminar definición
- Ver últimos valores
- Ver histórico (gráfico)

```tsx
interface TelemetryManagerProps {
  assetId: string;
  assetTypeId: string;
}

export function TelemetryManager({ assetId, assetTypeId }: TelemetryManagerProps) {
  const [definitions, setDefinitions] = useState<TelemetryDefinition[]>([]);
  const [latestValues, setLatestValues] = useState<Record<string, any>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Implementación
}
```

**Sub-componentes**:
- `TelemetryDefinitionForm`: Formulario para agregar/editar definición
- `TelemetryValueCard`: Card para mostrar valor actual
- `TelemetryHistoryChart`: Gráfico de histórico

#### 2.4 Componente: ComputedFieldsManager

**Archivo**: `/src/frontend/src/features/infrastructure/components/ComputedFieldsManager.tsx`

**Funcionalidad**:
- Listar campos calculados
- Agregar nueva fórmula
- Editar fórmula existente
- Eliminar campo calculado
- Recalcular manualmente
- Validar fórmula

```tsx
interface ComputedFieldsManagerProps {
  assetId: string;
  assetTypeId: string;
}

export function ComputedFieldsManager({ assetId, assetTypeId }: ComputedFieldsManagerProps) {
  const [definitions, setDefinitions] = useState<ComputedFieldDefinition[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Implementación
}
```

**Sub-componentes**:
- `FormulaEditor`: Editor de fórmulas con syntax highlighting
- `DependencySelector`: Selector de dependencias (telemetría/atributos)
- `ComputedValueCard`: Card para mostrar valor calculado

#### 2.5 Componente: DataTypeSelector

**Archivo**: `/src/frontend/src/features/infrastructure/components/DataTypeSelector.tsx`

**Funcionalidad**:
- Selector de tipo de dato
- Campos adicionales según tipo (unit, enum values, min/max)
- Validación según tipo

```tsx
interface DataTypeSelectorProps {
  value: DataType;
  onChange: (type: DataType) => void;
  showAdvanced?: boolean;
}

export function DataTypeSelector({ value, onChange, showAdvanced }: DataTypeSelectorProps) {
  // Implementación
}
```

---

### Fase 3: Integración en AssetDetailPage

#### 3.1 Actualizar AssetDetailPage

**Archivo**: `/src/frontend/src/features/infrastructure/pages/AssetDetailPage.tsx`

**Cambios**:

1. **Tab Información**: Agregar botón "Editar" que muestra `AssetInfoEditor`
2. **Tab Propiedades**: Usar `PropertiesViewer` con schema
3. **Tab Atributos**: Mejorar `AttributeEditor` para mostrar tipo de dato
4. **Tab Telemetría**: Reemplazar con `TelemetryManager`
5. **Tab Campos Calculados**: Reemplazar con `ComputedFieldsManager`

```tsx
export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('info');
  const [editingInfo, setEditingInfo] = useState(false);

  // ... hooks existentes ...

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header con botón Editar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/infrastructure/assets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          {/* ... info existente ... */}
        </div>
        <Button onClick={() => setEditingInfo(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar Asset
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
          <TabsTrigger value="attributes">Atributos</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetría</TabsTrigger>
          <TabsTrigger value="computed">Campos Calculados</TabsTrigger>
        </TabsList>

        {/* Tab: Información */}
        <TabsContent value="info">
          {editingInfo ? (
            <AssetInfoEditor
              asset={asset}
              onSave={handleSaveInfo}
              onCancel={() => setEditingInfo(false)}
            />
          ) : (
            // Vista de solo lectura existente
          )}
        </TabsContent>

        {/* Tab: Propiedades */}
        <TabsContent value="properties">
          <PropertiesViewer
            properties={asset.properties}
            schema={assetType?.fixedSchema}
          />
        </TabsContent>

        {/* Tab: Atributos */}
        <TabsContent value="attributes">
          <AttributeEditor
            attributes={asset.attributes}
            onSave={handleSaveAttributes}
          />
        </TabsContent>

        {/* Tab: Telemetría */}
        <TabsContent value="telemetry">
          <TelemetryManager
            assetId={id!}
            assetTypeId={asset.assetTypeId}
          />
        </TabsContent>

        {/* Tab: Campos Calculados */}
        <TabsContent value="computed">
          <ComputedFieldsManager
            assetId={id!}
            assetTypeId={asset.assetTypeId}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de edición de info */}
      {editingInfo && (
        <Dialog open={editingInfo} onOpenChange={setEditingInfo}>
          <DialogContent className="max-w-2xl">
            <AssetInfoEditor
              asset={asset}
              onSave={handleSaveInfo}
              onCancel={() => setEditingInfo(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

---

### Fase 4: Almacenamiento de Telemetría en TimescaleDB

#### 4.1 Verificar Hypertable

**Archivo**: `/database/postgres/schema/06_infrastructure_digital_twins.sql`

```sql
-- Asegurar que asset_telemetry es una hypertable
SELECT create_hypertable(
  'asset_telemetry', 
  'time',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '1 day'
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_asset_telemetry_asset_time 
  ON asset_telemetry (asset_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_asset_telemetry_key_time 
  ON asset_telemetry (asset_id, key, time DESC);

-- Políticas de retención (opcional)
SELECT add_retention_policy(
  'asset_telemetry',
  INTERVAL '90 days',
  if_not_exists => TRUE
);
```

#### 4.2 Servicio de Telemetría

**Archivo**: `/src/backend/src/modules/infrastructure/telemetry/telemetry.service.ts`

```typescript
export class TelemetryService {
  // Insertar punto de telemetría
  async insertTelemetryPoint(
    tenantId: string,
    assetId: string,
    key: string,
    value: any,
    dataType: DataType,
    unit?: string,
    quality?: string
  ): Promise<void> {
    // Validar tipo de dato
    // Insertar en asset_telemetry (TimescaleDB)
  }

  // Obtener histórico
  async getTelemetryHistory(
    tenantId: string,
    assetId: string,
    key: string,
    startTime: Date,
    endTime: Date,
    aggregation?: 'avg' | 'min' | 'max' | 'sum'
  ): Promise<TelemetryPoint[]> {
    // Consultar TimescaleDB con agregación si se especifica
  }

  // Obtener últimos valores
  async getLatestTelemetry(
    tenantId: string,
    assetId: string
  ): Promise<Record<string, TelemetryPoint>> {
    // Consultar últimos valores de cada key
  }
}
```

---

## 📊 Flujo de Usuario Mejorado

### Escenario 1: Editar Información del Asset

1. Usuario navega a `/infrastructure/assets/{id}`
2. Click en botón "Editar Asset" en el header
3. Se abre modal o formulario inline con campos editables
4. Usuario modifica nombre, descripción, ubicación, estado, tags
5. Click en "Guardar"
6. Confirmación y actualización de la vista

### Escenario 2: Agregar Definición de Telemetría

1. Usuario navega al tab "Telemetría"
2. Click en "Agregar Telemetría"
3. Se abre diálogo con formulario:
   - Nombre (ej: "Presión de Cabeza")
   - Key (ej: "headPressure")
   - Tipo de Dato: Number
   - Unidad: "psi"
   - Frecuencia de Muestreo: "5 segundos"
   - Rango válido: Min 0, Max 5000
4. Click en "Guardar"
5. Definición agregada al asset type
6. Aparece en la lista de telemetrías

### Escenario 3: Agregar Campo Calculado

1. Usuario navega al tab "Campos Calculados"
2. Click en "Agregar Campo Calculado"
3. Se abre diálogo con formulario:
   - Nombre: "Tasa Líquida"
   - Key: "liquidRate"
   - Tipo de Dato: Number
   - Unidad: "blpd"
   - Fórmula: `telemetry.oilRate + telemetry.waterRate`
   - Dependencias: [telemetry.oilRate, telemetry.waterRate]
   - Recalcular cuando: Cambia cualquier dependencia
4. Click en "Validar Fórmula" (valida sintaxis)
5. Click en "Guardar"
6. Campo calculado agregado
7. Se calcula automáticamente cuando llegan datos de telemetría

### Escenario 4: Ver Histórico de Telemetría

1. Usuario navega al tab "Telemetría"
2. Click en card de telemetría (ej: "Presión de Cabeza")
3. Se abre modal con gráfico de histórico
4. Usuario selecciona rango de tiempo (última hora, último día, última semana, custom)
5. Usuario selecciona agregación (promedio, mínimo, máximo)
6. Gráfico se actualiza con datos de TimescaleDB

---

## 🎨 Diseño de UI/UX

### Principios de Diseño

1. **Consistencia**: Todos los editores (atributos, telemetría, campos calculados) deben tener UI similar
2. **Tipos Visibles**: Siempre mostrar el tipo de dato con badge
3. **Validación Inmediata**: Validar valores según tipo de dato al escribir
4. **Feedback Claro**: Mensajes de éxito/error con toast
5. **Confirmaciones**: Pedir confirmación para acciones destructivas

### Componentes de UI Reutilizables

```tsx
// Badge de tipo de dato
<DataTypeBadge type="number" />

// Input con validación de tipo
<TypedInput type="number" unit="psi" min={0} max={5000} />

// Card de valor con tipo
<ValueCard
  label="Presión de Cabeza"
  value={3500}
  type="number"
  unit="psi"
  quality="GOOD"
  timestamp={new Date()}
/>

// Editor de fórmula
<FormulaEditor
  value="telemetry.oilRate + telemetry.waterRate"
  availableVariables={['telemetry.oilRate', 'telemetry.waterRate', 'attributes.density']}
  onValidate={handleValidate}
/>
```

---

## ✅ Checklist de Implementación

### Backend

- [ ] Crear/actualizar schema de base de datos con tipos de datos
- [ ] Crear tabla `asset_telemetry_definitions`
- [ ] Verificar hypertable de `asset_telemetry`
- [ ] Crear servicio `SchemaManagementService`
- [ ] Actualizar `AssetsController` con nuevos endpoints
- [ ] Crear `TelemetryService` con métodos de gestión
- [ ] Crear `ComputedFieldsService` con métodos de gestión
- [ ] Agregar validación de tipos de datos en todos los endpoints
- [ ] Crear seeds con ejemplos de telemetría y campos calculados

### Frontend - Componentes

- [ ] Crear `AssetInfoEditor` component
- [ ] Crear `PropertiesViewer` component
- [ ] Mejorar `AttributeEditor` para mostrar tipos de datos
- [ ] Crear `TelemetryManager` component
- [ ] Crear `TelemetryDefinitionForm` sub-component
- [ ] Crear `TelemetryValueCard` sub-component
- [ ] Crear `TelemetryHistoryChart` sub-component
- [ ] Crear `ComputedFieldsManager` component
- [ ] Crear `FormulaEditor` sub-component
- [ ] Crear `DependencySelector` sub-component
- [ ] Crear `ComputedValueCard` sub-component
- [ ] Crear `DataTypeSelector` component
- [ ] Crear `DataTypeBadge` component
- [ ] Crear `TypedInput` component
- [ ] Crear `ValueCard` component

### Frontend - API Hooks

- [ ] `useUpdateAssetInfo()` - Actualizar información básica
- [ ] `useTelemetryDefinitions()` - Listar definiciones
- [ ] `useCreateTelemetryDefinition()` - Crear definición
- [ ] `useUpdateTelemetryDefinition()` - Actualizar definición
- [ ] `useDeleteTelemetryDefinition()` - Eliminar definición
- [ ] `useTelemetryHistory()` - Obtener histórico
- [ ] `useComputedFieldDefinitions()` - Listar definiciones
- [ ] `useCreateComputedField()` - Crear campo calculado
- [ ] `useUpdateComputedField()` - Actualizar campo calculado
- [ ] `useDeleteComputedField()` - Eliminar campo calculado
- [ ] `useRecalculateComputedFields()` - Recalcular manualmente
- [ ] `useValidateFormula()` - Validar fórmula

### Frontend - Integración

- [ ] Actualizar `AssetDetailPage` con nuevos componentes
- [ ] Agregar botón "Editar Asset" en header
- [ ] Integrar `AssetInfoEditor` en tab Información
- [ ] Integrar `PropertiesViewer` en tab Propiedades
- [ ] Integrar `TelemetryManager` en tab Telemetría
- [ ] Integrar `ComputedFieldsManager` en tab Campos Calculados
- [ ] Agregar navegación entre tabs
- [ ] Agregar loading states
- [ ] Agregar error handling

### Testing

- [ ] Tests unitarios de servicios backend
- [ ] Tests de integración de endpoints
- [ ] Tests de componentes frontend
- [ ] Tests E2E de flujos completos
- [ ] Validar almacenamiento en TimescaleDB
- [ ] Validar recálculo automático de campos calculados

### Documentación

- [ ] Actualizar `/PROGRESS.md` con progreso
- [ ] Documentar nuevos endpoints en Swagger
- [ ] Crear guía de usuario para gestión de telemetría
- [ ] Crear guía de usuario para campos calculados
- [ ] Documentar tipos de datos soportados

---

## 🚀 Orden de Implementación Recomendado

### Sprint 1: Infraestructura (3-4 días)
1. Actualizar schema de base de datos
2. Crear servicios de gestión de schemas
3. Crear endpoints de backend
4. Tests de backend

### Sprint 2: Componentes Base (3-4 días)
1. Crear componentes reutilizables (DataTypeSelector, DataTypeBadge, TypedInput)
2. Crear API hooks
3. Mejorar AttributeEditor con tipos de datos
4. Tests de componentes

### Sprint 3: Gestión de Telemetría (4-5 días)
1. Crear TelemetryManager y sub-componentes
2. Integrar con backend
3. Implementar gráficos de histórico
4. Tests E2E

### Sprint 4: Gestión de Campos Calculados (4-5 días)
1. Crear ComputedFieldsManager y sub-componentes
2. Crear FormulaEditor con validación
3. Integrar con backend
4. Tests E2E

### Sprint 5: Integración y Pulido (2-3 días)
1. Integrar todos los componentes en AssetDetailPage
2. Crear AssetInfoEditor
3. Pulir UI/UX
4. Documentación

**Total estimado**: 16-21 días de desarrollo

---

## 📈 Métricas de Éxito

1. **Funcionalidad Completa**: Usuario puede agregar/editar/eliminar atributos, telemetría y campos calculados
2. **Tipos de Datos**: Todos los datos tienen tipo explícito y validación
3. **Telemetría en TimescaleDB**: Datos de telemetría se almacenan correctamente en hypertable
4. **Campos Calculados Automáticos**: Se recalculan cuando cambian dependencias
5. **UI Intuitiva**: Usuario puede completar tareas sin documentación
6. **Performance**: Carga de página < 1s, gráficos de histórico < 2s
7. **Tests**: Cobertura > 80%

---

## 🎯 Resultado Final

Al completar este roadmap, la página de Asset Detail será una **interfaz completa de gestión** donde el usuario podrá:

✅ Editar toda la información del asset  
✅ Agregar y gestionar atributos con tipos de datos  
✅ Agregar y gestionar definiciones de telemetría  
✅ Ver histórico de telemetría con gráficos  
✅ Agregar y gestionar campos calculados con fórmulas  
✅ Recalcular campos calculados manualmente  
✅ Validar fórmulas antes de guardar  
✅ Ver todos los datos con sus tipos explícitos  
✅ Tener auditoría completa de cambios  

**La interfaz será 100% funcional y profesional**, cumpliendo con los estándares de un sistema ERP+SCADA petrolero de nivel empresarial.
