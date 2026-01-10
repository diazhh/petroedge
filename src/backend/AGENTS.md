# BACKEND API - SCADA+ERP Petroleum Platform

Este es el componente de **Backend API** del sistema Edge. Proporciona todas las APIs REST para la gestión de datos operacionales y ERP.

---

## 📋 TRACKING DE PROGRESO

**IMPORTANTE**: El seguimiento de progreso se hace en `/PROGRESS.md` (raíz del proyecto).

### Antes de Trabajar en Backend
1. Consultar `/PROGRESS.md` → Sección "1.3 Backend API"
2. Verificar "Siguiente paso" y dependencias
3. Revisar roadmap detallado en `/roadmap/07_backend/` si es necesario

### Después de Completar Trabajo
1. Actualizar `/PROGRESS.md` → Sección "1.3 Backend API"
2. Mover tareas a "Completadas"
3. Actualizar porcentaje y "Siguiente paso"
4. Documentar bloqueadores si existen

**NO crear archivos STATUS.md o TODO.md en esta carpeta.**

---

## Stack Tecnológico

- **Runtime**: Node.js 20+ con TypeScript
- **Framework**: Fastify (APIs REST)
- **Base de Datos**: PostgreSQL 16 + TimescaleDB
- **ORM**: Drizzle ORM
- **Validación**: Zod
- **Autenticación**: JWT + RBAC

## Estructura de Módulos

Cada módulo sigue la arquitectura en capas:

```
modules/<module>/
├── <module>.controller.ts    # Handlers de rutas HTTP
├── <module>.service.ts       # Lógica de negocio
├── <module>.repository.ts    # Acceso a datos (Drizzle ORM)
├── <module>.schema.ts        # Esquemas Zod para validación
├── <module>.types.ts         # Tipos TypeScript
└── <module>.routes.ts        # Definición de rutas Fastify
```

## Módulos Implementados

### Core (Infraestructura)
- **auth**: Autenticación JWT, RBAC, gestión de usuarios
- **core/database**: Conexión DB, migraciones, esquemas
- **core/middleware**: Error handling, logging, rate limiting
- **core/config**: Configuración de aplicación

### Módulos Técnicos (Petroleros)
- **wells**: Gestión de pozos
- **well-testing**: Pruebas de pozo (IPR, VLP, Nodal Analysis)
- **drilling**: Operaciones de perforación
- **production**: Gestión de producción
- **coiled-tubing**: Intervenciones con coiled tubing
- **reservoirs**: Gestión de yacimientos

### Módulos ERP
- **inventory**: Control de inventario
- **finance**: Finanzas y contabilidad
- **hr**: Recursos humanos
- **maintenance**: Mantenimiento de equipos

## Convenciones de Código

### Naming Conventions
- **Archivos**: kebab-case (`well-testing.service.ts`)
- **Clases**: PascalCase (`WellTestService`)
- **Funciones/Variables**: camelCase (`calculateIpr`)
- **Constantes**: SCREAMING_SNAKE_CASE (`MAX_PRESSURE_PSI`)
- **Tipos/Interfaces**: PascalCase con prefijo I para interfaces (`IWellTest`)

### Estructura de Respuestas API

```typescript
// Respuesta exitosa
{
  "success": true,
  "data": {...},
  "meta": {
    "total": 100,
    "page": 1,
    "perPage": 20
  }
}

// Respuesta de error
{
  "success": false,
  "error": {
    "code": "WELL_NOT_FOUND",
    "message": "Well with ID xyz not found",
    "details": {...}
  }
}
```

### Códigos HTTP
- `200` - OK (GET, PUT exitoso)
- `201` - Created (POST exitoso)
- `204` - No Content (DELETE exitoso)
- `400` - Bad Request (validación fallida)
- `401` - Unauthorized (sin autenticación)
- `403` - Forbidden (sin permisos)
- `404` - Not Found
- `409` - Conflict (recurso duplicado)
- `500` - Internal Server Error

## Testing

- **Unit tests**: Vitest para lógica de negocio
- **Integration tests**: Tests de endpoints con DB en memoria
- **E2E tests**: Tests completos de flujos

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en watch mode
npm run test:watch
```

## Variables de Entorno

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/scadaerp
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Migraciones
npm run db:migrate
npm run db:seed

# Linting
npm run lint
npm run lint:fix
```

## Integración con Edge Gateway

El backend se comunica con el Edge Gateway vía:
- **MQTT**: Para recibir datos de telemetría en tiempo real
- **HTTP**: Para consultas de configuración

## Seguridad

- Todas las rutas requieren autenticación JWT (excepto `/auth/login`)
- RBAC implementado con roles: `admin`, `engineer`, `operator`, `viewer`
- Rate limiting: 100 req/min por IP
- Validación de input con Zod en todos los endpoints
- SQL injection prevention vía Drizzle ORM
- XSS prevention con sanitización de outputs

## Documentación API

La documentación OpenAPI/Swagger está disponible en:
- Desarrollo: `http://localhost:3000/docs`
- Producción: `https://edge-api.local/docs`
