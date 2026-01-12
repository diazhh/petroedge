# Plan de Corrección - Rule Engine TypeScript Errors

## 📋 Resumen de Errores

### Errores Críticos Identificados

1. **Componentes de Configuración**: Acceso a propiedades en objetos vacíos `{}`
2. **Separador faltante**: `@/components/ui/separator` no existe
3. **NodePalette**: Falta categoría `input` en Record<NodeCategory, string>
4. **CustomNode**: Problemas con tipos de datos
5. **Imports no usados**: useState en MessageTypeSwitchConfig

## 🔧 Correcciones por Archivo

### 1. Componentes de Configuración (Alta Prioridad)

**Problema**: Todos los componentes de configuración acceden a `config` como `{}` en lugar de tener el tipo correcto.

**Archivos afectados**:
- CreateAlarmConfig.tsx
- FetchAssetAttributesConfig.tsx
- FetchAssetTelemetryConfig.tsx
- FormulaConfig.tsx
- KafkaPublishConfig.tsx
- LogConfig.tsx
- MathConfig.tsx
- MessageTypeSwitchConfig.tsx
- RuleChainConfig.tsx
- SaveTimeseriesConfig.tsx
- ScriptFilterConfig.tsx
- ScriptTransformConfig.tsx
- ThresholdFilterConfig.tsx
- UpdateDittoFeatureConfig.tsx

**Solución**: 
- Definir interfaces específicas para cada tipo de configuración
- Usar type assertion o type guard para acceder a las propiedades
- Actualizar el hook `useNodeConfig` para retornar el tipo correcto

### 2. Separator Component (Media Prioridad)

**Archivo**: `EditorToolbar.tsx:15`

**Error**: `Cannot find module '@/components/ui/separator'`

**Solución**: 
- Crear componente `separator.tsx` en `/src/components/ui/`
- Usar Radix UI `@radix-ui/react-separator`

### 3. NodePalette Categories (Alta Prioridad)

**Archivo**: `NodePalette.tsx:9, 18`

**Error**: Falta categoría `input` en `Record<NodeCategory, string>`

**Solución**:
- Agregar categoría `input` a los objetos `categoryIcons` y `categoryLabels`
- O actualizar el tipo `NodeCategory` para no incluir `input`

### 4. CustomNode Type Issues (Media Prioridad)

**Archivo**: `CustomNode.tsx:43-69`

**Errores**:
- Type 'CustomNodeData' no satisface constraint
- 'data' is of type 'unknown'
- Element implicitly has 'any' type

**Solución**:
- Definir correctamente el tipo `CustomNodeData`
- Agregar type guards para acceder a propiedades
- Tipar correctamente los iconos y categorías

### 5. Imports No Usados (Baja Prioridad)

**Archivo**: `MessageTypeSwitchConfig.tsx:1`

**Error**: `'useState' is declared but its value is never read`

**Solución**: Remover import no usado

## 🎯 Orden de Ejecución

### Fase 1: Tipos Base (30 min)
1. ✅ Crear tipos para configuraciones de nodos
2. ✅ Actualizar hook `useNodeConfig` con tipos correctos
3. ✅ Crear interfaces para cada tipo de configuración

### Fase 2: Componentes UI Faltantes (10 min)
4. ✅ Crear componente `Separator`
5. ✅ Instalar dependencia si es necesaria

### Fase 3: Corrección de Componentes (60 min)
6. ✅ Arreglar NodePalette (agregar categoría `input`)
7. ✅ Arreglar CustomNode (tipos correctos)
8. ✅ Arreglar todos los componentes de configuración (14 archivos)
9. ✅ Remover imports no usados

### Fase 4: Verificación (15 min)
10. ✅ Ejecutar typecheck
11. ✅ Probar navegación en navegador
12. ✅ Verificar que todos los componentes cargan correctamente

## 📝 Archivos a Crear/Modificar

### Crear:
- `/src/components/ui/separator.tsx`
- `/src/features/rule-engine/types/node-config.types.ts` (tipos de configuración)

### Modificar:
- `/src/features/rule-engine/hooks/useNodeConfig.ts`
- `/src/features/rule-engine/components/editor/EditorToolbar.tsx`
- `/src/features/rule-engine/components/editor/NodePalette.tsx`
- `/src/features/rule-engine/components/nodes/CustomNode.tsx`
- Todos los archivos en `/src/features/rule-engine/components/config/` (14 archivos)

## 🚀 Comandos de Verificación

```bash
# Verificar errores de TypeScript
cd src/frontend
npm run typecheck

# Verificar solo Rule Engine
npx tsc --noEmit 2>&1 | grep "src/features/rule-engine"

# Iniciar servidor de desarrollo
npm run dev
```

## ✅ Checklist de Completitud

- [ ] Tipos de configuración definidos
- [ ] Hook useNodeConfig actualizado
- [ ] Componente Separator creado
- [ ] NodePalette corregido
- [ ] CustomNode corregido
- [ ] CreateAlarmConfig corregido
- [ ] FetchAssetAttributesConfig corregido
- [ ] FetchAssetTelemetryConfig corregido
- [ ] FormulaConfig corregido
- [ ] KafkaPublishConfig corregido
- [ ] LogConfig corregido
- [ ] MathConfig corregido
- [ ] MessageTypeSwitchConfig corregido
- [ ] RuleChainConfig corregido
- [ ] SaveTimeseriesConfig corregido
- [ ] ScriptFilterConfig corregido
- [ ] ScriptTransformConfig corregido
- [ ] ThresholdFilterConfig corregido
- [ ] UpdateDittoFeatureConfig corregido
- [ ] Typecheck pasa sin errores en Rule Engine
- [ ] Navegación funciona en navegador
- [ ] Componentes cargan correctamente
