import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './src/common/database/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '15432'),
    user: process.env.DB_USER || 'scadaerp',
    password: process.env.DB_PASSWORD || 'scadaerp_dev_password',
    database: process.env.DB_NAME || 'scadaerp',
  },
} satisfies Config;
