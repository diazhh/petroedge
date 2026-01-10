import { kafkaService } from './kafka.service.js';
import { logger } from '../utils/logger.js';

/**
 * Initialize Kafka topics for the SCADA+ERP system
 */
export async function initKafkaTopics(): Promise<void> {
  try {
    logger.info('Initializing Kafka topics...');

    await kafkaService.initAdmin();

    const topics = [
      // SCADA Telemetry Topics
      {
        topic: 'scada.telemetry.raw',
        numPartitions: 6,
        replicationFactor: 1,
      },
      {
        topic: 'scada.telemetry.validated',
        numPartitions: 6,
        replicationFactor: 1,
      },
      {
        topic: 'scada.telemetry.aggregated',
        numPartitions: 3,
        replicationFactor: 1,
      },

      // Alarms and Events
      {
        topic: 'scada.alarms',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'scada.events',
        numPartitions: 3,
        replicationFactor: 1,
      },

      // Well Testing Topics
      {
        topic: 'well-testing.events',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'well-testing.results',
        numPartitions: 3,
        replicationFactor: 1,
      },

      // Production Topics
      {
        topic: 'production.daily',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'production.realtime',
        numPartitions: 6,
        replicationFactor: 1,
      },

      // Drilling Topics
      {
        topic: 'drilling.events',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'drilling.logs',
        numPartitions: 3,
        replicationFactor: 1,
      },

      // System Topics
      {
        topic: 'system.audit',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'system.notifications',
        numPartitions: 3,
        replicationFactor: 1,
      },

      // Edge-Cloud Sync Topics
      {
        topic: 'sync.edge-to-cloud',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'sync.cloud-to-edge',
        numPartitions: 3,
        replicationFactor: 1,
      },
    ];

    await kafkaService.createTopics(topics);

    const existingTopics = await kafkaService.listTopics();
    logger.info(`Kafka topics initialized successfully. Total topics: ${existingTopics.length}`);
    logger.debug('Existing topics:', { topics: existingTopics });

    await kafkaService.disconnect();
  } catch (error) {
    logger.error('Failed to initialize Kafka topics', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initKafkaTopics()
    .then(() => {
      logger.info('Kafka topics initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Kafka topics initialization failed', error);
      process.exit(1);
    });
}
