import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import axios from 'axios';

export interface TenantAttributesConfig extends RuleNodeConfig {
  tenantIdKey?: string; // Key to get tenant ID (default: 'tenantId')
  outputKey?: string; // Key to store attributes (default: 'tenantAttributes')
  attributeKeys?: string[]; // Specific attributes to fetch (optional)
}

/**
 * Tenant Attributes Node
 * 
 * Enriches message with tenant attributes from Backend API.
 * Useful for multi-tenant scenarios where tenant-specific
 * configuration affects rule processing.
 * 
 * Config:
 * - tenantIdKey: Key to get tenant ID (default: 'tenantId')
 * - outputKey: Where to store attributes (default: 'tenantAttributes')
 * - attributeKeys: Specific attributes to fetch (optional, fetches all if not specified)
 * 
 * Example:
 * Enrich with tenant timezone, currency, or custom settings
 */
export class TenantAttributesNode extends RuleNode {
  constructor(config: TenantAttributesConfig) {
    super('tenant_attributes', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as TenantAttributesConfig;
    const tenantIdKey = config.tenantIdKey || 'tenantId';
    const outputKey = config.outputKey || 'tenantAttributes';

    const tenantId = message.data[tenantIdKey] || message.metadata?.tenantId;
    if (!tenantId) {
      this.log(context, 'warn', `Tenant ID not found in message.data.${tenantIdKey} or metadata`);
      return null;
    }

    try {
      // Fetch tenant attributes via Backend API
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${backendUrl}/api/v1/tenants/${tenantId}/attributes`);
      
      let attributes = response.data.data || {};

      // Filter to specific keys if configured
      if (config.attributeKeys && config.attributeKeys.length > 0) {
        const filtered: Record<string, any> = {};
        for (const key of config.attributeKeys) {
          if (attributes[key] !== undefined) {
            filtered[key] = attributes[key];
          }
        }
        attributes = filtered;
      }

      this.log(context, 'info', `Enriched with ${Object.keys(attributes).length} tenant attributes`, { tenantId });

      // Add tenant attributes to message
      return {
        ...message,
        data: {
          ...message.data,
          [outputKey]: attributes,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to fetch tenant attributes', { error, tenantId });
      return null;
    }
  }
}
