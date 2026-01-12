import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import mqtt from 'mqtt';

export interface MqttPublishConfig extends RuleNodeConfig {
  brokerUrl?: string; // MQTT broker URL (default: from env)
  topic: string; // MQTT topic (supports templates)
  qos?: 0 | 1 | 2; // QoS level (default: 1)
  retain?: boolean; // Retain message (default: false)
  payloadKey?: string; // Key to get payload from message
  payloadTemplate?: string; // Template for payload
}

/**
 * MQTT Publish Node
 * 
 * Publishes messages to MQTT broker.
 * Useful for:
 * - IoT device commands
 * - Edge gateway communication
 * - Protocol bridging
 * 
 * Config:
 * - brokerUrl: MQTT broker URL (optional, uses env default)
 * - topic: MQTT topic (required, supports {{templates}})
 * - qos: Quality of Service 0, 1, or 2 (default: 1)
 * - retain: Retain message flag (default: false)
 * - payloadKey: Key to get payload from message (optional)
 * - payloadTemplate: Template string for payload (optional)
 * 
 * Example topic: "devices/{{deviceId}}/commands"
 */
export class MqttPublishNode extends RuleNode {
  private client: mqtt.MqttClient | null = null;

  constructor(config: MqttPublishConfig) {
    super('mqtt_publish', config);
    this.initClient();
  }

  private initClient() {
    const brokerUrl = (this.config as MqttPublishConfig).brokerUrl || process.env.MQTT_BROKER_URL;
    
    if (!brokerUrl) {
      console.warn('MQTT broker URL not configured');
      return;
    }

    this.client = mqtt.connect(brokerUrl, {
      clientId: `rule-engine-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    this.client.on('error', (error) => {
      console.error('MQTT connection error:', error);
    });
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as MqttPublishConfig;

    if (!this.client || !this.client.connected) {
      this.log(context, 'error', 'MQTT client not connected');
      return null;
    }

    if (!config.topic) {
      this.log(context, 'error', 'MQTT topic not configured');
      return null;
    }

    try {
      // Apply template to topic
      const topic = this.applyTemplate(config.topic, message.data);

      // Build payload
      let payload: string;
      if (config.payloadTemplate) {
        payload = this.applyTemplate(config.payloadTemplate, message.data);
      } else if (config.payloadKey) {
        const payloadData = this.getNestedValue(message.data, config.payloadKey);
        payload = typeof payloadData === 'string' ? payloadData : JSON.stringify(payloadData);
      } else {
        // Default: send entire message data
        payload = JSON.stringify(message.data);
      }

      // Publish to MQTT
      await new Promise<void>((resolve, reject) => {
        this.client!.publish(
          topic,
          payload,
          {
            qos: config.qos || 1,
            retain: config.retain || false,
          },
          (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });

      this.log(context, 'info', 'MQTT message published', { topic, qos: config.qos || 1 });

      return message;
    } catch (error) {
      this.log(context, 'error', 'Failed to publish MQTT message', { error });
      return null;
    }
  }

  private applyTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key);
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
