/**
 * Telemetry API - React Query Hooks for TimescaleDB data
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface TelemetryPoint {
  time: string;
  telemetryKey: string;
  valueNumeric?: number;
  valueText?: string;
  valueBoolean?: boolean;
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN' | 'SIMULATED';
  source: 'SENSOR' | 'MANUAL' | 'CALCULATED' | 'IMPORTED' | 'EDGE';
  unit?: string;
}

export interface LatestTelemetry {
  [key: string]: TelemetryPoint;
}

export interface TelemetryStats {
  telemetryKey: string;
  min: number;
  max: number;
  avg: number;
  count: number;
  firstTime: string;
  lastTime: string;
}

export interface TelemetryQueryParams {
  assetId: string;
  telemetryKey?: string;
  startTime: string;
  endTime: string;
  interval?: string;
  aggregation?: 'avg' | 'min' | 'max' | 'sum' | 'count' | 'last' | 'first';
  limit?: number;
}

/**
 * Get latest telemetry values for an asset
 */
export const useLatestTelemetry = (assetId: string | undefined, telemetryKeys?: string[]) => {
  return useQuery({
    queryKey: ['telemetry', 'latest', assetId, telemetryKeys],
    queryFn: async (): Promise<LatestTelemetry> => {
      if (!assetId) throw new Error('Asset ID is required');
      
      const params = new URLSearchParams();
      if (telemetryKeys && telemetryKeys.length > 0) {
        params.append('telemetryKeys', telemetryKeys.join(','));
      }
      
      const url = `/api/v1/telemetry/assets/${assetId}/latest${params.toString() ? `?${params}` : ''}`;
      const response = await apiClient.get(url);
      return response.data.data;
    },
    enabled: !!assetId,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

/**
 * Query telemetry data with time bucketing and aggregation
 */
export const useTelemetryQuery = (params: TelemetryQueryParams | null) => {
  return useQuery({
    queryKey: ['telemetry', 'query', params],
    queryFn: async (): Promise<TelemetryPoint[]> => {
      if (!params) throw new Error('Query params are required');
      
      const queryParams = new URLSearchParams({
        assetId: params.assetId,
        startTime: params.startTime,
        endTime: params.endTime,
      });
      
      if (params.telemetryKey) queryParams.append('telemetryKey', params.telemetryKey);
      if (params.interval) queryParams.append('interval', params.interval);
      if (params.aggregation) queryParams.append('aggregation', params.aggregation);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const response = await apiClient.get(`/api/v1/telemetry/query?${queryParams}`);
      return response.data.data;
    },
    enabled: !!params,
  });
};

/**
 * Get raw telemetry data for a specific key
 */
export const useRawTelemetry = (
  assetId: string | undefined,
  telemetryKey: string | undefined,
  startTime: string,
  endTime: string,
  limit?: number
) => {
  return useQuery({
    queryKey: ['telemetry', 'raw', assetId, telemetryKey, startTime, endTime, limit],
    queryFn: async (): Promise<TelemetryPoint[]> => {
      if (!assetId || !telemetryKey) throw new Error('Asset ID and telemetry key are required');
      
      const params = new URLSearchParams({
        telemetryKey,
        startTime,
        endTime,
      });
      
      if (limit) params.append('limit', limit.toString());
      
      const response = await apiClient.get(`/api/v1/telemetry/assets/${assetId}/raw?${params}`);
      return response.data.data;
    },
    enabled: !!assetId && !!telemetryKey,
  });
};

/**
 * Get telemetry statistics
 */
export const useTelemetryStats = (
  assetId: string | undefined,
  telemetryKey: string | undefined,
  startTime: string,
  endTime: string
) => {
  return useQuery({
    queryKey: ['telemetry', 'stats', assetId, telemetryKey, startTime, endTime],
    queryFn: async (): Promise<TelemetryStats> => {
      if (!assetId || !telemetryKey) throw new Error('Asset ID and telemetry key are required');
      
      const params = new URLSearchParams({
        telemetryKey,
        startTime,
        endTime,
      });
      
      const response = await apiClient.get(`/api/v1/telemetry/assets/${assetId}/stats?${params}`);
      return response.data.data;
    },
    enabled: !!assetId && !!telemetryKey,
  });
};
