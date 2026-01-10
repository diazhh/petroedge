#!/bin/bash

# Script de instalación del Task Orchestrator MCP
# Uso: ./install.sh

set -e

echo "🚀 Instalando Task Orchestrator MCP..."

# Obtener ruta absoluta del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📁 Directorio del proyecto: $PROJECT_ROOT"

# Instalar dependencias
echo "📦 Instalando dependencias..."
cd "$SCRIPT_DIR"
npm install

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build

# Detectar sistema operativo y configurar ruta de config
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_PATH="$HOME/.config/windsurf/mcp_config.json"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_PATH="$HOME/.config/windsurf/mcp_config.json"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    CONFIG_PATH="$APPDATA/windsurf/mcp_config.json"
else
    echo "⚠️  Sistema operativo no reconocido. Configura manualmente."
    CONFIG_PATH=""
fi

echo ""
echo "✅ Instalación completada!"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Configura el servidor MCP en Windsurf:"
echo "   Archivo: $CONFIG_PATH"
echo ""
echo "   Agrega esta configuración:"
echo ""
echo '   {'
echo '     "mcpServers": {'
echo '       "task-orchestrator": {'
echo '         "command": "node",'
echo "         \"args\": [\"$SCRIPT_DIR/dist/index.js\"]"
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "2. Reinicia Windsurf completamente"
echo ""
echo "3. Edita las tareas en: $SCRIPT_DIR/tasks.json"
echo ""
echo "4. En Cascade, escribe: 'Consulta la siguiente tarea y ejecútala'"
echo ""
echo "📖 Documentación completa en: $SCRIPT_DIR/README.md"
echo ""
