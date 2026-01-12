# Rule Engine Frontend Module

**Estado**: 🟡 En Progreso (Fase 4 Completada - 80%)  
**Fecha**: 2026-01-10  
**Roadmap**: `/roadmap/01_arquitectura/13_RULE_ENGINE_FRONTEND.md`

## 📋 Progreso de Implementación

### ✅ Fase 1: Fundamentos (COMPLETADA)

#### Tipos TypeScript
- ✅ `types/rule.types.ts` - Tipos para reglas, nodos, edges, configuración
- ✅ `types/node.types.ts` - Tipos para definiciones de nodos, categorías
- ✅ `types/execution.types.ts` - Tipos para ejecuciones y logs

#### Schemas Zod
- ✅ `schemas/rule.schema.ts` - Validación de reglas (create, update, test)
- ✅ `schemas/node.schema.ts` - Validación de configuraciones de nodos

#### API Client (React Query)
- ✅ `api/rules.api.ts` - CRUD de reglas, activación, testing, versionado
- ✅ `api/nodes.api.ts` - Listado de nodos disponibles
- ✅ `api/executions.api.ts` - Historial de ejecuciones y estadísticas

#### Stores (Zustand)
- ✅ `stores/ruleEditorStore.ts` - Estado del editor (nodes, edges, undo/redo)
- ✅ `stores/nodeLibraryStore.ts` - Librería de nodos disponibles

#### Utilidades
- ✅ `utils/nodeRegistry.ts` - Registro de 13 nodos base, colores, iconos
- ✅ `utils/flowValidation.ts` - Validación de flujos (ciclos, nodos huérfanos)
- ✅ `utils/nodeHelpers.ts` - Auto-layout, export/import, helpers

### ✅ Fase 2: Páginas Principales (COMPLETADA)
- ✅ `pages/RuleEngineList.tsx` - Lista con filtros, KPIs, búsqueda y paginación
- ✅ `components/shared/RuleCard.tsx` - Card de regla con acciones
- ✅ `components/shared/RuleStatusBadge.tsx` - Badge de estado
- ✅ `pages/RuleEngineDetail.tsx` - Detalle con 5 tabs (Info, Config, Ejecuciones, Métricas, Versiones)

### ✅ Fase 3: Editor Visual (COMPLETADA)
- ✅ `pages/RuleEngineEditor.tsx` - Editor principal con React Flow
- ✅ `components/editor/NodePalette.tsx` - Paleta drag-and-drop con categorías
- ✅ `components/editor/EditorToolbar.tsx` - Toolbar con acciones completas
- ✅ `components/nodes/CustomNode.tsx` - Componente base de nodo con estilos
- ✅ `components/editor/NodeConfigPanel.tsx` - Panel de configuración lateral

### ✅ Fase 4: Configuración de Nodos (COMPLETADA)
- ✅ `hooks/useNodeConfig.ts` - Hook para gestión de configuración
- ✅ `hooks/useNodeValidation.ts` - Hook para validación con Zod
- ✅ `components/config/ScriptFilterConfig.tsx` - Config para script_filter
- ✅ `components/config/ThresholdFilterConfig.tsx` - Config para threshold_filter
- ✅ `components/config/MessageTypeSwitchConfig.tsx` - Config para message_type_switch
- ✅ `components/config/FetchAssetAttributesConfig.tsx` - Config para fetch_asset_attributes
- ✅ `components/config/FetchAssetTelemetryConfig.tsx` - Config para fetch_asset_telemetry
- ✅ `components/config/ScriptTransformConfig.tsx` - Config para script_transform
- ✅ `components/config/MathConfig.tsx` - Config para math
- ✅ `components/config/FormulaConfig.tsx` - Config para formula
- ✅ `components/config/SaveTimeseriesConfig.tsx` - Config para save_timeseries
- ✅ `components/config/UpdateDittoFeatureConfig.tsx` - Config para update_ditto_feature
- ✅ `components/config/CreateAlarmConfig.tsx` - Config para create_alarm
- ✅ `components/config/LogConfig.tsx` - Config para log
- ✅ `components/config/KafkaPublishConfig.tsx` - Config para kafka_publish
- ✅ `components/config/RuleChainConfig.tsx` - Config para rule_chain
- ✅ `components/editor/NodeConfigPanel.tsx` - Panel actualizado con componentes específicos

### ⬜ Fase 5: Testing (PENDIENTE)
- ⬜ `components/testing/RuleTestPanel.tsx` - Panel de pruebas
- ⬜ `components/testing/TestInputForm.tsx` - Formulario de input
- ⬜ `components/testing/TestResults.tsx` - Visualización de resultados

## 🔧 Dependencias Instaladas

```json
{
  "@xyflow/react": "^12.x",
  "dagre": "^0.8.5",
  "@types/dagre": "^0.7.x"
}
```

## 📦 Estructura de Archivos

```
src/features/rule-engine/
├── api/                    ✅ 3 archivos
├── components/             ✅ 5/5 carpetas
│   ├── editor/             ✅ 4 archivos (Toolbar, Palette, ConfigPanel, index)
│   ├── nodes/              ✅ 2 archivos (CustomNode, index)
│   ├── config/             ✅ 15 archivos (14 configs + index)
│   ├── testing/            ⬜ Pendiente (Fase 5)
│   └── shared/             ✅ 3 archivos (RuleCard, RuleStatusBadge, index)
├── pages/                  ✅ 3 archivos (List, Detail, Editor)
├── hooks/                  ✅ 3 archivos (useNodeConfig, useNodeValidation, index)
├── stores/                 ✅ 2 archivos (actualizado con validateFlow)
├── types/                  ✅ 4 archivos
├── schemas/                ✅ 3 archivos
├── utils/                  ✅ 4 archivos
└── index.ts                ✅
```

## 🎯 Próximos Pasos

1. **Fase 5: Testing y Debugging** (Pendiente):
   - RuleTestPanel.tsx - Panel de pruebas
   - TestInputForm.tsx - Formulario de input de prueba
   - TestResults.tsx - Visualización de resultados
   - Integración con backend para testing

3. **Integración y Optimización**:
   - Agregar rutas al router principal
   - Implementar backend endpoints
   - Optimizar rendimiento de React Flow
   - Agregar tests unitarios

## 📚 Referencias

- **Roadmap Completo**: `/roadmap/01_arquitectura/13_RULE_ENGINE_FRONTEND.md`
- **Backend Worker**: `/src/worker/` (64 nodos implementados)
- **React Flow Docs**: https://reactflow.dev/
- **Zustand Docs**: https://zustand-demo.pmnd.rs/

## 🔗 Integración Backend

### Endpoints Necesarios (a implementar en Backend)

```typescript
GET    /api/v1/rule-engine/rules
GET    /api/v1/rule-engine/rules/:id
POST   /api/v1/rule-engine/rules
PUT    /api/v1/rule-engine/rules/:id
DELETE /api/v1/rule-engine/rules/:id
POST   /api/v1/rule-engine/rules/:id/activate
POST   /api/v1/rule-engine/rules/:id/deactivate
POST   /api/v1/rule-engine/rules/:id/test
GET    /api/v1/rule-engine/rules/:id/executions
GET    /api/v1/rule-engine/rules/:id/metrics
GET    /api/v1/rule-engine/rules/:id/versions
GET    /api/v1/rule-engine/nodes
```

## ⚠️ Notas Importantes

- Los errores de TypeScript sobre `@xyflow/react` se resolverán cuando se ejecute `npm install` completo
- El módulo está diseñado siguiendo los estándares del frontend (ver `/roadmap/01_arquitectura/08_FRONTEND_STANDARDS.md`)
- Se requiere implementar los endpoints del backend antes de poder probar completamente
