import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import { config } from './common/config';
import { logger } from './common/utils/logger';
import { kafkaService } from './common/kafka/index.js';
import { redisService } from './common/redis/index.js';
import { configSyncService } from './modules/edge-gateways/config-sync.service.js';

const fastify = Fastify({
  logger: logger,
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  trustProxy: true,
});

async function start() {
  try {
    await fastify.register(helmet, {
      contentSecurityPolicy: false,
    });

    await fastify.register(cors, {
      origin: config.cors.origin,
      credentials: true,
    });

    await fastify.register(rateLimit, {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
    });

    await fastify.register(websocket);

    await fastify.register(swagger, {
      swagger: {
        info: {
          title: 'SCADA+ERP Petrolero API',
          description: 'API REST para sistema ERP+SCADA de exploración y producción petrolera',
          version: '0.1.0',
        },
        host: `${config.server.host}:${config.server.port}`,
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'auth', description: 'Autenticación y autorización' },
          { name: 'rbac', description: 'Control de acceso basado en roles (RBAC)' },
          { name: 'Asset Types', description: 'Tipos de activos (Digital Twins)' },
          { name: 'Assets', description: 'Activos/Gemelos Digitales' },
          { name: 'Telemetry', description: 'Telemetría de activos' },
          { name: 'Computed Fields', description: 'Campos calculados de activos' },
          { name: 'Rules', description: 'Motor de reglas visual' },
          { name: 'Digital Twins', description: 'Gemelos Digitales (Eclipse Ditto)' },
          { name: 'Magnitude Categories', description: 'Categorías de magnitudes físicas' },
          { name: 'Magnitudes', description: 'Magnitudes físicas' },
          { name: 'Units', description: 'Unidades de medida' },
          { name: 'Unit Converter', description: 'Conversión de unidades' },
          { name: 'well-testing', description: 'Pruebas de pozo e IPR' },
          { name: 'drilling', description: 'Operaciones de perforación' },
          { name: 'coiled-tubing', description: 'Operaciones de Coiled Tubing' },
          { name: 'health', description: 'Health checks' },
        ],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'JWT token. Format: Bearer {token}',
          },
        },
      },
    });

    await fastify.register(swaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    });

    fastify.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: '0.1.0',
      };
    });

    fastify.get('/', async () => {
      return {
        name: 'SCADA+ERP Petrolero API',
        version: '0.1.0',
        description: 'Sistema ERP+SCADA para exploración y producción petrolera',
        documentation: '/docs',
        health: '/health',
      };
    });

    await fastify.register(import('./modules/auth/auth.routes'), { prefix: '/api/v1/auth' });
    await fastify.register(import('./modules/rbac/rbac.routes'), { prefix: '/api/v1/rbac' });
    await fastify.register(import('./modules/infrastructure/assets/assets.routes'), { prefix: '/api/v1/infrastructure/assets' });
    await fastify.register(import('./modules/infrastructure/telemetry/telemetry.routes'), { prefix: '/api/v1/infrastructure/telemetry' });
    await fastify.register(import('./modules/infrastructure/computed-fields/computed-fields.routes'), { prefix: '/api/v1/infrastructure/computed-fields' });
    await fastify.register(import('./modules/infrastructure/rules/rules.routes'), { prefix: '/api/v1/infrastructure/rules' });
    await fastify.register(import('./modules/digital-twins/digital-twins.routes'), { prefix: '/api/v1/digital-twins' });
    await fastify.register(import('./modules/data-sources/data-sources.routes'), { prefix: '/api/v1/data-sources' });
    await fastify.register(import('./modules/edge-gateways/edge-gateways.routes'), { prefix: '/api/v1/edge-gateways' });
    await fastify.register(import('./modules/device-profiles/device-profiles.routes'), { prefix: '/api/v1/device-profiles' });
    await fastify.register(import('./modules/asset-templates/asset-templates.routes'), { prefix: '/api/v1/asset-templates' });
    await fastify.register(import('./modules/asset-types/asset-types.routes'), { prefix: '/api/v1/asset-types' });
    await fastify.register(import('./modules/magnitude-categories/magnitude-categories.routes'), { prefix: '/api/v1/magnitude-categories' });
    await fastify.register(import('./modules/magnitudes/magnitudes.routes'), { prefix: '/api/v1/magnitudes' });
    await fastify.register(import('./modules/units/units.routes'), { prefix: '/api/v1/units' });
    await fastify.register(import('./modules/unit-converter/unit-converter.routes'), { prefix: '/api/v1/unit-converter' });
    await fastify.register(import('./modules/connectivity-profiles/connectivity-profiles.routes'), { prefix: '/api/v1/connectivity-profiles' });
    await fastify.register(import('./modules/device-bindings/device-bindings.routes'), { prefix: '/api/v1/device-bindings' });
    await fastify.register(import('./modules/well-testing/well-testing.routes'), { prefix: '/api/v1' });
    await fastify.register(import('./modules/drilling/drilling.routes'), { prefix: '/api/v1/drilling' });
    await fastify.register(import('./modules/coiled-tubing/coiled-tubing.routes'), { prefix: '/api/v1/coiled-tubing' });

    // Initialize Redis
    try {
      await redisService.connect();
      logger.info('✅ Redis connected');
    } catch (error) {
      logger.error('❌ Failed to connect to Redis', error);
      logger.warn('⚠️  Server will continue without Redis cache');
    }

    // Initialize Kafka producer
    try {
      await kafkaService.initProducer();
      logger.info('✅ Kafka producer initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Kafka producer', error);
      logger.warn('⚠️  Server will continue without Kafka');
    }

    // Note: Kafka consumers moved to Worker Service
    // - Telemetry Consumer
    // - Computed Fields Consumer
    // - Rule Trigger Consumer
    // - WebSocket Broadcast Consumer
    // - Calculation Engine Consumer

    const address = await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    // Note: WebSocket Gateway moved to Worker Service

    // Initialize Config Sync Service
    try {
      await configSyncService.initialize();
      logger.info('✅ Config Sync Service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Config Sync Service', error);
      logger.warn('⚠️  Server will continue without config sync');
    }

    logger.info(`🚀 Server listening on ${address}`);
    logger.info(`📚 API Documentation: ${address}/docs`);
    logger.info(`💚 Health Check: ${address}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await configSyncService.shutdown();
  await kafkaService.disconnect();
  await redisService.disconnect();
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await configSyncService.shutdown();
  await kafkaService.disconnect();
  await redisService.disconnect();
  await fastify.close();
  process.exit(0);
});

start();
