# Correcciones Frontend - Digital Twins Ditto Integration

**Fecha**: 2026-01-10  
**Contexto**: Fixing Frontend Ditto Adapters - Las listas se mostraban pero algunas columnas no, y los detalles daban error

---

## Problemas Identificados

### 1. Estructura de Respuesta del Backend
**Problema**: El backend retorna:
```json
{
  "success": true,
  "data": {
    "items": [...]
  }
}
```

Pero los adaptadores del frontend accedían a:
- `response.data.data.items` ❌ (incorrecto)
- `response.data.data?.items || response.data.data || []` ❌ (fallback incorrecto)

**Solución**: Acceder correctamente a `response.data.data.items`

---

### 2. ThingCard - Nombres No Se Mostraban
**Problema**: El componente `ThingCard` buscaba `thing.attributes.name`, pero:
- Wells tienen `wellCode`, no `name`
- Reservoirs tienen `reservoirCode`, no `name`
- Fields tienen `fieldCode`, no `name`

**Solución**: Implementar lógica de fallback para obtener nombre según tipo:
```typescript
const getName = () => {
  if (thing.attributes?.name) return thing.attributes.name;
  if (thing.attributes?.wellCode) return thing.attributes.wellCode;
  if (thing.attributes?.reservoirCode) return thing.attributes.reservoirCode;
  if (thing.attributes?.fieldCode) return thing.attributes.fieldCode;
  if (thing.attributes?.basinCode) return thing.attributes.basinCode;
  if (thing.attributes?.code) return thing.attributes.code;
  if (thing.attributes?.apiNumber) return thing.attributes.apiNumber;
  return thing.thingId;
};
```

---

### 3. Wells Adapter - Campos Mal Mapeados
**Problema**: El adaptador accedía a features incorrectos:
- `features.classification.properties.wellType` ❌ → Debería ser `features.completion.properties.wellType` ✅
- `features.operations.properties.liftMethod` ❌ → Debería ser `features.completion.properties.liftMethod` ✅

**Datos reales de Ditto**:
```json
{
  "features": {
    "completion": {
      "properties": {
        "wellType": "PRODUCER",
        "liftMethod": "ESP",
        "tubingSize": "2.875",
        "casingSize": "7.000"
      }
    },
    "status": {
      "properties": {
        "current": "PRODUCING",
        "spudDate": "2010-03-14T00:00:00.000Z",
        "completionDate": "2010-05-19T00:00:00.000Z"
      }
    }
  }
}
```

**Solución**: Corregir paths en el adaptador:
```typescript
wellType: thing.features?.completion?.properties?.wellType || 'PRODUCER',
liftMethod: thing.features?.completion?.properties?.liftMethod,
```

---

### 4. Detalle de Things - URL Encoding
**Problema**: Los `thingId` vienen con namespace (`acme:well_MOR_001`) y necesitan encoding correcto en URLs.

**Solución**: Ya implementado correctamente con `encodeURIComponent(thingId)` en todas las APIs.

---

## Archivos Modificados

### 1. `/src/frontend/src/features/digital-twins/api/digital-twins.api.ts`
- ✅ `useThings`: Agregado `response.data.data`
- ✅ `useThing`: Agregado `response.data.data`
- ✅ `useCreateThing`: Agregado `response.data.data`
- ✅ `useUpdateThing`: Agregado `response.data.data`

### 2. `/src/frontend/src/features/digital-twins/components/ThingCard.tsx`
- ✅ Agregada función `getName()` con fallbacks por tipo

### 3. `/src/frontend/src/features/geology/api/wells.api.ts`
- ✅ Corregido acceso a items: `response.data.data?.items || []`
- ✅ Corregido `wellType`: `features.completion.properties.wellType`
- ✅ Corregido `liftMethod`: `features.completion.properties.liftMethod`
- ✅ Agregado fallback: `wellName: thing.attributes?.name || thing.attributes?.wellCode`

### 4. `/src/frontend/src/features/geology/api/reservoirs.api.ts`
- ✅ Corregido acceso a items: `response.data.data?.items || []`
- ✅ Agregado fallback: `reservoirName: thing.attributes?.name || thing.attributes?.reservoirCode`

### 5. `/src/frontend/src/features/geology/api/fields.api.ts`
- ✅ Corregido acceso a items: `response.data.data?.items || []`
- ✅ Agregado fallback: `fieldName: thing.attributes?.name || thing.attributes?.fieldCode`

### 6. `/src/frontend/src/features/geology/api/basins.api.ts`
- ✅ Corregido acceso a items: `response.data.data?.items || []`

---

## Resultado Esperado

### Listas
- ✅ Las listas de Digital Twins se muestran correctamente
- ✅ Las columnas muestran los nombres apropiados (wellCode, reservoirCode, etc.)
- ✅ Los tipos se muestran correctamente (WELL, RESERVOIR, FIELD, BASIN)

### Detalles
- ✅ Los detalles de Things se cargan correctamente
- ✅ Los atributos se muestran en formato JSON
- ✅ Las features se muestran agrupadas por feature ID
- ✅ Los metadatos (policyId, revision, created, modified) se muestran

---

## Warnings de TypeScript (No Críticos)

Los siguientes warnings aparecen pero no afectan funcionalidad:
- `'PaginatedResponse' is declared but never used` en basins, fields, reservoirs, wells APIs
  - **Razón**: Tipo importado pero no usado actualmente
  - **Acción**: Puede removerse en cleanup futuro

---

## Testing Manual Realizado

```bash
# 1. Verificar lista de wells
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/digital-twins?type=WELL"
# ✅ Retorna 3 wells correctamente

# 2. Verificar detalle de well
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/digital-twins/acme:well_MOR_001"
# ✅ Retorna well con todos los features
```

---

## Próximos Pasos

1. **Testing en Browser**: Verificar que las listas y detalles funcionen en el frontend
2. **Validar Columnas**: Confirmar que todas las columnas necesarias se muestren
3. **Error Handling**: Verificar manejo de errores en detalles
4. **Otros Errores**: Hay errores de compilación en otros archivos (BasinDetail, ReservoirDetail) que usan campos legacy que ya no existen

---

## Notas Técnicas

### Estructura de Ditto Thing
```typescript
{
  thingId: "namespace:id",
  policyId: "namespace:policy",
  attributes: {
    type: "WELL" | "RESERVOIR" | "FIELD" | "BASIN",
    wellCode?: string,
    reservoirCode?: string,
    fieldCode?: string,
    code?: string,
    name?: string,
    // ... otros atributos específicos
  },
  features: {
    [featureId]: {
      properties: {
        // ... propiedades del feature
      }
    }
  },
  _revision: number,
  _created: string,
  _modified: string
}
```

### Backend Response Format
```typescript
{
  success: true,
  data: {
    items: DittoThing[],
    nextPageOffset?: number
  }
}
```
