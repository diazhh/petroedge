/**
 * Telemetry Management Service
 * Enhanced service for managing telemetry definitions and data
 */

import { db } from '../../../common/database';
import { assetTelemetry, assetTypes, assets } from '../../../common/database/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { DataType, DataTypeValidator, TelemetryDefinition, schemaManagementService } from '../schemas';

export interface TelemetryPoint {
  time: Date;
  assetId: string;
  telemetryKey: string;
  valueNumeric?: number;
  valueText?: string;
  valueBoolean?: boolean;
  valueJson?: any;
  unit?: string;
  quality?: string;
  source?: string;
}

export interface TelemetryHistoryQuery {
  assetId: string;
  telemetryKey: string;
  startTime: Date;
  endTime: Date;
  aggregation?: 'avg' | 'min' | 'max' | 'sum' | 'count';
  interval?: string; // e.g., '5m', '1h', '1d'
}

export class TelemetryManagementService {
  /**
   * Insert a telemetry point
   */
  async insertTelemetryPoint(
    tenantId: string,
    point: TelemetryPoint
  ): Promise<void> {
    // Get asset to verify it exists and belongs to tenant
    const asset = await db.query.assets.findFirst({
      where: and(
        eq(assets.id, point.assetId),
        eq(assets.tenantId, tenantId)
      ),
    });

    if (!asset) {
      throw new Error(`Asset ${point.assetId} not found`);
    }

    // Get telemetry definition from asset type
    const assetType = await db.query.assetTypes.findFirst({
      where: eq(assetTypes.id, asset.assetTypeId),
    });

    if (!assetType) {
      throw new Error(`Asset type ${asset.assetTypeId} not found`);
    }

    const telemetrySchema = schemaManagementService.extractSchema(assetType.telemetrySchema);
    const definition = telemetrySchema[point.telemetryKey] as TelemetryDefinition;

    if (!definition) {
      throw new Error(`Telemetry key ${point.telemetryKey} not defined in asset type schema`);
    }

    // Validate value according to data type
    let value: any;
    switch (definition.type) {
      case DataType.NUMBER:
        value = point.valueNumeric;
        break;
      case DataType.STRING:
        value = point.valueText;
        break;
      case DataType.BOOLEAN:
        value = point.valueBoolean;
        break;
      case DataType.JSON:
        value = point.valueJson;
        break;
      default:
        value = point.valueNumeric;
    }

    const validation = DataTypeValidator.validate(value, definition);
    if (!validation.valid) {
      throw new Error(`Validation failed for ${point.telemetryKey}: ${validation.error}`);
    }

    // Insert telemetry point
    await db.insert(assetTelemetry).values({
      time: point.time,
      assetId: point.assetId,
      telemetryKey: point.telemetryKey,
      valueNumeric: point.valueNumeric,
      valueText: point.valueText,
      valueBoolean: point.valueBoolean,
      valueJson: point.valueJson,
      unit: point.unit || definition.unit,
      quality: point.quality || 'GOOD',
      source: point.source || 'SENSOR',
    });

    // Update current telemetry cache in asset
    const currentTelemetry = asset.currentTelemetry || {};
    currentTelemetry[point.telemetryKey] = {
      value,
      unit: point.unit || definition.unit,
      quality: point.quality || 'GOOD',
      time: point.time,
    };

    await db.update(assets)
      .set({
        currentTelemetry,
        telemetryUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(assets.id, point.assetId));
  }

  /**
   * Get telemetry history
   */
  async getTelemetryHistory(
    tenantId: string,
    query: TelemetryHistoryQuery
  ): Promise<TelemetryPoint[]> {
    // Verify asset belongs to tenant
    const asset = await db.query.assets.findFirst({
      where: and(
        eq(assets.id, query.assetId),
        eq(assets.tenantId, tenantId)
      ),
    });

    if (!asset) {
      throw new Error(`Asset ${query.assetId} not found`);
    }

    // Build query
    let dbQuery = db.select().from(assetTelemetry)
      .where(
        and(
          eq(assetTelemetry.assetId, query.assetId),
          eq(assetTelemetry.telemetryKey, query.telemetryKey),
          gte(assetTelemetry.time, query.startTime),
          lte(assetTelemetry.time, query.endTime)
        )
      )
      .orderBy(desc(assetTelemetry.time));

    // If aggregation is requested, use TimescaleDB time_bucket
    if (query.aggregation && query.interval) {
      const intervalMs = this.parseInterval(query.interval);
      const bucketInterval = `${intervalMs / 1000} seconds`;

      // Use raw SQL for TimescaleDB time_bucket
      const result = await db.execute(sql`
        SELECT 
          time_bucket(${bucketInterval}::interval, time) as bucket,
          ${this.getAggregationFunction(query.aggregation)}(value_numeric) as value,
          telemetry_key,
          unit,
          quality
        FROM asset_telemetry
        WHERE 
          asset_id = ${query.assetId}
          AND telemetry_key = ${query.telemetryKey}
          AND time >= ${query.startTime}
          AND time <= ${query.endTime}
        GROUP BY bucket, telemetry_key, unit, quality
        ORDER BY bucket DESC
      `);

      return (result.rows as any[]).map((row: any) => ({
        time: row.bucket,
        assetId: query.assetId,
        telemetryKey: row.telemetry_key,
        valueNumeric: row.value,
        unit: row.unit,
        quality: row.quality,
      }));
    }

    // No aggregation, return raw data
    const results = await dbQuery;
    return results.map(row => ({
      time: row.time,
      assetId: row.assetId,
      telemetryKey: row.telemetryKey,
      valueNumeric: row.valueNumeric ?? undefined,
      valueText: row.valueText ?? undefined,
      valueBoolean: row.valueBoolean ?? undefined,
      valueJson: row.valueJson,
      unit: row.unit ?? undefined,
      quality: row.quality ?? undefined,
      source: row.source ?? undefined,
    }));
  }

  /**
   * Get latest telemetry values for an asset
   */
  async getLatestTelemetry(
    tenantId: string,
    assetId: string
  ): Promise<Record<string, any>> {
    // Verify asset belongs to tenant
    const asset = await db.query.assets.findFirst({
      where: and(
        eq(assets.id, assetId),
        eq(assets.tenantId, tenantId)
      ),
    });

    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    // Return cached telemetry from asset
    return asset.currentTelemetry || {};
  }

  /**
   * Add telemetry definition to asset type
   */
  async addTelemetryDefinition(
    tenantId: string,
    assetTypeId: string,
    definition: TelemetryDefinition
  ): Promise<void> {
    // Get asset type
    const assetType = await db.query.assetTypes.findFirst({
      where: and(
        eq(assetTypes.id, assetTypeId),
        eq(assetTypes.tenantId, tenantId)
      ),
    });

    if (!assetType) {
      throw new Error(`Asset type ${assetTypeId} not found`);
    }

    // Validate definition
    const validation = schemaManagementService.validateTelemetrySchema({
      [definition.key]: definition,
    });

    if (!validation.valid) {
      throw new Error(`Invalid telemetry definition: ${validation.errors.join(', ')}`);
    }

    // Add to telemetry schema
    const telemetrySchema = schemaManagementService.extractSchema(assetType.telemetrySchema);
    telemetrySchema[definition.key] = definition;

    // Update asset type
    await db.update(assetTypes)
      .set({
        telemetrySchema,
        updatedAt: new Date(),
      })
      .where(eq(assetTypes.id, assetTypeId));
  }

  /**
   * Update telemetry definition
   */
  async updateTelemetryDefinition(
    tenantId: string,
    assetTypeId: string,
    key: string,
    definition: Partial<TelemetryDefinition>
  ): Promise<void> {
    // Get asset type
    const assetType = await db.query.assetTypes.findFirst({
      where: and(
        eq(assetTypes.id, assetTypeId),
        eq(assetTypes.tenantId, tenantId)
      ),
    });

    if (!assetType) {
      throw new Error(`Asset type ${assetTypeId} not found`);
    }

    // Get current schema
    const telemetrySchema = schemaManagementService.extractSchema(assetType.telemetrySchema);
    
    if (!telemetrySchema[key]) {
      throw new Error(`Telemetry definition ${key} not found`);
    }

    // Merge with existing definition
    telemetrySchema[key] = {
      ...telemetrySchema[key],
      ...definition,
    };

    // Validate updated schema
    const validation = schemaManagementService.validateTelemetrySchema({
      [key]: telemetrySchema[key] as TelemetryDefinition,
    });

    if (!validation.valid) {
      throw new Error(`Invalid telemetry definition: ${validation.errors.join(', ')}`);
    }

    // Update asset type
    await db.update(assetTypes)
      .set({
        telemetrySchema,
        updatedAt: new Date(),
      })
      .where(eq(assetTypes.id, assetTypeId));
  }

  /**
   * Delete telemetry definition
   */
  async deleteTelemetryDefinition(
    tenantId: string,
    assetTypeId: string,
    key: string
  ): Promise<void> {
    // Get asset type
    const assetType = await db.query.assetTypes.findFirst({
      where: and(
        eq(assetTypes.id, assetTypeId),
        eq(assetTypes.tenantId, tenantId)
      ),
    });

    if (!assetType) {
      throw new Error(`Asset type ${assetTypeId} not found`);
    }

    // Get current schema
    const telemetrySchema = schemaManagementService.extractSchema(assetType.telemetrySchema);
    
    if (!telemetrySchema[key]) {
      throw new Error(`Telemetry definition ${key} not found`);
    }

    // Remove from schema
    delete telemetrySchema[key];

    // Update asset type
    await db.update(assetTypes)
      .set({
        telemetrySchema,
        updatedAt: new Date(),
      })
      .where(eq(assetTypes.id, assetTypeId));
  }

  /**
   * Get telemetry definitions for an asset type
   */
  async getTelemetryDefinitions(
    tenantId: string,
    assetTypeId: string
  ): Promise<Record<string, TelemetryDefinition>> {
    // Get asset type
    const assetType = await db.query.assetTypes.findFirst({
      where: and(
        eq(assetTypes.id, assetTypeId),
        eq(assetTypes.tenantId, tenantId)
      ),
    });

    if (!assetType) {
      throw new Error(`Asset type ${assetTypeId} not found`);
    }

    return schemaManagementService.extractSchema(assetType.telemetrySchema) as Record<string, TelemetryDefinition>;
  }

  /**
   * Parse interval string to milliseconds
   */
  private parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid interval format: ${interval}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: throw new Error(`Unknown interval unit: ${unit}`);
    }
  }

  /**
   * Get aggregation function for SQL
   */
  private getAggregationFunction(aggregation: string): any {
    switch (aggregation) {
      case 'avg': return sql`AVG`;
      case 'min': return sql`MIN`;
      case 'max': return sql`MAX`;
      case 'sum': return sql`SUM`;
      case 'count': return sql`COUNT`;
      default: return sql`AVG`;
    }
  }
}

export const telemetryManagementService = new TelemetryManagementService();
