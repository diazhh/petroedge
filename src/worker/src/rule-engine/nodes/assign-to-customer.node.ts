import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import axios from 'axios';

export interface AssignToCustomerConfig extends RuleNodeConfig {
  assetIdKey?: string; // Key to get asset ID (default: 'assetId')
  customerIdKey?: string; // Key to get customer ID (default: 'customerId')
  customerId?: string; // Static customer ID (alternative to customerIdKey)
}

/**
 * Assign to Customer Node
 * 
 * Assigns an asset to a customer via Backend API.
 * Used in multi-tenant scenarios for customer management.
 * 
 * Config:
 * - assetIdKey: Key to get asset ID (default: 'assetId')
 * - customerIdKey: Key to get customer ID from message (default: 'customerId')
 * - customerId: Static customer ID (alternative to customerIdKey)
 * 
 * Example:
 * Automatically assign new devices to customers based on rules
 */
export class AssignToCustomerNode extends RuleNode {
  constructor(config: AssignToCustomerConfig) {
    super('assign_to_customer', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as AssignToCustomerConfig;
    const assetIdKey = config.assetIdKey || 'assetId';
    const customerIdKey = config.customerIdKey || 'customerId';

    const assetId = message.data[assetIdKey];
    if (!assetId) {
      this.log(context, 'warn', `Asset ID not found in message.data.${assetIdKey}`);
      return null;
    }

    // Get customer ID from config or message
    const customerId = config.customerId || message.data[customerIdKey];
    if (!customerId) {
      this.log(context, 'warn', 'Customer ID not found in config or message');
      return null;
    }

    try {
      // Assign asset to customer via Backend API
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
      await axios.post(`${backendUrl}/api/v1/assets/${assetId}/assign`, {
        customerId,
      });

      this.log(context, 'info', 'Asset assigned to customer', { assetId, customerId });

      return {
        ...message,
        data: {
          ...message.data,
          assignedToCustomer: true,
          customerId,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to assign asset to customer', { error, assetId, customerId });
      return null;
    }
  }
}
