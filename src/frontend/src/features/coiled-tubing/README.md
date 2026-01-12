# Módulo Coiled Tubing - Frontend

## Descripción

Módulo frontend para la gestión de operaciones de Coiled Tubing, incluyendo unidades CT, carretes y trabajos.

## Estructura del Módulo

```
/features/coiled-tubing/
├── api/                    # React Query hooks y API calls
│   ├── ct-units.api.ts
│   ├── ct-reels.api.ts
│   ├── ct-jobs.api.ts
│   └── index.ts
├── components/             # Componentes reutilizables
│   ├── CtUnitsTable.tsx
│   ├── CtReelsTable.tsx
│   ├── CtJobsTable.tsx
│   └── index.ts
├── pages/                  # Páginas principales
│   ├── CtUnitsList.tsx
│   ├── CtUnitDetail.tsx
│   ├── CtUnitForm.tsx
│   └── index.ts
├── schemas/                # Schemas de validación Zod
│   └── index.ts
├── types/                  # TypeScript types
│   └── index.ts
├── constants/              # Constantes y enums
│   └── index.ts
└── index.ts               # Exports públicos
```

## Características Implementadas

### ✅ Infraestructura Base
- Tipos TypeScript completos para Units, Reels, Jobs, BHA, Fluids, Operations
- Schemas de validación Zod
- Constantes y enums (status, tipos, colores)
- Sistema de permisos granular

### ✅ API Integration
- React Query hooks para CRUD operations
- Hooks para CT Units (useCtUnits, useCtUnit, useCreateCtUnit, etc.)
- Hooks para CT Reels (incluye gestión de secciones y cortes)
- Hooks para CT Jobs (incluye BHA, fluidos, operaciones, cálculos)
- Manejo de caché y invalidación automática

### ✅ Traducciones i18n
- Español (ES) completo
- Inglés (EN) completo
- Namespace: `coiled-tubing`

### ✅ Componentes Reutilizables
- `CtUnitsTable`: Tabla de unidades con acciones
- `CtReelsTable`: Tabla de carretes con indicador de fatiga
- `CtJobsTable`: Tabla de trabajos con badges de estado

### ✅ Páginas CT Units
- **Lista**: Filtros, paginación, búsqueda
- **Detalle**: 5 tabs (Info, Specs, Reels, Jobs, Maintenance)
- **Formulario**: Crear/Editar con validación

### ✅ Páginas CT Reels
- **Lista**: Filtros (status, manufacturer, fatigue range), paginación
- **Detalle**: 5 tabs (Info, Specs, Fatigue, Cuts, Jobs)
- **Formulario**: Crear/Editar con validación de diámetros

### ✅ Páginas CT Jobs
- **Lista**: Filtros (status, type, dates), paginación
- **Detalle**: 8 tabs (Info, BHA, Fluids, Operations, Calculations, Alarms, Costs, Ticket)
- **Formulario**: Crear/Editar con validación

### ✅ Dashboard Principal
- **KPIs**: Unidades activas, carretes disponibles, jobs en progreso, utilización
- **Cards de navegación**: Acceso rápido a Units, Reels, Jobs
- **Permisos**: Control de acceso granular por sección

### ✅ Integración con Router
- **Rutas configuradas**: Todas las páginas integradas en App.tsx
- **Sidebar**: Menú Coiled Tubing con submenú (Units, Reels, Jobs)
- **Navegación**: Breadcrumbs en todas las páginas

## Rutas

```typescript
/coiled-tubing                    // Dashboard principal
/coiled-tubing/units              // Lista de unidades
/coiled-tubing/units/new          // Crear unidad
/coiled-tubing/units/:id          // Detalle de unidad
/coiled-tubing/units/:id/edit     // Editar unidad

/coiled-tubing/reels              // Lista de carretes
/coiled-tubing/reels/new          // Crear carrete
/coiled-tubing/reels/:id          // Detalle de carrete
/coiled-tubing/reels/:id/edit     // Editar carrete

/coiled-tubing/jobs               // Lista de trabajos
/coiled-tubing/jobs/new           // Crear trabajo
/coiled-tubing/jobs/:id           // Detalle de trabajo
/coiled-tubing/jobs/:id/edit      // Editar trabajo
/coiled-tubing/jobs/:id/monitor   // Monitor en tiempo real (pendiente)
```

## Permisos

```typescript
// Units
coiled-tubing:units:read
coiled-tubing:units:create
coiled-tubing:units:update
coiled-tubing:units:delete

// Reels
coiled-tubing:reels:read
coiled-tubing:reels:create
coiled-tubing:reels:update
coiled-tubing:reels:delete

// Jobs
coiled-tubing:jobs:read
coiled-tubing:jobs:create
coiled-tubing:jobs:update
coiled-tubing:jobs:delete

// Calculations & Operations
coiled-tubing:calculations:run
coiled-tubing:operations:monitor
coiled-tubing:reports:view
```

## Uso

### Importar componentes

```typescript
import { CtUnitsList, CtUnitDetail, CtUnitForm } from '@/features/coiled-tubing/pages';
import { CtUnitsTable } from '@/features/coiled-tubing/components';
import { useCtUnits, useCreateCtUnit } from '@/features/coiled-tubing/api';
```

### Ejemplo de uso de hooks

```typescript
// Listar unidades con filtros
const { data, isLoading } = useCtUnits({ status: 'active' }, 1, 10);

// Obtener una unidad
const { data: unit } = useCtUnit(unitId);

// Crear unidad
const createUnit = useCreateCtUnit();
await createUnit.mutateAsync(formData);

// Actualizar unidad
const updateUnit = useUpdateCtUnit();
await updateUnit.mutateAsync({ id: unitId, data: formData });
```

## Próximos Pasos

### Pendiente de Implementación

1. **Componentes Adicionales**
   - CtReelSectionsTable
   - CtFatigueChart
   - CtOperationsTimeline
   - CtBhaDesigner
   - CtRealtimeDashboard
   - CtJobTicketViewer

2. **Dashboard Principal**
   - KPIs (unidades activas, carretes en uso, jobs en progreso)
   - Gráficos de utilización
   - Alertas de fatiga crítica

3. **Integración con Router**
   - Agregar rutas al router principal de la aplicación
   - Configurar navegación en sidebar

4. **Wizard de Creación de Jobs**
   - Implementar wizard de 6 pasos para crear jobs
   - Diseñador visual de BHA
   - Configuración de fluidos

5. **Monitor en Tiempo Real**
   - Dashboard de monitoreo de jobs activos
   - Gráficos en tiempo real (depth, pressure, weight)
   - WebSocket integration

## Notas Técnicas

- **Validación**: Usa Zod schemas para validación de formularios
- **Estado**: React Query maneja el estado del servidor
- **Permisos**: Usa `CanDo` y `PermissionGate` para control de acceso
- **Traducciones**: Usa `useTranslation('coiled-tubing')` para i18n
- **Notificaciones**: Usa `toast` de sonner para feedback al usuario
- **Navegación**: Sigue el patrón Lista → Detalle → Formulario → Detalle

## Dependencias

- React 18+
- React Router DOM
- React Hook Form
- Zod
- TanStack Query (React Query)
- i18next
- date-fns
- lucide-react
- sonner (toast notifications)
- shadcn/ui components

## Backend API

El módulo consume los siguientes endpoints:

- `GET /api/v1/coiled-tubing/units`
- `GET /api/v1/coiled-tubing/units/:id`
- `POST /api/v1/coiled-tubing/units`
- `PATCH /api/v1/coiled-tubing/units/:id`
- `DELETE /api/v1/coiled-tubing/units/:id`

(Similar para reels, jobs, bha-components, job-fluids, job-operations, job-calculations)

## Documentación Relacionada

- Planificación completa: `/home/diazhh/dev/scadaerp/ct.md` (Sección 15)
- Backend API: `/home/diazhh/dev/scadaerp/src/backend/src/modules/coiled-tubing/`
- Migraciones DB: `/home/diazhh/dev/scadaerp/database/postgres/migrations/017_create_coiled_tubing_module.sql`
