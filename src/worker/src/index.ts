import { createServer } from 'http';
import { CONFIG } from './config/index.js';
import { logger } from './utils/logger.js';
import { registerDefaultNodes } from './rule-engine/nodes/index.js';
import { TelemetryConsumer } from './consumers/telemetry.consumer.js';
import { RuleTriggerConsumer } from './consumers/rule-trigger.consumer.js';
import { AlarmBroadcastConsumer } from './consumers/alarm-broadcast.consumer.js';
import { AlarmService } from './services/alarm.service.js';
import { WebSocketGatewayService } from './services/websocket-gateway.service.js';
import { DittoClientService } from './services/ditto-client.service.js';
import { TimeSeriesService } from './services/timeseries.service.js';
import { RedisCacheService } from './services/redis-cache.service.js';
import { RuleEngineExecutorService } from './services/rule-engine-executor.service.js';

// Servicios globales
let telemetryConsumer: TelemetryConsumer;
let ruleTriggerConsumer: RuleTriggerConsumer;
let alarmBroadcastConsumer: AlarmBroadcastConsumer;
let alarmService: AlarmService;
let websocketGateway: WebSocketGatewayService;
let dittoClient: DittoClientService;
let timeSeriesService: TimeSeriesService;
let redisCacheService: RedisCacheService;
let ruleEngineExecutor: RuleEngineExecutorService;

async function main() {
  logger.info('Starting Worker Service...');
  logger.info('Configuration loaded', {
    kafka: CONFIG.kafka.brokers,
    redis: `${CONFIG.redis.host}:${CONFIG.redis.port}`,
    ditto: CONFIG.ditto.url,
    websocket: CONFIG.websocket.port,
  });

  // Registrar nodos del Rule Engine
  registerDefaultNodes();
  logger.info('Rule Engine nodes registered');

  // Inicializar Ditto Client
  dittoClient = new DittoClientService();
  logger.info('Ditto Client initialized');

  // Inicializar TimeSeries Service
  timeSeriesService = new TimeSeriesService();
  logger.info('TimeSeries Service initialized');

  // Inicializar Redis Cache Service
  redisCacheService = new RedisCacheService();
  logger.info('Redis Cache Service initialized');

  // Inicializar Rule Engine Executor
  ruleEngineExecutor = new RuleEngineExecutorService();
  logger.info('Rule Engine Executor initialized');

  // Inicializar Alarm Service
  alarmService = new AlarmService({
    kafkaBroker: CONFIG.kafka.brokers[0],
    kafkaTopic: 'scada.alarms',
    postgresUrl: CONFIG.postgres.url,
  });
  await alarmService.initialize();
  logger.info('Alarm Service initialized');

  // Crear servidor HTTP para WebSocket
  const httpServer = createServer();
  
  // Inicializar WebSocket Gateway
  websocketGateway = new WebSocketGatewayService({
    httpServer,
    corsOrigin: CONFIG.websocket.corsOrigin,
    path: '/ws',
  });
  websocketGateway.initialize();
  logger.info('WebSocket Gateway initialized');

  // Iniciar servidor HTTP
  httpServer.listen(CONFIG.websocket.port, () => {
    logger.info(`WebSocket server listening on port ${CONFIG.websocket.port}`);
  });

  // Inicializar Kafka consumers
  telemetryConsumer = new TelemetryConsumer({
    kafkaBroker: CONFIG.kafka.brokers[0],
    groupId: 'worker-telemetry-group',
    topics: ['scada.telemetry.raw', 'scada.telemetry.validated'],
    timeSeriesService,
    redisCacheService,
  });
  await telemetryConsumer.start();
  logger.info('Telemetry Consumer started');

  ruleTriggerConsumer = new RuleTriggerConsumer({
    kafkaBroker: CONFIG.kafka.brokers[0],
    groupId: 'worker-rule-trigger-group',
    topics: [
      'scada.telemetry.validated',
      'assets.attributes.changed',
      'assets.status.changed',
    ],
    ruleEngineExecutor,
  });
  await ruleTriggerConsumer.start();
  logger.info('Rule Trigger Consumer started');

  alarmBroadcastConsumer = new AlarmBroadcastConsumer(
    {
      kafkaBroker: CONFIG.kafka.brokers[0],
      groupId: 'worker-alarm-broadcast-group',
      topics: ['scada.alarms'],
    },
    websocketGateway
  );
  await alarmBroadcastConsumer.start();
  logger.info('Alarm Broadcast Consumer started');

  logger.info('Worker Service started successfully');
  logger.info('Services running:', {
    telemetryConsumer: 'active',
    ruleTriggerConsumer: 'active',
    alarmBroadcastConsumer: 'active',
    websocketGateway: 'active',
    alarmService: 'active',
    dittoClient: 'ready',
    timeSeriesService: 'ready',
    redisCacheService: 'ready',
    ruleEngineExecutor: 'ready',
  });
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down Worker Service...');

  // Detener consumers
  if (telemetryConsumer) {
    await telemetryConsumer.stop();
  }
  if (ruleTriggerConsumer) {
    await ruleTriggerConsumer.stop();
  }
  if (alarmBroadcastConsumer) {
    await alarmBroadcastConsumer.stop();
  }

  // Cerrar servicios
  if (websocketGateway) {
    await websocketGateway.shutdown();
  }
  if (alarmService) {
    await alarmService.shutdown();
  }
  if (timeSeriesService) {
    await timeSeriesService.close();
  }
  if (redisCacheService) {
    await redisCacheService.close();
  }
  if (ruleEngineExecutor) {
    await ruleEngineExecutor.close();
  }

  logger.info('Worker Service shut down successfully');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((error) => {
  logger.error('Fatal error starting Worker Service', { error });
  process.exit(1);
});
