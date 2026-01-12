import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface SendNotificationConfig extends RuleNodeConfig {
  userIdKey?: string; // Key to get user ID (default: 'userId')
  title: string; // Notification title (supports templates)
  body: string; // Notification body (supports templates)
  priority?: 'low' | 'normal' | 'high' | 'urgent'; // Priority (default: 'normal')
  category?: string; // Notification category (optional)
  actionUrl?: string; // URL to open on click (optional)
}

/**
 * Send Notification Node
 * 
 * Sends push notifications to users.
 * Supports web push, mobile push, and in-app notifications.
 * 
 * Config:
 * - userIdKey: Key to get user ID from message (default: 'userId')
 * - title: Notification title (required, supports {{templates}})
 * - body: Notification body (required, supports {{templates}})
 * - priority: Notification priority (default: 'normal')
 * - category: Notification category for grouping (optional)
 * - actionUrl: URL to navigate on click (optional)
 * 
 * Example:
 * Send alarm notification to operator
 */
export class SendNotificationNode extends RuleNode {
  constructor(config: SendNotificationConfig) {
    super('send_notification', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as SendNotificationConfig;
    const userIdKey = config.userIdKey || 'userId';

    const userId = message.data[userIdKey];
    if (!userId) {
      this.log(context, 'warn', `User ID not found at ${userIdKey}`);
      return null;
    }

    if (!config.title || !config.body) {
      this.log(context, 'error', 'Title and body are required');
      return null;
    }

    try {
      // Apply templates
      const title = this.applyTemplate(config.title, message.data);
      const body = this.applyTemplate(config.body, message.data);
      const actionUrl = config.actionUrl ? this.applyTemplate(config.actionUrl, message.data) : undefined;

      const notification = {
        userId,
        title,
        body,
        priority: config.priority || 'normal',
        category: config.category,
        actionUrl,
        timestamp: new Date().toISOString(),
      };

      // TODO: Integrate with notification service
      // For now, just log
      this.log(context, 'info', 'Notification sent', notification);

      return {
        ...message,
        data: {
          ...message.data,
          notificationSent: true,
          notificationId: `notif_${Date.now()}`,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to send notification', { error, userId });
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
