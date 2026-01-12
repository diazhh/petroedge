import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import axios from 'axios';

export interface UnassignFromCustomerConfig extends RuleNodeConfig {
  assetIdKey?: string; // Key to get asset ID (default: 'assetId')
}

/**
 * Unassign from Customer Node
 * 
 * Removes asset assignment from customer via Backend API.
 * Used in multi-tenant scenarios for customer management.
 * 
 * Config:
 * - assetIdKey: Key to get asset ID (default: 'assetId')
 * 
 * Example:
 * Automatically unassign devices when they are decommissioned
 */
export class UnassignFromCustomerNode extends RuleNode {
  constructor(config: UnassignFromCustomerConfig) {
    super('unassign_from_customer', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as UnassignFromCustomerConfig;
    const assetIdKey = config.assetIdKey || 'assetId';

    const assetId = message.data[assetIdKey];
    if (!assetId) {
      this.log(context, 'warn', `Asset ID not found in message.data.${assetIdKey}`);
      return null;
    }

    try {
      // Unassign asset from customer via Backend API
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
      await axios.post(`${backendUrl}/api/v1/assets/${assetId}/unassign`);

      this.log(context, 'info', 'Asset unassigned from customer', { assetId });

      return {
        ...message,
        data: {
          ...message.data,
          unassignedFromCustomer: true,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to unassign asset from customer', { error, assetId });
      return null;
    }
  }
}
