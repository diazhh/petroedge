import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import axios from 'axios';

export interface SlackConfig extends RuleNodeConfig {
  webhookUrl?: string; // Slack webhook URL (default: from env)
  channel?: string; // Channel to post to (optional)
  username?: string; // Bot username (optional)
  iconEmoji?: string; // Bot icon emoji (optional)
  text: string; // Message text (supports templates)
  attachments?: Array<{
    color?: string;
    title?: string;
    text?: string;
    fields?: Array<{ title: string; value: string; short?: boolean }>;
  }>;
}

/**
 * Slack Node
 * 
 * Sends notifications to Slack channels.
 * Uses Slack Incoming Webhooks.
 * 
 * Config:
 * - webhookUrl: Slack webhook URL (optional, uses env default)
 * - channel: Override default channel (optional)
 * - username: Bot display name (optional)
 * - iconEmoji: Bot icon (optional, e.g., ':robot_face:')
 * - text: Message text (required, supports {{templates}})
 * - attachments: Rich message attachments (optional)
 * 
 * Example text: "🚨 Alarm: {{alarmType}} on {{assetName}}"
 */
export class SlackNode extends RuleNode {
  constructor(config: SlackConfig) {
    super('slack', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as SlackConfig;
    const webhookUrl = config.webhookUrl || process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      this.log(context, 'error', 'Slack webhook URL not configured');
      return null;
    }

    if (!config.text) {
      this.log(context, 'error', 'Slack message text not configured');
      return null;
    }

    try {
      // Apply template to text
      const text = this.applyTemplate(config.text, message.data);

      // Build Slack message
      const slackMessage: any = {
        text,
      };

      if (config.channel) {
        slackMessage.channel = config.channel;
      }

      if (config.username) {
        slackMessage.username = config.username;
      }

      if (config.iconEmoji) {
        slackMessage.icon_emoji = config.iconEmoji;
      }

      if (config.attachments) {
        slackMessage.attachments = config.attachments.map(att => ({
          ...att,
          title: att.title ? this.applyTemplate(att.title, message.data) : undefined,
          text: att.text ? this.applyTemplate(att.text, message.data) : undefined,
        }));
      }

      // Send to Slack
      await axios.post(webhookUrl, slackMessage);

      this.log(context, 'info', 'Slack message sent', { channel: config.channel });

      return message;
    } catch (error) {
      this.log(context, 'error', 'Failed to send Slack message', { error });
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
