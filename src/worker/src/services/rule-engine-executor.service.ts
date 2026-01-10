import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/index.js';
import { nodeRegistry } from '../rule-engine/node-registry.js';

export interface RuleExecutionContext {
  assetId: string;
  tenantId: string;
  triggerType: 'telemetry_change' | 'attribute_change' | 'status_change' | 'manual' | 'schedule';
  data: Record<string, any>;
  timestamp: string;
}

export interface Rule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: string;
  assetTypeId?: string;
  assetId?: string;
  configuration: {
    nodes: Array<{
      id: string;
      type: string;
      config: Record<string, any>;
      position: { x: number; y: number };
    }>;
    connections: Array<{
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }>;
  };
}

/**
 * Rule Engine Executor Service
 * 
 * Ejecuta reglas del motor de reglas basado en eventos
 */
export class RuleEngineExecutorService {
  private client: postgres.Sql;
  private db: ReturnType<typeof drizzle>;

  constructor() {
    this.client = postgres(CONFIG.postgres.url);
    this.db = drizzle(this.client);
  }

  /**
   * Buscar reglas aplicables para un contexto
   */
  async findApplicableRules(context: RuleExecutionContext): Promise<Rule[]> {
    try {
      const result = await this.db.execute(sql`
        SELECT 
          id, tenant_id, name, description, is_active,
          trigger_type, asset_type_id, asset_id, configuration
        FROM rules
        WHERE tenant_id = ${context.tenantId}
          AND is_active = true
          AND trigger_type = ${context.triggerType}
          AND (
            asset_id = ${context.assetId}
            OR asset_id IS NULL
          )
        ORDER BY priority DESC, created_at ASC
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        description: row.description,
        isActive: row.is_active,
        triggerType: row.trigger_type,
        assetTypeId: row.asset_type_id,
        assetId: row.asset_id,
        configuration: row.configuration,
      }));
    } catch (error) {
      logger.error('Error finding applicable rules', { error, context });
      return [];
    }
  }

  /**
   * Ejecutar una regla
   */
  async executeRule(rule: Rule, context: RuleExecutionContext): Promise<void> {
    const executionId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      logger.info('Executing rule', {
        executionId,
        ruleId: rule.id,
        ruleName: rule.name,
        assetId: context.assetId,
      });

      // Crear log de ejecución
      await this.createExecutionLog(executionId, rule.id, context, 'running');

      // Ejecutar nodos de la regla
      const result = await this.executeRuleNodes(rule, context);

      // Actualizar log con resultado
      const duration = Date.now() - startTime;
      await this.updateExecutionLog(executionId, 'success', result, duration);

      logger.info('Rule executed successfully', {
        executionId,
        ruleId: rule.id,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Error executing rule', {
        executionId,
        ruleId: rule.id,
        error,
      });

      await this.updateExecutionLog(
        executionId,
        'error',
        { error: String(error) },
        duration
      );

      throw error;
    }
  }

  /**
   * Ejecutar nodos de una regla
   */
  private async executeRuleNodes(
    rule: Rule,
    context: RuleExecutionContext
  ): Promise<any> {
    const { nodes, connections } = rule.configuration;

    // Encontrar nodo de entrada
    const inputNode = nodes.find(n => n.type === 'kafka_input');
    if (!inputNode) {
      throw new Error('Rule must have an input node');
    }

    // Crear mensaje inicial
    let message = {
      data: context.data,
      metadata: {
        assetId: context.assetId,
        tenantId: context.tenantId,
        triggerType: context.triggerType,
        timestamp: context.timestamp,
      },
      type: 'telemetry',
    };

    // Ejecutar nodos en orden (topological sort simplificado)
    const executedNodes = new Set<string>();
    const nodeOutputs = new Map<string, any>();

    nodeOutputs.set(inputNode.id, message);
    executedNodes.add(inputNode.id);

    // Ejecutar nodos conectados
    let hasProgress = true;
    while (hasProgress) {
      hasProgress = false;

      for (const node of nodes) {
        if (executedNodes.has(node.id)) continue;

        // Verificar si todos los nodos de entrada están ejecutados
        const incomingConnections = connections.filter(c => c.target === node.id);
        const allInputsReady = incomingConnections.every(c => 
          executedNodes.has(c.source)
        );

        if (!allInputsReady) continue;

        // Obtener inputs
        const inputs = incomingConnections.map(c => nodeOutputs.get(c.source));
        const input = inputs.length > 0 ? inputs[0] : message;

        // Ejecutar nodo
        try {
          const nodeInstance = nodeRegistry.createNode(node.type, node.config);
          const output = await nodeInstance.execute(input);

          nodeOutputs.set(node.id, output);
          executedNodes.add(node.id);
          hasProgress = true;

          logger.debug('Node executed', {
            nodeId: node.id,
            nodeType: node.type,
            ruleId: rule.id,
          });
        } catch (error) {
          logger.error('Error executing node', {
            nodeId: node.id,
            nodeType: node.type,
            error,
          });
          throw error;
        }
      }
    }

    return {
      executedNodes: executedNodes.size,
      totalNodes: nodes.length,
    };
  }

  /**
   * Crear log de ejecución
   */
  private async createExecutionLog(
    executionId: string,
    ruleId: string,
    context: RuleExecutionContext,
    status: string
  ): Promise<void> {
    try {
      await this.db.execute(sql`
        INSERT INTO rule_executions (
          id, rule_id, asset_id, tenant_id,
          trigger_type, status, input_data, started_at
        ) VALUES (
          ${executionId}, ${ruleId}, ${context.assetId}, ${context.tenantId},
          ${context.triggerType}, ${status}, ${JSON.stringify(context.data)}, NOW()
        )
      `);
    } catch (error) {
      logger.error('Error creating execution log', { error, executionId });
    }
  }

  /**
   * Actualizar log de ejecución
   */
  private async updateExecutionLog(
    executionId: string,
    status: string,
    result: any,
    duration: number
  ): Promise<void> {
    try {
      await this.db.execute(sql`
        UPDATE rule_executions
        SET 
          status = ${status},
          output_data = ${JSON.stringify(result)},
          duration_ms = ${duration},
          completed_at = NOW()
        WHERE id = ${executionId}
      `);
    } catch (error) {
      logger.error('Error updating execution log', { error, executionId });
    }
  }

  /**
   * Cerrar conexión
   */
  async close(): Promise<void> {
    await this.client.end();
  }
}
