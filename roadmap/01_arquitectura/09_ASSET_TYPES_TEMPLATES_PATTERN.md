# PATRÓN DE PLANTILLAS DE ASSET TYPES POR MÓDULO

> 🔗 **IMPORTANTE**: Este documento define **Asset Types** (tipos de assets individuales).
> Para **Asset Templates** (composición de múltiples assets relacionados como gemelos digitales compuestos),
> ver: `15_DATA_SOURCE_DIGITAL_TWIN_MAPPING.md`
>
> **Relación**:
> - **Asset Type** = Tipo individual (ej: CT_REEL, CT_PUMP, CT_MOTOR)
> - **Asset Template** = Composición (ej: CT_UNIT_TEMPLATE = CT_UNIT + CT_REEL + CT_PUMP + CT_MOTOR)

## 📋 Visión General

Cada módulo operacional del sistema (Yacimientos, Well Testing, Drilling, Coiled Tubing, etc.) debe tener **asset_types predefinidos** que se crean automáticamente como plantillas.

### Principio Fundamental

**Dos formas de crear activos:**

1. **Desde interfaz específica del módulo** (ej: Yacimientos → Crear Pozo)
   - Se crea automáticamente un `asset` del tipo correspondiente
   - El usuario NO necesita saber que está usando Digital Twins
   - La interfaz es específica del dominio (campos de pozos, yacimientos, etc.)
   - Internamente usa la tabla `assets` con el `asset_type` correcto

2. **Desde interfaz genérica de Digital Twins**
   - Usuario avanzado puede crear cualquier tipo de asset
   - Puede crear tipos personalizados
   - Tiene acceso completo a atributos dinámicos, telemetrías, reglas

---

## 🎯 Implementación por Módulo

### Módulo: Yacimientos (Geology)

**Asset Types Predefinidos:**

```typescript
// Al inicializar el módulo, se crean estos asset_types si no existen:
- BASIN (Cuenca)
- FIELD (Campo)
- RESERVOIR (Yacimiento)
- WELL (Pozo)
```

**Flujo de Usuario:**

```
Usuario en UI: Yacimientos → Crear Pozo
  ↓
Backend: POST /api/v1/wells
  ↓
Service: wellsService.create()
  ↓
Internamente: assetsService.create({
  assetTypeCode: 'WELL',
  properties: { wellType, status, liftMethod, ... },
  attributes: { tubingSize, reservoirPressure, ... }
})
  ↓
Se crea en tabla: assets (con asset_type_id = WELL)
  ↓
Response: Datos del pozo (mapeados desde asset)
```

**Ventajas:**
- ✅ Usuario no necesita conocer Digital Twins
- ✅ Interfaz familiar del dominio petrolero
- ✅ Internamente usa arquitectura flexible
- ✅ Permite migración gradual desde tablas legacy

---

### Módulo: Well Testing

**Asset Types Predefinidos:**

```typescript
- WELL_TEST (Prueba de Pozo)
- SEPARATOR (Separador de Prueba)
- PRESSURE_GAUGE (Medidor de Presión)
- FLOW_METER (Medidor de Flujo)
```

**Ejemplo de Creación:**

```typescript
// UI: Well Testing → Nueva Prueba
POST /api/v1/well-tests

// Backend crea:
1. Asset tipo WELL_TEST con:
   - properties: { testType, testDate, duration, ... }
   - attributes: { separator, gauges, conditions, ... }
   - parentAssetId: wellId (relación con pozo)

2. Assets relacionados (si aplica):
   - SEPARATOR (equipo usado)
   - PRESSURE_GAUGE (instrumentos)
```

---

### Módulo: Drilling

**Asset Types Predefinidos:**

```typescript
- RIG (Taladro)
- BHA (Bottom Hole Assembly)
- DRILL_BIT (Broca)
- MWD_TOOL (Herramienta MWD)
- LWD_TOOL (Herramienta LWD)
- STABILIZER (Estabilizador)
- MOTOR (Motor de Fondo)
- DRILLING_JOB (Trabajo de Perforación)
```

**Flujo de Creación de Job:**

```typescript
// UI: Drilling → Nuevo Trabajo de Perforación
POST /api/v1/drilling/jobs

// Backend crea automáticamente:
1. Asset DRILLING_JOB (job principal)
2. Asset BHA (ensamblaje de fondo)
3. Assets de herramientas (bits, motors, MWD, etc.)
4. Relaciones jerárquicas entre ellos
```

---

### Módulo: Coiled Tubing

**Asset Types Predefinidos:**

```typescript
- CT_REEL (Carrete de Coiled Tubing)
- CT_UNIT (Unidad de CT)
- CT_JOB (Trabajo de CT)
- CT_TOOL (Herramienta de CT)
- INJECTOR_HEAD (Cabezal Inyector)
- POWER_PACK (Paquete de Potencia)
```

**Ejemplo de Plantilla de Job:**

```typescript
// UI: Coiled Tubing → Nuevo Job
POST /api/v1/coiled-tubing/jobs

// Backend crea estructura completa:
{
  ctJob: Asset {
    type: 'CT_JOB',
    properties: { jobType, wellId, startDate, ... },
    children: [
      {
        type: 'CT_REEL',
        properties: { serialNumber, odInches, length, ... },
        telemetries: { depth, speed, weight, pressure, ... }
      },
      {
        type: 'CT_UNIT',
        properties: { unitNumber, capacity, ... }
      },
      {
        type: 'CT_TOOL',
        properties: { toolType, serialNumber, ... }
      }
    ]
  }
}
```

---

### Módulo: Production

**Asset Types Predefinidos:**

```typescript
- ESP_UNIT (Unidad ESP)
- ESP_MOTOR (Motor ESP)
- ESP_PUMP (Bomba ESP)
- GAS_LIFT_VALVE (Válvula de Gas Lift)
- SURFACE_PUMP (Bomba de Superficie)
- COMPRESSOR (Compresor)
- SEPARATOR (Separador de Producción)
```

---

### Módulo: Inventory (ERP)

**Asset Types Predefinidos:**

```typescript
- WAREHOUSE (Almacén)
- STORAGE_LOCATION (Ubicación de Almacenamiento)
- EQUIPMENT_ITEM (Ítem de Equipo)
- CONSUMABLE_ITEM (Ítem Consumible)
- SPARE_PART (Repuesto)
```

---

## 🔧 Implementación Técnica

### 1. Seed de Asset Types por Módulo

Cada módulo debe tener un archivo de seed:

```
/src/backend/src/modules/{module}/seeds/
  └── asset-types.seed.ts
```

**Ejemplo:**

```typescript
// /src/backend/src/modules/coiled-tubing/seeds/asset-types.seed.ts

export async function seedCoiledTubingAssetTypes(tenantId: string) {
  const assetTypes = [
    {
      code: 'CT_REEL',
      name: 'Carrete de Coiled Tubing',
      fixedSchema: { ... },
      attributeSchema: { ... },
      telemetrySchema: { ... },
      computedFields: [ ... ],
    },
    // ... más tipos
  ];
  
  for (const type of assetTypes) {
    await assetsService.createOrUpdateAssetType(type);
  }
}
```

### 2. Service Layer con Abstracción

Cada módulo tiene un service que abstrae Digital Twins:

```typescript
// /src/backend/src/modules/wells/wells.service.ts

export class WellsService {
  constructor(
    private assetsService: AssetsService
  ) {}
  
  async createWell(data: CreateWellDTO) {
    // Mapear DTO específico de pozo a estructura de asset
    const assetData = {
      assetTypeCode: 'WELL',
      code: data.wellCode,
      name: data.wellName,
      properties: {
        wellType: data.wellType,
        status: data.status,
        liftMethod: data.liftMethod,
        spudDate: data.spudDate,
        // ... propiedades fijas
      },
      attributes: {
        tubingSize: data.tubingSize,
        reservoirPressure: data.reservoirPressure,
        // ... atributos dinámicos
      },
      latitude: data.surfaceLatitude,
      longitude: data.surfaceLongitude,
      parentAssetId: data.fieldId, // Relación con campo
    };
    
    const asset = await this.assetsService.create(assetData);
    
    // Mapear asset de vuelta a DTO de pozo
    return this.mapAssetToWell(asset);
  }
  
  async getWell(id: string) {
    const asset = await this.assetsService.getById(id);
    return this.mapAssetToWell(asset);
  }
  
  private mapAssetToWell(asset: Asset): Well {
    return {
      id: asset.id,
      wellName: asset.name,
      wellCode: asset.code,
      wellType: asset.properties.wellType,
      status: asset.properties.status,
      // ... mapeo completo
    };
  }
}
```

### 3. Controller con Interfaz Específica

```typescript
// /src/backend/src/modules/wells/wells.controller.ts

export class WellsController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createWellSchema.parse(request.body);
    const well = await wellsService.createWell(data);
    
    return reply.code(201).send({
      success: true,
      data: well,
    });
  }
}
```

### 4. Frontend Transparente

```typescript
// /src/frontend/src/features/wells/api/wells.api.ts

export const createWell = async (data: CreateWellDTO) => {
  // Usuario usa interfaz de pozos, no sabe que es un asset
  const response = await api.post('/api/v1/wells', data);
  return response.data;
};
```

---

## 📊 Migración de Módulos Legacy

### Estrategia de Migración

Para módulos que ya tienen tablas legacy (como Yacimientos):

**Opción 1: Wrapper Transparente (Recomendado)**

```typescript
// Mantener API existente, cambiar implementación interna
export class WellsService {
  async create(data: CreateWellDTO) {
    // Crear en assets (nueva arquitectura)
    const asset = await assetsService.create({...});
    
    // Opcional: Mantener sincronización con tabla legacy
    // para compatibilidad temporal
    await this.syncToLegacyTable(asset);
    
    return this.mapAssetToWell(asset);
  }
}
```

**Opción 2: Migración Completa**

1. Crear asset_types
2. Migrar datos de tablas legacy a assets
3. Actualizar todos los servicios para usar assets
4. Deprecar tablas legacy
5. Eliminar tablas legacy después de período de transición

---

## ✅ Checklist por Módulo

Cuando se implemente cada módulo, verificar:

- [ ] Asset types definidos en `/seeds/asset-types.seed.ts`
- [ ] Schemas completos (fixed, attributes, telemetry, computed)
- [ ] Service layer con mapeo asset ↔ DTO específico
- [ ] Controller con interfaz específica del dominio
- [ ] Frontend usa API específica (transparente a Digital Twins)
- [ ] Documentación de asset types en README del módulo
- [ ] Tests de creación y mapeo
- [ ] Migración de datos legacy (si aplica)

---

## 🎯 Beneficios del Patrón

1. **Separación de Concerns**
   - Usuario del módulo: Interfaz específica del dominio
   - Usuario avanzado: Acceso completo a Digital Twins

2. **Flexibilidad**
   - Módulos pueden agregar atributos personalizados
   - Telemetrías configurables por tipo de activo
   - Reglas visuales aplicables a cualquier asset

3. **Consistencia**
   - Mismo patrón en todos los módulos
   - Arquitectura unificada de datos
   - Facilita integraciones

4. **Escalabilidad**
   - Nuevos módulos siguen el mismo patrón
   - Asset types se pueden extender sin cambiar DB
   - Soporta multi-tenancy naturalmente

---

## 📝 Ejemplo Completo: Módulo Coiled Tubing

### 1. Definir Asset Types

```typescript
// /modules/coiled-tubing/seeds/asset-types.seed.ts
export const CT_ASSET_TYPES = [
  {
    code: 'CT_JOB',
    name: 'Trabajo de Coiled Tubing',
    fixedSchema: {
      jobType: { type: 'enum', values: ['CLEANOUT', 'STIMULATION', 'LOGGING'] },
      startDate: { type: 'date', required: true },
      endDate: { type: 'date' },
    },
    attributeSchema: {
      plannedDepthFt: { type: 'number', unit: 'ft' },
      actualDepthFt: { type: 'number', unit: 'ft' },
    },
    telemetrySchema: {
      currentDepthFt: { type: 'number', unit: 'ft', frequency: '1sec' },
      pumpPressure: { type: 'number', unit: 'psi', frequency: '1sec' },
    },
  },
  {
    code: 'CT_REEL',
    name: 'Carrete de Coiled Tubing',
    // ... schema completo
  },
];
```

### 2. Service con Abstracción

```typescript
// /modules/coiled-tubing/coiled-tubing.service.ts
export class CoiledTubingService {
  async createJob(data: CreateCTJobDTO) {
    // Crear job principal
    const jobAsset = await assetsService.create({
      assetTypeCode: 'CT_JOB',
      name: `CT Job ${data.jobNumber}`,
      properties: {
        jobType: data.jobType,
        startDate: data.startDate,
      },
      parentAssetId: data.wellId,
    });
    
    // Crear reel asociado
    const reelAsset = await assetsService.create({
      assetTypeCode: 'CT_REEL',
      name: data.reelSerialNumber,
      properties: {
        odInches: data.reelOD,
        materialGrade: data.materialGrade,
      },
      parentAssetId: jobAsset.id,
    });
    
    // Crear herramientas
    for (const tool of data.tools) {
      await assetsService.create({
        assetTypeCode: 'CT_TOOL',
        name: tool.name,
        parentAssetId: jobAsset.id,
      });
    }
    
    return this.mapAssetToCTJob(jobAsset);
  }
}
```

### 3. API Específica

```typescript
// POST /api/v1/coiled-tubing/jobs
{
  "jobNumber": "CT-2026-001",
  "jobType": "CLEANOUT",
  "wellId": "uuid-well",
  "startDate": "2026-01-10",
  "reelSerialNumber": "CT-REEL-12345",
  "reelOD": 2.375,
  "materialGrade": "CT-80",
  "tools": [
    { "name": "Jetting Tool", "type": "JETTING" },
    { "name": "Scraper", "type": "SCRAPER" }
  ]
}

// Response: CTJob con estructura completa
```

---

## 🔄 Actualización de PROGRESS.md

Cuando se complete la migración de cada módulo, actualizar:

```markdown
### Módulo: {Nombre}
**Estado**: 🟢 Completado (100%)
**Migración a Digital Twins**: ✅ Completada

#### Asset Types Implementados
- ✅ {ASSET_TYPE_1}
- ✅ {ASSET_TYPE_2}
- ...

#### Funcionalidades
- ✅ CRUD desde interfaz específica
- ✅ Mapeo automático asset ↔ DTO
- ✅ Telemetrías configuradas
- ✅ Campos calculados activos
```

---

**Fecha de creación**: 2026-01-09  
**Última actualización**: 2026-01-09  
**Estado**: 📋 Patrón definido - Listo para implementación
