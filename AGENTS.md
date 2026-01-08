# SCADA+ERP Petroleum Platform - Development Guidelines

Este proyecto es un sistema ERP+SCADA para la industria petrolera con arquitectura Edge-Cloud.

## Stack Tecnológico

### Backend
- **Runtime**: Node.js 20+ con TypeScript
- **Framework**: Fastify (APIs REST)
- **Base de Datos**: PostgreSQL 16 + TimescaleDB (series temporales)
- **ORM**: Drizzle ORM
- **Validación**: Zod
- **Autenticación**: JWT + RBAC
- **Comunicación**: MQTT, Modbus TCP/IP, OPC-UA

### Frontend
- **Framework**: React 18+ con TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: TailwindCSS
- **Estado**: Zustand + React Query
- **Gráficos**: Recharts, Apache ECharts
- **Mapas**: Leaflet

### Edge Computing
- **Runtime**: Node.js con PM2
- **Base de Datos Local**: SQLite
- **Comunicación**: MQTT con QoS 1/2

## Convenciones de Código

### General
- Usar TypeScript estricto (`strict: true`)
- Preferir `const` sobre `let`
- Usar async/await en lugar de callbacks
- Documentar funciones públicas con JSDoc
- Nombres en inglés para código, español para UI

### Naming Conventions
- **Archivos**: kebab-case (`well-testing.service.ts`)
- **Clases**: PascalCase (`WellTestService`)
- **Funciones/Variables**: camelCase (`calculateIpr`)
- **Constantes**: SCREAMING_SNAKE_CASE (`MAX_PRESSURE_PSI`)
- **Tipos/Interfaces**: PascalCase con prefijo I para interfaces (`IWellTest`)
- **Enums**: PascalCase (`WellStatus`)

### Estructura de Archivos Backend
```
src/modules/<module>/
├── <module>.controller.ts    # Handlers de rutas
├── <module>.service.ts       # Lógica de negocio
├── <module>.repository.ts    # Acceso a datos
├── <module>.schema.ts        # Esquemas Zod
├── <module>.types.ts         # Tipos TypeScript
└── <module>.routes.ts        # Definición de rutas
```

### Estructura de Archivos Frontend
```
src/features/<feature>/
├── components/               # Componentes específicos
├── hooks/                    # Custom hooks
├── api/                      # Llamadas API (React Query)
├── stores/                   # Estado Zustand
├── types/                    # Tipos
└── index.ts                  # Exports públicos
```

## Reglas de Base de Datos

- Usar UUID como primary keys
- Incluir `tenant_id` en tablas multi-tenant
- Incluir campos de auditoría: `created_at`, `updated_at`
- Usar TimescaleDB hypertables para datos de series temporales
- Crear índices para campos frecuentemente consultados
- Usar constraints CHECK para validaciones a nivel DB

## APIs REST

- Seguir convenciones RESTful
- Usar versionado: `/api/v1/`
- Respuestas JSON estandarizadas:
```json
{
  "success": true,
  "data": {...},
  "meta": {"total": 100, "page": 1}
}
```
- Códigos HTTP apropiados (200, 201, 400, 401, 403, 404, 500)
- Paginación con `page` y `per_page`

## Testing

- Tests unitarios con Vitest
- Tests de integración para APIs
- Cobertura mínima: 80%
- Naming: `*.test.ts` o `*.spec.ts`

## Git Workflow

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Branch naming: `feature/`, `fix/`, `hotfix/`
- PRs requieren review antes de merge
- No commits directos a `main`

## Seguridad

- Nunca hardcodear credenciales
- Usar variables de entorno para secrets
- Validar todo input del usuario
- Sanitizar queries SQL (usar ORM)
- Implementar rate limiting en APIs públicas

## Rendimiento

- Lazy loading para componentes pesados
- Virtualización para listas largas
- Debounce en búsquedas
- Caché de queries con React Query
- Compresión gzip en respuestas

## Documentación

- README.md en cada módulo
- Comentarios solo cuando el código no es auto-explicativo
- Mantener actualizada la documentación de API (OpenAPI/Swagger)
