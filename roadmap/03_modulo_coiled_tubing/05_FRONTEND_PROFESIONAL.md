# BLOQUE 5: FRONTEND PROFESIONAL

> **Módulo**: Coiled Tubing  
> **Fase**: Interfaces de Usuario e Dashboards  
> **Duración estimada**: 3-4 semanas  
> **Prioridad**: 🟡 ALTA (UX y valor visual)

---

## 📋 ÍNDICE

1. [Arquitectura Frontend](#arquitectura-frontend)
2. [Dashboard Principal](#dashboard-principal)
3. [Wizard de Jobs](#wizard-de-jobs)
4. [Monitor en Tiempo Real](#monitor-en-tiempo-real)
5. [Gestión de Assets CT](#gestión-de-assets-ct)
6. [Componentes Reutilizables](#componentes-reutilizables)
7. [Implementación](#implementación)

---

## 1. ARQUITECTURA FRONTEND

### 1.1 Estructura de Carpetas

```
/src/frontend/src/features/coiled-tubing/
├── api/
│   ├── ct-jobs.api.ts           # React Query hooks para Jobs
│   ├── ct-calculations.api.ts   # Hooks para cálculos
│   └── ct-realtime.api.ts       # WebSocket hooks
├── components/
│   ├── CtJobsTable.tsx
│   ├── CtFatigueChart.tsx
│   ├── CtBroomstickChart.tsx
│   ├── CtAlarmsPanel.tsx
│   ├── CtOperationsTimeline.tsx
│   ├── CtBhaDesigner.tsx
│   └── ... (11 componentes total)
├── hooks/
│   ├── useCtJob.ts
│   ├── useCtRealtime.ts
│   └── useCtCalculations.ts
├── pages/
│   ├── CtDashboard.tsx          # Dashboard principal
│   ├── CtJobsList.tsx           # Lista de jobs
│   ├── CtJobDetail.tsx          # Detalle con tabs
│   ├── CtJobWizard.tsx          # Wizard 6 pasos
│   └── CtJobMonitor.tsx         # Monitor RT
├── stores/
│   └── ct-job-store.ts          # Zustand store
├── types/
│   └── ct.types.ts
├── schemas/
│   └── ct.schemas.ts            # Zod validation
└── i18n/
    ├── es.json
    └── en.json
```

### 1.2 Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **React 18** | Framework UI |
| **TypeScript** | Type safety |
| **TailwindCSS** | Styling |
| **shadcn/ui** | Component library |
| **Recharts** | Gráficos (broomstick, fatiga) |
| **React Query** | Data fetching, caching |
| **Zustand** | State management (RT data) |
| **React Hook Form** | Form handling |
| **Zod** | Validation |
| **Socket.io Client** | WebSocket |
| **React Flow** | BHA designer (drag & drop) |

---

## 2. DASHBOARD PRINCIPAL

### 2.1 Diseño Visual

```
┌─────────────────────────────────────────────────────────────────────┐
│  COILED TUBING - DASHBOARD                   🔔 Notif    👤 User   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─ KPI Cards ──────────────────────────────────────────────────┐  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │  │
│  │  │ 🚚 Units   │ │ 🎞️ Reels   │ │ 📋 Jobs    │ │ ⚠️ Critical│ │  │
│  │  │            │ │            │ │            │ │            │ │  │
│  │  │   5 Total  │ │   12 Total │ │   3 Active │ │  2 Fatigue │ │  │
│  │  │ 3 Active   │ │ 2 Critical │ │ 2 Planned  │ │  1 Alarm   │ │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Jobs Activos ────────────────────┐  ┌─ Fatiga de Flota ─────┐  │
│  │                                    │  │                        │  │
│  │  🟢 CT-2026-042                   │  │  R-2024-008  87% 🔴   │  │
│  │     PDC-15 | Cleanout | 8,542 ft  │  │  ████████████████░░   │  │
│  │     [Ver Monitor RT]               │  │                        │  │
│  │                                    │  │  R-2024-012  78% 🟠   │  │
│  │  🟢 CT-2026-043                   │  │  ███████████████░░░   │  │
│  │     VEN-08 | N2 Lift | 6,200 ft   │  │                        │  │
│  │     [Ver Monitor RT]               │  │  R-2024-003  42% 🟢   │  │
│  │                                    │  │  ████████░░░░░░░░░   │  │
│  │  🟡 CT-2026-044                   │  │                        │  │
│  │     PET-23 | Milling | Rig Up     │  │     [Ver Detalles]    │  │
│  │                                    │  │                        │  │
│  │        [Ver Todos los Jobs]        │  └────────────────────────┘  │
│  └────────────────────────────────────┘                              │
│                                                                      │
│  ┌─ KPIs del Mes ────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Jobs Completados    Éxito Rate      NPT Rate    Utilización  │  │
│  │       28            96.4%            2.3%         78%          │  │
│  │  ████████████████    ████████████    ██░░░░░░    ████████░░   │  │
│  │                                                                │  │
│  │  ┌─ Gráfico Tendencia (últimos 30 días) ───────────────────┐ │  │
│  │  │   Jobs/día                                               │ │  │
│  │  │   5 │                  ●                                 │ │  │
│  │  │   4 │        ●    ●        ●   ●                         │ │  │
│  │  │   3 │    ●       ●    ●        ●   ●                     │ │  │
│  │  │   2 │  ●   ●  ●                    ●  ●                  │ │  │
│  │  │   1 │                                     ●   ●          │ │  │
│  │  │   0 └─────────────────────────────────────────────────▶ │ │  │
│  │  │     1   5   10  15  20  25  30                          │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Próximas Inspecciones ────────┐  ┌─ Alarmas Recientes ──────┐  │
│  │                                 │  │                           │  │
│  │  📅 En 3 días                  │  │  🔴 HIGH_PRESSURE         │  │
│  │     Unit-03 | BOP Test         │  │     CT-2026-042 | 10:45   │  │
│  │                                 │  │                           │  │
│  │  📅 En 7 días                  │  │  🟠 FATIGUE_WARNING       │  │
│  │     R-2024-015 | Inspección    │  │     R-2024-012 | 09:30    │  │
│  │                                 │  │                           │  │
│  │     [Ver Calendario]            │  │     [Ver Todas]           │  │
│  └─────────────────────────────────┘  └───────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Componentes del Dashboard

#### CtDashboard.tsx

```typescript
export function CtDashboard() {
  const { data: stats } = useCtDashboardStats();
  const { data: activeJobs } = useCtActiveJobs();
  const { data: fatigueAlerts } = useCtFatigueAlerts();
  const { data: monthlyKpis } = useCtMonthlyKpis();
  
  return (
    <div className="space-y-6 p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="CT Units"
          value={stats.totalUnits}
          subtitle={`${stats.activeUnits} active`}
          icon={<Truck />}
          trend={stats.unitsTrend}
        />
        <KpiCard
          title="Reels"
          value={stats.totalReels}
          subtitle={`${stats.criticalReels} critical`}
          icon={<Disc />}
          trend={stats.reelsTrend}
          alert={stats.criticalReels > 0}
        />
        <KpiCard
          title="Jobs"
          value={stats.activeJobs}
          subtitle={`${stats.plannedJobs} planned`}
          icon={<Clipboard />}
        />
        <KpiCard
          title="Alerts"
          value={stats.criticalAlerts}
          subtitle="Critical fatigue"
          icon={<AlertTriangle />}
          variant="danger"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Jobs Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <CtActiveJobsList jobs={activeJobs} />
          </CardContent>
        </Card>
        
        {/* Fatigue Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Fatiga de Flota</CardTitle>
          </CardHeader>
          <CardContent>
            <CtFatigueAlertsList alerts={fatigueAlerts} />
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>KPIs del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <CtMonthlyKpisChart data={monthlyKpis} />
        </CardContent>
      </Card>
      
      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Inspecciones</CardTitle>
          </CardHeader>
          <CardContent>
            <CtUpcomingInspections />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Alarmas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <CtRecentAlarms />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 3. WIZARD DE JOBS

### 3.1 Flujo del Wizard (6 Pasos)

```
Paso 1: Información General
  └─▶ Paso 2: Selección de Recursos (Unit, Reel, Personal)
       └─▶ Paso 3: Planificación Operacional
            └─▶ Paso 4: Diseño de BHA
                 └─▶ Paso 5: Programa de Fluidos
                      └─▶ Paso 6: Revisión y Simulación
                           └─▶ [Crear Job]
```

### 3.2 CtJobWizard.tsx

```typescript
export function CtJobWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [jobData, setJobData] = useState<Partial<CreateCtJobInput>>({});
  
  const steps = [
    { number: 1, title: 'Información General', component: StepGeneral },
    { number: 2, title: 'Recursos', component: StepResources },
    { number: 3, title: 'Planificación', component: StepPlanning },
    { number: 4, title: 'BHA', component: StepBHA },
    { number: 5, title: 'Fluidos', component: StepFluids },
    { number: 6, title: 'Revisión', component: StepReview },
  ];
  
  const CurrentStepComponent = steps[currentStep - 1].component;
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Progress Stepper */}
      <WizardStepper steps={steps} currentStep={currentStep} />
      
      {/* Step Content */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            data={jobData}
            onChange={(data) => setJobData({ ...jobData, ...data })}
            onNext={() => setCurrentStep(currentStep + 1)}
            onBack={() => setCurrentStep(currentStep - 1)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.3 Paso 2: Selección de Recursos

**IMPORTANTE**: Este paso valida disponibilidad en tiempo real

```typescript
function StepResources({ data, onChange, onNext, onBack }: StepProps) {
  const { data: units } = useCtUnits({ status: 'AVAILABLE' });
  const { data: reels } = useCtReels({ status: 'AVAILABLE' });
  const [selectedUnit, setSelectedUnit] = useState(data.ctUnitId);
  const [selectedReel, setSelectedReel] = useState(data.ctReelId);
  
  // Validar reel con fatiga crítica
  const selectedReelData = reels?.find(r => r.id === selectedReel);
  const hasCriticalFatigue = selectedReelData?.attributes.fatiguePercentage > 80;
  
  return (
    <div className="space-y-6">
      {/* Unit Selection */}
      <div>
        <Label>Seleccionar CT Unit</Label>
        <RadioGroup value={selectedUnit} onValueChange={setSelectedUnit}>
          {units?.map(unit => (
            <div key={unit.id} className="flex items-center space-x-3 border rounded p-3">
              <RadioGroupItem value={unit.id} />
              <div className="flex-1">
                <div className="font-medium">{unit.code}</div>
                <div className="text-sm text-muted-foreground">
                  {unit.properties.manufacturer} | {unit.properties.injectorCapacityLbs}K Injector
                </div>
              </div>
              <Badge variant="success">🟢 Available</Badge>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Reel Selection */}
      <div>
        <Label>Seleccionar Reel</Label>
        <RadioGroup value={selectedReel} onValueChange={setSelectedReel}>
          {reels?.map(reel => {
            const fatigue = reel.attributes.fatiguePercentage;
            const isCritical = fatigue > 80;
            
            return (
              <div key={reel.id} className={cn(
                "flex items-center space-x-3 border rounded p-3",
                isCritical && "border-red-500 bg-red-50"
              )}>
                <RadioGroupItem value={reel.id} disabled={isCritical} />
                <div className="flex-1">
                  <div className="font-medium">{reel.code}</div>
                  <div className="text-sm text-muted-foreground">
                    {reel.properties.outerDiameterIn}" {reel.properties.steelGrade} | 
                    {reel.properties.totalLengthFt} ft
                  </div>
                  <div className="mt-1">
                    <CtFatigueBar percentage={fatigue} />
                  </div>
                </div>
                {isCritical && (
                  <Badge variant="destructive">🔴 Critical - Cutting Required</Badge>
                )}
              </div>
            );
          })}
        </RadioGroup>
        
        {hasCriticalFatigue && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Advertencia de Fatiga</AlertTitle>
            <AlertDescription>
              El reel seleccionado tiene fatiga crítica (>80%). Se recomienda realizar corte antes de usarlo.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Personal */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Supervisor</Label>
          <Input placeholder="Nombre del supervisor" />
        </div>
        <div>
          <Label>Operador CT</Label>
          <Input placeholder="Nombre del operador" />
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ◀ Anterior
        </Button>
        <Button onClick={() => {
          onChange({ ctUnitId: selectedUnit, ctReelId: selectedReel });
          onNext();
        }}>
          Siguiente ▶
        </Button>
      </div>
    </div>
  );
}
```

### 3.4 Paso 6: Revisión y Simulación

```typescript
function StepReview({ data, onChange, onBack }: StepProps) {
  const { mutate: createJob, isLoading } = useCreateCtJob();
  const { data: lockupPrediction, isLoading: isSimulating } = useCtLockupPrediction({
    wellId: data.wellId,
    tubingSpecs: data.tubingSpecs,
    enabled: !!data.wellId
  });
  
  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="Job Number" value={data.jobNumber} />
        <InfoItem label="Job Type" value={data.jobType} />
        <InfoItem label="Well" value={data.wellName} />
        <InfoItem label="CT Unit" value={data.unitCode} />
        <InfoItem label="Reel" value={data.reelCode} />
        <InfoItem label="Target Depth" value={`${data.targetDepthFt} ft`} />
      </div>
      
      {/* Simulación de Lockup */}
      <Card>
        <CardHeader>
          <CardTitle>Simulación de Lockup</CardTitle>
        </CardHeader>
        <CardContent>
          {isSimulating ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Calculando predicción de lockup...</span>
            </div>
          ) : lockupPrediction ? (
            <>
              <div className="mb-4">
                <Alert variant={lockupPrediction.lockupDepthFt < data.targetDepthFt ? 'destructive' : 'default'}>
                  <AlertTitle>Predicción de Lockup</AlertTitle>
                  <AlertDescription>
                    Lockup esperado a: <strong>{lockupPrediction.lockupDepthFt} ft</strong>
                    {lockupPrediction.lockupDepthFt < data.targetDepthFt && (
                      <span className="block mt-2 text-red-600">
                        ⚠️ Lockup antes de alcanzar profundidad objetivo ({data.targetDepthFt} ft)
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
              
              {/* Broomstick Chart */}
              <CtBroomstickChart data={lockupPrediction.broomstickCurve} />
            </>
          ) : null}
        </CardContent>
      </Card>
      
      {/* Botones */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ◀ Anterior
        </Button>
        <Button 
          onClick={() => createJob(data)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando Job...
            </>
          ) : (
            'Crear Job'
          )}
        </Button>
      </div>
    </div>
  );
}
```

---

## 4. MONITOR EN TIEMPO REAL

### 4.1 Diseño del Monitor

```
┌─────────────────────────────────────────────────────────────────────┐
│  CT-2026-042 | PDC-15 | Cleanout              🟢 EN POZO   🔴 ⏹️   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─ Gauges ──────────────────────────────────────────────────────┐  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │ Depth    │  │ Weight   │  │ Speed    │  │ Pressure │      │  │
│  │  │          │  │          │  │          │  │          │      │  │
│  │  │ 8,542 ft │  │-1,250 lbs│  │ 45 ft/min│  │ 2,850 psi│      │  │
│  │  │ ████████ │  │ ████░░░░ │  │ █████░░░ │  │ ████████ │      │  │
│  │  │ 85% TD   │  │ OK       │  │ Normal   │  │ Normal   │      │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Broomstick Chart (Peso vs Profundidad) ────────────────────┐   │
│  │                                                               │   │
│  │  Weight (lbs)     ─── Modelo  ●●● Medido                     │   │
│  │   6000 │                                                      │   │
│  │        │────────────────────── Pickup                        │   │
│  │      0 │        ●●●●●●●●●●●●●●●●●●                          │   │
│  │        │────────────────────── String Weight                 │   │
│  │  -4000 │                                                      │   │
│  │        │──────────────────────── Slackoff                    │   │
│  │  -6000 │              ⚠️ Lockup @ 12,500 ft                  │   │
│  │        └────────────────────────────────────────▶ Depth      │   │
│  │          2000  4000  6000  8000  10000  12000                │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─ Alarmas Activas ────────────┐  ┌─ Log de Operaciones ───────┐  │
│  │ ✅ Peso OK                   │  │ 10:45:32 RIH 8,542 ft      │  │
│  │ ✅ Presión OK                │  │          -1,250 lbs        │  │
│  │ ⚠️ Fatiga 78%                │  │          Circulando        │  │
│  │ ✅ Velocidad OK              │  │                            │  │
│  └──────────────────────────────┘  │ 10:30:15 RIH 8,000 ft      │  │
│                                     │          Normal            │  │
│  ┌─ Fatiga en Tiempo Real ──────┐  │                            │  │
│  │  Reel: R-2024-012             │  │ 10:15:00 TAG 8,542 ft     │  │
│  │  Fatiga actual: 78.3%         │  │          Arena detectada   │  │
│  │  Incremento hoy: +2.1%        │  │                            │  │
│  │  Ciclos: 1,245                │  │     [Ver Historial]        │  │
│  └───────────────────────────────┘  └────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 CtJobMonitor.tsx

```typescript
export function CtJobMonitor({ jobId }: { jobId: string }) {
  const { data: job } = useCtJob(jobId);
  const { telemetry, alarms, isConnected } = useCtRealtime(jobId);
  const { mutate: stopJob } = useStopCtJob();
  
  if (!job) return <LoadingScreen />;
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {job.jobNumber} | {job.wellName} | {job.jobType}
          </h1>
          <p className="text-muted-foreground">
            {isConnected ? (
              <Badge variant="success">🟢 Conectado</Badge>
            ) : (
              <Badge variant="destructive">🔴 Desconectado</Badge>
            )}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="destructive" onClick={() => stopJob(jobId)}>
            ⏹️ Detener Job
          </Button>
        </div>
      </div>
      
      {/* Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CtGauge
          label="Profundidad"
          value={telemetry.depthFt}
          unit="ft"
          max={job.targetDepthFt}
          format={(v) => `${v.toLocaleString()} ft`}
        />
        <CtGauge
          label="Peso"
          value={telemetry.surfaceWeightLbs}
          unit="lbs"
          min={-10000}
          max={10000}
          zones={[
            { min: -10000, max: -5000, color: 'red', label: 'Slack-off' },
            { min: -5000, max: 5000, color: 'green', label: 'OK' },
            { min: 5000, max: 10000, color: 'red', label: 'Overpull' }
          ]}
        />
        <CtGauge
          label="Velocidad"
          value={telemetry.speedFtMin}
          unit="ft/min"
          max={150}
        />
        <CtGauge
          label="Presión Bomba"
          value={telemetry.pumpPressurePsi}
          unit="psi"
          max={5000}
        />
      </div>
      
      {/* Broomstick Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gráfico Broomstick (Peso vs Profundidad)</CardTitle>
        </CardHeader>
        <CardContent>
          <CtBroomstickChart
            modelData={job.lockupPrediction?.broomstickCurve}
            realtimeData={telemetry.history}
            currentDepth={telemetry.depthFt}
            currentWeight={telemetry.surfaceWeightLbs}
          />
        </CardContent>
      </Card>
      
      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alarms */}
        <Card>
          <CardHeader>
            <CardTitle>Alarmas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <CtAlarmsPanel alarms={alarms} />
          </CardContent>
        </Card>
        
        {/* Operations Log */}
        <Card>
          <CardHeader>
            <CardTitle>Log de Operaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <CtOperationsTimeline operations={telemetry.operationsLog} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 4.3 useCtRealtime Hook

```typescript
export function useCtRealtime(jobId: string) {
  const [telemetry, setTelemetry] = useState<CtTelemetryData | null>(null);
  const [alarms, setAlarms] = useState<CtAlarm[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    // Conectar a WebSocket
    const socket = io(WS_URL, {
      auth: { token: getAuthToken() }
    });
    
    socketRef.current = socket;
    
    // Suscribirse al job
    socket.emit('subscribe:ct-job', { jobId });
    
    // Event listeners
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('ct:initial-state', (data) => {
      setTelemetry(data.telemetry);
      setAlarms(data.alarms);
    });
    
    socket.on('ct:telemetry', (data) => {
      setTelemetry(prev => ({
        ...data,
        history: [...(prev?.history || []).slice(-100), data] // Mantener últimos 100
      }));
    });
    
    socket.on('ct:alarm', (alarm) => {
      setAlarms(prev => [alarm, ...prev]);
    });
    
    socket.on('ct:fatigue-updated', (data) => {
      // Actualizar telemetría con nueva fatiga
      setTelemetry(prev => prev ? { ...prev, fatiguePercent: data.fatiguePercent } : null);
    });
    
    return () => {
      socket.emit('unsubscribe:ct-job', { jobId });
      socket.disconnect();
    };
  }, [jobId]);
  
  return { telemetry, alarms, isConnected };
}
```

---

## 5. GESTIÓN DE ASSETS CT

**NOTA**: Los assets CT (Units, Reels, etc.) se gestionan desde `/digital-twins`, pero necesitamos vistas especializadas.

### 5.1 CtReelDetail.tsx

Vista detallada de un reel con mapa de fatiga interactivo

```typescript
export function CtReelDetail({ reelId }: { reelId: string }) {
  const { data: reel } = useAsset(reelId); // Usa hook de assets core
  const { data: sections } = useReelSections(reelId);
  
  return (
    <Tabs defaultValue="info">
      <TabsList>
        <TabsTrigger value="info">Información</TabsTrigger>
        <TabsTrigger value="fatigue">Mapa de Fatiga</TabsTrigger>
        <TabsTrigger value="history">Historial</TabsTrigger>
        <TabsTrigger value="jobs">Jobs Realizados</TabsTrigger>
      </TabsList>
      
      <TabsContent value="fatigue">
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Fatiga por Sección</CardTitle>
          </CardHeader>
          <CardContent>
            <CtFatigueMap sections={sections} />
            
            {/* Visual de secciones */}
            <div className="mt-6 space-y-2">
              {sections?.map(section => (
                <div key={section.id} className="flex items-center gap-4">
                  <div className="w-32 text-sm">
                    {section.startDepthFt}-{section.endDepthFt} ft
                  </div>
                  <div className="flex-1">
                    <FatigueBar
                      percentage={section.attributes.fatiguePercentage}
                      showLabel
                    />
                  </div>
                  {section.attributes.fatiguePercentage > 80 && (
                    <Button size="sm" variant="destructive">
                      Programar Corte
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
```

---

## 6. COMPONENTES REUTILIZABLES

### 6.1 CtBroomstickChart.tsx

```typescript
interface BroomstickChartProps {
  modelData?: Array<{ depthFt: number; pickupLbs: number; slackoffLbs: number }>;
  realtimeData?: Array<{ depthFt: number; weightLbs: number; timestamp: Date }>;
  currentDepth?: number;
  currentWeight?: number;
}

export function CtBroomstickChart({ modelData, realtimeData, currentDepth, currentWeight }: BroomstickChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="depthFt"
          label={{ value: 'Profundidad (ft)', position: 'insideBottom', offset: -5 }}
        />
        <YAxis
          label={{ value: 'Peso (lbs)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <Legend />
        
        {/* Modelo predicho */}
        {modelData && (
          <>
            <Line
              data={modelData}
              type="monotone"
              dataKey="pickupLbs"
              stroke="#10b981"
              name="Pickup (Modelo)"
              strokeDasharray="5 5"
            />
            <Line
              data={modelData}
              type="monotone"
              dataKey="slackoffLbs"
              stroke="#ef4444"
              name="Slackoff (Modelo)"
              strokeDasharray="5 5"
            />
          </>
        )}
        
        {/* Datos reales */}
        {realtimeData && (
          <Line
            data={realtimeData}
            type="monotone"
            dataKey="weightLbs"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Medido"
            dot={{ r: 3 }}
          />
        )}
        
        {/* Punto actual */}
        {currentDepth && currentWeight && (
          <ReferenceDot
            x={currentDepth}
            y={currentWeight}
            r={8}
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth={2}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 6.2 CtFatigueBar.tsx

```typescript
interface FatigueBarProps {
  percentage: number;
  showLabel?: boolean;
  height?: number;
}

export function CtFatigueBar({ percentage, showLabel = false, height = 24 }: FatigueBarProps) {
  const getColor = (p: number) => {
    if (p > 80) return 'bg-red-500';
    if (p > 60) return 'bg-orange-500';
    if (p > 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getIcon = (p: number) => {
    if (p > 80) return '🔴';
    if (p > 60) return '🟠';
    if (p > 40) return '🟡';
    return '🟢';
  };
  
  return (
    <div className="flex items-center gap-2">
      {showLabel && <span className="text-sm">{getIcon(percentage)}</span>}
      <div className="flex-1 bg-gray-200 rounded-full overflow-hidden" style={{ height }}>
        <div
          className={cn("h-full transition-all duration-300", getColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <span className="text-sm font-medium w-12">{percentage.toFixed(1)}%</span>}
    </div>
  );
}
```

### 6.3 CtGauge.tsx

Componente de gauge circular para valores en tiempo real

```typescript
export function CtGauge({ label, value, unit, min = 0, max, zones }: GaugeProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">{label}</div>
          <div className="text-3xl font-bold">{value.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{unit}</div>
          
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 7. IMPLEMENTACIÓN

### 7.1 Checklist de Desarrollo

**Dashboard** (1 página):
- [ ] CtDashboard.tsx
- [ ] KPI cards con stats reales
- [ ] Active jobs list con WebSocket
- [ ] Fatigue alerts list
- [ ] Monthly KPIs chart

**Wizard de Jobs** (7 componentes):
- [ ] CtJobWizard.tsx (container)
- [ ] StepGeneral.tsx
- [ ] StepResources.tsx (con validación)
- [ ] StepPlanning.tsx
- [ ] StepBHA.tsx
- [ ] StepFluids.tsx
- [ ] StepReview.tsx (con simulación)

**Monitor en Tiempo Real** (1 página + hooks):
- [ ] CtJobMonitor.tsx
- [ ] useCtRealtime.ts (WebSocket hook)
- [ ] CtGauge.tsx (x4 gauges)
- [ ] CtBroomstickChart.tsx
- [ ] CtAlarmsPanel.tsx
- [ ] CtOperationsTimeline.tsx

**Gestión de Assets** (vistas especializadas):
- [ ] CtReelDetail.tsx (con tabs)
- [ ] CtFatigueMap.tsx
- [ ] CtUnitDetail.tsx

**Componentes Reutilizables** (11 componentes):
- [ ] CtJobsTable.tsx
- [ ] CtFatigueBar.tsx
- [ ] CtFatigueChart.tsx
- [ ] CtBroomstickChart.tsx
- [ ] CtAlarmsPanel.tsx
- [ ] CtOperationsTimeline.tsx
- [ ] CtBhaDesigner.tsx (React Flow)
- [ ] CtGauge.tsx
- [ ] CtKpiCard.tsx
- [ ] WizardStepper.tsx
- [ ] CtJobFilters.tsx

**API Hooks** (React Query):
- [ ] useCtJobs.ts
- [ ] useCtJob.ts
- [ ] useCreateCtJob.ts
- [ ] useStartCtJob.ts
- [ ] useCompleteCtJob.ts
- [ ] useCtRealtime.ts
- [ ] useCtCalculations.ts
- [ ] useCtDashboardStats.ts

**i18n**:
- [ ] es.json (traducciones español)
- [ ] en.json (traducciones inglés)

### 7.2 Estimación de Esfuerzo

| Componente | Horas |
|------------|-------|
| Dashboard Principal | 8 |
| Wizard de Jobs (6 pasos) | 16 |
| Monitor en Tiempo Real | 12 |
| Gestión de Assets (vistas) | 6 |
| Componentes Reutilizables | 14 |
| API Hooks (React Query) | 6 |
| i18n (traducciones) | 2 |
| Testing y Refinamiento | 8 |
| **TOTAL** | **72 hrs** (~2-3 semanas) |

---

## 📊 CRITERIOS DE ÉXITO

- ✅ Dashboard profesional con datos reales
- ✅ Wizard funcional que valida disponibilidad
- ✅ Monitor RT con WebSocket conectado
- ✅ Broomstick chart mostrando modelo vs medido
- ✅ Mapa de fatiga interactivo
- ✅ Responsive (desktop + tablet)
- ✅ Traducciones ES/EN completas
- ✅ Loading states y error handling
- ✅ Permisos RBAC implementados

---

**Siguiente bloque**: [06_SIMULADOR_SEEDS.md](./06_SIMULADOR_SEEDS.md) →
