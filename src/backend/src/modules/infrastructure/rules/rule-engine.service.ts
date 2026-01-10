import { db } from '../../../common/database/index.js';
import { rules, ruleExecutions } from '../../../common/database/schema.js';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../../common/utils/logger.js';
import { assetsRepository } from '../assets/assets.repository.js';
import { computedFieldsService } from '../computed-fields/computed-fields.service.js';

// Node types
export enum NodeType {
  // TRIGGERS
  TELEMETRY_CHANGE = 'telemetry_change',
  ATTRIBUTE_CHANGE = 'attribute_change',
  STATUS_CHANGE = 'status_change',
  SCHEDULE = 'schedule',
  MANUAL = 'manual',
  
  // CONDITIONS
  IF = 'if',
  SWITCH = 'switch',
  AND = 'and',
  OR = 'or',
  
  // TRANSFORMATIONS
  MATH = 'math',
  FORMULA = 'formula',
  GET_TELEMETRY = 'get_telemetry',
  GET_ATTRIBUTE = 'get_attribute',
  
  // ACTIONS
  SET_COMPUTED = 'set_computed',
  SET_ATTRIBUTE = 'set_attribute',
  SET_STATUS = 'set_status',
  CREATE_ALARM = 'create_alarm',
  LOG = 'log',
}

interface RuleNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

interface RuleConnection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

interface ExecutionContext {
  assetId: string;
  tenantId: string;
  triggerType: string;
  triggerData: any;
  asset?: any;
  nodeOutputs: Map<string, any>;
}

export class RuleEngineService {
  /**
   * Execute a rule for a specific asset
   */
  async executeRule(
    ruleId: string,
    assetId: string,
    tenantId: string,
    triggerType: string,
    triggerData: any
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const startTime = Date.now();

    try {
      // Get rule
      const [rule] = await db.select().from(rules).where(
        and(
          eq(rules.id, ruleId),
          eq(rules.tenantId, tenantId),
          eq(rules.status, 'ACTIVE')
        )
      );

      if (!rule) {
        throw new Error(`Rule not found or inactive: ${ruleId}`);
      }

      // Get asset
      const asset = await assetsRepository.findById(tenantId, assetId);
      if (!asset) {
        throw new Error(`Asset not found: ${assetId}`);
      }

      // Check if rule applies to this asset type
      const appliesToAssetTypes = rule.appliesToAssetTypes as string[];
      if (!appliesToAssetTypes.includes(asset.assetTypeId)) {
        logger.debug('Rule does not apply to asset type', { ruleId, assetTypeId: asset.assetTypeId });
        return { success: true, result: { skipped: true, reason: 'Asset type mismatch' } };
      }

      // Check if rule applies to specific assets
      const appliesToAssets = rule.appliesToAssets as string[] | null;
      if (appliesToAssets && appliesToAssets.length > 0 && !appliesToAssets.includes(assetId)) {
        logger.debug('Rule does not apply to this specific asset', { ruleId, assetId });
        return { success: true, result: { skipped: true, reason: 'Asset not in scope' } };
      }

      // Create execution context
      const context: ExecutionContext = {
        assetId,
        tenantId,
        triggerType,
        triggerData,
        asset,
        nodeOutputs: new Map(),
      };

      // Execute rule nodes
      const ruleNodes = rule.nodes as RuleNode[];
      const ruleConnections = rule.connections as RuleConnection[];
      
      const result = await this.executeNodes(ruleNodes, ruleConnections, context);

      const durationMs = Date.now() - startTime;

      // Log execution
      await db.insert(ruleExecutions).values({
        ruleId,
        assetId,
        triggerType: triggerType as any,
        triggerData,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs,
        success: true,
        result,
        actionsExecuted: Array.from(context.nodeOutputs.entries()).map(([nodeId, output]) => ({
          nodeId,
          output,
        })),
      });

      logger.info('Rule executed successfully', { ruleId, assetId, durationMs });

      return { success: true, result };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      // Log failed execution
      await db.insert(ruleExecutions).values({
        ruleId,
        assetId,
        triggerType: triggerType as any,
        triggerData,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs,
        success: false,
        error: error.message,
      });

      logger.error('Rule execution failed', { ruleId, assetId, error: error.message });

      return { success: false, error: error.message };
    }
  }

  /**
   * Execute nodes in topological order
   */
  private async executeNodes(
    nodes: RuleNode[],
    connections: RuleConnection[],
    context: ExecutionContext
  ): Promise<any> {
    // Find trigger node (entry point)
    const triggerNode = nodes.find(n => 
      n.type === NodeType.TELEMETRY_CHANGE ||
      n.type === NodeType.ATTRIBUTE_CHANGE ||
      n.type === NodeType.STATUS_CHANGE ||
      n.type === NodeType.SCHEDULE ||
      n.type === NodeType.MANUAL
    );

    if (!triggerNode) {
      throw new Error('No trigger node found in rule');
    }

    // Execute from trigger node
    await this.executeNode(triggerNode, nodes, connections, context);

    return { executed: true, outputs: Object.fromEntries(context.nodeOutputs) };
  }

  /**
   * Execute a single node and its connected nodes
   */
  private async executeNode(
    node: RuleNode,
    allNodes: RuleNode[],
    connections: RuleConnection[],
    context: ExecutionContext
  ): Promise<any> {
    try {
      let output: any;

      // Execute node based on type
      switch (node.type) {
        case NodeType.TELEMETRY_CHANGE:
        case NodeType.ATTRIBUTE_CHANGE:
        case NodeType.STATUS_CHANGE:
        case NodeType.MANUAL:
          output = context.triggerData;
          break;

        case NodeType.IF:
          output = await this.executeIfNode(node, context);
          break;

        case NodeType.GET_TELEMETRY:
          output = await this.executeGetTelemetryNode(node, context);
          break;

        case NodeType.GET_ATTRIBUTE:
          output = await this.executeGetAttributeNode(node, context);
          break;

        case NodeType.MATH:
          output = await this.executeMathNode(node, context);
          break;

        case NodeType.FORMULA:
          output = await this.executeFormulaNode(node, context);
          break;

        case NodeType.SET_COMPUTED:
          output = await this.executeSetComputedNode(node, context);
          break;

        case NodeType.SET_ATTRIBUTE:
          output = await this.executeSetAttributeNode(node, context);
          break;

        case NodeType.SET_STATUS:
          output = await this.executeSetStatusNode(node, context);
          break;

        case NodeType.CREATE_ALARM:
          output = await this.executeCreateAlarmNode(node, context);
          break;

        case NodeType.LOG:
          output = await this.executeLogNode(node, context);
          break;

        default:
          logger.warn('Unknown node type', { nodeType: node.type, nodeId: node.id });
          output = null;
      }

      // Store output
      context.nodeOutputs.set(node.id, output);

      // Find and execute connected nodes
      const outgoingConnections = connections.filter(c => c.fromNode === node.id);
      
      for (const connection of outgoingConnections) {
        const nextNode = allNodes.find(n => n.id === connection.toNode);
        if (nextNode) {
          await this.executeNode(nextNode, allNodes, connections, context);
        }
      }

      return output;
    } catch (error: any) {
      logger.error('Node execution failed', { nodeId: node.id, nodeType: node.type, error: error.message });
      throw error;
    }
  }

  /**
   * Execute IF condition node
   */
  private async executeIfNode(node: RuleNode, context: ExecutionContext): Promise<boolean> {
    const { expression } = node.config;
    
    if (!expression) {
      throw new Error('IF node missing expression');
    }

    // Simple expression evaluation (can be enhanced)
    // Format: "telemetry.pressure > 500"
    try {
      const asset = context.asset;
      const telemetry = asset?.currentTelemetry || {};
      const attributes = asset?.attributes || {};
      const computed = asset?.computedValues || {};

      // Create evaluation context
      const evalContext = { telemetry, attributes, computed, asset };

      // Simple eval (in production, use a safer expression evaluator)
      const result = new Function('context', `
        with (context) {
          return ${expression};
        }
      `)(evalContext);

      return Boolean(result);
    } catch (error: any) {
      logger.error('IF node evaluation failed', { expression, error: error.message });
      return false;
    }
  }

  /**
   * Execute GET_TELEMETRY node
   */
  private async executeGetTelemetryNode(node: RuleNode, context: ExecutionContext): Promise<any> {
    const { telemetryKey } = node.config;
    
    if (!telemetryKey) {
      throw new Error('GET_TELEMETRY node missing telemetryKey');
    }

    const telemetry = context.asset?.currentTelemetry as Record<string, any> || {};
    return telemetry[telemetryKey]?.value || null;
  }

  /**
   * Execute GET_ATTRIBUTE node
   */
  private async executeGetAttributeNode(node: RuleNode, context: ExecutionContext): Promise<any> {
    const { attributeKey } = node.config;
    
    if (!attributeKey) {
      throw new Error('GET_ATTRIBUTE node missing attributeKey');
    }

    const attributes = context.asset?.attributes as Record<string, any> || {};
    return attributes[attributeKey] || null;
  }

  /**
   * Execute MATH node
   */
  private async executeMathNode(node: RuleNode, context: ExecutionContext): Promise<number> {
    const { operation, operands } = node.config;
    
    if (!operation || !operands) {
      throw new Error('MATH node missing operation or operands');
    }

    // Get operand values from previous nodes or context
    const values = operands.map((op: any) => {
      if (typeof op === 'number') return op;
      if (op.nodeId) return context.nodeOutputs.get(op.nodeId);
      return 0;
    });

    switch (operation) {
      case 'add': return values.reduce((a: number, b: number) => a + b, 0);
      case 'subtract': return values.reduce((a: number, b: number) => a - b);
      case 'multiply': return values.reduce((a: number, b: number) => a * b, 1);
      case 'divide': return values.reduce((a: number, b: number) => a / b);
      default: throw new Error(`Unknown math operation: ${operation}`);
    }
  }

  /**
   * Execute FORMULA node
   */
  private async executeFormulaNode(node: RuleNode, context: ExecutionContext): Promise<any> {
    const { formula } = node.config;
    
    if (!formula) {
      throw new Error('FORMULA node missing formula');
    }

    // Use computedFieldsService to evaluate formula
    const fieldDef = {
      key: 'temp',
      name: 'Temporary',
      formula,
      recalculateOn: [],
    };

    const result = await computedFieldsService.calculateField(
      context.tenantId,
      context.assetId,
      fieldDef
    );

    return result.value;
  }

  /**
   * Execute SET_COMPUTED node
   */
  private async executeSetComputedNode(node: RuleNode, context: ExecutionContext): Promise<void> {
    const { field, value } = node.config;
    
    if (!field) {
      throw new Error('SET_COMPUTED node missing field');
    }

    // Get value from previous node or config
    const computedValue = value !== undefined ? value : context.nodeOutputs.get(node.inputs[0]);

    // Update computed values
    const currentComputed = context.asset?.computedValues as Record<string, any> || {};
    currentComputed[field] = {
      value: computedValue,
      calculatedAt: new Date().toISOString(),
      source: 'rule',
    };

    await assetsRepository.updateComputedValues(context.tenantId, context.assetId, currentComputed);

    logger.debug('Computed field updated by rule', { assetId: context.assetId, field, value: computedValue });
  }

  /**
   * Execute SET_ATTRIBUTE node
   */
  private async executeSetAttributeNode(node: RuleNode, context: ExecutionContext): Promise<void> {
    const { attribute, value } = node.config;
    
    if (!attribute) {
      throw new Error('SET_ATTRIBUTE node missing attribute');
    }

    const attributeValue = value !== undefined ? value : context.nodeOutputs.get(node.inputs[0]);

    const currentAttributes = context.asset?.attributes as Record<string, any> || {};
    currentAttributes[attribute] = attributeValue;

    await assetsRepository.update(context.tenantId, context.assetId, {
      attributes: currentAttributes,
    });

    logger.debug('Attribute updated by rule', { assetId: context.assetId, attribute, value: attributeValue });
  }

  /**
   * Execute SET_STATUS node
   */
  private async executeSetStatusNode(node: RuleNode, context: ExecutionContext): Promise<void> {
    const { status } = node.config;
    
    if (!status) {
      throw new Error('SET_STATUS node missing status');
    }

    await assetsRepository.update(context.tenantId, context.assetId, {
      status: status as any,
    });

    logger.debug('Status updated by rule', { assetId: context.assetId, status });
  }

  /**
   * Execute CREATE_ALARM node
   */
  private async executeCreateAlarmNode(node: RuleNode, context: ExecutionContext): Promise<void> {
    const { alarmCode, name, message, severity } = node.config;
    
    if (!alarmCode || !name) {
      throw new Error('CREATE_ALARM node missing required fields');
    }

    // TODO: Implement alarm creation
    logger.info('Alarm created by rule', {
      assetId: context.assetId,
      alarmCode,
      name,
      message,
      severity: severity || 'MEDIUM',
    });
  }

  /**
   * Execute LOG node
   */
  private async executeLogNode(node: RuleNode, context: ExecutionContext): Promise<void> {
    const { message, level } = node.config;
    
    const logMessage = message || 'Rule execution log';
    const logLevel = level || 'info';

    logger[logLevel as 'info' | 'warn' | 'error' | 'debug'](logMessage, {
      ruleNode: node.id,
      assetId: context.assetId,
      outputs: Object.fromEntries(context.nodeOutputs),
    });
  }

  /**
   * Find rules that apply to an asset and trigger type
   */
  async findApplicableRules(
    tenantId: string,
    assetTypeId: string
  ): Promise<any[]> {
    const allRules = await db
      .select()
      .from(rules)
      .where(
        and(
          eq(rules.tenantId, tenantId),
          eq(rules.status, 'ACTIVE')
        )
      );

    // Filter rules that apply to this asset type
    return allRules.filter(rule => {
      const appliesToAssetTypes = rule.appliesToAssetTypes as string[];
      return appliesToAssetTypes.includes(assetTypeId);
    });
  }
}

export const ruleEngineService = new RuleEngineService();
