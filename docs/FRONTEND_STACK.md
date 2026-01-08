# FRONTEND STACK PARA ERP+SCADA PETROLERO

## Resumen Ejecutivo

Este documento define el stack tecnológico de frontend para el sistema ERP+SCADA petrolero. La interfaz debe manejar visualización de datos en tiempo real, gráficos industriales de alta performance, mapas geoespaciales y componentes HMI tradicionales.

Se evalúan frameworks principales (**React**, **Vue**, **Angular**), librerías de gráficos (**Apache ECharts**, **Plotly**, **D3.js**), y soluciones de mapas (**OpenLayers**, **MapLibre GL**, **Leaflet**). 

**Recomendación:** React + Apache ECharts + OpenLayers + TanStack Query + Zustand, con shadcn/ui como sistema de componentes.

---

## 1. Requerimientos de Frontend

### 1.1 Funcionalidades Críticas

| Categoría | Funcionalidad | Requerimiento |
|-----------|---------------|---------------|
| **Real-time** | Actualización de datos | <1s latencia visual |
| **Gráficos** | Time-series charts | 100K+ puntos, zoom fluido |
| **Mapas** | Campos petroleros | Bubble maps, pipelines, wells |
| **HMI** | Componentes industriales | Gauges, tanks, pumps, valves |
| **Tables** | Grids de datos | Sorting, filtering, export |
| **Reports** | PDF/Excel export | Generación client-side |
| **Mobile** | Responsive design | Tablets en campo |

### 1.2 Escenarios de Uso

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USUARIO: Operador de Campo                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    DASHBOARD OPERACIONAL                         │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │
│  │  │   Status    │  │  Alarms     │  │   KPIs      │              │    │
│  │  │   Overview  │  │   Panel     │  │   Cards     │              │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │              FIELD MAP (Bubble Map)                      │    │    │
│  │  │    ○ Well-001 (1250 BOPD)                               │    │    │
│  │  │         ○ Well-002 (980 BOPD)                           │    │    │
│  │  │    ●══════════════════════● Pipeline                    │    │    │
│  │  │              ○ Well-003 (offline)                       │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │           PRODUCTION TREND (Last 24h)                    │    │    │
│  │  │  ▁▂▃▄▅▆▇█▇▆▅▄▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅                          │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Comparativa de Frameworks

### 2.1 React

**Descripción:** Librería de UI de Meta, dominante en el mercado con el ecosistema más grande.

**Estadísticas (2024):**
- ~3.7M sitios web activos
- ~52K ofertas de empleo
- npm downloads: ~25M/semana

**Arquitectura típica:**
```
┌─────────────────────────────────────────────────────────────┐
│                      REACT APPLICATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   App Component                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │   Router    │  │   Context   │  │   Provider  │  │    │
│  │  │ (React      │  │   (Auth,    │  │  (TanStack  │  │    │
│  │  │  Router)    │  │   Theme)    │  │   Query)    │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Page Components                   │    │
│  │  ┌───────────────────────────────────────────────┐  │    │
│  │  │                  Dashboard                     │  │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐       │  │    │
│  │  │  │ Widget  │  │  Chart  │  │   Map   │       │  │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘       │  │    │
│  │  └───────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  State Management                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │  TanStack   │  │   Zustand   │  │   Local     │  │    │
│  │  │   Query     │  │  (Global)   │  │   State     │  │    │
│  │  │  (Server)   │  │             │  │  (useState) │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Pros:**
- ✓ Ecosistema más grande (npm packages)
- ✓ Mayor pool de desarrolladores
- ✓ Flexibilidad arquitectónica
- ✓ React Server Components (Next.js)
- ✓ Excelente tooling (Vite, TypeScript)
- ✓ Community-driven innovation

**Contras:**
- ✗ "Fatiga de decisiones" (muchas opciones)
- ✗ No opinionated (requiere arquitectura propia)
- ✗ Boilerplate para setup inicial

### 2.2 Vue 3

**Descripción:** Framework progresivo, balance entre simplicidad y potencia.

**Estadísticas (2024):**
- ~3.7M sitios web activos
- Composition API (similar a React Hooks)
- Excelente documentación oficial

**Pros:**
- ✓ Curva de aprendizaje suave
- ✓ Documentación excelente
- ✓ Single-File Components (SFC)
- ✓ Composition API moderno
- ✓ Nuxt.js para SSR

**Contras:**
- ✗ Ecosistema más pequeño que React
- ✗ Menos ofertas laborales
- ✗ Comunidad fragmentada (Options vs Composition)

### 2.3 Angular

**Descripción:** Framework completo de Google, opinionated y enterprise-ready.

**Estadísticas (2024):**
- ~96K sitios web activos
- Soporte de Google a largo plazo
- TypeScript nativo obligatorio

**Pros:**
- ✓ Framework completo (routing, forms, HTTP, DI)
- ✓ TypeScript nativo
- ✓ RxJS para reactive programming
- ✓ Estructura consistente
- ✓ Soporte enterprise de Google

**Contras:**
- ✗ Curva de aprendizaje empinada
- ✗ Verbose (más código)
- ✗ Bundle size mayor
- ✗ Menos flexible

### 2.4 Tabla Comparativa

| Criterio | React | Vue 3 | Angular |
|----------|-------|-------|---------|
| **Learning Curve** | Media | Baja | Alta |
| **Ecosystem Size** | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| **Performance** | ★★★★☆ | ★★★★★ | ★★★★☆ |
| **TypeScript** | Excelente | Muy bueno | Nativo |
| **Enterprise Ready** | ★★★★☆ | ★★★☆☆ | ★★★★★ |
| **Job Market** | ★★★★★ | ★★★☆☆ | ★★★★☆ |
| **Bundle Size** | Pequeño | Muy pequeño | Grande |
| **Opinionated** | No | Parcial | Sí |

**Recomendación:** **React** por ecosistema, talento disponible y flexibilidad.

---

## 3. Librerías de Gráficos Industriales

### 3.1 Apache ECharts

**Descripción:** Librería de visualización open-source de Apache, optimizada para grandes datasets.

**Características clave:**
- WebGL acceleration para 100K+ puntos
- 20+ tipos de gráficos
- Responsive y mobile-friendly
- Internacionalización
- Theming extensivo
- Export a imagen/PDF

**Performance con grandes datasets:**
```javascript
// ECharts con large dataset mode
option = {
  dataset: {
    source: largeData // 100,000+ points
  },
  xAxis: { type: 'time' },
  yAxis: { type: 'value' },
  series: [{
    type: 'line',
    encode: { x: 'time', y: 'value' },
    large: true,           // Enable large mode
    largeThreshold: 5000,  // Threshold for large mode
    progressive: 2000,     // Progressive rendering
    progressiveThreshold: 5000
  }]
};
```

**Gráficos relevantes para Oil & Gas:**

```typescript
// Decline Curve Chart
const declineCurveOption: EChartsOption = {
  title: { text: 'Decline Curve Analysis - Well-001' },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const p = params[0];
      return `${p.name}<br/>Rate: ${p.value[1].toFixed(1)} BOPD`;
    }
  },
  xAxis: {
    type: 'time',
    name: 'Date'
  },
  yAxis: {
    type: 'log',
    name: 'Oil Rate (BOPD)',
    min: 10
  },
  series: [
    {
      name: 'Actual',
      type: 'scatter',
      data: actualData,
      symbolSize: 6,
      itemStyle: { color: '#3b82f6' }
    },
    {
      name: 'Forecast (Hyperbolic)',
      type: 'line',
      data: forecastData,
      smooth: true,
      lineStyle: { type: 'dashed' },
      itemStyle: { color: '#ef4444' }
    }
  ],
  dataZoom: [
    { type: 'inside', xAxisIndex: 0 },
    { type: 'slider', xAxisIndex: 0, bottom: 10 }
  ]
};

// Production Stacked Area Chart
const productionChartOption: EChartsOption = {
  title: { text: 'Field Production' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: { data: ['Oil', 'Gas', 'Water'] },
  xAxis: { type: 'time' },
  yAxis: [
    { type: 'value', name: 'Liquid (BPD)', position: 'left' },
    { type: 'value', name: 'Gas (MCFD)', position: 'right' }
  ],
  series: [
    {
      name: 'Oil',
      type: 'line',
      areaStyle: { opacity: 0.7 },
      data: oilData,
      itemStyle: { color: '#22c55e' }
    },
    {
      name: 'Water',
      type: 'line',
      areaStyle: { opacity: 0.5 },
      data: waterData,
      itemStyle: { color: '#3b82f6' }
    },
    {
      name: 'Gas',
      type: 'line',
      yAxisIndex: 1,
      data: gasData,
      itemStyle: { color: '#f59e0b' }
    }
  ]
};
```

### 3.2 Plotly.js

**Descripción:** Librería científica con soporte para gráficos 3D y estadísticos.

**Pros:**
- Gráficos 3D nativos
- Excelente para datos científicos
- Interactividad avanzada
- Export de alta calidad

**Contras:**
- Bundle size grande (~3MB)
- Menos performante con >50K puntos
- API menos intuitiva

**Uso ideal:** Gráficos científicos específicos (crossplots PVT, 3D reservoir).

### 3.3 D3.js

**Descripción:** Librería de bajo nivel para visualizaciones custom.

**Pros:**
- Control total sobre visualización
- Máxima flexibilidad
- Base de otras librerías

**Contras:**
- Curva de aprendizaje muy alta
- Mucho código para gráficos simples
- No es "batteries included"

**Uso ideal:** Visualizaciones altamente customizadas que no existen en otras librerías.

### 3.4 Comparativa de Gráficos

| Criterio | ECharts | Plotly | D3.js |
|----------|---------|--------|-------|
| **Performance (100K pts)** | ★★★★★ | ★★★☆☆ | ★★★★☆ |
| **Ease of Use** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Chart Variety** | ★★★★★ | ★★★★☆ | ★★★★★ |
| **3D Support** | ★★★☆☆ | ★★★★★ | ★★★☆☆ |
| **Bundle Size** | ~1MB | ~3MB | ~500KB |
| **React Integration** | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| **Documentation** | ★★★★★ | ★★★★☆ | ★★★☆☆ |

**Recomendación:** **Apache ECharts** como librería principal, Plotly para gráficos 3D específicos.

---

## 4. Componentes HMI/SCADA

### 4.1 Componentes Industriales Necesarios

| Componente | Uso | Ejemplo |
|------------|-----|---------|
| **Gauge** | Presión, temperatura | THP, BHT |
| **Tank Level** | Nivel de tanques | Separador, storage |
| **Pump** | Estado de bombas | ESP, PCP |
| **Valve** | Estado de válvulas | Choke, SDV |
| **Flow Indicator** | Dirección de flujo | Pipelines |
| **Alarm Panel** | Lista de alarmas | Críticas, warnings |
| **Trend** | Histórico en tiempo real | Últimas 4 horas |

### 4.2 Implementación de Componentes HMI

```tsx
// components/hmi/Gauge.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  title: string;
  thresholds?: {
    warning: number;
    alarm: number;
  };
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  min,
  max,
  unit,
  title,
  thresholds
}) => {
  const getColor = () => {
    if (thresholds) {
      if (value >= thresholds.alarm) return '#ef4444';
      if (value >= thresholds.warning) return '#f59e0b';
    }
    return '#22c55e';
  };

  const option = {
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min,
      max,
      splitNumber: 5,
      itemStyle: { color: getColor() },
      progress: {
        show: true,
        width: 20
      },
      pointer: { show: false },
      axisLine: {
        lineStyle: { width: 20, color: [[1, '#e5e7eb']] }
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: {
        show: true,
        offsetCenter: [0, '70%'],
        fontSize: 12,
        color: '#6b7280'
      },
      detail: {
        fontSize: 24,
        offsetCenter: [0, '40%'],
        valueAnimation: true,
        formatter: `{value} ${unit}`,
        color: getColor()
      },
      data: [{ value, name: title }]
    }]
  };

  return (
    <div className="w-40 h-40">
      <ReactECharts option={option} style={{ height: '100%' }} />
    </div>
  );
};

// components/hmi/TankLevel.tsx
interface TankLevelProps {
  level: number; // 0-100%
  label: string;
  alarmHigh?: number;
  alarmLow?: number;
}

export const TankLevel: React.FC<TankLevelProps> = ({
  level,
  label,
  alarmHigh = 90,
  alarmLow = 10
}) => {
  const getColor = () => {
    if (level >= alarmHigh || level <= alarmLow) return 'bg-red-500';
    if (level >= alarmHigh - 10 || level <= alarmLow + 10) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-medium mb-1">{label}</span>
      <div className="relative w-16 h-32 border-2 border-gray-400 rounded-b-lg bg-gray-100">
        {/* Liquid level */}
        <div
          className={`absolute bottom-0 left-0 right-0 rounded-b-md transition-all duration-500 ${getColor()}`}
          style={{ height: `${level}%` }}
        />
        {/* Level markers */}
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute left-0 right-0 border-t border-gray-300"
            style={{ bottom: `${mark}%` }}
          />
        ))}
      </div>
      <span className="text-lg font-bold mt-1">{level.toFixed(1)}%</span>
    </div>
  );
};

// components/hmi/PumpStatus.tsx
interface PumpStatusProps {
  name: string;
  running: boolean;
  current?: number;
  frequency?: number;
  fault?: boolean;
}

export const PumpStatus: React.FC<PumpStatusProps> = ({
  name,
  running,
  current,
  frequency,
  fault
}) => {
  const getStatusColor = () => {
    if (fault) return 'bg-red-500';
    if (running) return 'bg-green-500';
    return 'bg-gray-400';
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{name}</span>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${running && !fault ? 'animate-pulse' : ''}`} />
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="font-medium">
            {fault ? 'FAULT' : running ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>
        {current !== undefined && (
          <div className="flex justify-between">
            <span>Current:</span>
            <span>{current.toFixed(1)} A</span>
          </div>
        )}
        {frequency !== undefined && (
          <div className="flex justify-between">
            <span>Frequency:</span>
            <span>{frequency.toFixed(1)} Hz</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4.3 SVG Animations para Equipos

```tsx
// components/hmi/AnimatedPump.tsx
import React from 'react';

interface AnimatedPumpProps {
  running: boolean;
  size?: number;
}

export const AnimatedPump: React.FC<AnimatedPumpProps> = ({ 
  running, 
  size = 64 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="transition-all"
    >
      {/* Pump body */}
      <rect
        x="10"
        y="20"
        width="44"
        height="24"
        rx="4"
        fill={running ? '#22c55e' : '#9ca3af'}
        className="transition-colors duration-300"
      />
      
      {/* Rotating element */}
      <g transform="translate(32, 32)">
        <circle
          r="8"
          fill="#ffffff"
          stroke={running ? '#16a34a' : '#6b7280'}
          strokeWidth="2"
        />
        <g className={running ? 'animate-spin' : ''} style={{ transformOrigin: 'center' }}>
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#374151" strokeWidth="2" />
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#374151" strokeWidth="2" />
        </g>
      </g>
      
      {/* Inlet pipe */}
      <rect x="0" y="28" width="10" height="8" fill="#6b7280" />
      
      {/* Outlet pipe */}
      <rect x="54" y="28" width="10" height="8" fill="#6b7280" />
      
      {/* Flow arrows when running */}
      {running && (
        <>
          <path
            d="M 3 32 L 7 32"
            stroke="#3b82f6"
            strokeWidth="2"
            className="animate-pulse"
          />
          <path
            d="M 57 32 L 61 32"
            stroke="#3b82f6"
            strokeWidth="2"
            className="animate-pulse"
          />
        </>
      )}
    </svg>
  );
};
```

---

## 5. Mapas para Visualización de Campos

### 5.1 Comparativa de Librerías de Mapas

| Criterio | OpenLayers | MapLibre GL | Leaflet |
|----------|------------|-------------|---------|
| **Rendering** | Canvas/WebGL | WebGL | Canvas/SVG |
| **Performance** | ★★★★★ | ★★★★★ | ★★★☆☆ |
| **Vector Tiles** | ✓ | ✓ Nativo | Plugin |
| **3D Terrain** | Limitado | ✓ | ✗ |
| **GIS Features** | ★★★★★ | ★★★☆☆ | ★★★☆☆ |
| **Bundle Size** | ~500KB | ~400KB | ~150KB |
| **Learning Curve** | Alta | Media | Baja |

### 5.2 OpenLayers para Oil & Gas

**Por qué OpenLayers:**
- Soporte completo de formatos GIS (WMS, WFS, GeoJSON, KML)
- Proyecciones customizadas
- Edición de geometrías
- Mejor para aplicaciones GIS complejas

```tsx
// components/maps/FieldMap.tsx
import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';

interface Well {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  oilRate: number;
  status: 'producing' | 'shut_in' | 'offline';
}

interface FieldMapProps {
  wells: Well[];
  pipelines?: GeoJSON.FeatureCollection;
  center: [number, number];
  zoom?: number;
  onWellClick?: (well: Well) => void;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  wells,
  pipelines,
  center,
  zoom = 12,
  onWellClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Well features
    const wellFeatures = wells.map((well) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([well.longitude, well.latitude])),
        well: well
      });

      // Size based on production
      const radius = Math.max(8, Math.min(30, well.oilRate / 100));
      
      // Color based on status
      const color = {
        producing: '#22c55e',
        shut_in: '#f59e0b',
        offline: '#ef4444'
      }[well.status];

      feature.setStyle(new Style({
        image: new Circle({
          radius,
          fill: new Fill({ color: color + '80' }), // 50% opacity
          stroke: new Stroke({ color, width: 2 })
        }),
        text: new Text({
          text: well.name,
          offsetY: -radius - 10,
          font: '12px sans-serif',
          fill: new Fill({ color: '#374151' }),
          stroke: new Stroke({ color: '#ffffff', width: 3 })
        })
      }));

      return feature;
    });

    const wellsLayer = new VectorLayer({
      source: new VectorSource({ features: wellFeatures }),
      zIndex: 10
    });

    // Popup overlay
    const popup = new Overlay({
      element: popupRef.current!,
      positioning: 'bottom-center',
      offset: [0, -10],
      autoPan: true
    });

    // Create map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        wellsLayer
      ],
      overlays: [popup],
      view: new View({
        center: fromLonLat(center),
        zoom
      })
    });

    // Click handler
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        const well = feature.get('well') as Well;
        if (well && onWellClick) {
          onWellClick(well);
        }
        popup.setPosition(evt.coordinate);
      } else {
        popup.setPosition(undefined);
      }
    });

    // Hover cursor
    map.on('pointermove', (evt) => {
      const hit = map.hasFeatureAtPixel(evt.pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    mapInstance.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, [wells, center, zoom]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Popup template */}
      <div ref={popupRef} className="hidden">
        <div className="bg-white rounded-lg shadow-lg p-3 min-w-48">
          {/* Content filled dynamically */}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow p-3">
        <h4 className="font-medium text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Producing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Shut-in</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Offline</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Circle size = Production rate
        </p>
      </div>
    </div>
  );
};
```

---

## 6. State Management y Data Fetching

### 6.1 TanStack Query (React Query)

**Por qué TanStack Query:**
- Cache automático con invalidación inteligente
- Refetching automático (window focus, interval)
- Optimistic updates
- Infinite scroll/pagination
- Devtools excelentes

```tsx
// hooks/useWells.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wellsApi } from '@/api/wells';

export const useWells = (filters?: WellFilters) => {
  return useQuery({
    queryKey: ['wells', filters],
    queryFn: () => wellsApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useWell = (wellId: string) => {
  return useQuery({
    queryKey: ['wells', wellId],
    queryFn: () => wellsApi.getById(wellId),
    enabled: !!wellId,
  });
};

export const useWellProduction = (
  wellId: string,
  timeRange: { start: Date; end: Date },
  interval: string = '1h'
) => {
  return useQuery({
    queryKey: ['wells', wellId, 'production', timeRange, interval],
    queryFn: () => wellsApi.getProduction(wellId, timeRange, interval),
    refetchInterval: 60 * 1000, // Refetch every minute
    enabled: !!wellId,
  });
};

export const useCreateWell = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: wellsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wells'] });
    },
  });
};

// hooks/useRealTimeData.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useRealTimeProduction = (wellId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(`${WS_URL}/wells/${wellId}/production`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Update cache with new data point
      queryClient.setQueryData(
        ['wells', wellId, 'realtime'],
        (old: ProductionData[] = []) => [...old.slice(-100), data]
      );
    };

    return () => ws.close();
  }, [wellId, queryClient]);

  return useQuery({
    queryKey: ['wells', wellId, 'realtime'],
    queryFn: () => [], // Initial empty array
    staleTime: Infinity, // Never stale (updated via WS)
  });
};
```

### 6.2 Zustand para State Global

```tsx
// store/appStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  roles: string[];
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  
  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // Active selections
  selectedFieldId: string | null;
  setSelectedField: (fieldId: string | null) => void;
  selectedWellId: string | null;
  setSelectedWell: (wellId: string | null) => void;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      
      // UI
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // Active selections
      selectedFieldId: null,
      setSelectedField: (fieldId) => set({ selectedFieldId: fieldId }),
      selectedWellId: null,
      setSelectedWell: (wellId) => set({ selectedWellId: wellId }),
      
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'scada-app-storage',
      partialize: (state) => ({
        token: state.token,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
```

---

## 7. Component Library

### 7.1 shadcn/ui (Recomendado)

**Por qué shadcn/ui:**
- Componentes copiables (no dependencia npm)
- Tailwind CSS nativo
- Radix UI primitives (accesibilidad)
- Altamente customizable
- TypeScript first

**Setup:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card table dialog
```

### 7.2 Estructura de Componentes

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   └── dialog.tsx
│   │
│   ├── hmi/                   # HMI/SCADA components
│   │   ├── Gauge.tsx
│   │   ├── TankLevel.tsx
│   │   ├── PumpStatus.tsx
│   │   ├── ValveStatus.tsx
│   │   └── AlarmPanel.tsx
│   │
│   ├── charts/                # Chart components
│   │   ├── ProductionChart.tsx
│   │   ├── DeclineCurve.tsx
│   │   ├── PressureChart.tsx
│   │   └── IPRVLPChart.tsx
│   │
│   ├── maps/                  # Map components
│   │   ├── FieldMap.tsx
│   │   ├── WellPopup.tsx
│   │   └── PipelineLayer.tsx
│   │
│   ├── layout/                # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MainLayout.tsx
│   │   └── PageHeader.tsx
│   │
│   └── features/              # Feature-specific
│       ├── wells/
│       │   ├── WellCard.tsx
│       │   ├── WellTable.tsx
│       │   └── WellDetail.tsx
│       └── production/
│           ├── ProductionSummary.tsx
│           └── ProductionReport.tsx
```

---

## 8. Real-Time Updates

### 8.1 WebSocket Integration

```tsx
// lib/websocket.ts
import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: any) => void;

interface UseWebSocketOptions {
  url: string;
  onMessage?: MessageHandler;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
}

export const useWebSocket = ({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  reconnectInterval = 5000,
}: UseWebSocketOptions) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        onConnect?.();
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        onDisconnect?.();
        
        // Reconnect after delay
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error', error);
        ws.close();
      };
      
      wsRef.current = ws;
    } catch (e) {
      console.error('Failed to connect WebSocket', e);
    }
  }, [url, onMessage, onConnect, onDisconnect, reconnectInterval]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { send };
};

// Usage in component
const ProductionDashboard: React.FC = () => {
  const [realtimeData, setRealtimeData] = useState<ProductionData[]>([]);
  
  useWebSocket({
    url: `${WS_URL}/production`,
    onMessage: (data) => {
      setRealtimeData((prev) => [...prev.slice(-100), data]);
    },
    onConnect: () => console.log('Connected to production feed'),
  });

  return (
    <RealtimeChart data={realtimeData} />
  );
};
```

---

## 9. Stack Recomendado Final

### 9.1 Resumen de Tecnologías

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| **Framework** | React | 18.x |
| **Build Tool** | Vite | 5.x |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 3.x |
| **Components** | shadcn/ui | latest |
| **Charts** | Apache ECharts | 5.x |
| **Maps** | OpenLayers | 9.x |
| **State (Server)** | TanStack Query | 5.x |
| **State (Client)** | Zustand | 4.x |
| **Forms** | React Hook Form + Zod | 7.x |
| **Router** | React Router | 6.x |
| **Icons** | Lucide React | latest |
| **Tables** | TanStack Table | 8.x |

### 9.2 Estructura de Proyecto

```
src/
├── api/                      # API clients
│   ├── client.ts             # Axios instance
│   ├── wells.ts
│   ├── production.ts
│   └── alarms.ts
│
├── components/               # React components
│   ├── ui/                   # shadcn/ui
│   ├── hmi/                  # Industrial components
│   ├── charts/               # Chart components
│   ├── maps/                 # Map components
│   └── layout/               # Layout components
│
├── features/                 # Feature modules
│   ├── dashboard/
│   ├── wells/
│   ├── production/
│   ├── alarms/
│   └── reports/
│
├── hooks/                    # Custom hooks
│   ├── useWells.ts
│   ├── useWebSocket.ts
│   └── useAuth.ts
│
├── lib/                      # Utilities
│   ├── utils.ts
│   ├── constants.ts
│   └── formatters.ts
│
├── store/                    # Zustand stores
│   └── appStore.ts
│
├── types/                    # TypeScript types
│   ├── well.ts
│   ├── production.ts
│   └── api.ts
│
├── App.tsx
├── main.tsx
└── index.css
```

### 9.3 package.json

```json
{
  "name": "scada-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@tanstack/react-query": "^5.24.0",
    "@tanstack/react-table": "^8.12.0",
    "zustand": "^4.5.0",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "ol": "^9.0.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    "axios": "^1.6.7",
    "date-fns": "^3.3.1",
    "lucide-react": "^0.330.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.0",
    "vitest": "^1.2.2"
  }
}
```

---

## 10. Siguientes Pasos

1. **Scaffold proyecto** con Vite + React + TypeScript
2. **Configurar** Tailwind CSS + shadcn/ui
3. **Implementar** layout base (sidebar, header)
4. **Crear** componentes HMI básicos (Gauge, Tank)
5. **Integrar** OpenLayers con mapa de campo
6. **Conectar** con API backend (TanStack Query)
7. **Implementar** WebSocket para real-time

---

## 11. Referencias

### Documentación Oficial
- [React Documentation](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Apache ECharts](https://echarts.apache.org/)
- [OpenLayers](https://openlayers.org/)
- [Tailwind CSS](https://tailwindcss.com/)

### Recursos Adicionales
- [ECharts Examples](https://echarts.apache.org/examples/)
- [OpenLayers Workshop](https://openlayers.org/workshop/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
