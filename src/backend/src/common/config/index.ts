import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string().default('scadaerp'),
  DB_USER: z.string().default('scadaerp'),
  DB_PASSWORD: z.string().default(''),
  DATABASE_URL: z.string().optional(),
  
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  MQTT_HOST: z.string().default('localhost'),
  MQTT_PORT: z.string().transform(Number).default('1883'),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  MQTT_CLIENT_ID: z.string().default('scadaerp-backend'),
  
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().default('scadaerp-backend'),
  KAFKA_GROUP_ID: z.string().default('scadaerp-consumers'),
  KAFKA_ENABLE_SSL: z.string().transform((val) => val === 'true').default('false'),
  KAFKA_SASL_MECHANISM: z.string().optional(),
  KAFKA_SASL_USERNAME: z.string().optional(),
  KAFKA_SASL_PASSWORD: z.string().optional(),
  
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.string().transform((val) => val === 'true').default('true'),
  
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_TIMEWINDOW: z.string().transform(Number).default('60000'),
  
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  
  DEFAULT_TENANT_ID: z.string().default('default'),
  
  EDGE_SITE_ID: z.string().default('EDGE-001'),
  EDGE_SITE_NAME: z.string().default('Campo Norte'),
  
  CLOUD_ENABLED: z.string().transform((val) => val === 'true').default('false'),
  CLOUD_API_URL: z.string().optional(),
  CLOUD_API_KEY: z.string().optional(),
});

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  server: {
    port: env.PORT,
    host: env.HOST,
  },
  
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    url: env.DATABASE_URL || `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  mqtt: {
    host: env.MQTT_HOST,
    port: env.MQTT_PORT,
    username: env.MQTT_USERNAME,
    password: env.MQTT_PASSWORD,
    clientId: env.MQTT_CLIENT_ID,
  },
  
  kafka: {
    brokers: env.KAFKA_BROKERS.split(','),
    clientId: env.KAFKA_CLIENT_ID,
    groupId: env.KAFKA_GROUP_ID,
    enableSsl: env.KAFKA_ENABLE_SSL,
    sasl: env.KAFKA_SASL_MECHANISM ? {
      mechanism: env.KAFKA_SASL_MECHANISM as 'plain' | 'scram-sha-256' | 'scram-sha-512',
      username: env.KAFKA_SASL_USERNAME || '',
      password: env.KAFKA_SASL_PASSWORD || '',
    } : undefined,
  },
  
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  
  logging: {
    level: env.LOG_LEVEL,
    pretty: env.LOG_PRETTY,
  },
  
  cors: {
    origin: env.CORS_ORIGIN,
  },
  
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIMEWINDOW,
  },
  
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
  },
  
  tenant: {
    defaultId: env.DEFAULT_TENANT_ID,
  },
  
  edge: {
    siteId: env.EDGE_SITE_ID,
    siteName: env.EDGE_SITE_NAME,
  },
  
  cloud: {
    enabled: env.CLOUD_ENABLED,
    apiUrl: env.CLOUD_API_URL,
    apiKey: env.CLOUD_API_KEY,
  },
} as const;
