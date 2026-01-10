import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { RuleEngineExecutorService } from '../services/rule-engine-executor.service.js';

// Rule trigger message schema
const RuleTriggerMessageSchema = z.object({
  triggerType: z.enum(['telemetry_change', 'attribute_change', 'status_change', 'manual']),
  assetId: z.string().uuid(),
  tenantId: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.record(z.any()),
});

export type RuleTriggerMessage = z.infer<typeof RuleTriggerMessageSchema>;

export interface RuleTriggerConsumerConfig {
  kafkaBroker: string;
  groupId: string;
  topics: string[];
  ruleEngineExecutor?: RuleEngineExecutorService;
}

/**
 * Rule Trigger Consumer
 * 
 * Consume eventos que disparan reglas:
 * - Cambios de telemetría
 * - Cambios de atributos
 * - Cambios de estado
 * - Triggers manuales
 */
export class RuleTriggerConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private config: RuleTriggerConsumerConfig;
  private isRunning = false;
  private ruleEngineExecutor: RuleEngineExecutorService;

  constructor(config: RuleTriggerConsumerConfig) {
    this.config = config;
    this.kafka = new Kafka({
      clientId: 'worker-rule-trigger-consumer',
      brokers: [config.kafkaBroker],
    });
    this.consumer = this.kafka.consumer({ groupId: config.groupId });
    this.ruleEngineExecutor = config.ruleEngineExecutor || new RuleEngineExecutorService();
  }

  /**
   * Iniciar consumer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Rule trigger consumer already running');
      return;
    }

    logger.info('Starting rule trigger consumer...', {
      topics: this.config.topics,
      groupId: this.config.groupId,
    });

    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: this.config.topics,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: this.handleMessage.bind(this),
    });

    this.isRunning = true;
    logger.info('Rule trigger consumer started');
  }

  /**
   * Procesar mensaje
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      if (!message.value) {
        logger.warn('Received empty message', { topic, partition });
        return;
      }

      const rawData = message.value.toString();
      const data = JSON.parse(rawData);

      // Validar mensaje
      const trigger = RuleTriggerMessageSchema.parse(data);

      logger.debug('Processing rule trigger', {
        topic,
        triggerType: trigger.triggerType,
        assetId: trigger.assetId,
      });

      // Procesar trigger
      await this.processTrigger(trigger);

    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid rule trigger message format', {
          topic,
          errors: error.errors,
        });
      } else {
        logger.error('Error processing rule trigger message', {
          topic,
          error,
        });
      }
    }
  }

  /**
   * Procesar trigger
   */
  private async processTrigger(trigger: RuleTriggerMessage): Promise<void> {
    try {
      // 1. Buscar reglas aplicables
      const rules = await this.ruleEngineExecutor.findApplicableRules({
        assetId: trigger.assetId,
        tenantId: trigger.tenantId,
        triggerType: trigger.triggerType,
        data: trigger.data,
        timestamp: trigger.timestamp,
      });

      if (rules.length === 0) {
        logger.debug('No applicable rules found', {
          triggerType: trigger.triggerType,
          assetId: trigger.assetId,
        });
        return;
      }

      logger.info('Found applicable rules', {
        triggerType: trigger.triggerType,
        assetId: trigger.assetId,
        ruleCount: rules.length,
      });

      // 2. Ejecutar cada regla
      for (const rule of rules) {
        try {
          await this.ruleEngineExecutor.executeRule(rule, {
            assetId: trigger.assetId,
            tenantId: trigger.tenantId,
            triggerType: trigger.triggerType,
            data: trigger.data,
            timestamp: trigger.timestamp,
          });
        } catch (error) {
          logger.error('Error executing rule', {
            ruleId: rule.id,
            ruleName: rule.name,
            error,
          });
          // Continuar con las demás reglas
        }
      }

      logger.debug('Rule trigger processed', {
        triggerType: trigger.triggerType,
        assetId: trigger.assetId,
        rulesExecuted: rules.length,
      });
    } catch (error) {
      logger.error('Error processing rule trigger', {
        error,
        trigger,
      });
      throw error;
    }
  }

  /**
   * Detener consumer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping rule trigger consumer...');
    await this.consumer.disconnect();
    this.isRunning = false;
    logger.info('Rule trigger consumer stopped');
  }
}
