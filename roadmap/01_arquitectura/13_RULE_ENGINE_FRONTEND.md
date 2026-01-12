# 🎨 Frontend del Motor de Reglas - Editor Visual

**Fecha**: 2026-01-10  
**Estado**: 📋 Planificación  
**Prioridad**: ALTA (Completa Fase 2)

---

## 📋 Visión General

Frontend completo para el Motor de Reglas con editor visual tipo Node-RED/ThingsBoard, permitiendo crear, editar y gestionar reglas de procesamiento de datos en tiempo real sin código.

### Objetivos

1. ✅ Editor visual drag-and-drop con React Flow
2. ✅ Paleta de 64+ nodos organizados por categorías
3. ✅ Configuración visual de nodos con formularios dinámicos
4. ✅ Gestión completa de reglas (CRUD)
5. ✅ Testing y debugging de reglas
6. ✅ Versionado y historial de cambios
7. ✅ Integración con Backend API y Worker Service

---

## 🏗️ Arquitectura del Frontend

### Stack Tecnológico

```yaml
Framework: React 18+ con TypeScript
Build Tool: Vite
UI Library: shadcn/ui + Radix UI
Styling: TailwindCSS
Estado: Zustand + React Query
Editor: React Flow (xyflow/react)
Formularios: React Hook Form + Zod
Iconos: Lucide React
Notificaciones: Sonner (toast)
```

### Estructura de Archivos

```
src/frontend/src/features/rule-engine/
├── api/
│   ├── rules.api.ts              # API calls para reglas
│   ├── nodes.api.ts              # API calls para nodos
│   └── executions.api.ts         # API calls para ejecuciones
├── components/
│   ├── editor/
│   │   ├── RuleEditor.tsx        # Editor principal con React Flow
│   │   ├── NodePalette.tsx       # Paleta de nodos drag-and-drop
│   │   ├── NodeConfigPanel.tsx   # Panel de configuración lateral
│   │   ├── EditorToolbar.tsx     # Toolbar con acciones
│   │   ├── MiniMap.tsx           # Mini mapa de navegación
│   │   └── Controls.tsx          # Controles de zoom/pan
│   ├── nodes/
│   │   ├── CustomNode.tsx        # Componente base de nodo
│   │   ├── FilterNode.tsx        # Nodo de filtro
│   │   ├── TransformNode.tsx     # Nodo de transformación
│   │   ├── ActionNode.tsx        # Nodo de acción
│   │   └── ...                   # Otros tipos de nodos
│   ├── config/
│   │   ├── NodeConfigForm.tsx    # Formulario dinámico de config
│   │   ├── FilterConfig.tsx      # Config específica de filtros
│   │   ├── TransformConfig.tsx   # Config específica de transforms
│   │   └── ...                   # Otros formularios
│   ├── testing/
│   │   ├── RuleTestPanel.tsx     # Panel de testing
│   │   ├── TestInputForm.tsx     # Formulario de input de prueba
│   │   └── TestResults.tsx       # Resultados de ejecución
│   └── shared/
│       ├── RuleCard.tsx          # Card de regla en lista
│       ├── ExecutionLog.tsx      # Log de ejecución
│       └── NodeIcon.tsx          # Icono de nodo
├── pages/
│   ├── RuleEngineList.tsx        # Lista de reglas
│   ├── RuleEngineDetail.tsx      # Detalle de regla con tabs
│   ├── RuleEngineEditor.tsx      # Editor de regla (crear/editar)
│   └── RuleEngineDebug.tsx       # Vista de debugging
├── hooks/
│   ├── useRuleEditor.ts          # Hook para estado del editor
│   ├── useNodeConfig.ts          # Hook para configuración de nodos
│   ├── useRuleExecution.ts       # Hook para ejecución de reglas
│   └── useNodeValidation.ts      # Hook para validación
├── stores/
│   ├── ruleEditorStore.ts        # Estado del editor (Zustand)
│   └── nodeLibraryStore.ts       # Librería de nodos disponibles
├── types/
│   ├── rule.types.ts             # Tipos de reglas
│   ├── node.types.ts             # Tipos de nodos
│   └── execution.types.ts        # Tipos de ejecución
├── schemas/
│   ├── rule.schema.ts            # Schemas Zod para reglas
│   └── node.schema.ts            # Schemas Zod para nodos
├── utils/
│   ├── nodeRegistry.ts           # Registro de tipos de nodos
│   ├── flowValidation.ts         # Validación de flujos
│   └── nodeHelpers.ts            # Helpers para nodos
└── index.ts                      # Exports públicos
```

---

## 🎨 Diseño de Interfaces

### 1. Lista de Reglas (`RuleEngineList.tsx`)

**Ruta**: `/rule-engine`

**Componentes**:
```tsx
<RuleEngineList>
  <PageHeader>
    <Title>Motor de Reglas</Title>
    <Actions>
      <Button onClick={navigateToCreate}>Nueva Regla</Button>
      <Button variant="outline">Importar</Button>
    </Actions>
  </PageHeader>
  
  <KPICards>
    <KPICard title="Reglas Activas" value={activeRules} />
    <KPICard title="Ejecuciones Hoy" value={executionsToday} />
    <KPICard title="Tasa de Éxito" value={successRate} />
    <KPICard title="Errores" value={errors} />
  </KPICards>
  
  <Filters>
    <SearchInput placeholder="Buscar reglas..." />
    <Select placeholder="Estado">
      <Option value="active">Activas</Option>
      <Option value="inactive">Inactivas</Option>
      <Option value="draft">Borradores</Option>
    </Select>
    <Select placeholder="Categoría">
      <Option value="telemetry">Telemetría</Option>
      <Option value="alarms">Alarmas</Option>
      <Option value="calculations">Cálculos</Option>
    </Select>
  </Filters>
  
  <RuleTable>
    <Columns>
      - Nombre
      - Descripción
      - Estado (badge)
      - Última ejecución
      - Ejecuciones (24h)
      - Tasa de éxito
      - Acciones (ver, editar, duplicar, eliminar)
    </Columns>
  </RuleTable>
  
  <Pagination />
</RuleEngineList>
```

**Características**:
- ✅ Click en fila → navega a detalle
- ✅ Filtros por estado, categoría, fecha
- ✅ Búsqueda por nombre/descripción
- ✅ KPIs en tiempo real
- ✅ Badges de estado (activa, inactiva, error)

---

### 2. Detalle de Regla (`RuleEngineDetail.tsx`)

**Ruta**: `/rule-engine/:id`

**Tabs**:
```tsx
<RuleEngineDetail>
  <Header>
    <Breadcrumbs>
      <Link to="/rule-engine">Reglas</Link>
      <Separator />
      <Text>{ruleName}</Text>
    </Breadcrumbs>
    
    <Actions>
      <Button onClick={navigateToEdit}>Editar</Button>
      <Button onClick={duplicateRule}>Duplicar</Button>
      <Button onClick={toggleActive}>
        {isActive ? 'Desactivar' : 'Activar'}
      </Button>
      <Button variant="destructive" onClick={deleteRule}>
        Eliminar
      </Button>
    </Actions>
  </Header>
  
  <Tabs>
    <Tab label="Información">
      <InfoSection>
        - Nombre
        - Descripción
        - Estado
        - Categoría
        - Prioridad
        - Creado por / fecha
        - Modificado por / fecha
      </InfoSection>
      
      <FlowPreview>
        <ReactFlowRenderer 
          nodes={rule.nodes} 
          edges={rule.edges}
          interactive={false}
        />
      </FlowPreview>
    </Tab>
    
    <Tab label="Configuración">
      <ConfigSection>
        - Trigger type (telemetry, attribute, schedule, manual)
        - Trigger config (topic, cron, etc.)
        - Timeout
        - Max retries
        - DLQ config
      </ConfigSection>
    </Tab>
    
    <Tab label="Ejecuciones">
      <ExecutionHistory>
        <Filters>
          <DateRangePicker />
          <Select placeholder="Estado">
            <Option value="success">Exitosas</Option>
            <Option value="error">Con errores</Option>
          </Select>
        </Filters>
        
        <ExecutionTable>
          - ID
          - Timestamp
          - Duración
          - Estado
          - Input data
          - Output data
          - Errores
          - Acciones (ver detalle)
        </ExecutionTable>
      </ExecutionHistory>
    </Tab>
    
    <Tab label="Métricas">
      <MetricsCharts>
        <Chart title="Ejecuciones por Hora" type="line" />
        <Chart title="Tasa de Éxito" type="area" />
        <Chart title="Duración Promedio" type="bar" />
        <Chart title="Errores por Tipo" type="pie" />
      </MetricsCharts>
    </Tab>
    
    <Tab label="Versiones">
      <VersionHistory>
        - Versión
        - Fecha
        - Usuario
        - Cambios
        - Acciones (ver diff, restaurar)
      </VersionHistory>
    </Tab>
  </Tabs>
</RuleEngineDetail>
```

---

### 3. Editor de Reglas (`RuleEngineEditor.tsx`)

**Ruta**: `/rule-engine/new` o `/rule-engine/:id/edit`

**Layout**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                                     │
│  [Guardar] [Guardar y Activar] [Probar] [Deshacer] [Rehacer] [Zoom] [Auto] │
└─────────────────────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────────────────────┬──────────────────┐
│              │                                          │                  │
│   PALETA     │           CANVAS (React Flow)            │  CONFIG PANEL    │
│   DE NODOS   │                                          │                  │
│              │  ┌────┐      ┌────┐      ┌────┐         │  ┌────────────┐  │
│  Filter      │  │ IN │─────▶│ F1 │─────▶│OUT │         │  │ Node Config│  │
│  ├─ Script   │  └────┘      └────┘      └────┘         │  │            │  │
│  ├─ Threshold│                                          │  │ Name: ...  │  │
│  └─ Switch   │  ┌────┐      ┌────┐                     │  │ Type: ...  │  │
│              │  │ F2 │─────▶│ A1 │                     │  │            │  │
│  Transform   │  └────┘      └────┘                     │  │ [Config]   │  │
│  ├─ Script   │                                          │  │            │  │
│  ├─ Math     │                                          │  │ [Validate] │  │
│  └─ Formula  │                                          │  │            │  │
│              │                                          │  │ [Apply]    │  │
│  Action      │                                          │  └────────────┘  │
│  ├─ Log      │                                          │                  │
│  ├─ Alarm    │                                          │  ┌────────────┐  │
│  └─ Email    │                                          │  │ Mini Map   │  │
│              │                                          │  └────────────┘  │
│  ...         │                                          │                  │
│              │                                          │                  │
└──────────────┴──────────────────────────────────────────┴──────────────────┘
```

**Componentes Principales**:

#### 3.1 Toolbar (`EditorToolbar.tsx`)
```tsx
<Toolbar>
  <Group>
    <Button onClick={saveRule}>
      <SaveIcon /> Guardar
    </Button>
    <Button onClick={saveAndActivate} variant="primary">
      <PlayIcon /> Guardar y Activar
    </Button>
  </Group>
  
  <Separator />
  
  <Group>
    <Button onClick={testRule}>
      <TestTubeIcon /> Probar
    </Button>
    <Button onClick={validateFlow}>
      <CheckIcon /> Validar
    </Button>
  </Group>
  
  <Separator />
  
  <Group>
    <Button onClick={undo} disabled={!canUndo}>
      <UndoIcon />
    </Button>
    <Button onClick={redo} disabled={!canRedo}>
      <RedoIcon />
    </Button>
  </Group>
  
  <Separator />
  
  <Group>
    <Button onClick={zoomIn}>
      <ZoomInIcon />
    </Button>
    <Button onClick={zoomOut}>
      <ZoomOutIcon />
    </Button>
    <Button onClick={fitView}>
      <MaximizeIcon /> Ajustar
    </Button>
  </Group>
  
  <Separator />
  
  <Group>
    <Button onClick={autoLayout}>
      <LayoutIcon /> Auto Layout
    </Button>
  </Group>
</Toolbar>
```

#### 3.2 Paleta de Nodos (`NodePalette.tsx`)
```tsx
<NodePalette>
  <Search placeholder="Buscar nodos..." />
  
  <Accordion>
    <AccordionItem value="input" title="Input (1)">
      <NodeItem 
        type="kafka_input"
        icon={<InboxIcon />}
        label="Kafka Input"
        draggable
      />
    </AccordionItem>
    
    <AccordionItem value="filter" title="Filter (12)">
      <NodeItem type="script_filter" label="Script Filter" />
      <NodeItem type="threshold_filter" label="Threshold" />
      <NodeItem type="message_type_switch" label="Switch" />
      <NodeItem type="check_relation" label="Check Relation" />
      <NodeItem type="geofencing" label="Geofencing" />
      {/* ... más nodos */}
    </AccordionItem>
    
    <AccordionItem value="enrichment" title="Enrichment (12)">
      <NodeItem type="fetch_asset_attributes" label="Asset Attributes" />
      <NodeItem type="fetch_asset_telemetry" label="Asset Telemetry" />
      <NodeItem type="tenant_attributes" label="Tenant Attributes" />
      <NodeItem type="device_attributes" label="Device Attributes" />
      {/* ... más nodos */}
    </AccordionItem>
    
    <AccordionItem value="transform" title="Transform (6)">
      <NodeItem type="script_transform" label="Script Transform" />
      <NodeItem type="math" label="Math" />
      <NodeItem type="formula" label="Formula" />
      {/* ... más nodos */}
    </AccordionItem>
    
    <AccordionItem value="action" title="Action (20)">
      <NodeItem type="log" label="Log" />
      <NodeItem type="create_alarm" label="Create Alarm" />
      <NodeItem type="send_email" label="Send Email" />
      <NodeItem type="save_timeseries" label="Save Timeseries" />
      <NodeItem type="assign_to_customer" label="Assign to Customer" />
      {/* ... más nodos */}
    </AccordionItem>
    
    <AccordionItem value="external" title="External (3)">
      <NodeItem type="mqtt_publish" label="MQTT Publish" />
      <NodeItem type="slack" label="Slack" />
      <NodeItem type="rest_api_call" label="REST API" />
    </AccordionItem>
    
    <AccordionItem value="flow" title="Flow (7)">
      <NodeItem type="rule_chain" label="Rule Chain" />
      <NodeItem type="merge" label="Merge" />
      <NodeItem type="split" label="Split" />
      {/* ... más nodos */}
    </AccordionItem>
  </Accordion>
</NodePalette>
```

#### 3.3 Canvas con React Flow (`RuleEditor.tsx`)
```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  onNodeClick={onNodeClick}
  onNodeDoubleClick={onNodeDoubleClick}
  nodeTypes={customNodeTypes}
  edgeTypes={customEdgeTypes}
  fitView
  snapToGrid
  snapGrid={[15, 15]}
>
  <Background variant="dots" gap={15} size={1} />
  <Controls />
  <MiniMap 
    nodeColor={getNodeColor}
    maskColor="rgba(0, 0, 0, 0.1)"
  />
</ReactFlow>
```

**Características del Canvas**:
- ✅ Drag & drop de nodos desde paleta
- ✅ Conexión visual entre nodos
- ✅ Validación de conexiones (tipos compatibles)
- ✅ Selección múltiple (Ctrl+Click)
- ✅ Copy/paste de nodos (Ctrl+C/V)
- ✅ Delete de nodos (Delete/Backspace)
- ✅ Undo/Redo (Ctrl+Z/Y)
- ✅ Zoom y pan
- ✅ Auto-layout (dagre)
- ✅ Mini mapa de navegación

#### 3.4 Panel de Configuración (`NodeConfigPanel.tsx`)
```tsx
<ConfigPanel>
  {selectedNode ? (
    <>
      <Header>
        <NodeIcon type={selectedNode.type} />
        <Title>{selectedNode.data.label}</Title>
        <Badge>{selectedNode.type}</Badge>
      </Header>
      
      <Form>
        <FormField label="Nombre del Nodo">
          <Input 
            value={nodeConfig.label}
            onChange={updateLabel}
          />
        </FormField>
        
        <FormField label="Descripción">
          <Textarea 
            value={nodeConfig.description}
            onChange={updateDescription}
          />
        </FormField>
        
        <Separator />
        
        {/* Configuración específica del tipo de nodo */}
        <DynamicNodeConfig 
          nodeType={selectedNode.type}
          config={nodeConfig}
          onChange={updateConfig}
        />
        
        <Separator />
        
        <FormActions>
          <Button onClick={validateConfig}>
            Validar
          </Button>
          <Button onClick={applyConfig} variant="primary">
            Aplicar
          </Button>
          <Button onClick={resetConfig} variant="outline">
            Resetear
          </Button>
        </FormActions>
      </Form>
      
      <Accordion>
        <AccordionItem title="Documentación">
          <NodeDocumentation type={selectedNode.type} />
        </AccordionItem>
        
        <AccordionItem title="Ejemplos">
          <NodeExamples type={selectedNode.type} />
        </AccordionItem>
      </Accordion>
    </>
  ) : (
    <EmptyState>
      <Text>Selecciona un nodo para configurarlo</Text>
    </EmptyState>
  )}
</ConfigPanel>
```

---

### 4. Panel de Testing (`RuleTestPanel.tsx`)

**Modal/Drawer para probar reglas**:

```tsx
<TestPanel>
  <Header>
    <Title>Probar Regla</Title>
    <CloseButton />
  </Header>
  
  <Tabs>
    <Tab label="Input">
      <JsonEditor
        value={testInput}
        onChange={setTestInput}
        schema={inputSchema}
      />
      
      <TemplateSelector>
        <Select placeholder="Usar plantilla">
          <Option value="telemetry">Telemetría de Pozo</Option>
          <Option value="alarm">Evento de Alarma</Option>
          <Option value="custom">Personalizado</Option>
        </Select>
      </TemplateSelector>
      
      <Button onClick={runTest} variant="primary">
        <PlayIcon /> Ejecutar Prueba
      </Button>
    </Tab>
    
    <Tab label="Output">
      {testResult ? (
        <>
          <StatusBadge status={testResult.status} />
          
          <Section title="Resultado">
            <JsonViewer data={testResult.output} />
          </Section>
          
          <Section title="Ejecución">
            <ExecutionFlow 
              nodes={testResult.executedNodes}
              duration={testResult.duration}
            />
          </Section>
          
          {testResult.errors && (
            <Section title="Errores">
              <ErrorList errors={testResult.errors} />
            </Section>
          )}
        </>
      ) : (
        <EmptyState>
          Ejecuta una prueba para ver resultados
        </EmptyState>
      )}
    </Tab>
    
    <Tab label="Logs">
      <LogViewer logs={testLogs} />
    </Tab>
  </Tabs>
</TestPanel>
```

---

## 🔌 Integración con Backend

### API Endpoints Necesarios

```typescript
// GET /api/v1/rule-engine/rules
interface ListRulesResponse {
  success: boolean;
  data: Rule[];
  meta: {
    total: number;
    page: number;
    perPage: number;
  };
}

// GET /api/v1/rule-engine/rules/:id
interface GetRuleResponse {
  success: boolean;
  data: Rule;
}

// POST /api/v1/rule-engine/rules
interface CreateRuleRequest {
  name: string;
  description?: string;
  category: string;
  nodes: Node[];
  edges: Edge[];
  config: RuleConfig;
}

// PUT /api/v1/rule-engine/rules/:id
interface UpdateRuleRequest {
  name?: string;
  description?: string;
  category?: string;
  nodes?: Node[];
  edges?: Edge[];
  config?: RuleConfig;
}

// DELETE /api/v1/rule-engine/rules/:id

// POST /api/v1/rule-engine/rules/:id/activate
// POST /api/v1/rule-engine/rules/:id/deactivate

// POST /api/v1/rule-engine/rules/:id/test
interface TestRuleRequest {
  input: Record<string, any>;
}

interface TestRuleResponse {
  success: boolean;
  data: {
    status: 'success' | 'error';
    output: Record<string, any>;
    executedNodes: string[];
    duration: number;
    errors?: Error[];
  };
}

// GET /api/v1/rule-engine/rules/:id/executions
interface ListExecutionsResponse {
  success: boolean;
  data: Execution[];
  meta: PaginationMeta;
}

// GET /api/v1/rule-engine/rules/:id/metrics
interface GetMetricsResponse {
  success: boolean;
  data: {
    executionsToday: number;
    successRate: number;
    avgDuration: number;
    errorCount: number;
    executionsByHour: TimeSeriesData[];
  };
}

// GET /api/v1/rule-engine/nodes
interface ListNodesResponse {
  success: boolean;
  data: NodeDefinition[];
}

// GET /api/v1/rule-engine/rules/:id/versions
interface ListVersionsResponse {
  success: boolean;
  data: RuleVersion[];
}
```

---

## 📦 Tipos TypeScript

### Tipos Principales

```typescript
// rule.types.ts

export interface Rule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  status: 'active' | 'inactive' | 'draft' | 'error';
  nodes: RuleNode[];
  edges: RuleEdge[];
  config: RuleConfig;
  metadata: RuleMetadata;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export interface RuleNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config: Record<string, any>;
  };
}

export interface RuleEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  label?: string;
}

export interface RuleConfig {
  trigger: {
    type: 'telemetry' | 'attribute' | 'schedule' | 'manual' | 'kafka';
    config: Record<string, any>;
  };
  timeout?: number;
  maxRetries?: number;
  dlqEnabled?: boolean;
  dlqTopic?: string;
}

export interface RuleMetadata {
  executionCount: number;
  lastExecutionAt?: string;
  successRate: number;
  avgDuration: number;
  errorCount: number;
}

export interface NodeDefinition {
  type: string;
  category: 'input' | 'filter' | 'enrichment' | 'transform' | 'action' | 'external' | 'flow';
  name: string;
  description: string;
  icon: string;
  configSchema: Record<string, any>; // JSON Schema
  inputs: number;
  outputs: number;
  documentation?: string;
  examples?: any[];
}

export interface Execution {
  id: string;
  ruleId: string;
  status: 'success' | 'error' | 'timeout';
  input: Record<string, any>;
  output?: Record<string, any>;
  executedNodes: string[];
  duration: number;
  errors?: ExecutionError[];
  timestamp: string;
}

export interface ExecutionError {
  nodeId: string;
  nodeType: string;
  message: string;
  stack?: string;
}
```

---

## 🎯 Fases de Implementación

### Fase 1: Fundamentos (1 semana)
- ✅ Estructura de archivos y carpetas
- ✅ Tipos TypeScript base
- ✅ API client con React Query
- ✅ Stores de Zustand
- ✅ Routing y navegación

### Fase 2: Lista y Detalle (1 semana)
- ✅ Página de lista con filtros
- ✅ Página de detalle con tabs
- ✅ KPIs y métricas
- ✅ Historial de ejecuciones

### Fase 3: Editor Visual (2 semanas)
- ✅ Integración de React Flow
- ✅ Paleta de nodos drag-and-drop
- ✅ Canvas interactivo
- ✅ Conexiones entre nodos
- ✅ Validación de flujos

### Fase 4: Configuración de Nodos (1.5 semanas)
- ✅ Panel de configuración lateral
- ✅ Formularios dinámicos por tipo de nodo
- ✅ Validación con Zod
- ✅ Documentación inline

### Fase 5: Testing y Debugging (1 semana)
- ✅ Panel de testing
- ✅ Ejecución de pruebas
- ✅ Visualización de resultados
- ✅ Logs de ejecución

### Fase 6: Funcionalidades Avanzadas (1 semana)
- ✅ Versionado de reglas
- ✅ Diff entre versiones
- ✅ Importar/Exportar reglas
- ✅ Duplicar reglas
- ✅ Auto-layout

### Fase 7: Optimización y Testing (1 semana)
- ✅ Performance optimization
- ✅ Tests unitarios
- ✅ Tests E2E
- ✅ Documentación

**Total estimado: 8.5 semanas**

---

## 🎨 Ejemplos de Configuración de Nodos

### Script Filter Node
```tsx
<ScriptFilterConfig>
  <FormField label="Script">
    <CodeEditor
      language="javascript"
      value={config.script}
      onChange={updateScript}
      height="200px"
    />
  </FormField>
  
  <FormField label="Timeout (ms)">
    <Input 
      type="number"
      value={config.timeout}
      onChange={updateTimeout}
    />
  </FormField>
  
  <HelpText>
    El script debe retornar true/false.
    Variables disponibles: msg, metadata, ctx
  </HelpText>
  
  <ExampleCode>
    {`return msg.data.temperature > 80;`}
  </ExampleCode>
</ScriptFilterConfig>
```

### Threshold Filter Node
```tsx
<ThresholdFilterConfig>
  <FormField label="Campo">
    <Input 
      value={config.field}
      placeholder="data.temperature"
    />
  </FormField>
  
  <FormField label="Operador">
    <Select value={config.operator}>
      <Option value=">">Mayor que (>)</Option>
      <Option value=">=">Mayor o igual (>=)</Option>
      <Option value="<">Menor que (<)</Option>
      <Option value="<=">Menor o igual (<=)</Option>
      <Option value="==">Igual (==)</Option>
      <Option value="!=">Diferente (!=)</Option>
    </Select>
  </FormField>
  
  <FormField label="Valor">
    <Input 
      type="number"
      value={config.value}
    />
  </FormField>
</ThresholdFilterConfig>
```

### Send Email Node
```tsx
<SendEmailConfig>
  <FormField label="Para (To)">
    <TagsInput 
      value={config.to}
      onChange={updateTo}
      placeholder="email@example.com"
    />
  </FormField>
  
  <FormField label="Asunto">
    <Input 
      value={config.subject}
      placeholder="Soporta templates: {{data.field}}"
    />
  </FormField>
  
  <FormField label="Cuerpo">
    <Textarea 
      value={config.body}
      rows={10}
      placeholder="Soporta templates y HTML"
    />
  </FormField>
  
  <FormField label="Plantilla">
    <Select value={config.template}>
      <Option value="">Sin plantilla</Option>
      <Option value="alarm">Alarma</Option>
      <Option value="report">Reporte</Option>
    </Select>
  </FormField>
</SendEmailConfig>
```

---

## 🔍 Validaciones

### Validación de Flujo
```typescript
export function validateFlow(nodes: RuleNode[], edges: RuleEdge[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  // 1. Debe tener al menos un nodo de entrada
  const inputNodes = nodes.filter(n => n.type === 'kafka_input' || n.type === 'input');
  if (inputNodes.length === 0) {
    errors.push({
      type: 'missing_input',
      message: 'La regla debe tener al menos un nodo de entrada'
    });
  }
  
  // 2. No debe haber nodos huérfanos (sin conexiones)
  const connectedNodes = new Set([
    ...edges.map(e => e.source),
    ...edges.map(e => e.target)
  ]);
  
  const orphanNodes = nodes.filter(n => !connectedNodes.has(n.id));
  if (orphanNodes.length > 0) {
    errors.push({
      type: 'orphan_nodes',
      message: `Nodos sin conexiones: ${orphanNodes.map(n => n.data.label).join(', ')}`,
      nodeIds: orphanNodes.map(n => n.id)
    });
  }
  
  // 3. No debe haber ciclos
  if (hasCycles(nodes, edges)) {
    errors.push({
      type: 'cycle_detected',
      message: 'El flujo contiene ciclos. Usa el nodo "checkpoint" para ciclos intencionales'
    });
  }
  
  // 4. Validar configuración de cada nodo
  for (const node of nodes) {
    const nodeErrors = validateNodeConfig(node);
    errors.push(...nodeErrors);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 📊 Métricas y Monitoreo

### Dashboard de Métricas
```tsx
<MetricsDashboard>
  <TimeRangeSelector />
  
  <Grid cols={4}>
    <MetricCard
      title="Ejecuciones"
      value={metrics.executionCount}
      change={metrics.executionChange}
      trend="up"
    />
    <MetricCard
      title="Tasa de Éxito"
      value={`${metrics.successRate}%`}
      change={metrics.successRateChange}
      trend="up"
    />
    <MetricCard
      title="Duración Promedio"
      value={`${metrics.avgDuration}ms`}
      change={metrics.durationChange}
      trend="down"
    />
    <MetricCard
      title="Errores"
      value={metrics.errorCount}
      change={metrics.errorChange}
      trend="down"
    />
  </Grid>
  
  <Grid cols={2}>
    <Chart
      title="Ejecuciones por Hora"
      type="line"
      data={metrics.executionsByHour}
    />
    <Chart
      title="Tasa de Éxito"
      type="area"
      data={metrics.successRateByHour}
    />
  </Grid>
  
  <Grid cols={2}>
    <Chart
      title="Duración por Nodo"
      type="bar"
      data={metrics.durationByNode}
    />
    <Chart
      title="Errores por Tipo"
      type="pie"
      data={metrics.errorsByType}
    />
  </Grid>
</MetricsDashboard>
```

---

## 🚀 Próximos Pasos

1. **Crear estructura de carpetas** en `/src/frontend/src/features/rule-engine/`
2. **Implementar tipos TypeScript** base
3. **Configurar React Query** para API calls
4. **Crear stores de Zustand** para estado del editor
5. **Implementar página de lista** con filtros y KPIs
6. **Implementar página de detalle** con tabs
7. **Integrar React Flow** en el editor
8. **Crear paleta de nodos** drag-and-drop
9. **Implementar panel de configuración** de nodos
10. **Agregar testing y debugging**

---

## 📚 Referencias

- **React Flow**: https://reactflow.dev/
- **shadcn/ui**: https://ui.shadcn.com/
- **Zustand**: https://zustand-demo.pmnd.rs/
- **React Query**: https://tanstack.com/query/latest
- **ThingsBoard UI**: https://demo.thingsboard.io/
- **Node-RED**: https://nodered.org/

---

**Última actualización**: 2026-01-10
