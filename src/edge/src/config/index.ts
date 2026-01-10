import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const configSchema = z.object({
  gateway: z.object({
    id: z.string().default('edge-gateway-001'),
    name: z.string().default('Edge Gateway 1'),
    siteName: z.string().default('Site Alpha'),
  }),
  kafka: z.object({
    brokers: z.string().transform((val) => val.split(',')),
    clientId: z.string().default('edge-gateway'),
    groupId: z.string().default('edge-gateway-group'),
  }),
  modbus: z.object({
    enabled: z.string().transform((val) => val === 'true').default('true'),
    host: z.string().default('192.168.1.100'),
    port: z.number().default(502),
    timeout: z.number().default(5000),
    retryAttempts: z.number().default(3),
  }),
  opcua: z.object({
    enabled: z.string().transform((val) => val === 'true').default('false'),
    endpoint: z.string().default('opc.tcp://localhost:4840'),
    username: z.string().optional(),
    password: z.string().optional(),
  }),
  database: z.object({
    path: z.string().default('./data/edge.db'),
  }),
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    pretty: z.string().transform((val) => val === 'true').default('true'),
  }),
  dataCollection: z.object({
    pollingIntervalMs: z.number().default(1000),
    batchSize: z.number().default(100),
    bufferSize: z.number().default(1000),
  }),
  healthCheck: z.object({
    port: z.number().default(3001),
  }),
});

const rawConfig = {
  gateway: {
    id: process.env.GATEWAY_ID,
    name: process.env.GATEWAY_NAME,
    siteName: process.env.SITE_NAME,
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS || 'localhost:9092',
    clientId: process.env.KAFKA_CLIENT_ID,
    groupId: process.env.KAFKA_GROUP_ID,
  },
  modbus: {
    enabled: process.env.MODBUS_ENABLED,
    host: process.env.MODBUS_HOST,
    port: process.env.MODBUS_PORT ? parseInt(process.env.MODBUS_PORT) : undefined,
    timeout: process.env.MODBUS_TIMEOUT ? parseInt(process.env.MODBUS_TIMEOUT) : undefined,
    retryAttempts: process.env.MODBUS_RETRY_ATTEMPTS ? parseInt(process.env.MODBUS_RETRY_ATTEMPTS) : undefined,
  },
  opcua: {
    enabled: process.env.OPCUA_ENABLED,
    endpoint: process.env.OPCUA_ENDPOINT,
    username: process.env.OPCUA_USERNAME,
    password: process.env.OPCUA_PASSWORD,
  },
  database: {
    path: process.env.DB_PATH,
  },
  logging: {
    level: process.env.LOG_LEVEL,
    pretty: process.env.LOG_PRETTY,
  },
  dataCollection: {
    pollingIntervalMs: process.env.POLLING_INTERVAL_MS ? parseInt(process.env.POLLING_INTERVAL_MS) : undefined,
    batchSize: process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : undefined,
    bufferSize: process.env.BUFFER_SIZE ? parseInt(process.env.BUFFER_SIZE) : undefined,
  },
  healthCheck: {
    port: process.env.HEALTH_CHECK_PORT ? parseInt(process.env.HEALTH_CHECK_PORT) : undefined,
  },
};

export const config = configSchema.parse(rawConfig);
