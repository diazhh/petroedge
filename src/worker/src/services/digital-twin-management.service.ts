import { DittoClientService, DittoThing, DittoFeature } from './ditto-client.service.js';
import { logger } from '../utils/logger.js';

export interface CreateThingInput {
  tenantId: string;
  type: 'BASIN' | 'FIELD' | 'RESERVOIR' | 'WELL' | 'EQUIPMENT' | 'TOOL';
  code: string;
  name: string;
  description?: string;
  attributes?: Record<string, any>;
  features?: Record<string, DittoFeature>;
  parentThingId?: string;
}

export interface UpdateThingInput {
  attributes?: Record<string, any>;
  features?: Record<string, DittoFeature>;
}

export interface ThingQuery {
  tenantId: string;
  type?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

/**
 * Digital Twin Management Service
 * 
 * Servicio de gestión completa de Digital Twins en Eclipse Ditto:
 * - CRUD de Things
 * - Gestión de Attributes
 * - Gestión de Features y Properties
 * - Búsqueda y filtrado
 */
export class DigitalTwinManagementService {
  private dittoClient: DittoClientService;

  constructor() {
    this.dittoClient = new DittoClientService();
  }

  /**
   * Crear nuevo Digital Twin
   */
  async createThing(input: CreateThingInput): Promise<string> {
    try {
      const thingId = `${input.tenantId}:${input.type.toLowerCase()}-${input.code}`;

      const thing: DittoThing = {
        thingId,
        policyId: `${input.tenantId}:default-policy`,
        attributes: {
          type: input.type,
          code: input.code,
          name: input.name,
          description: input.description,
          parentThingId: input.parentThingId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...input.attributes,
        },
        features: input.features || {},
      };

      await this.dittoClient.createThing(thing);
      logger.info({ thingId }, 'Digital Twin created');

      return thingId;
    } catch (error) {
      logger.error({ error, input }, 'Error creating Digital Twin');
      throw error;
    }
  }

  /**
   * Obtener Digital Twin por ID
   */
  async getThing(thingId: string): Promise<DittoThing | null> {
    try {
      return await this.dittoClient.getThing(thingId);
    } catch (error) {
      logger.error({ error, thingId }, 'Error getting Digital Twin');
      throw error;
    }
  }

  /**
   * Actualizar Digital Twin
   */
  async updateThing(thingId: string, input: UpdateThingInput): Promise<boolean> {
    try {
      // Obtener thing actual
      const thing = await this.dittoClient.getThing(thingId);
      if (!thing) {
        throw new Error(`Thing ${thingId} not found`);
      }

      // Actualizar attributes si se proporcionan
      if (input.attributes) {
        thing.attributes = {
          ...thing.attributes,
          ...input.attributes,
          updatedAt: new Date().toISOString(),
        };
      }

      // Actualizar features si se proporcionan
      if (input.features) {
        thing.features = {
          ...thing.features,
          ...input.features,
        };
      }

      await this.dittoClient.createThing(thing);
      logger.info({ thingId }, 'Digital Twin updated');

      return true;
    } catch (error) {
      logger.error({ error, thingId }, 'Error updating Digital Twin');
      throw error;
    }
  }

  /**
   * Eliminar Digital Twin
   */
  async deleteThing(thingId: string): Promise<boolean> {
    try {
      await this.dittoClient.deleteThing(thingId);
      logger.info({ thingId }, 'Digital Twin deleted');
      return true;
    } catch (error) {
      logger.error({ error, thingId }, 'Error deleting Digital Twin');
      throw error;
    }
  }

  /**
   * Obtener atributos de Digital Twin
   */
  async getAttributes(thingId: string): Promise<Record<string, any> | null> {
    try {
      return await this.dittoClient.getThingAttributes(thingId);
    } catch (error) {
      logger.error({ error, thingId }, 'Error getting attributes');
      throw error;
    }
  }

  /**
   * Actualizar atributos de Digital Twin
   */
  async updateAttributes(thingId: string, attributes: Record<string, any>): Promise<boolean> {
    try {
      const thing = await this.dittoClient.getThing(thingId);
      if (!thing) {
        throw new Error(`Thing ${thingId} not found`);
      }

      thing.attributes = {
        ...thing.attributes,
        ...attributes,
        updatedAt: new Date().toISOString(),
      };

      await this.dittoClient.createThing(thing);
      logger.info({ thingId }, 'Attributes updated');

      return true;
    } catch (error) {
      logger.error({ error, thingId }, 'Error updating attributes');
      throw error;
    }
  }

  /**
   * Obtener properties de Feature
   */
  async getFeatureProperties(thingId: string, featureId: string): Promise<Record<string, any> | null> {
    try {
      return await this.dittoClient.getFeatureProperties(thingId, featureId);
    } catch (error) {
      logger.error({ error, thingId, featureId }, 'Error getting feature properties');
      throw error;
    }
  }

  /**
   * Actualizar properties de Feature (reemplazo completo)
   */
  async updateFeatureProperties(
    thingId: string,
    featureId: string,
    properties: Record<string, any>
  ): Promise<boolean> {
    try {
      await this.dittoClient.updateFeatureProperties(thingId, featureId, properties);
      logger.info({ thingId, featureId }, 'Feature properties updated');
      return true;
    } catch (error) {
      logger.error({ error, thingId, featureId }, 'Error updating feature properties');
      throw error;
    }
  }

  /**
   * Actualizar properties de Feature (actualización parcial)
   */
  async patchFeatureProperties(
    thingId: string,
    featureId: string,
    properties: Record<string, any>
  ): Promise<boolean> {
    try {
      await this.dittoClient.patchFeatureProperties(thingId, featureId, properties);
      logger.info({ thingId, featureId }, 'Feature properties patched');
      return true;
    } catch (error) {
      logger.error({ error, thingId, featureId }, 'Error patching feature properties');
      throw error;
    }
  }

  /**
   * Crear o actualizar Feature completo
   */
  async upsertFeature(thingId: string, featureId: string, feature: DittoFeature): Promise<boolean> {
    try {
      const thing = await this.dittoClient.getThing(thingId);
      if (!thing) {
        throw new Error(`Thing ${thingId} not found`);
      }

      thing.features = thing.features || {};
      thing.features[featureId] = feature;

      await this.dittoClient.createThing(thing);
      logger.info({ thingId, featureId }, 'Feature upserted');

      return true;
    } catch (error) {
      logger.error({ error, thingId, featureId }, 'Error upserting feature');
      throw error;
    }
  }

  /**
   * Eliminar Feature
   */
  async deleteFeature(thingId: string, featureId: string): Promise<boolean> {
    try {
      const thing = await this.dittoClient.getThing(thingId);
      if (!thing) {
        throw new Error(`Thing ${thingId} not found`);
      }

      if (thing.features && thing.features[featureId]) {
        delete thing.features[featureId];
        await this.dittoClient.createThing(thing);
        logger.info({ thingId, featureId }, 'Feature deleted');
      }

      return true;
    } catch (error) {
      logger.error({ error, thingId, featureId }, 'Error deleting feature');
      throw error;
    }
  }

  /**
   * Actualizar telemetría (feature telemetry)
   */
  async updateTelemetry(
    thingId: string,
    telemetryData: Record<string, { value: any; unit?: string; timestamp?: string }>
  ): Promise<boolean> {
    try {
      const properties: Record<string, any> = {};
      
      for (const [key, data] of Object.entries(telemetryData)) {
        properties[key] = {
          value: data.value,
          unit: data.unit,
          timestamp: data.timestamp || new Date().toISOString(),
        };
      }

      await this.dittoClient.patchFeatureProperties(thingId, 'telemetry', properties);
      logger.info({ thingId, tagCount: Object.keys(telemetryData).length }, 'Telemetry updated');

      return true;
    } catch (error) {
      logger.error({ error, thingId }, 'Error updating telemetry');
      throw error;
    }
  }

  /**
   * Obtener telemetría actual
   */
  async getTelemetry(thingId: string): Promise<Record<string, any> | null> {
    try {
      return await this.dittoClient.getFeatureProperties(thingId, 'telemetry');
    } catch (error) {
      logger.error({ error, thingId }, 'Error getting telemetry');
      throw error;
    }
  }
}
