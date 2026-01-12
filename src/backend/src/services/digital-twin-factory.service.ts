/**
 * Digital Twin Factory Service
 * 
 * Creates Digital Twin instances in Eclipse Ditto from Asset Templates.
 * This service orchestrates the creation of composite Things (root + components).
 */

import { db } from '../common/database/index.js';
import { assetTemplates, digitalTwinInstances, assetTypes } from '../common/database/schema.js';
import { eq, and } from 'drizzle-orm';

interface AssetComponent {
  code: string;
  assetTypeCode: string;
  name: string;
  required: boolean;
}

const DITTO_URL = process.env.DITTO_URL || 'http://localhost:30080';
const DITTO_USERNAME = process.env.DITTO_USERNAME || 'ditto';
const DITTO_PASSWORD = process.env.DITTO_PASSWORD || 'ditto';
const DITTO_AUTH = Buffer.from(`${DITTO_USERNAME}:${DITTO_PASSWORD}`).toString('base64');

interface DittoThing {
  thingId: string;
  policyId: string;
  attributes: {
    type: string;
    name: string;
    description?: string;
    [key: string]: any;
  };
  features?: Record<string, any>;
}

interface CreateDigitalTwinInput {
  tenantId: string;
  assetTemplateId: string;
  code: string;
  name: string;
  description?: string;
  properties?: Record<string, any>;
  userId: string;
}

interface DigitalTwinCreationResult {
  digitalTwinInstanceId: string;
  rootThingId: string;
  componentThingIds: Record<string, string>;
  thingsCreated: string[];
}

export class DigitalTwinFactoryService {
  private baseUrl = `${DITTO_URL}/api/2`;

  private getHeaders() {
    return {
      'Authorization': `Basic ${DITTO_AUTH}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a Thing in Eclipse Ditto
   */
  private async createDittoThing(thing: DittoThing): Promise<void> {
    const response = await fetch(`${this.baseUrl}/things/${thing.thingId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(thing),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Thing ${thing.thingId}: ${response.status} ${error}`);
    }
  }

  /**
   * Get Asset Template with components
   */
  private async getAssetTemplate(templateId: string, tenantId: string) {
    const [template] = await db
      .select()
      .from(assetTemplates)
      .where(and(
        eq(assetTemplates.id, templateId),
        eq(assetTemplates.tenantId, tenantId)
      ));

    if (!template) {
      throw {
        statusCode: 404,
        code: 'ASSET_TEMPLATE_NOT_FOUND',
        message: `Asset template with ID ${templateId} not found`,
      };
    }

    if (!template.isActive) {
      throw {
        statusCode: 400,
        code: 'ASSET_TEMPLATE_INACTIVE',
        message: `Asset template ${template.code} is inactive`,
      };
    }

    return template;
  }

  /**
   * Get Asset Type information
   */
  private async getAssetType(assetTypeId: string) {
    const [assetType] = await db
      .select()
      .from(assetTypes)
      .where(eq(assetTypes.id, assetTypeId));

    if (!assetType) {
      throw {
        statusCode: 404,
        code: 'ASSET_TYPE_NOT_FOUND',
        message: `Asset type with ID ${assetTypeId} not found`,
      };
    }

    return assetType;
  }

  /**
   * Generate Thing ID from namespace and code
   */
  private generateThingId(namespace: string, code: string): string {
    // Convert code to lowercase and replace spaces/special chars with underscores
    const sanitizedCode = code.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return `${namespace}:${sanitizedCode}`;
  }

  /**
   * Create root Thing for the Digital Twin
   */
  private async createRootThing(
    namespace: string,
    code: string,
    name: string,
    description: string | undefined,
    assetType: any,
    properties: Record<string, any>
  ): Promise<string> {
    const thingId = this.generateThingId(namespace, code);

    const thing: DittoThing = {
      thingId,
      policyId: thingId,
      attributes: {
        type: assetType.code,
        name,
        description: description || '',
        ...properties,
      },
      features: {},
    };

    await this.createDittoThing(thing);
    return thingId;
  }

  /**
   * Create component Thing
   */
  private async createComponentThing(
    namespace: string,
    parentCode: string,
    component: AssetComponent,
    componentAssetType: any,
    properties: Record<string, any>
  ): Promise<string> {
    const componentCode = `${parentCode}_${component.code}`;
    const thingId = this.generateThingId(namespace, componentCode);

    const thing: DittoThing = {
      thingId,
      policyId: thingId,
      attributes: {
        type: componentAssetType.code,
        name: component.name,
        parentCode,
        componentCode: component.code,
        ...properties,
      },
      features: {},
    };

    await this.createDittoThing(thing);
    return thingId;
  }

  /**
   * Create a complete Digital Twin instance from an Asset Template
   */
  async createFromTemplate(input: CreateDigitalTwinInput): Promise<DigitalTwinCreationResult> {
    const { tenantId, assetTemplateId, code, name, description, properties = {}, userId } = input;

    // Get template
    const template = await this.getAssetTemplate(assetTemplateId, tenantId);

    // Get root asset type
    const rootAssetType = await this.getAssetType(template.rootAssetTypeId);

    // Use tenant slug as namespace (for now, use 'acme' as default)
    // TODO: Map tenantId to actual namespace from tenant table
    const namespace = 'acme';

    const thingsCreated: string[] = [];
    const componentThingIds: Record<string, string> = {};

    try {
      // 1. Create root Thing
      const defaultProps = (template.defaultProperties || {}) as Record<string, any>;
      const rootThingId = await this.createRootThing(
        namespace,
        code,
        name,
        description,
        rootAssetType,
        { ...defaultProps, ...properties }
      );
      thingsCreated.push(rootThingId);

      // 2. Create component Things
      const components = (template.components || []) as AssetComponent[];
      
      for (const component of components) {
        // Get asset type for component
        const componentAssetType = await db
          .select()
          .from(assetTypes)
          .where(eq(assetTypes.code, component.assetTypeCode))
          .limit(1);

        if (componentAssetType.length === 0) {
          throw {
            statusCode: 400,
            code: 'COMPONENT_ASSET_TYPE_NOT_FOUND',
            message: `Asset type ${component.assetTypeCode} not found for component ${component.code}`,
          };
        }

        const componentThingId = await this.createComponentThing(
          namespace,
          code,
          component,
          componentAssetType[0],
          (template.defaultProperties || {}) as Record<string, any>
        );

        thingsCreated.push(componentThingId);
        componentThingIds[component.code] = componentThingId;
      }

      // 3. Save Digital Twin Instance to database
      const [digitalTwinInstance] = await db
        .insert(digitalTwinInstances)
        .values({
          tenantId,
          assetTemplateId,
          code,
          name,
          description,
          rootThingId,
          componentThingIds,
          status: 'ACTIVE',
          createdBy: userId,
        })
        .returning();

      return {
        digitalTwinInstanceId: digitalTwinInstance.id,
        rootThingId,
        componentThingIds,
        thingsCreated,
      };
    } catch (error: any) {
      // Rollback: Delete created Things from Ditto
      await this.rollbackThings(thingsCreated);
      throw error;
    }
  }

  /**
   * Delete a Digital Twin instance (root + components)
   */
  async deleteInstance(instanceId: string, tenantId: string): Promise<void> {
    // Get instance
    const [instance] = await db
      .select()
      .from(digitalTwinInstances)
      .where(and(
        eq(digitalTwinInstances.id, instanceId),
        eq(digitalTwinInstances.tenantId, tenantId)
      ));

    if (!instance) {
      throw {
        statusCode: 404,
        code: 'DIGITAL_TWIN_INSTANCE_NOT_FOUND',
        message: `Digital twin instance with ID ${instanceId} not found`,
      };
    }

    // Collect all Thing IDs to delete
    const componentIds = instance.componentThingIds 
      ? Object.values(instance.componentThingIds as Record<string, string>)
      : [];
    const thingIds = [instance.rootThingId, ...componentIds];

    // Delete from Ditto
    await this.rollbackThings(thingIds);

    // Delete from database
    await db
      .delete(digitalTwinInstances)
      .where(eq(digitalTwinInstances.id, instanceId));
  }

  /**
   * Rollback: Delete Things from Ditto
   */
  private async rollbackThings(thingIds: string[]): Promise<void> {
    for (const thingId of thingIds) {
      try {
        await fetch(`${this.baseUrl}/things/${thingId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        });
      } catch (error) {
        console.error(`Failed to delete Thing ${thingId} during rollback:`, error);
      }
    }
  }

  /**
   * Get Digital Twin Instance by ID
   */
  async getInstance(instanceId: string, tenantId: string) {
    const [instance] = await db
      .select()
      .from(digitalTwinInstances)
      .where(and(
        eq(digitalTwinInstances.id, instanceId),
        eq(digitalTwinInstances.tenantId, tenantId)
      ));

    if (!instance) {
      throw {
        statusCode: 404,
        code: 'DIGITAL_TWIN_INSTANCE_NOT_FOUND',
        message: `Digital twin instance with ID ${instanceId} not found`,
      };
    }

    return instance;
  }

  /**
   * List Digital Twin Instances
   */
  async listInstances(tenantId: string, filters?: { assetTemplateId?: string; status?: string }) {
    const conditions = [eq(digitalTwinInstances.tenantId, tenantId)];

    if (filters?.assetTemplateId) {
      conditions.push(eq(digitalTwinInstances.assetTemplateId, filters.assetTemplateId));
    }

    if (filters?.status) {
      conditions.push(eq(digitalTwinInstances.status, filters.status as any));
    }

    return db
      .select()
      .from(digitalTwinInstances)
      .where(and(...conditions));
  }
}
