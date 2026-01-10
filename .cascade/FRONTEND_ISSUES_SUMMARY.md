# Resumen de Problemas Frontend - Digital Twins

**Fecha**: 2026-01-10 13:01  
**Reportado por**: Usuario

---

## Problemas Reportados

### 1. `/basins` - Sin detalles
- ❌ Al hacer clic en una cuenca, no carga la página de detalle
- ✅ La lista se muestra correctamente
- ✅ Todas las columnas se muestran

**Causa**: Página `BasinDetail.tsx` existe pero tiene errores de compilación TypeScript

### 2. `/fields` - Solo se muestra columna "Operador"
- ❌ Solo se muestra la columna "Operador", las demás están vacías
- ❌ No tiene página de detalle (no existe `FieldDetail.tsx`)

**Causa**: 
- Los datos de Ditto no tienen `name`, solo `code`
- El adaptador no estaba mapeando correctamente `fieldName` desde `code`
- Falta la columna "Cuenca" porque `basin` no se estaba incluyendo en el adaptador

### 3. `/reservoirs` - Solo se muestra "Litología"
- ❌ Solo se muestra la columna "Litología", las demás están vacías
- ❌ No tiene página de detalle (existe `ReservoirDetail.tsx` pero con errores)

**Causa**:
- El adaptador no estaba mapeando correctamente `formationName` (estaba undefined)
- Falta la columna "Campo" porque `field` no se estaba incluyendo en el adaptador

### 4. `/wells` - No se muestra "Yacimiento"
- ❌ La columna "Yacimiento" está vacía
- ❌ No tiene página de detalle (no existe `WellDetail.tsx`)

**Causa**:
- El adaptador no estaba incluyendo `reservoir` en `WellWithRelations`

---

## Soluciones Aplicadas

### ✅ Adaptadores Corregidos

#### 1. `fields.api.ts`
```typescript
// Agregado:
basin: thing.attributes?.parentBasinId ? { id: thing.attributes.parentBasinId, name: '' } as any : undefined,
fieldName: thing.attributes?.name || thing.attributes?.fieldCode || thing.attributes?.code || '',
status: thing.features?.operations?.properties?.status || thing.features?.status?.properties?.current,
discoveryDate: thing.features?.operations?.properties?.discoveryDate || thing.features?.metadata?.properties?.discoveryDate,
```

#### 2. `reservoirs.api.ts`
```typescript
// Agregado:
field: thing.attributes?.parentFieldId ? { id: thing.attributes.parentFieldId, fieldName: '', fieldCode: '' } as any : undefined,
formationName: thing.features?.geology?.properties?.formationName || '', // Agregado fallback a string vacío
```

#### 3. `wells.api.ts`
```typescript
// Corregido WellWithRelations:
field: thing.attributes?.parentFieldId ? {
  id: thing.attributes.parentFieldId,
  fieldName: '',
  fieldCode: '',
} as any : undefined,
reservoir: thing.attributes?.parentReservoirId ? {
  id: thing.attributes.parentReservoirId,
  reservoirName: '',
  reservoirCode: '',
} as any : undefined,
```

---

## Problemas Pendientes

### 1. Páginas de Detalle Faltantes

#### ❌ `FieldDetail.tsx` - NO EXISTE
**Ubicación esperada**: `/src/frontend/src/features/fields/pages/FieldDetail.tsx`
**Necesita**: Crear página de detalle para Fields

#### ❌ `WellDetail.tsx` - NO EXISTE
**Ubicación esperada**: `/src/frontend/src/features/wells/pages/WellDetail.tsx`
**Necesita**: Crear página de detalle para Wells

#### ⚠️ `BasinDetail.tsx` - EXISTE CON ERRORES
**Ubicación**: `/src/frontend/src/features/basins/pages/BasinDetail.tsx`
**Errores**:
- Usa `BasinType.SEDIMENTARY` que no existe en el enum
- Usa campos legacy como `area_km2` en lugar de `areaKm2`
- Usa `geological_age` que no existe

#### ⚠️ `ReservoirDetail.tsx` - EXISTE CON ERRORES
**Ubicación**: `/src/frontend/src/features/reservoirs/pages/ReservoirDetail.tsx`
**Errores**:
- Usa campos legacy como `depth_top_m`, `depth_bottom_m`, `thickness_m`
- Usa `porosity_percent`, `permeability_md`, `temperature_c` que no existen
- Los campos correctos son: `topDepthTvdFt`, `bottomDepthTvdFt`, `avgPorosity`, `avgPermeabilityMd`, `reservoirTemperatureF`

### 2. Datos Relacionados Vacíos

Las relaciones (basin, field, reservoir) se están incluyendo pero con datos vacíos:
```typescript
basin: { id: 'xxx', name: '' }  // name está vacío
field: { id: 'xxx', fieldName: '', fieldCode: '' }  // nombres vacíos
reservoir: { id: 'xxx', reservoirName: '', reservoirCode: '' }  // nombres vacíos
```

**Solución necesaria**: 
- Opción 1: Hacer queries adicionales para obtener los nombres
- Opción 2: Incluir los nombres en los attributes de Ditto durante la migración
- Opción 3: Usar solo los IDs y hacer joins en el frontend cuando sea necesario

---

## Estructura de Datos Ditto Actual

### Field Example
```json
{
  "thingId": "acme:field_MOR",
  "attributes": {
    "type": "FIELD",
    "code": "MOR",  // ⚠️ No hay "name" o "fieldCode"
    "description": "Campo productor de crudo mediano",
    "legacyId": "7dca735c-2b6c-4dd1-99af-2a8f587397d9",
    "parentBasinId": "95d989b6-e3e4-4c5d-8db9-ab4c92bc18f3"
  },
  "features": {
    "operations": {
      "properties": {
        "operator": "PDVSA",
        "discoveryDate": "1985-03-14T00:00:00.000Z",
        "status": "PRODUCING"
      }
    }
  }
}
```

### Well Example
```json
{
  "thingId": "acme:well_MOR_001",
  "attributes": {
    "type": "WELL",
    "wellCode": "MOR-001",
    "apiNumber": "VE-ANZ-MOR-001",
    "parentFieldId": "7dca735c-2b6c-4dd1-99af-2a8f587397d9"
    // ⚠️ No hay "parentReservoirId"
  },
  "features": {
    "completion": {
      "properties": {
        "wellType": "PRODUCER",
        "liftMethod": "ESP"
      }
    },
    "status": {
      "properties": {
        "current": "PRODUCING"
      }
    }
  }
}
```

---

## Próximos Pasos

1. **Crear páginas de detalle faltantes**:
   - [ ] `FieldDetail.tsx`
   - [ ] `WellDetail.tsx`

2. **Corregir páginas de detalle con errores**:
   - [ ] `BasinDetail.tsx` - Actualizar a nuevos nombres de campos
   - [ ] `ReservoirDetail.tsx` - Actualizar a nuevos nombres de campos

3. **Resolver datos relacionados vacíos**:
   - [ ] Decidir estrategia (queries adicionales vs datos en Ditto)
   - [ ] Implementar solución elegida

4. **Verificar rutas**:
   - [ ] Asegurar que las rutas `/basins/:id`, `/fields/:id`, `/reservoirs/:id`, `/wells/:id` estén configuradas

---

## Warnings de TypeScript (No Críticos)

- `'PaginatedResponse' is declared but never used` en todos los archivos de API
  - **Acción**: Puede removerse en cleanup futuro
