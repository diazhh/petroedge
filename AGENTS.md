# SCADA+ERP PETROLERO - CONVENCIONES DE DESARROLLO

Este proyecto es un sistema ERP+SCADA para la industria petrolera con arquitectura Edge-Cloud.

---

## SISTEMA DE DOCUMENTACIÓN Y TRACKING

### Documento Central de Progreso
**Archivo**: `/PROGRESS.md` (raíz del proyecto)

Este es el **ÚNICO documento oficial** para tracking de progreso. Todos los agentes DEBEN:

1. **CONSULTAR** `PROGRESS.md` ANTES de iniciar cualquier trabajo
2. **ACTUALIZAR** `PROGRESS.md` DESPUÉS de completar tareas
3. **NO CREAR** documentos de progreso adicionales (evitar `STATUS.md`, `TODO.md`, etc.)

### Estructura de Documentación

```
/PROGRESS.md                    ← TRACKING CENTRALIZADO (consultar/actualizar)
/QUICKSTART.md                  ← Guía de inicio rápido
/IMPLEMENTATION_STATUS.md       ← Snapshot temporal (NO actualizar)
/roadmap/                       ← Roadmaps detallados (referencia)
  ├── 00_MASTER_ROADMAP.md     ← Plan maestro
  ├── 01_arquitectura/         ← Roadmap de arquitectura
  ├── 02_modulo_well_testing/  ← Roadmap Well Testing
  └── ...
/AGENTS.md                      ← Este archivo (convenciones)
```

### Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE TRABAJO                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CONSULTAR /PROGRESS.md                                  │
│     ↓                                                        │
│  2. Identificar próxima tarea                               │
│     ↓                                                        │
│  3. Revisar roadmap detallado si es necesario               │
│     ↓                                                        │
│  4. EJECUTAR trabajo                                        │
│     ↓                                                        │
│  5. ACTUALIZAR /PROGRESS.md con:                            │
│     - Estado actualizado                                    │
│     - Tareas completadas                                    │
│     - Próximo paso                                          │
│     - Bloqueadores (si existen)                             │
│     ↓                                                        │
│  6. Commit cambios                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Reglas de Documentación

✅ **HACER**:
- Consultar `/PROGRESS.md` al inicio de cada sesión
- Actualizar `/PROGRESS.md` después de cada tarea completada
- Usar roadmaps en `/roadmap/` como referencia técnica
- Mantener `QUICKSTART.md` actualizado con comandos

❌ **NO HACER**:
- Crear archivos `STATUS.md`, `TODO.md`, `PROGRESS_*.md` adicionales
- Duplicar información de progreso en múltiples lugares
- Actualizar `IMPLEMENTATION_STATUS.md` (es un snapshot)
- Crear documentos de tracking en carpetas individuales

---

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

---

## 📊 Actualización de Progreso

### Cuándo Actualizar `/PROGRESS.md`

**SIEMPRE actualizar después de**:
- ✅ Completar una tarea o subtarea
- ✅ Completar un módulo o componente
- ✅ Cambiar el estado de un roadmap
- ✅ Encontrar un bloqueador
- ✅ Resolver un bloqueador
- ✅ Iniciar trabajo en un nuevo componente

### Cómo Actualizar

1. Abrir `/PROGRESS.md`
2. Localizar la sección del componente/módulo
3. Actualizar:
   - Estado (🟢🟡🟠⚪🔴)
   - Porcentaje de progreso
   - Mover tareas de "Pendientes" a "Completadas"
   - Actualizar "Siguiente paso"
   - Documentar bloqueadores si existen
   - Actualizar "Última actualización" con fecha
4. Guardar cambios

### Estados Válidos

- **🟢 Completado**: 100% - Todas las tareas terminadas y verificadas
- **🟡 En Progreso**: 1-99% - Trabajo activo en el componente
- **🟠 Bloqueado**: Esperando dependencias o resolución de problemas
- **⚪ Pendiente**: 0% - No iniciado
- **🔴 Problema**: Error crítico que requiere atención inmediata

### Ejemplo de Actualización

```markdown
### 1.3 Backend API (Node.js + Fastify)
**Estado**: 🟡 En Progreso (45%)  ← Actualizar porcentaje
**Última actualización**: 2026-01-08  ← Actualizar fecha

#### Tareas Completadas
- ✅ Estructura de proyecto creada
- ✅ Dependencias instaladas
- ✅ Servidor Fastify iniciado  ← Mover de Pendientes

#### Tareas en Progreso
- 🟡 Implementando módulo de autenticación  ← Agregar si aplica

#### Tareas Pendientes
- ⬜ Implementar módulo de usuarios
- ⬜ Conectar con PostgreSQL

**Siguiente paso**: Completar módulo de autenticación  ← Actualizar
**Bloqueadores**: Ninguno  ← Documentar si existen
```

---

## 🔍 Consulta de Próxima Tarea

### Antes de Iniciar Trabajo

1. Abrir `/PROGRESS.md`
2. Revisar sección "🎯 Próxima Tarea a Ejecutar"
3. Verificar dependencias completadas
4. Revisar roadmap detallado si es necesario
5. Iniciar trabajo

### Si No Hay Tarea Clara

1. Revisar "Estado General del Proyecto"
2. Identificar fase actual
3. Buscar tareas con estado ⚪ Pendiente sin bloqueadores
4. Priorizar según dependencias
5. Actualizar "Próxima Tarea a Ejecutar" en `/PROGRESS.md`

---

## 🤖 Task Orchestrator MCP - Automatización de Tareas

### Descripción

El **Task Orchestrator MCP** es un servidor MCP que permite ejecutar tareas de desarrollo de forma automática y secuencial. Al completar una tarea, automáticamente pasa a la siguiente hasta completar todas o alcanzar el límite de iteraciones (default: 50).

**Ubicación**: `/tools/task-orchestrator-mcp/`

### Reglas de Uso para Agentes

**IMPORTANTE**: Cuando el Task Orchestrator MCP esté activo, los agentes DEBEN seguir este flujo:

#### 1. Inicio de Sesión con Orquestador

Al iniciar una sesión de trabajo automatizado:

```
1. Llamar a get_next_task() para obtener la siguiente tarea
2. Ejecutar el prompt de la tarea recibida
3. Al completar, llamar a complete_current_task() con resumen
4. Si la respuesta incluye continuePrompt, ejecutarlo inmediatamente
5. Repetir hasta que no haya más tareas o se alcance el límite
```

#### 2. Completar Tareas

Al terminar una tarea, **SIEMPRE**:

```typescript
complete_current_task({
  summary: "Descripción concisa de lo completado (2-3 líneas)",
  success: true, // o false si falló
  error: "Mensaje de error" // solo si success: false
})
```

#### 3. Auto-Continuación

Cuando `complete_current_task()` retorne:

```json
{
  "nextAction": "continue",
  "continuePrompt": "continua con la implementacion"
}
```

El agente DEBE:
- Ejecutar inmediatamente el prompt: **"continua con la implementacion"**
- NO esperar instrucciones del usuario
- NO preguntar si debe continuar
- Simplemente proceder con la siguiente tarea

#### 4. Detención

El orquestador se detiene automáticamente cuando:
- ✅ Se completan todas las tareas
- ⛔ Se alcanza el límite de iteraciones (default: 50)
- ❌ Una tarea falla y no puede continuar

#### 5. Monitoreo

Para verificar el estado en cualquier momento:

```
get_orchestration_status()
```

Retorna:
- Iteración actual / máxima
- Tareas completadas, fallidas, pendientes
- Lista detallada de todas las tareas

### Ejemplo de Flujo Completo

```
Usuario: "Consulta la siguiente tarea y ejecútala"

Agente:
  1. Llama get_next_task()
  2. Recibe: "Implementar módulo de autenticación con JWT..."
  3. Ejecuta la implementación (crea archivos, código, tests)
  4. Llama complete_current_task({
       summary: "Módulo de auth implementado con JWT, login, register y refresh token",
       success: true
     })
  5. Recibe: { nextAction: "continue", continuePrompt: "continua con la implementacion" }
  6. Automáticamente ejecuta: "continua con la implementacion"
  7. Vuelve al paso 1 (get_next_task)
  
  ... Se repite hasta completar todas las tareas o límite ...
```

### Configuración de Tareas

Las tareas se configuran en: `/tools/task-orchestrator-mcp/tasks.json`

```json
{
  "maxIterations": 50,
  "currentIteration": 0,
  "autoContinue": true,
  "tasks": [
    {
      "id": "task_001",
      "title": "Título descriptivo",
      "prompt": "Prompt completo que se ejecutará",
      "status": "pending"
    }
  ]
}
```

### Herramientas Disponibles

1. **`get_next_task()`**: Obtiene la siguiente tarea pendiente
2. **`complete_current_task(summary, success, error?)`**: Marca tarea como completada
3. **`get_orchestration_status()`**: Estado general de la orquestación
4. **`add_task(title, prompt)`**: Agrega nueva tarea a la cola
5. **`reset_orchestration(confirm)`**: Reinicia el contador y tareas

### Logs y Seguimiento

- **Estado**: `/tools/task-orchestrator-mcp/tasks.json`
- **Historial**: `/tools/task-orchestrator-mcp/tasks.log`

### Integración con PROGRESS.md

El Task Orchestrator **complementa** (no reemplaza) el sistema de tracking en `/PROGRESS.md`:

- Usar Task Orchestrator para **ejecución automatizada** de tareas predefinidas
- Seguir actualizando `/PROGRESS.md` después de cada tarea completada
- El orquestador maneja el flujo, `/PROGRESS.md` mantiene el estado del proyecto

### Cuándo Usar el Orquestador

✅ **Usar cuando**:
- Hay una lista clara de tareas secuenciales
- Las tareas son independientes o tienen dependencias lineales
- Se quiere automatizar la ejecución sin intervención manual
- Se necesita ejecutar múltiples tareas en una sesión

❌ **NO usar cuando**:
- Las tareas requieren decisiones del usuario
- Hay alta incertidumbre en los requisitos
- Se necesita exploración o investigación
- Las tareas tienen dependencias complejas no lineales
