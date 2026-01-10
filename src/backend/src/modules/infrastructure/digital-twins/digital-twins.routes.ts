import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../common/middleware/auth.middleware.js';
import { requirePermission } from '../../rbac/rbac.middleware.js';
import {
  createDigitalTwin,
  getDigitalTwin,
  updateDigitalTwin,
  deleteDigitalTwin,
  getAttributes,
  updateAttributes,
  getFeatureProperties,
  updateFeatureProperties,
  patchFeatureProperties,
  getTelemetry,
  updateTelemetry,
  migrateEntity,
  migrateAllEntities,
} from './digital-twins.controller.js';
import {
  createDigitalTwinSchema,
  updateDigitalTwinSchema,
  updateAttributesSchema,
  updateFeaturePropertiesSchema,
  telemetryUpdateSchema,
  migrationRequestSchema,
  thingIdParamSchema,
  featureIdParamSchema,
} from './digital-twins.schema.js';

export async function digitalTwinsRoutes(server: FastifyInstance) {
  // Todas las rutas requieren autenticación
  server.addHook('onRequest', authMiddleware);

  // CRUD de Digital Twins
  server.post(
    '/',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Crear nuevo Digital Twin',
        body: createDigitalTwinSchema,
      },
      preHandler: requirePermission('assets:create'),
    },
    createDigitalTwin
  );

  server.get(
    '/:thingId',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Obtener Digital Twin por ID',
        params: thingIdParamSchema,
      },
      preHandler: requirePermission('assets:read'),
    },
    getDigitalTwin
  );

  server.put(
    '/:thingId',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Actualizar Digital Twin',
        params: thingIdParamSchema,
        body: updateDigitalTwinSchema,
      },
      preHandler: requirePermission('assets:update'),
    },
    updateDigitalTwin
  );

  server.delete(
    '/:thingId',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Eliminar Digital Twin',
        params: thingIdParamSchema,
      },
      preHandler: requirePermission('assets:delete'),
    },
    deleteDigitalTwin
  );

  // Gestión de Atributos
  server.get(
    '/:thingId/attributes',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Obtener atributos de Digital Twin',
        params: thingIdParamSchema,
      },
      preHandler: requirePermission('assets:read'),
    },
    getAttributes
  );

  server.patch(
    '/:thingId/attributes',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Actualizar atributos de Digital Twin',
        params: thingIdParamSchema,
        body: updateAttributesSchema,
      },
      preHandler: requirePermission('assets:update'),
    },
    updateAttributes
  );

  // Gestión de Features
  server.get(
    '/:thingId/features/:featureId',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Obtener properties de Feature',
        params: featureIdParamSchema,
      },
      preHandler: requirePermission('assets:read'),
    },
    getFeatureProperties
  );

  server.put(
    '/:thingId/features/:featureId',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Actualizar properties de Feature (reemplazo completo)',
        params: featureIdParamSchema,
        body: updateFeaturePropertiesSchema,
      },
      preHandler: requirePermission('assets:update'),
    },
    updateFeatureProperties
  );

  server.patch(
    '/:thingId/features/:featureId',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Actualizar properties de Feature (parcial)',
        params: featureIdParamSchema,
        body: updateFeaturePropertiesSchema,
      },
      preHandler: requirePermission('assets:update'),
    },
    patchFeatureProperties
  );

  // Gestión de Telemetría
  server.get(
    '/:thingId/telemetry',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Obtener telemetría actual',
        params: thingIdParamSchema,
      },
      preHandler: requirePermission('assets:read'),
    },
    getTelemetry
  );

  server.post(
    '/:thingId/telemetry',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Actualizar telemetría',
        params: thingIdParamSchema,
        body: telemetryUpdateSchema,
      },
      preHandler: requirePermission('assets:update'),
    },
    updateTelemetry
  );

  // Migración de entidades legacy
  server.post(
    '/migrate',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Migrar entidad legacy a Ditto',
        body: migrationRequestSchema,
      },
      preHandler: requirePermission('assets:manage'),
    },
    migrateEntity
  );

  server.post(
    '/migrate/all',
    {
      schema: {
        tags: ['Digital Twins'],
        summary: 'Migrar todas las entidades del tenant',
      },
      preHandler: requirePermission('assets:manage'),
    },
    migrateAllEntities
  );
}
