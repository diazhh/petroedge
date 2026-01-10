import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateDigitalTwinInput,
  UpdateDigitalTwinInput,
  UpdateAttributesInput,
  UpdateFeaturePropertiesInput,
  TelemetryUpdateInput,
  MigrationRequestInput,
} from './digital-twins.schema.js';
import { logger } from '../../../common/utils/logger.js';

// Cliente HTTP para comunicarse con Eclipse Ditto directamente
const DITTO_URL = process.env.DITTO_URL || 'http://localhost:8080';
const DITTO_AUTH = Buffer.from('ditto:ditto').toString('base64');

async function dittoFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${DITTO_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Basic ${DITTO_AUTH}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok && response.status !== 404) {
    throw new Error(`Ditto API error: ${response.statusText}`);
  }
  
  return response;
}

/**
 * Crear nuevo Digital Twin
 */
export async function createDigitalTwin(
  request: FastifyRequest<{ Body: CreateDigitalTwinInput }>,
  reply: FastifyReply
) {
  try {
    const tenantId = request.user!.tenantId;
    const thingId = `${tenantId}:${request.body.type.toLowerCase()}-${request.body.code}`;

    const thing = {
      thingId,
      policyId: `${tenantId}:default-policy`,
      attributes: {
        type: request.body.type,
        code: request.body.code,
        name: request.body.name,
        description: request.body.description,
        parentThingId: request.body.parentThingId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...request.body.attributes,
      },
      features: request.body.features || {},
    };

    await dittoFetch(`/api/2/things/${thingId}`, {
      method: 'PUT',
      body: JSON.stringify(thing),
    });

    return reply.status(201).send({
      success: true,
      data: { thingId },
    });
  } catch (error) {
    logger.error({ error }, 'Error creating digital twin');
    return reply.status(500).send({
      success: false,
      error: 'Failed to create digital twin',
    });
  }
}

/**
 * Obtener Digital Twin por ID
 */
export async function getDigitalTwin(
  request: FastifyRequest<{ Params: { thingId: string } }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    const response = await dittoFetch(`/api/2/things/${thingId}`);

    if (response.status === 404) {
      return reply.status(404).send({
        success: false,
        error: 'Digital twin not found',
      });
    }

    const thing = await response.json();

    return reply.send({
      success: true,
      data: thing,
    });
  } catch (error) {
    logger.error({ error }, 'Error getting digital twin');
    return reply.status(500).send({
      success: false,
      error: 'Failed to get digital twin',
    });
  }
}

/**
 * Actualizar Digital Twin
 */
export async function updateDigitalTwin(
  request: FastifyRequest<{
    Params: { thingId: string };
    Body: UpdateDigitalTwinInput;
  }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    
    // Obtener thing actual
    const getResponse = await dittoFetch(`/api/2/things/${thingId}`);
    if (getResponse.status === 404) {
      return reply.status(404).send({
        success: false,
        error: 'Digital twin not found',
      });
    }
    
    const thing = await getResponse.json();
    
    // Actualizar
    if (request.body.attributes) {
      thing.attributes = { ...thing.attributes, ...request.body.attributes, updatedAt: new Date().toISOString() };
    }
    if (request.body.features) {
      thing.features = { ...thing.features, ...request.body.features };
    }
    
    await dittoFetch(`/api/2/things/${thingId}`, {
      method: 'PUT',
      body: JSON.stringify(thing),
    });

    return reply.send({
      success: true,
      message: 'Digital twin updated successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error updating digital twin');
    return reply.status(500).send({
      success: false,
      error: 'Failed to update digital twin',
    });
  }
}

/**
 * Eliminar Digital Twin
 */
export async function deleteDigitalTwin(
  request: FastifyRequest<{ Params: { thingId: string } }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    await dittoFetch(`/api/2/things/${thingId}`, { method: 'DELETE' });

    return reply.send({
      success: true,
      message: 'Digital twin deleted successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error deleting digital twin');
    return reply.status(500).send({
      success: false,
      error: 'Failed to delete digital twin',
    });
  }
}

/**
 * Obtener atributos de Digital Twin
 */
export async function getAttributes(
  request: FastifyRequest<{ Params: { thingId: string } }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    const response = await dittoFetch(`/api/2/things/${thingId}/attributes`);

    if (response.status === 404) {
      return reply.status(404).send({
        success: false,
        error: 'Attributes not found',
      });
    }

    const attributes = await response.json();

    return reply.send({
      success: true,
      data: attributes,
    });
  } catch (error) {
    logger.error({ error }, 'Error getting attributes');
    return reply.status(500).send({
      success: false,
      error: 'Failed to get attributes',
    });
  }
}

/**
 * Actualizar atributos de Digital Twin
 */
export async function updateAttributes(
  request: FastifyRequest<{
    Params: { thingId: string };
    Body: UpdateAttributesInput;
  }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    
    const body = {
      ...request.body,
      updatedAt: new Date().toISOString(),
    };
    
    await dittoFetch(`/api/2/things/${thingId}/attributes`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    return reply.send({
      success: true,
      message: 'Attributes updated successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error updating attributes');
    return reply.status(500).send({
      success: false,
      error: 'Failed to update attributes',
    });
  }
}

/**
 * Obtener properties de Feature
 */
export async function getFeatureProperties(
  request: FastifyRequest<{ Params: { thingId: string; featureId: string } }>,
  reply: FastifyReply
) {
  try {
    const { thingId, featureId } = request.params;
    const response = await dittoFetch(`/api/2/things/${thingId}/features/${featureId}/properties`);

    if (response.status === 404) {
      return reply.status(404).send({
        success: false,
        error: 'Feature properties not found',
      });
    }

    const properties = await response.json();

    return reply.send({
      success: true,
      data: properties,
    });
  } catch (error) {
    logger.error({ error }, 'Error getting feature properties');
    return reply.status(500).send({
      success: false,
      error: 'Failed to get feature properties',
    });
  }
}

/**
 * Actualizar properties de Feature (PUT - reemplazo completo)
 */
export async function updateFeatureProperties(
  request: FastifyRequest<{
    Params: { thingId: string; featureId: string };
    Body: UpdateFeaturePropertiesInput;
  }>,
  reply: FastifyReply
) {
  try {
    const { thingId, featureId } = request.params;
    await dittoFetch(`/api/2/things/${thingId}/features/${featureId}/properties`, {
      method: 'PUT',
      body: JSON.stringify(request.body),
    });

    return reply.send({
      success: true,
      message: 'Feature properties updated successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error updating feature properties');
    return reply.status(500).send({
      success: false,
      error: 'Failed to update feature properties',
    });
  }
}

/**
 * Actualizar properties de Feature (PATCH - actualización parcial)
 */
export async function patchFeatureProperties(
  request: FastifyRequest<{
    Params: { thingId: string; featureId: string };
    Body: UpdateFeaturePropertiesInput;
  }>,
  reply: FastifyReply
) {
  try {
    const { thingId, featureId } = request.params;
    await dittoFetch(`/api/2/things/${thingId}/features/${featureId}/properties`, {
      method: 'PATCH',
      body: JSON.stringify(request.body),
    });

    return reply.send({
      success: true,
      message: 'Feature properties patched successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error patching feature properties');
    return reply.status(500).send({
      success: false,
      error: 'Failed to patch feature properties',
    });
  }
}

/**
 * Obtener telemetría actual
 */
export async function getTelemetry(
  request: FastifyRequest<{ Params: { thingId: string } }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    const response = await dittoFetch(`/api/2/things/${thingId}/features/telemetry/properties`);

    if (response.status === 404) {
      return reply.status(404).send({
        success: false,
        error: 'Telemetry not found',
      });
    }

    const telemetry = await response.json();

    return reply.send({
      success: true,
      data: telemetry,
    });
  } catch (error) {
    logger.error({ error }, 'Error getting telemetry');
    return reply.status(500).send({
      success: false,
      error: 'Failed to get telemetry',
    });
  }
}

/**
 * Actualizar telemetría
 */
export async function updateTelemetry(
  request: FastifyRequest<{
    Params: { thingId: string };
    Body: TelemetryUpdateInput;
  }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    
    const properties: Record<string, any> = {};
    for (const [key, data] of Object.entries(request.body)) {
      properties[key] = {
        value: data.value,
        unit: data.unit,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    }
    
    await dittoFetch(`/api/2/things/${thingId}/features/telemetry/properties`, {
      method: 'PATCH',
      body: JSON.stringify(properties),
    });

    return reply.send({
      success: true,
      message: 'Telemetry updated successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error updating telemetry');
    return reply.status(500).send({
      success: false,
      error: 'Failed to update telemetry',
    });
  }
}

/**
 * Migrar entidad legacy a Ditto
 * NOTA: Esta funcionalidad requiere ejecutar el script de migración en el Worker Service
 */
export async function migrateEntity(
  request: FastifyRequest<{ Body: MigrationRequestInput }>,
  reply: FastifyReply
) {
  try {
    return reply.status(501).send({
      success: false,
      error: 'Migration must be executed from Worker Service. Use: npm run migrate:ditto',
    });
  } catch (error) {
    logger.error({ error }, 'Error migrating entity');
    return reply.status(500).send({
      success: false,
      error: 'Failed to migrate entity',
    });
  }
}

/**
 * Migrar todas las entidades del tenant
 * NOTA: Esta funcionalidad requiere ejecutar el script de migración en el Worker Service
 */
export async function migrateAllEntities(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    return reply.status(501).send({
      success: false,
      error: 'Migration must be executed from Worker Service. Use: npm run migrate:ditto',
    });
  } catch (error) {
    logger.error({ error }, 'Error migrating all entities');
    return reply.status(500).send({
      success: false,
      error: 'Failed to migrate all entities',
    });
  }
}
