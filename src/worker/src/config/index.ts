import { config } from 'dotenv';

config();

export const CONFIG = {
  kafka: {
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    clientId: 'worker-service',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '16379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  websocket: {
    port: parseInt(process.env.WS_PORT || '3001', 10),
    corsOrigin: process.env.WS_CORS_ORIGIN || 'http://localhost:5173',
  },
  ditto: {
    url: process.env.DITTO_URL || 'http://localhost:8080',
    username: process.env.DITTO_USERNAME || 'devops',
    password: process.env.DITTO_PASSWORD || 'ditto',
  },
  postgres: {
    url: process.env.DATABASE_URL || 'postgresql://scadaerp:scadaerp_dev_password@localhost:15432/scadaerp',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};
