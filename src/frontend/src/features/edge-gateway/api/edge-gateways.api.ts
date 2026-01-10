/**
 * Edge Gateways API Client
 * 
 * React Query hooks for Edge Gateway management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateEdgeGatewayDTO,
  UpdateEdgeGatewayDTO,
  EdgeGatewayFilters,
  EdgeGatewaysResponse,
  EdgeGatewayResponse,
  EdgeGatewayStatsResponse,
  EdgeGatewayHealthResponse,
  EdgeGatewayConfigResponse,
  EdgeGatewayHeartbeat,
} from '../types';

const BASE_URL = '/api/v1/edge-gateways';

// ==================== Edge Gateways ====================

/**
 * Fetch all edge gateways with filters
 */
export const useEdgeGateways = (filters?: EdgeGatewayFilters) => {
  return useQuery({
    queryKey: ['edge-gateways', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.location) params.append('location', filters.location);
      if (filters?.assetId) params.append('assetId', filters.assetId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.perPage) params.append('perPage', String(filters.perPage));
      if (filters?.includeSources) params.append('includeSources', String(filters.includeSources));
      if (filters?.includeAsset) params.append('includeAsset', String(filters.includeAsset));

      const response = await apiClient.get<EdgeGatewaysResponse>(
        `${BASE_URL}?${params.toString()}`
      );
      return response.data;
    },
  });
};

/**
 * Fetch single edge gateway by ID
 */
export const useEdgeGateway = (
  id: string,
  includeSources = false,
  includeAsset = false
) => {
  return useQuery({
    queryKey: ['edge-gateways', id, includeSources, includeAsset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeSources) params.append('includeSources', 'true');
      if (includeAsset) params.append('includeAsset', 'true');

      const response = await apiClient.get<EdgeGatewayResponse>(
        `${BASE_URL}/${id}?${params.toString()}`
      );
      return response.data.data;
    },
    enabled: !!id,
  });
};

/**
 * Fetch edge gateway statistics
 */
export const useEdgeGatewayStats = () => {
  return useQuery({
    queryKey: ['edge-gateways', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<EdgeGatewayStatsResponse>(
        `${BASE_URL}/stats`
      );
      return response.data.data;
    },
  });
};

/**
 * Fetch edge gateway health metrics
 */
export const useEdgeGatewayHealth = (id: string) => {
  return useQuery({
    queryKey: ['edge-gateways', id, 'health'],
    queryFn: async () => {
      const response = await apiClient.get<EdgeGatewayHealthResponse>(
        `${BASE_URL}/${id}/health`
      );
      return response.data.data;
    },
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Fetch edge gateway configuration
 */
export const useEdgeGatewayConfig = (gatewayId: string) => {
  return useQuery({
    queryKey: ['edge-gateways', gatewayId, 'config'],
    queryFn: async () => {
      const response = await apiClient.get<EdgeGatewayConfigResponse>(
        `${BASE_URL}/${gatewayId}/config`
      );
      return response.data.data;
    },
    enabled: !!gatewayId,
  });
};

/**
 * Create new edge gateway
 */
export const useCreateEdgeGateway = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEdgeGatewayDTO) => {
      const response = await apiClient.post<EdgeGatewayResponse>(BASE_URL, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edge-gateways'] });
    },
  });
};

/**
 * Update edge gateway
 */
export const useUpdateEdgeGateway = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEdgeGatewayDTO }) => {
      const response = await apiClient.put<EdgeGatewayResponse>(
        `${BASE_URL}/${id}`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['edge-gateways'] });
      queryClient.invalidateQueries({ queryKey: ['edge-gateways', variables.id] });
    },
  });
};

/**
 * Delete edge gateway
 */
export const useDeleteEdgeGateway = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${BASE_URL}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edge-gateways'] });
    },
  });
};

/**
 * Send heartbeat (for edge devices)
 */
export const useSendHeartbeat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (heartbeat: EdgeGatewayHeartbeat) => {
      const response = await apiClient.post<{ success: boolean }>(
        `${BASE_URL}/heartbeat`,
        heartbeat
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['edge-gateways', variables.gatewayId] });
      queryClient.invalidateQueries({
        queryKey: ['edge-gateways', variables.gatewayId, 'health'],
      });
    },
  });
};
