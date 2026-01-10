/**
 * Digital Twins Controller
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { DigitalTwinsService } from './digital-twins.service';
import type { CreateThingDto, UpdateThingDto, ThingQueryParams } from './digital-twins.types';

const digitalTwinsService = new DigitalTwinsService();

/**
 * List Things
 * GET /api/v1/digital-twins
 */
export async function listThings(
  request: FastifyRequest<{ Querystring: ThingQueryParams }>,
  reply: FastifyReply
) {
  try {
    const tenantId = request.user?.tenantId || 'default';
    const result = await digitalTwinsService.listThings(tenantId, request.query);
    
    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'DITTO_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list things',
      },
    });
  }
}

/**
 * Get Thing by ID
 * GET /api/v1/digital-twins/:thingId
 */
export async function getThing(
  request: FastifyRequest<{ Params: { thingId: string } }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    const result = await digitalTwinsService.getThing(thingId);
    
    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(404).send({
      success: false,
      error: {
        code: 'THING_NOT_FOUND',
        message: 'Thing not found',
      },
    });
  }
}

/**
 * Create Thing
 * POST /api/v1/digital-twins
 */
export async function createThing(
  request: FastifyRequest<{ Body: CreateThingDto }>,
  reply: FastifyReply
) {
  try {
    const result = await digitalTwinsService.createThing(request.body);
    
    return reply.status(201).send({
      success: true,
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create thing',
      },
    });
  }
}

/**
 * Update Thing
 * PATCH /api/v1/digital-twins/:thingId
 */
export async function updateThing(
  request: FastifyRequest<{ Params: { thingId: string }; Body: UpdateThingDto }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    const result = await digitalTwinsService.updateThing(thingId, request.body);
    
    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update thing',
      },
    });
  }
}

/**
 * Delete Thing
 * DELETE /api/v1/digital-twins/:thingId
 */
export async function deleteThing(
  request: FastifyRequest<{ Params: { thingId: string } }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    await digitalTwinsService.deleteThing(thingId);
    
    return reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to delete thing',
      },
    });
  }
}

/**
 * Update Thing attributes
 * PATCH /api/v1/digital-twins/:thingId/attributes
 */
export async function updateAttributes(
  request: FastifyRequest<{ Params: { thingId: string }; Body: Record<string, any> }>,
  reply: FastifyReply
) {
  try {
    const { thingId } = request.params;
    await digitalTwinsService.updateAttributes(thingId, request.body);
    
    return reply.send({
      success: true,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update attributes',
      },
    });
  }
}

/**
 * Update Feature properties
 * PATCH /api/v1/digital-twins/:thingId/features/:featureId/properties
 */
export async function updateFeatureProperties(
  request: FastifyRequest<{
    Params: { thingId: string; featureId: string };
    Body: Record<string, any>;
  }>,
  reply: FastifyReply
) {
  try {
    const { thingId, featureId } = request.params;
    await digitalTwinsService.updateFeatureProperties(thingId, featureId, request.body);
    
    return reply.send({
      success: true,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update feature properties',
      },
    });
  }
}
