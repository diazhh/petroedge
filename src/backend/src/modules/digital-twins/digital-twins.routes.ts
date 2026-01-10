/**
 * Digital Twins Routes
 */
import type { FastifyInstance } from 'fastify';
import * as controller from './digital-twins.controller';

export default async function digitalTwinsRoutes(fastify: FastifyInstance) {
  // List Things
  fastify.get('/', controller.listThings);

  // Get Thing by ID
  fastify.get('/:thingId', controller.getThing);

  // Create Thing
  fastify.post('/', controller.createThing);

  // Update Thing
  fastify.patch('/:thingId', controller.updateThing);

  // Delete Thing
  fastify.delete('/:thingId', controller.deleteThing);

  // Update attributes
  fastify.patch('/:thingId/attributes', controller.updateAttributes);

  // Update feature properties
  fastify.patch('/:thingId/features/:featureId/properties', controller.updateFeatureProperties);
}
