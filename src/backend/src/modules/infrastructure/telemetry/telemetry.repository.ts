import { sql } from 'drizzle-orm';
import { db } from '../../../common/database';
import {
  assetTelemetry,
  type NewAssetTelemetry,
} from '../../../common/database/schema';
import type { QueryTelemetryInput } from './telemetry.schema';

export class TelemetryRepository {
  async ingest(data: Omit<NewAssetTelemetry, 'id'>): Promise<void> {
    await db.insert(assetTelemetry).values(data);
  }

  async batchIngest(points: Omit<NewAssetTelemetry, 'id'>[]): Promise<void> {
    if (points.length === 0) return;
    await db.insert(assetTelemetry).values(points);
  }

  async query(query: QueryTelemetryInput): Promise<any[]> {
    const { assetId, telemetryKey, startTime, endTime, interval, aggregation, quality, limit } = query;

    // Build aggregation function
    const aggFn = {
      avg: sql`AVG(value_numeric)`,
      min: sql`MIN(value_numeric)`,
      max: sql`MAX(value_numeric)`,
      sum: sql`SUM(value_numeric)`,
      count: sql`COUNT(*)`,
      last: sql`last(value_numeric, time)`,
      first: sql`first(value_numeric, time)`,
    }[aggregation];

    // Use TimescaleDB time_bucket for aggregation
    const result = await db.execute(sql`
      SELECT 
        time_bucket(${interval}::interval, time) AS bucket,
        ${aggFn} AS value,
        telemetry_key,
        ${quality ? sql`quality` : sql`'GOOD'`} AS quality
      FROM asset_telemetry
      WHERE asset_id = ${assetId}::uuid
        AND time >= ${startTime}::timestamptz
        AND time <= ${endTime}::timestamptz
        ${telemetryKey ? sql`AND telemetry_key = ${telemetryKey}` : sql``}
        ${quality ? sql`AND quality = ${quality}` : sql``}
      GROUP BY bucket, telemetry_key ${quality ? sql`, quality` : sql``}
      ORDER BY bucket DESC
      LIMIT ${limit}
    `);

    return result.rows;
  }

  async getLatest(assetId: string, telemetryKeys?: string[]): Promise<any[]> {
    // Use TimescaleDB last() function for efficient latest value retrieval
    if (telemetryKeys && telemetryKeys.length > 0) {
      const result = await db.execute(sql`
        SELECT DISTINCT ON (telemetry_key)
          telemetry_key,
          time,
          value_numeric,
          value_text,
          value_boolean,
          quality,
          source,
          unit
        FROM asset_telemetry
        WHERE asset_id = ${assetId}::uuid
          AND telemetry_key = ANY(${telemetryKeys}::text[])
        ORDER BY telemetry_key, time DESC
      `);
      return result.rows;
    }

    const result = await db.execute(sql`
      SELECT DISTINCT ON (telemetry_key)
        telemetry_key,
        time,
        value_numeric,
        value_text,
        value_boolean,
        quality,
        source,
        unit
      FROM asset_telemetry
      WHERE asset_id = ${assetId}::uuid
      ORDER BY telemetry_key, time DESC
    `);
    return result.rows;
  }

  async getRaw(
    assetId: string,
    telemetryKey: string,
    startTime: string,
    endTime: string,
    limit: number = 1000
  ): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        time,
        value_numeric,
        value_text,
        value_boolean,
        quality,
        source,
        source_id,
        unit
      FROM asset_telemetry
      WHERE asset_id = ${assetId}::uuid
        AND telemetry_key = ${telemetryKey}
        AND time >= ${startTime}::timestamptz
        AND time <= ${endTime}::timestamptz
      ORDER BY time DESC
      LIMIT ${limit}
    `);
    return result.rows;
  }

  async getStats(assetId: string, telemetryKey: string, startTime: string, endTime: string): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as count,
        MIN(value_numeric) as min,
        MAX(value_numeric) as max,
        AVG(value_numeric) as avg,
        STDDEV(value_numeric) as stddev,
        MIN(time) as first_time,
        MAX(time) as last_time
      FROM asset_telemetry
      WHERE asset_id = ${assetId}::uuid
        AND telemetry_key = ${telemetryKey}
        AND time >= ${startTime}::timestamptz
        AND time <= ${endTime}::timestamptz
    `);
    return result.rows[0] || null;
  }

  async deleteOldData(assetId: string, olderThan: string): Promise<number> {
    const result = await db.execute(sql`
      DELETE FROM asset_telemetry
      WHERE asset_id = ${assetId}::uuid
        AND time < ${olderThan}::timestamptz
    `);
    return result.rowCount || 0;
  }
}

export const telemetryRepository = new TelemetryRepository();
