# Plan de Pruebas - Rule Engine Frontend

## ✅ Completado

### 1. Infraestructura
- ✅ Componente ScrollArea creado
- ✅ Dependencia @radix-ui/react-scroll-area instalada
- ✅ Link en sidebar actualizado a `/rule-engine`
- ✅ Frontend corriendo en http://localhost:5174

### 2. Componentes de Configuración Implementados

#### Nodos de Filtro
- ✅ ScriptFilterConfig - Filtro con script JavaScript
- ✅ ThresholdFilterConfig - Filtro por umbrales

#### Nodos de Routing
- ✅ MessageTypeSwitchConfig - Switch por tipo de mensaje

#### Nodos de Enrichment
- ✅ FetchAssetAttributesConfig - Obtener atributos de assets
- ✅ FetchAssetTelemetryConfig - Obtener telemetría

#### Nodos de Transform
- ✅ ScriptTransformConfig - Transformación con script
- ✅ MathConfig - Operaciones matemáticas
- ✅ FormulaConfig - Fórmulas personalizadas

#### Nodos de Action
- ✅ SaveTimeseriesConfig - Guardar en TimescaleDB
- ✅ UpdateDittoFeatureConfig - Actualizar Digital Twin
- ✅ CreateAlarmConfig - Crear alarma
- ✅ LogConfig - Logging
- ✅ KafkaPublishConfig - Publicar a Kafka

#### Nodos de Flow
- ✅ RuleChainConfig - Invocar otra regla

## 🧪 Pruebas a Realizar

### Prueba 1: Navegación
1. Abrir http://localhost:5174
2. Login con usuario de prueba
3. Verificar que "Motor de Reglas" aparece en el sidebar
4. Click en "Motor de Reglas"
5. Verificar que carga la página del editor

### Prueba 2: Editor Visual
1. Verificar que el canvas de React Flow se carga
2. Verificar que el panel de nodos está visible
3. Arrastrar un nodo al canvas
4. Verificar que el nodo se renderiza correctamente

### Prueba 3: Configuración de Nodos
Para cada tipo de nodo:
1. Arrastrar nodo al canvas
2. Click en el nodo para seleccionarlo
3. Verificar que el panel de configuración se abre
4. Verificar que los campos específicos del nodo aparecen
5. Modificar valores
6. Verificar que los cambios se reflejan en el store

### Prueba 4: Validación
1. Intentar guardar una regla sin configuración completa
2. Verificar que aparecen mensajes de validación
3. Completar configuración requerida
4. Verificar que la validación pasa

## 📋 Checklist de Componentes

### ScriptFilterConfig
- [ ] Campo de script (textarea)
- [ ] Selector de lenguaje (JavaScript/TypeScript)
- [ ] Botón de validación de sintaxis
- [ ] Preview de variables disponibles

### ThresholdFilterConfig
- [ ] Campo para seleccionar atributo
- [ ] Selector de operador (>, <, >=, <=, ==, !=)
- [ ] Campo de valor umbral
- [ ] Tipo de dato (number, string, boolean)

### MessageTypeSwitchConfig
- [ ] Lista de tipos de mensaje
- [ ] Botón para agregar tipo
- [ ] Botón para eliminar tipo
- [ ] Mapeo tipo → output handle

### FetchAssetAttributesConfig
- [ ] Campo para Thing ID (puede ser variable)
- [ ] Lista de atributos a obtener
- [ ] Opción de obtener todos los atributos
- [ ] Campo para almacenar resultado

### FetchAssetTelemetryConfig
- [ ] Campo para Thing ID
- [ ] Lista de features/properties
- [ ] Rango de tiempo (opcional)
- [ ] Agregación (last, avg, max, min)

### ScriptTransformConfig
- [ ] Editor de script
- [ ] Variables de entrada disponibles
- [ ] Variables de salida esperadas
- [ ] Botón de test

### MathConfig
- [ ] Selector de operación (+, -, *, /, %, ^)
- [ ] Campo operando 1
- [ ] Campo operando 2
- [ ] Campo para resultado

### FormulaConfig
- [ ] Editor de fórmula (mathjs)
- [ ] Lista de variables disponibles
- [ ] Preview de resultado
- [ ] Validación de sintaxis

### SaveTimeseriesConfig
- [ ] Campo para Thing ID
- [ ] Campo para Feature ID
- [ ] Mapeo de propiedades
- [ ] Timestamp (auto o manual)

### UpdateDittoFeatureConfig
- [ ] Campo para Thing ID
- [ ] Campo para Feature ID
- [ ] Editor JSON para properties
- [ ] Opción de merge/replace

### CreateAlarmConfig
- [ ] Tipo de alarma (crítica, advertencia, info)
- [ ] Mensaje de alarma
- [ ] Asset relacionado
- [ ] Metadata adicional

### LogConfig
- [ ] Nivel de log (debug, info, warn, error)
- [ ] Mensaje (puede incluir variables)
- [ ] Incluir metadata

### KafkaPublishConfig
- [ ] Topic de destino
- [ ] Key (opcional)
- [ ] Formato (JSON, String, Avro)
- [ ] Headers (opcional)

### RuleChainConfig
- [ ] Selector de regla a invocar
- [ ] Mapeo de entrada
- [ ] Mapeo de salida

## 🐛 Issues Conocidos

1. Backend no tiene endpoints implementados
   - Solución temporal: Mock data en frontend
   - Solución permanente: Implementar endpoints en backend

2. Validación de scripts
   - Necesita implementar parser/validator
   - Por ahora solo validación básica

3. Preview de resultados
   - Requiere ejecutar reglas en modo test
   - Pendiente de implementación

## 📝 Notas

- Todos los componentes de configuración están implementados
- Falta integración con backend (endpoints)
- Falta implementación de validación avanzada
- Falta sistema de preview/testing
- El editor visual funciona correctamente con React Flow
- El store de Zustand maneja el estado correctamente
