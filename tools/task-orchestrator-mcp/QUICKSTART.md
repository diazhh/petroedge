# Task Orchestrator MCP v2.0 - Inicio Rápido

## ⚠️ Importante: Lectura Dinámica de PROGRESS.md

Este servidor MCP **NO usa archivos de tareas estáticas**. Lee las tareas directamente de `/PROGRESS.md` en tiempo real, siguiendo las reglas de `DOCUMENTATION_RULES.md`.

**Archivos**:
- ✅ `config.json` - Solo configuración (iteraciones, historial)
- ✅ `/PROGRESS.md` - Fuente de verdad para tareas
- ❌ `tasks.json` - NO EXISTE (obsoleto)

## Instalación Automática

```bash
cd /home/diazhh/dev/scadaerp/tools/task-orchestrator-mcp
./install.sh
```

## Configuración Manual

### 1. Instalar y Compilar

```bash
cd /home/diazhh/dev/scadaerp/tools/task-orchestrator-mcp
npm install
npm run build
```

### 2. Configurar en Windsurf

Edita el archivo de configuración de MCP:

**Linux**: `~/.config/windsurf/mcp_config.json`

Agrega esta configuración (reemplaza `/home/diazhh/dev/scadaerp` con tu ruta real):

```json
{
  "mcpServers": {
    "task-orchestrator": {
      "command": "node",
      "args": [
        "/home/diazhh/dev/scadaerp/tools/task-orchestrator-mcp/dist/index.js"
      ]
    }
  }
}
```

### 3. Reiniciar Windsurf

Cierra y abre Windsurf completamente para que cargue el servidor MCP.

### 4. Verificar Instalación

En Cascade, escribe:

```
Muéstrame el estado de la orquestación
```

Si ves una respuesta con estadísticas de tareas, ¡está funcionando! 🎉

## Uso Básico

### Configurar Tareas

Edita `tasks.json` con tus tareas:

```json
{
  "maxIterations": 50,
  "currentIteration": 0,
  "autoContinue": true,
  "tasks": [
    {
      "id": "task_001",
      "title": "Tu tarea aquí",
      "prompt": "Descripción detallada de lo que debe hacer...",
      "status": "pending"
    }
  ]
}
```

### Iniciar Ejecución Automática

En Cascade, simplemente escribe:

```
Consulta la siguiente tarea y ejecútala
```

Cascade automáticamente:
1. Obtendrá la primera tarea
2. La ejecutará
3. Al terminar, pasará a la siguiente
4. Se repetirá hasta completar todas o alcanzar el límite

### Monitorear Progreso

```
Muéstrame el estado de la orquestación
```

### Agregar Tarea Durante Ejecución

```
Agrega una nueva tarea: "Implementar módulo X"
```

### Reiniciar

```
Reinicia la orquestación
```

## Archivos Importantes

- **`tasks.json`**: Configuración y estado de tareas
- **`tasks.log`**: Historial de ejecución
- **`README.md`**: Documentación completa

## Troubleshooting

### No aparece el servidor en Cascade

1. Verifica que la ruta en `mcp_config.json` sea absoluta
2. Asegúrate de haber ejecutado `npm run build`
3. Reinicia Windsurf completamente
4. Revisa logs: `Help > Toggle Developer Tools > Console`

### Las tareas no continúan automáticamente

1. Verifica `"autoContinue": true` en `tasks.json`
2. Revisa que `currentIteration < maxIterations`
3. Consulta `tasks.log` para errores

## Ejemplo Completo

```bash
# 1. Instalar
cd /home/diazhh/dev/scadaerp/tools/task-orchestrator-mcp
./install.sh

# 2. Configurar Windsurf (ver arriba)

# 3. Reiniciar Windsurf

# 4. En Cascade:
"Consulta la siguiente tarea y ejecútala"

# El sistema ejecutará automáticamente todas las tareas
# configuradas en tasks.json hasta completarlas o
# alcanzar el límite de 50 iteraciones
```

## Próximos Pasos

1. Lee `README.md` para documentación completa
2. Personaliza `tasks.json` con tus tareas
3. Revisa `AGENTS.md` en la raíz del proyecto para las reglas de uso
