# ROADMAP: FRONTEND STACK

## Índice de Documentos

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| `01_ARQUITECTURA_FRONTEND.md` | Estructura y patrones | ✅ |
| `02_COMPONENTES.md` | Librería de componentes | 📋 |
| `03_VISUALIZACIONES.md` | Gráficos y dashboards | 📋 |
| `04_RESPONSIVE.md` | Mobile y tablet | 📋 |

---

## Resumen Ejecutivo

El frontend del sistema ERP+SCADA está diseñado para:

- **Usabilidad**: Interfaz intuitiva para operadores de campo
- **Tiempo real**: Actualización instantánea de datos SCADA
- **Visualizaciones**: Gráficos técnicos profesionales
- **Responsive**: Funcional en desktop, tablet y móvil

---

## Stack Tecnológico

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| **Framework** | React 18+ | Ecosistema, componentización |
| **Lenguaje** | TypeScript | Seguridad de tipos |
| **Build** | Vite | Velocidad de desarrollo |
| **Estado** | Zustand / TanStack Query | Simplicidad, cache |
| **Estilos** | TailwindCSS | Utility-first, personalizable |
| **Componentes** | shadcn/ui | Accesibles, personalizables |
| **Gráficos** | Recharts / D3.js | Visualizaciones técnicas |
| **Tablas** | TanStack Table | Tablas avanzadas |
| **Forms** | React Hook Form + Zod | Validación |
| **Icons** | Lucide React | Iconos consistentes |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                              PAGES                                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │Dashboard│ │ Wells   │ │Drilling │ │Productn │ │Settings │        │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                            FEATURES                                    │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │  │
│  │  │  WellTesting    │ │    Drilling     │ │   Production    │         │  │
│  │  │  ├── TestList   │ │  ├── Dashboard  │ │  ├── Dashboard  │         │  │
│  │  │  ├── TestForm   │ │  ├── TDModel    │ │  ├── ESPMonitor │         │  │
│  │  │  └── IPRChart   │ │  └── DDR        │ │  └── DCA        │         │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                           COMPONENTS                                   │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │  │
│  │  │ Layout │ │ Forms  │ │ Tables │ │ Charts │ │  Maps  │             │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                              CORE                                      │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │  │
│  │  │  API   │ │ Auth   │ │ Store  │ │ Hooks  │ │ Utils  │             │  │
│  │  │ Client │ │Context │ │Zustand │ │        │ │        │             │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Estructura del Proyecto

```
frontend/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes.tsx
│   │
│   ├── api/                    # API Client
│   │   ├── client.ts
│   │   ├── wells.ts
│   │   ├── drilling.ts
│   │   └── production.ts
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── PageLayout.tsx
│   │   ├── charts/
│   │   │   ├── IPRChart.tsx
│   │   │   ├── VLPChart.tsx
│   │   │   ├── ProductionChart.tsx
│   │   │   └── DynamometerCard.tsx
│   │   ├── tables/
│   │   │   └── DataTable.tsx
│   │   └── forms/
│   │       ├── WellTestForm.tsx
│   │       └── ...
│   │
│   ├── features/               # Módulos de negocio
│   │   ├── well-testing/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── drilling/
│   │   ├── production/
│   │   ├── reservoir/
│   │   └── ...
│   │
│   ├── hooks/                  # Custom hooks globales
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   └── useRealTime.ts
│   │
│   ├── stores/                 # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   │
│   ├── lib/                    # Utilidades
│   │   ├── utils.ts
│   │   └── validators.ts
│   │
│   └── types/                  # TypeScript types
│       ├── well.ts
│       ├── test.ts
│       └── ...
│
└── public/
    └── assets/
```

---

## Componentes Clave

### 1. Layout Principal

```tsx
// PageLayout.tsx
export function PageLayout({ children, title, actions }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 2. Gráfico IPR/VLP

```tsx
// IPRVLPChart.tsx
interface IPRVLPChartProps {
  iprCurve: Point[];
  vlpCurve: Point[];
  operatingPoint?: { q: number; pwf: number };
}

export function IPRVLPChart({ iprCurve, vlpCurve, operatingPoint }: IPRVLPChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="q" label={{ value: 'Rate (BOPD)', position: 'bottom' }} />
        <YAxis label={{ value: 'Pwf (psi)', angle: -90, position: 'left' }} />
        <Tooltip />
        <Legend />
        <Line data={iprCurve} type="monotone" dataKey="pwf" stroke="#2563eb" name="IPR" />
        <Line data={vlpCurve} type="monotone" dataKey="pwf" stroke="#dc2626" name="VLP" />
        {operatingPoint && (
          <ReferenceDot x={operatingPoint.q} y={operatingPoint.pwf} r={8} fill="#16a34a" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 3. Dashboard de Producción

```tsx
// ProductionDashboard.tsx
export function ProductionDashboard() {
  const { data: wells } = useQuery(['wells', 'producing'], fetchProducingWells);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard title="Producción Total" value={wells?.totalOil} unit="BOPD" />
      <MetricCard title="Pozos Activos" value={wells?.activeCount} />
      <MetricCard title="Eficiencia" value={wells?.efficiency} unit="%" />
      <MetricCard title="Producción Diferida" value={wells?.deferred} unit="BOPD" />
      
      <div className="col-span-full">
        <ProductionTrendChart data={wells?.trend} />
      </div>
      
      <div className="col-span-full">
        <WellsTable data={wells?.list} />
      </div>
    </div>
  );
}
```

---

## Real-Time con WebSocket

```tsx
// useRealTime.ts
export function useRealTimeData(wellId: string) {
  const [data, setData] = useState<RealTimeData | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/wells/${wellId}/telemetry`);
    
    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);
    };
    
    return () => ws.close();
  }, [wellId]);
  
  return data;
}

// Uso en componente
function ESPMonitor({ wellId }) {
  const realTimeData = useRealTimeData(wellId);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <GaugeCard title="Frecuencia" value={realTimeData?.frequency} unit="Hz" />
      <GaugeCard title="Corriente" value={realTimeData?.current} unit="A" />
      <GaugeCard title="Temperatura" value={realTimeData?.motorTemp} unit="°F" />
    </div>
  );
}
```

---

## Paleta de Colores

| Color | Uso | Hex |
|-------|-----|-----|
| **Primary** | Acciones principales | #1E3A5F |
| **Secondary** | Acciones secundarias | #3B82F6 |
| **Success** | Estados positivos | #10B981 |
| **Warning** | Alertas | #F59E0B |
| **Error** | Errores | #EF4444 |
| **Oil** | Petróleo | #1F2937 |
| **Water** | Agua | #60A5FA |
| **Gas** | Gas | #F87171 |

---

## Responsive Design

| Breakpoint | Ancho | Comportamiento |
|------------|-------|----------------|
| **sm** | 640px | Mobile |
| **md** | 768px | Tablet vertical |
| **lg** | 1024px | Tablet horizontal |
| **xl** | 1280px | Desktop |
| **2xl** | 1536px | Desktop grande |

---

## Cronograma de Implementación

| Fase | Entregable | Duración |
|------|------------|----------|
| **1** | Setup + Layout base | 1 semana |
| **2** | Componentes UI (shadcn) | 1 semana |
| **3** | Auth + Routing | 1 semana |
| **4** | Gráficos técnicos | 2 semanas |
| **5** | Módulos de negocio | 4 semanas |
| **6** | Real-time (WebSocket) | 1 semana |
| **7** | Responsive + PWA | 1 semana |

**Total: 11 semanas**

