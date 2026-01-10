import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { kafkaService } from './services/kafka.service.js';
import { dataCollectorServiceV2 } from './services/data-collector-v2.service.js';
import { configSyncService } from './services/config-sync.service.js';
import { heartbeatService } from './services/heartbeat.service.js';
import { TagConfig } from './services/protocols/protocol-interface.js';
import http from 'http';

// Example tag configuration (in production, this would come from a config file or API)
// Using new TagConfig format with protocolConfig
const exampleTags: TagConfig[] = [
  {
    tagId: 'WELL-001.OIL_RATE',
    assetId: 'well-001-uuid',
    description: 'Oil production rate',
    protocol: 'modbus',
    protocolConfig: {
      unitId: 1,
      registerType: 'holding',
      address: 0,
      quantity: 2,
      dataType: 'float32',
    },
    unit: 'BOPD',
    scanRate: 5000, // 5 seconds
    deadband: 0.5,
    enabled: true,
  },
  {
    tagId: 'WELL-001.GAS_RATE',
    assetId: 'well-001-uuid',
    description: 'Gas production rate',
    protocol: 'modbus',
    protocolConfig: {
      unitId: 1,
      registerType: 'holding',
      address: 2,
      quantity: 2,
      dataType: 'float32',
    },
    unit: 'MSCFD',
    scanRate: 5000,
    deadband: 1.0,
    enabled: true,
  },
  {
    tagId: 'WELL-001.PRESSURE',
    assetId: 'well-001-uuid',
    description: 'Wellhead pressure',
    protocol: 'modbus',
    protocolConfig: {
      unitId: 1,
      registerType: 'holding',
      address: 4,
      quantity: 2,
      dataType: 'float32',
    },
    unit: 'PSI',
    scanRate: 2000, // 2 seconds (more frequent for critical parameter)
    deadband: 2.0,
    enabled: true,
  },
  {
    tagId: 'WELL-001.TEMPERATURE',
    assetId: 'well-001-uuid',
    description: 'Wellhead temperature',
    protocol: 'modbus',
    protocolConfig: {
      unitId: 1,
      registerType: 'holding',
      address: 6,
      quantity: 2,
      dataType: 'float32',
    },
    unit: 'DEGF',
    scanRate: 10000, // 10 seconds
    deadband: 1.0,
    enabled: true,
  },
];

async function start() {
  try {
    logger.info('Starting Edge Gateway...', {
      gatewayId: config.gateway.id,
      gatewayName: config.gateway.name,
      siteName: config.gateway.siteName,
    });

    // Initialize Kafka producer
    try {
      await kafkaService.initProducer();
      logger.info('✅ Kafka producer initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Kafka producer', error);
      logger.warn('⚠️  Gateway will continue but telemetry will not be sent');
    }

    // Register tags for data collection
    dataCollectorServiceV2.registerTags(exampleTags);
    logger.info(`✅ Registered ${exampleTags.length} tags for data collection`);

    // Start data collector V2 (multi-protocol support)
    await dataCollectorServiceV2.start();
    logger.info('✅ Data collector V2 started with multi-protocol support');

    // Start Config Sync Service (consume configuration changes from Cloud)
    try {
      await configSyncService.start();
      logger.info('✅ Config Sync Service started');
    } catch (error) {
      logger.error('❌ Failed to start Config Sync Service', error);
      logger.warn('⚠️  Gateway will continue but configuration sync is disabled');
    }

    // Start Heartbeat Service (send periodic status to Cloud)
    try {
      await heartbeatService.start();
      logger.info('✅ Heartbeat Service started');
    } catch (error) {
      logger.error('❌ Failed to start Heartbeat Service', error);
      logger.warn('⚠️  Gateway will continue but heartbeat is disabled');
    }

    // Start health check HTTP server
    const healthServer = http.createServer(async (req, res) => {
      if (req.url === '/health') {
        const stats = dataCollectorServiceV2.getStats();
        const driversHealth = await dataCollectorServiceV2.getDriversHealth();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            gateway: {
              id: config.gateway.id,
              name: config.gateway.name,
              site: config.gateway.siteName,
            },
            collector: stats,
            drivers: driversHealth,
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    healthServer.listen(config.healthCheck.port, () => {
      logger.info(`✅ Health check server listening on port ${config.healthCheck.port}`);
      logger.info(`💚 Health endpoint: http://localhost:${config.healthCheck.port}/health`);
    });

    logger.info('🚀 Edge Gateway started successfully');
  } catch (err) {
    logger.error('Failed to start Edge Gateway', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await heartbeatService.stop();
  await configSyncService.stop();
  await dataCollectorServiceV2.stop();
  await kafkaService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await heartbeatService.stop();
  await configSyncService.stop();
  await dataCollectorServiceV2.stop();
  await kafkaService.disconnect();
  process.exit(0);
});

start();
