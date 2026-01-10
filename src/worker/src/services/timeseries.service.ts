import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/index.js';

export interface TelemetryRecord {
  assetId: string;
  tenantId: string;
  timestamp: Date;
  tags: Record<string, {
    value: number | string | boolean;
    quality?: 'good' | 'bad' | 'uncertain';
    unit?: string;
  }>;
  source?: string;
}

/**
 * TimeSeries Service
 * 
 * Gestiona la persistencia de datos de telemetría en TimescaleDB
 */
export class TimeSeriesService {
  private client: postgres.Sql;
  private db: ReturnType<typeof drizzle>;

  constructor() {
    this.client = postgres(CONFIG.postgres.url);
    this.db = drizzle(this.client);
  }

  /**
   * Guardar telemetría en TimescaleDB
   */
  async saveTelemetry(telemetry: TelemetryRecord): Promise<void> {
    try {
      // Insertar cada tag como una fila en asset_telemetry
      const values = Object.entries(telemetry.tags).map(([tagName, tagData]) => ({
        asset_id: telemetry.assetId,
        tenant_id: telemetry.tenantId,
        timestamp: telemetry.timestamp,
        tag_name: tagName,
        value_numeric: typeof tagData.value === 'number' ? tagData.value : null,
        value_string: typeof tagData.value === 'string' ? tagData.value : null,
        value_boolean: typeof tagData.value === 'boolean' ? tagData.value : null,
        quality: tagData.quality || 'good',
        unit: tagData.unit,
        source: telemetry.source,
      }));

      // Batch insert
      await this.db.execute(sql`
        INSERT INTO asset_telemetry (
          asset_id, tenant_id, timestamp, tag_name,
          value_numeric, value_string, value_boolean,
          quality, unit, source
        )
        SELECT * FROM ${sql.raw('jsonb_to_recordset')}(${JSON.stringify(values)}::jsonb)
        AS t(
          asset_id uuid, tenant_id uuid, timestamp timestamptz, tag_name text,
          value_numeric numeric, value_string text, value_boolean boolean,
          quality text, unit text, source text
        )
      `);

      logger.debug('Telemetry saved to TimescaleDB', {
        assetId: telemetry.assetId,
        tagCount: Object.keys(telemetry.tags).length,
      });
    } catch (error) {
      logger.error('Error saving telemetry to TimescaleDB', {
        error,
        assetId: telemetry.assetId,
      });
      throw error;
    }
  }

  /**
   * Obtener última telemetría de un asset
   */
  async getLatestTelemetry(assetId: string, tagNames?: string[]): Promise<Record<string, any>> {
    try {
      const tagFilter = tagNames && tagNames.length > 0
        ? sql`AND tag_name = ANY(${tagNames})`
        : sql``;

      const result = await this.db.execute(sql`
        SELECT DISTINCT ON (tag_name)
          tag_name,
          value_numeric,
          value_string,
          value_boolean,
          quality,
          unit,
          timestamp
        FROM asset_telemetry
        WHERE asset_id = ${assetId}
          ${tagFilter}
        ORDER BY tag_name, timestamp DESC
      `);

      const telemetry: Record<string, any> = {};
      
      for (const row of result.rows as any[]) {
        telemetry[row.tag_name] = {
          value: row.value_numeric ?? row.value_string ?? row.value_boolean,
          quality: row.quality,
          unit: row.unit,
          timestamp: row.timestamp,
        };
      }

      return telemetry;
    } catch (error) {
      logger.error('Error getting latest telemetry', { error, assetId });
      throw error;
    }
  }

  /**
   * Cerrar conexión
   */
  async close(): Promise<void> {
    await this.client.end();
  }
}
