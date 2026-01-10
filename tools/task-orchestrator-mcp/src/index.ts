#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PendingTask {
  section: string;
  sectionTitle: string;
  task: string;
  roadmap?: string;
  dependencies?: string;
  nextStep?: string;
}

interface TaskHistory {
  id: string;
  section: string;
  task: string;
  startedAt: string;
  completedAt?: string;
  summary?: string;
  success: boolean;
  error?: string;
}

interface OrchestratorConfig {
  maxIterations: number;
  currentIteration: number;
  autoContinue: boolean;
  projectRoot: string;
  history: TaskHistory[];
}

const CONFIG_PATH = join(__dirname, '..', 'config.json');
const LOG_PATH = join(__dirname, '..', 'tasks.log');
const PROGRESS_PATH = join(__dirname, '..', '..', '..', 'PROGRESS.md');

function loadConfig(): OrchestratorConfig {
  if (!existsSync(CONFIG_PATH)) {
    const defaultConfig: OrchestratorConfig = {
      maxIterations: 50,
      currentIteration: 0,
      autoContinue: true,
      projectRoot: join(__dirname, '..', '..', '..'),
      history: []
    };
    saveConfig(defaultConfig);
    return defaultConfig;
  }
  
  const content = readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(content);
}

function saveConfig(config: OrchestratorConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function log(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  appendFileSync(LOG_PATH, logMessage, 'utf-8');
}

function parseProgressMd(): PendingTask[] {
  if (!existsSync(PROGRESS_PATH)) {
    log(`⚠️ PROGRESS.md no encontrado en: ${PROGRESS_PATH}`);
    return [];
  }

  const content = readFileSync(PROGRESS_PATH, 'utf-8');
  const lines = content.split('\n');
  const pendingTasks: PendingTask[] = [];
  
  let currentSection = '';
  let currentSectionTitle = '';
  let inPendingSection = false;
  let roadmap = '';
  let dependencies = '';
  let nextStep = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      currentSection = line.replace('### ', '').trim();
      currentSectionTitle = currentSection;
      inPendingSection = false;
      roadmap = '';
      dependencies = '';
      nextStep = '';
      continue;
    }

    if (line.startsWith('**Roadmap**:')) {
      roadmap = line.replace('**Roadmap**:', '').trim();
    }

    if (line.startsWith('**Dependencias**:')) {
      dependencies = line.replace('**Dependencias**:', '').trim();
    }

    if (line.startsWith('**Siguiente paso**:')) {
      nextStep = line.replace('**Siguiente paso**:', '').trim();
    }

    if (line.includes('#### Tareas Pendientes')) {
      inPendingSection = true;
      continue;
    }

    if (inPendingSection) {
      if (line.startsWith('####') || line.startsWith('###') || line.startsWith('**')) {
        inPendingSection = false;
        continue;
      }

      if (line.trim().startsWith('- ⬜')) {
        const task = line.replace('- ⬜', '').trim();
        if (task && currentSection) {
          pendingTasks.push({
            section: currentSection,
            sectionTitle: currentSectionTitle,
            task,
            roadmap: roadmap || undefined,
            dependencies: dependencies || undefined,
            nextStep: nextStep || undefined
          });
        }
      }
    }
  }

  return pendingTasks;
}

const server = new Server(
  {
    name: 'task-orchestrator-mcp',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools: Tool[] = [
  {
    name: 'get_next_task',
    description: 'Obtiene la siguiente tarea pendiente consultando dinámicamente /PROGRESS.md según DOCUMENTATION_RULES.md',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'complete_current_task',
    description: 'Marca la tarea actual como completada. El agente debe actualizar manualmente /PROGRESS.md según DOCUMENTATION_RULES.md',
    inputSchema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Resumen conciso de lo completado',
        },
        success: {
          type: 'boolean',
          description: 'Si la tarea se completó exitosamente',
        },
        error: {
          type: 'string',
          description: 'Mensaje de error si falló (opcional)',
        },
      },
      required: ['summary', 'success'],
    },
  },
  {
    name: 'get_orchestration_status',
    description: 'Obtiene el estado de la orquestación: iteraciones, historial de tareas completadas',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'reset_orchestration',
    description: 'Reinicia el contador de iteraciones e historial',
    inputSchema: {
      type: 'object',
      properties: {
        confirm: {
          type: 'boolean',
          description: 'Debe ser true para confirmar',
        },
      },
      required: ['confirm'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_next_task': {
        const config = loadConfig();
        
        if (config.currentIteration >= config.maxIterations) {
          log(`⛔ Límite de iteraciones alcanzado: ${config.currentIteration}/${config.maxIterations}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'limit_reached',
                  message: `Se alcanzó el límite de ${config.maxIterations} iteraciones.`,
                  currentIteration: config.currentIteration,
                  maxIterations: config.maxIterations,
                }, null, 2),
              },
            ],
          };
        }

        const pendingTasks = parseProgressMd();
        
        if (pendingTasks.length === 0) {
          log(`✅ No hay tareas pendientes en PROGRESS.md`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'no_tasks',
                  message: '¡No hay tareas pendientes en PROGRESS.md! Consulta el documento para verificar el estado.',
                  completedInSession: config.history.filter(h => h.success).length,
                  failedInSession: config.history.filter(h => !h.success).length,
                }, null, 2),
              },
            ],
          };
        }

        const nextTask = pendingTasks[0];
        config.currentIteration++;
        saveConfig(config);
        
        const taskId = `task_${Date.now()}`;
        const historyEntry: TaskHistory = {
          id: taskId,
          section: nextTask.section,
          task: nextTask.task,
          startedAt: new Date().toISOString(),
          success: false,
        };
        config.history.push(historyEntry);
        saveConfig(config);

        log(`🚀 Iniciando tarea [${config.currentIteration}/${config.maxIterations}]: ${nextTask.section} - ${nextTask.task}`);

        const prompt = `Según PROGRESS.md, la siguiente tarea pendiente es:

**Sección**: ${nextTask.sectionTitle}
**Tarea**: ${nextTask.task}
${nextTask.roadmap ? `**Roadmap**: ${nextTask.roadmap}` : ''}
${nextTask.dependencies ? `**Dependencias**: ${nextTask.dependencies}` : ''}
${nextTask.nextStep ? `**Siguiente paso**: ${nextTask.nextStep}` : ''}

**IMPORTANTE**: 
1. Ejecuta esta tarea siguiendo las convenciones en AGENTS.md
2. Al terminar, ACTUALIZA /PROGRESS.md según DOCUMENTATION_RULES.md:
   - Mueve la tarea de "Pendientes" a "Completadas"
   - Actualiza el porcentaje de progreso
   - Actualiza "Siguiente paso"
   - Actualiza "Última actualización" con la fecha actual
3. Luego llama a complete_current_task() con el resumen

Procede con la implementación.`;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'task_ready',
                task: {
                  id: taskId,
                  section: nextTask.section,
                  task: nextTask.task,
                  prompt: prompt,
                },
                iteration: config.currentIteration,
                maxIterations: config.maxIterations,
                remainingTasks: pendingTasks.length - 1,
                message: `Ejecuta: ${nextTask.section} - ${nextTask.task}`,
              }, null, 2),
            },
          ],
        };
      }

      case 'complete_current_task': {
        const { summary, success, error } = args as { summary: string; success: boolean; error?: string };
        const config = loadConfig();
        
        const currentTask = config.history[config.history.length - 1];
        
        if (!currentTask || currentTask.completedAt) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: 'No hay tarea en progreso para completar.',
                }, null, 2),
              },
            ],
          };
        }

        currentTask.completedAt = new Date().toISOString();
        currentTask.summary = summary;
        currentTask.success = success;
        if (error) {
          currentTask.error = error;
        }
        
        saveConfig(config);
        
        const statusEmoji = success ? '✅' : '❌';
        log(`${statusEmoji} Tarea completada: ${currentTask.section} - ${currentTask.task}`);
        log(`   Resumen: ${summary}`);

        const pendingTasks = parseProgressMd();
        const shouldContinue = config.autoContinue && 
                               pendingTasks.length > 0 && 
                               config.currentIteration < config.maxIterations;

        const response: any = {
          status: 'task_completed',
          completedTask: {
            id: currentTask.id,
            section: currentTask.section,
            task: currentTask.task,
            success,
            summary,
          },
          progress: {
            completed: config.history.filter(h => h.success).length,
            failed: config.history.filter(h => !h.success).length,
            pendingInProgressMd: pendingTasks.length,
          },
          iteration: config.currentIteration,
          maxIterations: config.maxIterations,
        };

        if (shouldContinue) {
          response.nextAction = 'continue';
          response.message = '🔄 Continuando automáticamente con la siguiente tarea...';
          response.continuePrompt = 'continua con la implementacion';
          log(`🔄 Auto-continuación activada. Siguiente tarea disponible en PROGRESS.md`);
        } else if (config.currentIteration >= config.maxIterations) {
          response.nextAction = 'stop';
          response.message = `⛔ Límite de ${config.maxIterations} iteraciones alcanzado.`;
          log(`⛔ Límite de iteraciones alcanzado`);
        } else if (pendingTasks.length === 0) {
          response.nextAction = 'stop';
          response.message = '✅ ¡No hay más tareas pendientes en PROGRESS.md!';
          log(`✅ No hay más tareas pendientes`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'get_orchestration_status': {
        const config = loadConfig();
        const pendingTasks = parseProgressMd();
        
        const status = {
          currentIteration: config.currentIteration,
          maxIterations: config.maxIterations,
          autoContinue: config.autoContinue,
          canContinue: config.currentIteration < config.maxIterations,
          progressMdPath: PROGRESS_PATH,
          pendingTasksInProgressMd: pendingTasks.length,
          sessionHistory: {
            total: config.history.length,
            completed: config.history.filter(h => h.success).length,
            failed: config.history.filter(h => !h.success).length,
          },
          recentTasks: config.history.slice(-5).map(h => ({
            section: h.section,
            task: h.task,
            success: h.success,
            completedAt: h.completedAt,
            summary: h.summary,
          })),
          nextTasksPreview: pendingTasks.slice(0, 3).map(t => ({
            section: t.section,
            task: t.task,
          })),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'reset_orchestration': {
        const { confirm } = args as { confirm: boolean };
        
        if (!confirm) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: 'Debes confirmar el reinicio con confirm: true',
                }, null, 2),
              },
            ],
          };
        }

        const config = loadConfig();
        config.currentIteration = 0;
        config.history = [];
        
        saveConfig(config);
        log(`🔄 Orquestación reiniciada. Historial limpiado.`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'reset_complete',
                message: 'Orquestación reiniciada. Las tareas se leerán dinámicamente de PROGRESS.md',
              }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: `Herramienta desconocida: ${name}`,
              }, null, 2),
            },
          ],
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`❌ Error en ${name}: ${errorMessage}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: errorMessage,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('🚀 Task Orchestrator MCP Server v2.0 iniciado - Consulta dinámica de PROGRESS.md');
}

main().catch((error) => {
  log(`❌ Error fatal: ${error}`);
  console.error('Error fatal:', error);
  process.exit(1);
});
