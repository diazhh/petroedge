/**
 * Telemetry API Hooks
 * React Query hooks for telemetry management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { TelemetryDefinition } from '../types/data-types';
import { toast } from 'sonner';

interface TelemetryPoint {
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

interface TelemetryHistoryQuery {
  assetId: string;
  telemetryKey: string;
  startTime: Date;
  endTime: Date;
  aggregation?: 'avg' | 'min' | 'max' | 'sum' | 'count';
  interval?: string;
}

// Get telemetry definitions for an asset type
export function useTelemetryDefinitions(assetTypeId: string) {
  return useQuery({
    queryKey: ['telemetry-definitions', assetTypeId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/infrastructure/asset-types/${assetTypeId}/telemetry/definitions`);
      return response.data;
    },
    enabled: !!assetTypeId,
  });
}

// Get latest telemetry values for an asset
export function useLatestTelemetry(assetId: string) {
  return useQuery({
    queryKey: ['latest-telemetry', assetId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/infrastructure/assets/${assetId}/telemetry/latest`);
      return response.data;
    },
    enabled: !!assetId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

// Get telemetry history
export function useTelemetryHistory(query: TelemetryHistoryQuery, enabled = true) {
  return useQuery({
    queryKey: ['telemetry-history', query],
    queryFn: async () => {
      const response = await apiClient.post(`/api/v1/infrastructure/assets/${query.assetId}/telemetry/history`, query);
      return response.data;
    },
    enabled: enabled && !!query.assetId && !!query.telemetryKey,
  });
}

// Create telemetry definition
export function useCreateTelemetryDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetTypeId, definition }: { assetTypeId: string; definition: TelemetryDefinition }) => {
      const response = await apiClient.post(
        `/api/v1/infrastructure/asset-types/${assetTypeId}/telemetry/definitions`,
        definition
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['telemetry-definitions', variables.assetTypeId] });
      toast.success('Definición de telemetría creada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al crear definición de telemetría');
    },
  });
}

// Update telemetry definition
export function useUpdateTelemetryDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assetTypeId, 
      key, 
      definition 
    }: { 
      assetTypeId: string; 
      key: string; 
      definition: Partial<TelemetryDefinition> 
    }) => {
      const response = await apiClient.put(
        `/api/v1/infrastructure/asset-types/${assetTypeId}/telemetry/definitions/${key}`,
        definition
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['telemetry-definitions', variables.assetTypeId] });
      toast.success('Definición de telemetría actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al actualizar definición de telemetría');
    },
  });
}

// Delete telemetry definition
export function useDeleteTelemetryDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetTypeId, key }: { assetTypeId: string; key: string }) => {
      const response = await apiClient.delete(
        `/api/v1/infrastructure/asset-types/${assetTypeId}/telemetry/definitions/${key}`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['telemetry-definitions', variables.assetTypeId] });
      toast.success('Definición de telemetría eliminada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al eliminar definición de telemetría');
    },
  });
}

// Insert telemetry point (for testing/manual entry)
export function useInsertTelemetryPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (point: TelemetryPoint) => {
      const response = await apiClient.post(`/api/v1/infrastructure/assets/${point.assetId}/telemetry`, point);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['latest-telemetry', variables.assetId] });
      queryClient.invalidateQueries({ queryKey: ['telemetry-history'] });
      toast.success('Punto de telemetría insertado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al insertar punto de telemetría');
    },
  });
}
