import { telemetryRepository } from './telemetry.repository';
import { assetsRepository } from '../assets/assets.repository';
import { telemetryCacheService } from './telemetry-cache.service.js';
import { redisService } from '../../../common/redis/index.js';
import type {
  IngestTelemetryInput,
  BatchIngestTelemetryInput,
  QueryTelemetryInput,
  GetLatestTelemetryInput,
} from './telemetry.schema';

export class TelemetryService {
  async ingestTelemetry(tenantId: string, input: IngestTelemetryInput): Promise<void> {
    // Verify asset exists and belongs to tenant
    const asset = await assetsRepository.findById(tenantId, input.assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${input.assetId}`);
    }

    await telemetryRepository.ingest({
      time: input.time ? new Date(input.time) : new Date(),
      assetId: input.assetId,
      telemetryKey: input.telemetryKey,
      valueNumeric: input.valueNumeric?.toString(),
      valueText: input.valueText,
      valueBoolean: input.valueBoolean,
      quality: input.quality,
      source: input.source,
      sourceId: input.sourceId,
      unit: input.unit,
    });

    // Update current telemetry cache on asset (DB)
    const currentTelemetry = (asset.currentTelemetry as Record<string, any>) || {};
    const value = input.valueNumeric ?? input.valueText ?? input.valueBoolean;
    if (value === undefined) {
      throw new Error('At least one value type must be provided');
    }
    
    const telemetryValue = {
      value,
      unit: input.unit,
      quality: input.quality,
      time: input.time || new Date().toISOString(),
      source: input.source,
    };
    currentTelemetry[input.telemetryKey] = telemetryValue;
    await assetsRepository.updateCurrentTelemetry(tenantId, input.assetId, currentTelemetry);

    // Update Redis cache if available
    if (redisService.isReady()) {
      await telemetryCacheService.setTelemetry(input.assetId, input.telemetryKey, telemetryValue);
    }
  }

  async batchIngestTelemetry(tenantId: string, input: BatchIngestTelemetryInput): Promise<{ ingested: number; errors: string[] }> {
    const errors: string[] = [];
    const validPoints: any[] = [];

    // Group points by asset for validation
    const assetIds = [...new Set(input.points.map(p => p.assetId))];
    const assetMap = new Map<string, any>();

    for (const assetId of assetIds) {
      const asset = await assetsRepository.findById(tenantId, assetId);
      if (asset) {
        assetMap.set(assetId, asset);
      }
    }

    for (const point of input.points) {
      if (!assetMap.has(point.assetId)) {
        errors.push(`Asset not found: ${point.assetId}`);
        continue;
      }

      validPoints.push({
        time: point.time ? new Date(point.time) : new Date(),
        assetId: point.assetId,
        telemetryKey: point.telemetryKey,
        valueNumeric: point.valueNumeric?.toString(),
        valueText: point.valueText,
        valueBoolean: point.valueBoolean,
        quality: point.quality,
        source: point.source,
        sourceId: point.sourceId,
        unit: point.unit,
      });
    }

    if (validPoints.length > 0) {
      await telemetryRepository.batchIngest(validPoints);

      // Update current telemetry cache for each asset
      const updatesByAsset = new Map<string, Record<string, any>>();
      for (const point of validPoints) {
        if (!updatesByAsset.has(point.assetId)) {
          const asset = assetMap.get(point.assetId);
          updatesByAsset.set(point.assetId, { ...(asset?.currentTelemetry as Record<string, any> || {}) });
        }
        const telemetry = updatesByAsset.get(point.assetId)!;
        telemetry[point.telemetryKey] = {
          value: point.valueNumeric ?? point.valueText ?? point.valueBoolean,
          unit: point.unit,
          quality: point.quality,
          time: point.time?.toISOString() || new Date().toISOString(),
        };
      }

      for (const [assetId, telemetry] of updatesByAsset) {
        await assetsRepository.updateCurrentTelemetry(tenantId, assetId, telemetry);
        
        // Update Redis cache if available
        if (redisService.isReady()) {
          await telemetryCacheService.setTelemetryBatch(assetId, telemetry);
        }
      }
    }

    return { ingested: validPoints.length, errors };
  }

  async queryTelemetry(tenantId: string, query: QueryTelemetryInput): Promise<any[]> {
    // Verify asset exists and belongs to tenant
    const asset = await assetsRepository.findById(tenantId, query.assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${query.assetId}`);
    }

    return telemetryRepository.query(query);
  }

  async getLatestTelemetry(tenantId: string, input: GetLatestTelemetryInput): Promise<any[]> {
    // Verify asset exists and belongs to tenant
    const asset = await assetsRepository.findById(tenantId, input.assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${input.assetId}`);
    }

    return telemetryRepository.getLatest(input.assetId, input.telemetryKeys);
  }

  async getRawTelemetry(
    tenantId: string,
    assetId: string,
    telemetryKey: string,
    startTime: string,
    endTime: string,
    limit?: number
  ): Promise<any[]> {
    // Verify asset exists and belongs to tenant
    const asset = await assetsRepository.findById(tenantId, assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    return telemetryRepository.getRaw(assetId, telemetryKey, startTime, endTime, limit);
  }

  async getTelemetryStats(
    tenantId: string,
    assetId: string,
    telemetryKey: string,
    startTime: string,
    endTime: string
  ): Promise<any> {
    // Verify asset exists and belongs to tenant
    const asset = await assetsRepository.findById(tenantId, assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    return telemetryRepository.getStats(assetId, telemetryKey, startTime, endTime);
  }
}

export const telemetryService = new TelemetryService();
