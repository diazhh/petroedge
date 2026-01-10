# Task Orchestrator MCP Server v2.0

Servidor MCP (Model Context Protocol) para orquestar tareas de desarrollo siguiendo **DOCUMENTATION_RULES.md**.

## 🎯 Características

- ✅ **Consulta dinámica de `/PROGRESS.md`**: Lee tareas pendientes en tiempo real
- ✅ **Sigue DOCUMENTATION_RULES.md**: Única fuente de verdad para tareas
- ✅ **Auto-continuación**: Al completar una tarea, automáticamente pasa a la siguiente
- ✅ **Límite de iteraciones**: Protección contra loops infinitos (default: 50)
- ✅ **Historial de sesión**: Registra tareas completadas en la sesión actual
- ✅ **Logging completo**: Historial de ejecución en `tasks.log`
- ✅ **Sin tareas hardcodeadas**: Todo se lee dinámicamente de `/PROGRESS.md`

## 📦 Instalación

```bash
cd tools/task-orchestrator-mcp
npm install
npm run build
```

## ⚙️ Configuración en Windsurf

Agrega el servidor MCP a tu configuración de Windsurf:

**macOS/Linux**: `~/.config/windsurf/mcp_config.json`
**Windows**: `%APPDATA%\windsurf\mcp_config.json`

```json
{
  "mcpServers": {
    "task-orchestrator": {
      "command": "node",
      "args": [
        "/ruta/absoluta/a/scadaerp/tools/task-orchestrator-mcp/dist/index.js"
      ]
    }
  }
}
```

**Importante**: Reemplaza `/ruta/absoluta/a/scadaerp` con la ruta real de tu proyecto.

Después de configurar, **reinicia Windsurf** para que cargue el servidor MCP.

## 🚀 Uso

### 1. Asegurar que `/PROGRESS.md` esté actualizado

El orquestador lee tareas directamente de `/PROGRESS.md`. Asegúrate de que:

- Las secciones tengan "#### Tareas Pendientes"
- Las tareas pendientes estén marcadas con `- ⬜`
- El documento siga el formato de `DOCUMENTATION_RULES.md`

Ejemplo en `/PROGRESS.md`:

```markdown
### 1.3 Backend API
**Estado**: 🟡 En Progreso (85%)

#### Tareas Pendientes
- ⬜ Implementar error handling global mejorado
- ⬜ Configurar tests con Vitest
- ⬜ Implementar rate limiting
```

### 2. Iniciar Orquestación

En Cascade, simplemente escribe:

```
Consulta la siguiente tarea y ejecútala
```

Cascade automáticamente:
1. Llamará a `get_next_task()` → Lee `/PROGRESS.md` y extrae la primera tarea pendiente
2. Ejecutará el prompt de la tarea
3. **IMPORTANTE**: Cascade debe actualizar `/PROGRESS.md` según `DOCUMENTATION_RULES.md`
4. Al terminar, llamará a `complete_current_task()`
5. Si `autoContinue: true`, continuará con la siguiente tarea
6. Se detendrá al alcanzar el límite de iteraciones o cuando no haya más tareas en `/PROGRESS.md`

### 3. Monitorear Progreso

```
Muéstrame el estado de la orquestación
```

Cascade llamará a `get_orchestration_status()` y mostrará:
- Iteración actual / máxima
- Tareas pendientes en `/PROGRESS.md` (conteo en tiempo real)
- Historial de tareas completadas en esta sesión
- Preview de próximas 3 tareas

## 🛠️ Herramientas Disponibles

### `get_next_task()`
**Lee dinámicamente `/PROGRESS.md`** y extrae la primera tarea pendiente.

**Retorna**:
- `task`: Información de la tarea (section, task, prompt con contexto)
- `iteration`: Iteración actual
- `maxIterations`: Límite de iteraciones
- `remainingTasks`: Tareas pendientes en `/PROGRESS.md`

### `complete_current_task(summary, success, error?)`
Marca la tarea actual como completada en el historial de la sesión.

**IMPORTANTE**: El agente debe actualizar manualmente `/PROGRESS.md` según `DOCUMENTATION_RULES.md` antes de llamar a esta herramienta.

**Parámetros**:
- `summary` (string): Resumen de lo realizado
- `success` (boolean): Si se completó exitosamente
- `error` (string, opcional): Mensaje de error si falló

**Retorna**:
- `completedTask`: Información de la tarea completada
- `progress`: Estadísticas de progreso
- `nextAction`: 'continue' o 'stop'
- `continuePrompt`: "continua con la implementacion" (si debe continuar)

### `get_orchestration_status()`
Obtiene el estado de la orquestación consultando `/PROGRESS.md` en tiempo real.

**Retorna**:
- `currentIteration` / `maxIterations`
- `pendingTasksInProgressMd`: Conteo actual de tareas en `/PROGRESS.md`
- `sessionHistory`: Tareas completadas/fallidas en esta sesión
- `nextTasksPreview`: Preview de próximas 3 tareas

### `reset_orchestration(confirm)`
Reinicia el contador de iteraciones e historial de la sesión.

**Parámetros**:
- `confirm` (boolean): Debe ser `true` para confirmar

## 📝 Archivos

- **`config.json`**: Configuración (maxIterations, currentIteration, history)
- **`tasks.log`**: Historial de ejecución con timestamps
- **`/PROGRESS.md`**: Fuente de verdad para tareas (raíz del proyecto)
- **`src/index.ts`**: Código fuente del servidor MCP
- **`dist/index.js`**: Código compilado (generado por `npm run build`)

## 🔄 Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────┐
│  Usuario: "Consulta la siguiente tarea y ejecútala"    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Cascade llama: get_next_task()                         │
│  → Servidor lee /PROGRESS.md en tiempo real             │
│  → Extrae primera tarea con "- ⬜"                       │
│  → Retorna: tarea con contexto (sección, roadmap, etc.) │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Cascade ejecuta la tarea                               │
│  (Implementa código, crea archivos, etc.)               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Cascade ACTUALIZA /PROGRESS.md:                        │
│  - Mueve tarea de "Pendientes" a "Completadas"         │
│  - Actualiza porcentaje de progreso                    │
│  - Actualiza "Siguiente paso"                           │
│  - Actualiza fecha (según DOCUMENTATION_RULES.md)       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Cascade llama: complete_current_task(                  │
│    summary: "Tarea completada...",                      │
│    success: true                                        │
│  )                                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Servidor MCP retorna:                                  │
│  {                                                      │
│    nextAction: "continue",                              │
│    continuePrompt: "continua con la implementacion"     │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Cascade automáticamente ejecuta:                       │
│  "continua con la implementacion"                       │
│  → Vuelve a llamar get_next_task()                      │
│  → Lee /PROGRESS.md actualizado                         │
└─────────────────────────────────────────────────────────┘
                         ↓
            (Se repite hasta que /PROGRESS.md
             no tenga más tareas pendientes
             o se alcance el límite de 50)
```

## ⚠️ Limitaciones y Consideraciones

1. **Límite de iteraciones**: Por defecto 50. Ajusta `maxIterations` en `tasks.json` si necesitas más.

2. **Contexto acumulado**: Cascade mantiene el contexto en la misma sesión de chat. Para tareas muy largas, considera dividirlas en subtareas más pequeñas.

3. **Aprobación de comandos**: Comandos destructivos o que requieren permisos seguirán pidiendo aprobación del usuario.

4. **Tareas complejas**: Si una tarea requiere decisiones del usuario, el flujo se pausará hasta que el usuario responda.

## 🐛 Troubleshooting

### El servidor no aparece en Cascade

1. Verifica que la ruta en `mcp_config.json` sea absoluta y correcta
2. Asegúrate de haber ejecutado `npm run build`
3. Reinicia Windsurf completamente
4. Revisa los logs de Windsurf: `Help > Toggle Developer Tools > Console`

### Las tareas no se ejecutan automáticamente

1. Verifica que `autoContinue: true` en `tasks.json`
2. Asegúrate de que `currentIteration < maxIterations`
3. Revisa `tasks.log` para ver si hay errores

### Error "Cannot find module '@modelcontextprotocol/sdk'"

Ejecuta `npm install` en el directorio del servidor MCP.

## 📊 Ejemplo de tasks.log

```
[2026-01-08T22:30:15.234Z] 🚀 Task Orchestrator MCP Server iniciado
[2026-01-08T22:30:20.123Z] 🚀 Iniciando tarea [1/50]: Implementar autenticación
[2026-01-08T22:35:45.678Z] ✅ Tarea completada: Implementar autenticación - Módulo de auth con JWT implementado
[2026-01-08T22:35:46.012Z] 🔄 Auto-continuación activada. Siguiente tarea: Crear módulo de usuarios
[2026-01-08T22:35:47.234Z] 🚀 Iniciando tarea [2/50]: Crear módulo de usuarios
```

## 🔧 Desarrollo

```bash
# Modo desarrollo (recompila automáticamente)
npm run dev

# Compilar
npm run build

# Ejecutar directamente
npm start
```

## 📄 Licencia

MIT
