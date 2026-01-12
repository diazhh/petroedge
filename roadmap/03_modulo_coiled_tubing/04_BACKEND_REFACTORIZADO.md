# BLOQUE 4: BACKEND REFACTORIZADO

> **Módulo**: Coiled Tubing  
> **Fase**: APIs REST y Servicios de Negocio  
> **Duración estimada**: 2-3 semanas  
> **Prioridad**: 🔴 CRÍTICA (APIs para frontend)

---

## 📋 ÍNDICE

1. [Tablas a Mantener](#tablas-a-mantener)
2. [Tablas a Eliminar](#tablas-a-eliminar)
3. [Arquitectura de Servicios](#arquitectura-de-servicios)
4. [APIs REST](#apis-rest)
5. [Servicios de Cálculo](#servicios-de-cálculo)
6. [WebSocket Gateway](#websocket-gateway)
7. [Implementación](#implementación)

---

## 1. TABLAS A MANTENER

Las siguientes tablas **NO son Digital Twins** y se mantienen porque representan **transacciones operacionales**:

### 1.1 ct_jobs (Trabajos)

```sql
CREATE TABLE ct_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Identificación
  job_number VARCHAR(50) NOT NULL,
  job_type VARCHAR(50) NOT NULL, -- CLN, N2L, ACT, MIL, etc.
  
  -- Relaciones
  well_id VARCHAR(200),  -- Ditto Thing ID: "acme:well-pdc-15"
  field_name VARCHAR(100),
  ct_unit_id UUID REFERENCES assets(id), -- Asset ID del CT Unit
  ct_reel_id UUID REFERENCES assets(id), -- Asset ID del Reel
  
  -- Fechas
  planned_start_date TIMESTAMP,
  actual_start_date TIMESTAMP,
  planned_end_date TIMESTAMP,
  actual_end_date TIMESTAMP,
  
  -- Personal
  supervisor VARCHAR(100),
  operator VARCHAR(100),
  client VARCHAR(100),
  client_representative VARCHAR(100),
  
  -- Objetivos
  objective TEXT,
  well_depth_ft INTEGER,
  target_depth_ft INTEGER,
  estimated_duration_hours NUMERIC,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PLANNED, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED
  
  -- Observaciones
  description TEXT,
  notes TEXT,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  UNIQUE(tenant_id, job_number)
);

CREATE INDEX idx_ct_jobs_status ON ct_jobs(status);
CREATE INDEX idx_ct_jobs_unit ON ct_jobs(ct_unit_id);
CREATE INDEX idx_ct_jobs_dates ON ct_jobs(actual_start_date, actual_end_date);
```

### 1.2 ct_job_operations (Operaciones del Job)

```sql
CREATE TABLE ct_job_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
  
  -- Secuencia
  sequence_number INTEGER NOT NULL,
  operation_type VARCHAR(50) NOT NULL, -- RIH, POOH, CIRCULATE, TAG, MILL, etc.
  
  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  
  -- Parámetros
  start_depth_ft INTEGER,
  end_depth_ft INTEGER,
  max_weight_lbs INTEGER,
  max_pressure_psi INTEGER,
  pump_rate_bpm NUMERIC(6, 2),
  
  -- Descripción
  description TEXT,
  observations TEXT,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, ABORTED
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ct_job_operations_job ON ct_job_operations(job_id);
```

### 1.3 ct_job_fluids (Fluidos Bombeados)

```sql
CREATE TABLE ct_job_fluids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
  
  sequence_number INTEGER NOT NULL,
  
  -- Tipo de fluido
  fluid_type VARCHAR(50) NOT NULL, -- WATER, N2, ACID, DIESEL, etc.
  fluid_name VARCHAR(100),
  density_ppg NUMERIC(5, 2),
  viscosity_cp NUMERIC(6, 2),
  
  -- Volúmenes
  planned_volume_bbl NUMERIC(10, 2),
  actual_volume_bbl NUMERIC(10, 2),
  
  -- Parámetros de bombeo
  pump_rate_bpm NUMERIC(6, 2),
  pump_pressure_psi INTEGER,
  
  -- Timing
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  
  observations TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ct_job_fluids_job ON ct_job_fluids(job_id);
```

### 1.4 ct_job_bha (Configuración BHA del Job)

```sql
CREATE TABLE ct_job_bha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
  
  bha_config_name VARCHAR(100),
  total_length_ft NUMERIC(8, 2),
  total_weight_lbs NUMERIC(10, 2),
  
  description TEXT,
  schematic_url VARCHAR(500), -- URL a diagrama
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.5 ct_bha_components (Componentes del BHA)

```sql
CREATE TABLE ct_bha_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bha_id UUID NOT NULL REFERENCES ct_job_bha(id) ON DELETE CASCADE,
  
  sequence_number INTEGER NOT NULL, -- 1, 2, 3... (desde abajo)
  
  -- Componente (referencia a asset si es herramienta registrada)
  component_asset_id UUID REFERENCES assets(id), -- Opcional: si es herramienta del inventario
  component_type VARCHAR(50) NOT NULL, -- JAR, MOTOR, NOZZLE, CHECK_VALVE
  component_name VARCHAR(100),
  
  -- Especificaciones
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  
  length_ft NUMERIC(6, 2),
  outer_diameter_in NUMERIC(5, 3),
  inner_diameter_in NUMERIC(5, 3),
  weight_lbs NUMERIC(8, 2),
  
  specifications JSONB -- Specs técnicas adicionales
);

CREATE INDEX idx_ct_bha_components_bha ON ct_bha_components(bha_id);
```

### 1.6 ct_job_tickets (Job Tickets)

```sql
CREATE TABLE ct_job_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
  
  ticket_number VARCHAR(50) NOT NULL,
  
  -- Contenido
  summary TEXT,
  operations_summary TEXT,
  fluids_summary TEXT,
  results_summary TEXT,
  
  -- Firmas digitales
  operator_signature VARCHAR(200),
  operator_signed_at TIMESTAMP,
  supervisor_signature VARCHAR(200),
  supervisor_signed_at TIMESTAMP,
  client_signature VARCHAR(200),
  client_signed_at TIMESTAMP,
  
  -- PDF generado
  pdf_url VARCHAR(500),
  pdf_generated_at TIMESTAMP,
  
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PENDING_SIGNATURES, COMPLETED
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.7 ct_fatigue_cycles (Log Histórico de Fatiga)

**NOTA**: Esta tabla es de **auditoría/histórico**. La fatiga actual se guarda en `assets.attributes.fatiguePercentage`.

```sql
CREATE TABLE ct_fatigue_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES assets(id), -- Asset ID del reel
  section_id UUID REFERENCES assets(id), -- Asset ID de la sección (si aplica)
  job_id UUID REFERENCES ct_jobs(id) ON DELETE SET NULL,
  
  cycle_type VARCHAR(20) NOT NULL, -- BENDING, PRESSURE, COMBINED
  
  -- Parámetros del ciclo
  max_strain NUMERIC(8, 6),
  max_pressure_psi INTEGER,
  guide_radius_in NUMERIC(6, 2),
  
  -- Daño calculado
  cycles_applied INTEGER DEFAULT 1,
  cycles_to_failure INTEGER,
  damage_ratio NUMERIC(10, 8), -- nᵢ / Nᵢ
  
  occurred_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ct_fatigue_cycles_reel ON ct_fatigue_cycles(reel_id);
CREATE INDEX idx_ct_fatigue_cycles_job ON ct_fatigue_cycles(job_id);
```

---

## 2. TABLAS A ELIMINAR

Las siguientes tablas **SE ELIMINAN** porque ahora se manejan como Assets:

❌ **ct_units** → Usar `assets` con type `CT_UNIT`  
❌ **ct_reels** → Usar `assets` con type `CT_REEL`  
❌ **ct_reel_sections** → Usar `assets` con type `CT_REEL_SECTION`  
❌ **ct_realtime_data** → Usar `asset_telemetry`  
❌ **ct_alarms** → Usar `alarms` (tabla core)

**Migration script**: Ver Bloque 7

---

## 3. ARQUITECTURA DE SERVICIOS

### 3.1 Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ARQUITECTURA BACKEND CT                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              CT Jobs Module                          │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  ct-jobs.routes.ts        (Fastify routes)          │           │
│  │  ct-jobs.controller.ts    (HTTP handlers)           │           │
│  │  ct-jobs.service.ts       (Business logic)          │           │
│  │  ct-jobs.repository.ts    (DB access)               │           │
│  │  ct-jobs.schema.ts        (Zod validation)          │           │
│  └────────────────────┬─────────────────────────────────┘           │
│                       │                                              │
│                       ↓ usa                                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │          Assets Service (core)                       │           │
│  │  - Gestión de CT Units, Reels, Components           │           │
│  │  - CRUD de Assets vía /digital-twins                │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐           │
│  │       CT Calculations Service                        │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  ct-calculations.service.ts                          │           │
│  │  - Fatiga (simple, Node.js)                          │           │
│  │  - Strain (Node.js)                                  │           │
│  │  - Buckling (Node.js)                                │           │
│  │  - Lockup (delega a Python)                          │           │
│  │  - Hidráulica completa (delega a Python)            │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐           │
│  │       CT Realtime Service                            │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  ct-realtime.service.ts                              │           │
│  │  - WebSocket rooms por job                           │           │
│  │  - Broadcasting de telemetría                        │           │
│  │  - Suscripción a asset_telemetry changes            │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐           │
│  │       CT Job Ticket Generator                        │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │  ct-job-ticket.service.ts                            │           │
│  │  - Generación PDF con PDFKit o Puppeteer            │           │
│  │  - Templates con branding                            │           │
│  │  - Firmas digitales                                  │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Módulos y Servicios

| Módulo | Responsabilidad | Archivos |
|--------|-----------------|----------|
| **ct-jobs** | CRUD de jobs, workflow, operaciones | 6 archivos |
| **ct-calculations** | Cálculos de ingeniería | 1 servicio |
| **ct-realtime** | WebSocket, broadcasting | 1 servicio |
| **ct-tickets** | Generación de PDFs | 1 servicio |

---

## 4. APIS REST

### 4.1 Jobs API

**Base**: `/api/v1/coiled-tubing/jobs`

#### 4.1.1 GET /jobs

Lista de jobs con filtros avanzados

```typescript
// Query params
interface CtJobsQuery {
  status?: 'DRAFT' | 'PLANNED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  ctUnitId?: string; // Asset ID
  wellId?: string; // Ditto Thing ID
  dateFrom?: string; // ISO date
  dateTo?: string;
  page?: number;
  perPage?: number;
}

// Response
interface CtJobsListResponse {
  success: true;
  data: CtJob[];
  meta: {
    total: number;
    page: number;
    perPage: number;
  };
}
```

#### 4.1.2 POST /jobs

Crear nuevo job

```typescript
interface CreateCtJobInput {
  jobNumber: string;
  jobType: 'CLN' | 'N2L' | 'ACT' | 'MIL' | 'FSH' | 'LOG' | 'PER' | 'CTD';
  
  // Relaciones
  wellId: string; // Ditto Thing ID
  fieldName?: string;
  ctUnitId: string; // Asset UUID
  ctReelId: string; // Asset UUID
  
  // Fechas
  plannedStartDate: Date;
  plannedEndDate?: Date;
  
  // Personal
  supervisor?: string;
  operator?: string;
  client?: string;
  clientRepresentative?: string;
  
  // Objetivo
  objective?: string;
  wellDepthFt?: number;
  targetDepthFt?: number;
  estimatedDurationHours?: number;
}
```

#### 4.1.3 GET /jobs/:id

Detalle completo del job

```typescript
interface CtJobDetail {
  id: string;
  jobNumber: string;
  jobType: string;
  status: string;
  
  // Relaciones expandidas
  well?: WellDigitalTwin; // Fetch de Ditto
  field?: FieldDigitalTwin;
  ctUnit: Asset;
  ctReel: Asset;
  
  // Timing
  plannedStartDate: Date;
  actualStartDate?: Date;
  plannedEndDate?: Date;
  actualEndDate?: Date;
  durationHours?: number;
  
  // Operaciones relacionadas
  operations: CtJobOperation[];
  fluids: CtJobFluid[];
  bha?: CtJobBha;
  ticket?: CtJobTicket;
  
  // Stats
  stats: {
    totalDepthFt: number;
    maxDepthReached: number;
    totalVolumePumped: number;
    nptHours: number;
    efficiency: number;
  };
}
```

#### 4.1.4 PUT /jobs/:id

Actualizar job

#### 4.1.5 DELETE /jobs/:id

Eliminar job (solo si status = DRAFT)

#### 4.1.6 POST /jobs/:id/start

Iniciar job (cambiar status a IN_PROGRESS)

```typescript
interface StartJobInput {
  actualStartDate?: Date; // Default: now
  notes?: string;
}
```

**Acciones**:
1. Validar que CT Unit y Reel están disponibles
2. Actualizar `status` → `IN_PROGRESS`
3. Actualizar `assets.attributes.status` del unit → `IN_SERVICE`
4. Actualizar `assets.attributes.currentJobId` del unit
5. Crear room WebSocket: `ct:job:{jobId}`

#### 4.1.7 POST /jobs/:id/complete

Completar job

```typescript
interface CompleteJobInput {
  actualEndDate?: Date; // Default: now
  summary: string;
  resultsSummary?: string;
  nptHours?: number;
}
```

**Acciones**:
1. Actualizar `status` → `COMPLETED`
2. Actualizar `assets.attributes.status` del unit → `AVAILABLE`
3. Limpiar `assets.attributes.currentJobId`
4. Calcular stats finales
5. Cerrar room WebSocket

#### 4.1.8 GET /jobs/:id/realtime

Stream de telemetría en tiempo real (vía WebSocket)

```typescript
// WebSocket connection
socket.on('subscribe', { jobId: 'xxx' });

// Broadcasts
socket.on('ct:telemetry', (data) => {
  // { depth, weight, speed, pressure, ... }
});

socket.on('ct:alarm', (alarm) => {
  // Alarma detectada
});

socket.on('ct:fatigue-updated', (data) => {
  // Fatiga actualizada
});
```

---

### 4.2 Operations API

**Base**: `/api/v1/coiled-tubing/jobs/:jobId/operations`

#### 4.2.1 POST /operations

Registrar nueva operación

```typescript
interface CreateOperationInput {
  sequenceNumber: number;
  operationType: 'RIH' | 'POOH' | 'CIRCULATE' | 'TAG' | 'MILL' | 'WASH';
  startTime: Date;
  startDepthFt?: number;
  endDepthFt?: number;
  description?: string;
}
```

#### 4.2.2 PUT /operations/:id

Actualizar operación (finalizar)

```typescript
interface UpdateOperationInput {
  endTime: Date;
  endDepthFt?: number;
  maxWeightLbs?: number;
  maxPressurePsi?: number;
  observations?: string;
  status: 'COMPLETED' | 'ABORTED';
}
```

#### 4.2.3 GET /operations

Listar operaciones del job

---

### 4.3 Fluids API

**Base**: `/api/v1/coiled-tubing/jobs/:jobId/fluids`

#### 4.3.1 POST /fluids

Registrar fluido bombeado

#### 4.3.2 GET /fluids

Lista de fluidos del job

---

### 4.4 BHA API

**Base**: `/api/v1/coiled-tubing/jobs/:jobId/bha`

#### 4.4.1 POST /bha

Crear configuración BHA para el job

```typescript
interface CreateBhaInput {
  bhaConfigName: string;
  components: {
    sequenceNumber: number;
    componentAssetId?: string; // Si es del inventario
    componentType: string;
    componentName: string;
    lengthFt: number;
    outerDiameterIn: number;
    weightLbs: number;
    specifications?: any;
  }[];
}
```

#### 4.4.2 GET /bha

Obtener BHA del job

---

### 4.5 Tickets API

**Base**: `/api/v1/coiled-tubing/jobs/:jobId/ticket`

#### 4.5.1 POST /ticket/generate

Generar job ticket

```typescript
interface GenerateTicketInput {
  summary: string;
  operationsSummary?: string; // Auto-generado si no se provee
  fluidsSummary?: string;
  resultsSummary: string;
}

// Response
interface GenerateTicketResponse {
  success: true;
  data: {
    ticketId: string;
    pdfUrl: string; // URL al PDF generado
    ticketNumber: string;
  };
}
```

#### 4.5.2 POST /ticket/sign

Firmar ticket

```typescript
interface SignTicketInput {
  signatureType: 'OPERATOR' | 'SUPERVISOR' | 'CLIENT';
  signature: string; // Base64 de la firma
}
```

#### 4.5.3 GET /ticket

Obtener ticket del job

---

### 4.6 Calculations API

**Base**: `/api/v1/coiled-tubing/calculations`

#### 4.6.1 POST /calculations/fatigue

Calcular fatiga para un reel

```typescript
interface FatigueCalculationInput {
  reelId: string; // Asset UUID
  jobScenario: {
    depthFt: number;
    tripsCount: number; // Número de viajes RIH/POOH
    maxPressurePsi: number;
  };
}

interface FatigueCalculationResult {
  currentFatigue: number; // %
  incrementalFatigue: number; // % que se agregará
  projectedFatigue: number; // % después del job
  estimatedLifeCycles: number;
  recommendation: string; // "OK", "WARNING", "CRITICAL"
}
```

#### 4.6.2 POST /calculations/lockup

Predicción de lockup

```typescript
interface LockupPredictionInput {
  wellId: string; // Para obtener trayectoria
  tubingSpecs: {
    outerDiameterIn: number;
    wallThicknessIn: number;
    steelGrade: string;
  };
  fluidDensityPpg: number;
  frictionCoefficient?: number;
}

interface LockupPredictionResult {
  lockupDepthFt: number;
  maxDepthReachable: number;
  broomstickCurve: Array<{
    depthFt: number;
    pickupLbs: number;
    slackoffLbs: number;
  }>;
}
```

#### 4.6.3 POST /calculations/hydraulics

Cálculos hidráulicos completos

```typescript
interface HydraulicsInput {
  tubingSpecs: {...};
  fluidProperties: {
    densityPpg: number;
    viscosityPlasticCp: number;
    yieldPointLbf100sqft: number;
  };
  pumpRateBpm: number;
  depthFt: number;
}

interface HydraulicsResult {
  frictionPressureLossPsi: number;
  ecd: number; // Densidad equivalente de circulación
  reynoldsNumber: number;
  flowRegime: 'LAMINAR' | 'TURBULENT';
  annularVelocityFtMin: number;
}
```

---

## 5. SERVICIOS DE CÁLCULO

### 5.1 CT Calculations Service

**Ubicación**: `/src/backend/src/modules/coiled-tubing/ct-calculations.service.ts`

```typescript
export class CtCalculationsService {
  /**
   * Calcular fatiga incremental (Node.js - rápido)
   */
  async calculateFatigueIncrement(input: FatigueCalculationInput): Promise<FatigueCalculationResult> {
    const reel = await assetsRepository.findById(input.reelId);
    const { outerDiameterIn, steelGrade } = reel.properties;
    
    // Implementación del cálculo (ver Bloque 3)
    // ...
    
    return {
      currentFatigue: reel.attributes.fatiguePercentage,
      incrementalFatigue: calculatedIncrement,
      projectedFatigue: currentFatigue + calculatedIncrement,
      estimatedLifeCycles: Nf,
      recommendation: projectedFatigue > 85 ? 'CRITICAL' : projectedFatigue > 75 ? 'WARNING' : 'OK'
    };
  }
  
  /**
   * Predicción de lockup (delega a Python)
   */
  async predictLockup(input: LockupPredictionInput): Promise<LockupPredictionResult> {
    // 1. Obtener trayectoria del well desde Ditto
    const well = await dittoService.getThing(input.wellId);
    const trajectory = well.features.trajectory.properties.value;
    
    // 2. Preparar request para Python
    const calcRequest = {
      id: uuid(),
      calculationType: 'CT_LOCKUP_PREDICTION',
      inputs: {
        wellTrajectory: trajectory,
        tubingSpecs: input.tubingSpecs,
        fluidDensityPpg: input.fluidDensityPpg,
        frictionCoefficient: input.frictionCoefficient || 0.25
      },
      tenantId: input.tenantId
    };
    
    // 3. Publicar a Kafka
    await kafkaService.publish('calculation.request', calcRequest);
    
    // 4. Esperar respuesta (con timeout)
    const result = await this.waitForCalculationResult(calcRequest.id, { timeout: 10000 });
    
    return result;
  }
  
  /**
   * Cálculos hidráulicos (delega a Python)
   */
  async calculateHydraulics(input: HydraulicsInput): Promise<HydraulicsResult> {
    // Similar a lockup, delega a Python
    // ...
  }
}
```

---

## 6. WEBSOCKET GATEWAY

### 6.1 CT Realtime Service

**Ubicación**: `/src/backend/src/modules/coiled-tubing/ct-realtime.service.ts`

```typescript
import { Server as SocketIOServer } from 'socket.io';

export class CtRealtimeService {
  private io: SocketIOServer;
  
  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventListeners();
  }
  
  /**
   * Cliente se suscribe a un job
   */
  setupEventListeners() {
    this.io.on('connection', (socket) => {
      socket.on('subscribe:ct-job', async ({ jobId, tenantId }) => {
        // Validar permisos
        const hasPermission = await this.validatePermissions(socket, tenantId, jobId);
        if (!hasPermission) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }
        
        // Unirse a room
        socket.join(`ct:job:${jobId}`);
        
        // Enviar estado inicial
        const currentState = await this.getJobCurrentState(jobId);
        socket.emit('ct:initial-state', currentState);
      });
      
      socket.on('unsubscribe:ct-job', ({ jobId }) => {
        socket.leave(`ct:job:${jobId}`);
      });
    });
  }
  
  /**
   * Broadcast telemetría a todos los suscritos al job
   */
  async broadcastTelemetry(jobId: string, telemetry: any) {
    this.io.to(`ct:job:${jobId}`).emit('ct:telemetry', telemetry);
  }
  
  /**
   * Broadcast alarma
   */
  async broadcastAlarm(jobId: string, alarm: any) {
    this.io.to(`ct:job:${jobId}`).emit('ct:alarm', alarm);
  }
  
  /**
   * Broadcast actualización de fatiga
   */
  async broadcastFatigueUpdate(jobId: string, fatigueData: any) {
    this.io.to(`ct:job:${jobId}`).emit('ct:fatigue-updated', fatigueData);
  }
}
```

### 6.2 Integración con Asset Telemetry

```typescript
// En TelemetryConsumerService (core)
// Después de guardar en asset_telemetry

if (asset.assetType === 'CT_UNIT' && asset.attributes.currentJobId) {
  const jobId = asset.attributes.currentJobId;
  
  // Broadcast a WebSocket
  await ctRealtimeService.broadcastTelemetry(jobId, {
    depth: telemetry.currentDepth,
    weight: telemetry.surfaceWeight,
    speed: telemetry.speed,
    pumpPressure: telemetry.pumpPressure,
    timestamp: new Date()
  });
}
```

---

## 7. IMPLEMENTACIÓN

### 7.1 Estructura de Archivos

```
/src/backend/src/modules/coiled-tubing/
├── jobs/
│   ├── ct-jobs.routes.ts
│   ├── ct-jobs.controller.ts
│   ├── ct-jobs.service.ts
│   ├── ct-jobs.repository.ts
│   └── ct-jobs.schema.ts
├── operations/
│   ├── ct-operations.controller.ts
│   ├── ct-operations.service.ts
│   └── ct-operations.repository.ts
├── fluids/
│   ├── ct-fluids.controller.ts
│   └── ct-fluids.repository.ts
├── bha/
│   ├── ct-bha.controller.ts
│   └── ct-bha.repository.ts
├── tickets/
│   ├── ct-tickets.controller.ts
│   ├── ct-tickets.service.ts
│   └── templates/
│       └── job-ticket.ejs
├── calculations/
│   ├── ct-calculations.service.ts
│   └── ct-calculations.controller.ts
├── realtime/
│   ├── ct-realtime.service.ts
│   └── ct-realtime.gateway.ts
└── index.ts
```

### 7.2 Checklist de Implementación

**Jobs Module** (6 archivos):
- [ ] ct-jobs.routes.ts
- [ ] ct-jobs.controller.ts (11 endpoints)
- [ ] ct-jobs.service.ts (lógica de negocio)
- [ ] ct-jobs.repository.ts (queries)
- [ ] ct-jobs.schema.ts (Zod schemas)
- [ ] ct-jobs.types.ts

**Operations, Fluids, BHA, Tickets**:
- [ ] 4 controllers
- [ ] 4 repositories
- [ ] Schemas Zod

**Calculations Service**:
- [ ] ct-calculations.service.ts (fatiga, buckling)
- [ ] Integración con Python (lockup, hidráulica)

**Realtime Service**:
- [ ] ct-realtime.service.ts (WebSocket)
- [ ] Event listeners
- [ ] Broadcasting

**Job Ticket Generator**:
- [ ] ct-tickets.service.ts
- [ ] Template EJS o Handlebars
- [ ] Generación PDF (PDFKit)

### 7.3 Testing

```typescript
// Test: Crear job
describe('CT Jobs Service', () => {
  it('should create a job successfully', async () => {
    const job = await ctJobsService.create(tenantId, userId, {
      jobNumber: 'CT-2026-050',
      jobType: 'CLN',
      wellId: 'acme:well-pdc-15',
      ctUnitId: 'asset-ct-unit-05',
      ctReelId: 'asset-reel-2024-012',
      plannedStartDate: new Date()
    });
    
    expect(job).toBeDefined();
    expect(job.status).toBe('DRAFT');
  });
  
  it('should validate CT unit is available', async () => {
    // Unit ya tiene un job activo
    await expect(
      ctJobsService.create(tenantId, userId, {
        ctUnitId: 'asset-ct-unit-05-busy',
        // ...
      })
    ).rejects.toThrow('CT Unit is not available');
  });
});
```

---

## 📊 CRITERIOS DE ÉXITO

- ✅ 11 endpoints de Jobs API funcionando
- ✅ CRUD completo de Operations, Fluids, BHA, Tickets
- ✅ Cálculos de fatiga en <10ms
- ✅ Integración Python para lockup funcional
- ✅ WebSocket broadcasting telemetría en RT
- ✅ Generación de PDF de job ticket
- ✅ Tests unitarios >80% coverage
- ✅ Documentación Swagger/OpenAPI

---

**Siguiente bloque**: [05_FRONTEND_PROFESIONAL.md](./05_FRONTEND_PROFESIONAL.md) →
