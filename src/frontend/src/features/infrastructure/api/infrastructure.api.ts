import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AssetType,
  Asset,
  TelemetryPoint,
  Rule,
  PaginatedResponse,
  SingleResponse,
} from '../types';

// ============================================================================
// ASSET TYPES
// ============================================================================

export const useAssetTypes = () => {
  return useQuery({
    queryKey: ['asset-types'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AssetType>>(
        '/api/v1/infrastructure/assets/types'
      );
      return response.data;
    },
  });
};

export const useAssetType = (id: string) => {
  return useQuery({
    queryKey: ['asset-types', id],
    queryFn: async () => {
      const response = await api.get<SingleResponse<AssetType>>(
        `/api/v1/infrastructure/assets/types/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
};

// ============================================================================
// ASSETS
// ============================================================================

export const useAssets = (page = 1, perPage = 20, assetTypeId?: string) => {
  return useQuery({
    queryKey: ['assets', page, perPage, assetTypeId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
      });
      if (assetTypeId) {
        params.append('assetTypeId', assetTypeId);
      }
      const response = await api.get<PaginatedResponse<Asset>>(
        `/api/v1/infrastructure/assets?${params.toString()}`
      );
      return response.data;
    },
  });
};

export const useAsset = (id: string) => {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: async () => {
      const response = await api.get<SingleResponse<Asset>>(
        `/api/v1/infrastructure/assets/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Asset>) => {
      const response = await api.post<SingleResponse<Asset>>(
        '/api/v1/infrastructure/assets',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Asset> }) => {
      const response = await api.put<SingleResponse<Asset>>(
        `/api/v1/infrastructure/assets/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/infrastructure/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUpdateAssetAttributes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, attributes, reason }: { id: string; attributes: Record<string, any>; reason?: string }) => {
      const response = await api.patch<SingleResponse<Asset>>(
        `/api/v1/infrastructure/assets/${id}/attributes`,
        { attributes, reason }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

// ============================================================================
// TELEMETRY
// ============================================================================

export const useLatestTelemetry = (assetId: string) => {
  return useQuery({
    queryKey: ['telemetry', 'latest', assetId],
    queryFn: async () => {
      const response = await api.get<SingleResponse<Record<string, TelemetryPoint>>>(
        `/api/v1/infrastructure/telemetry/assets/${assetId}/latest`
      );
      return response.data;
    },
    enabled: !!assetId,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

export const useIngestTelemetry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<TelemetryPoint>) => {
      const response = await api.post<SingleResponse<TelemetryPoint>>(
        '/api/v1/infrastructure/telemetry',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telemetry'] });
    },
  });
};

// ============================================================================
// RULES
// ============================================================================

export const useRules = (page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ['rules', page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
      });
      const response = await api.get<PaginatedResponse<Rule>>(
        `/api/v1/infrastructure/rules?${params.toString()}`
      );
      return response.data;
    },
  });
};

export const useRule = (id: string) => {
  return useQuery({
    queryKey: ['rules', id],
    queryFn: async () => {
      const response = await api.get<SingleResponse<Rule>>(
        `/api/v1/infrastructure/rules/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Rule>) => {
      const response = await api.post<SingleResponse<Rule>>(
        '/api/v1/infrastructure/rules',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
};

export const useUpdateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Rule> }) => {
      const response = await api.put<SingleResponse<Rule>>(
        `/api/v1/infrastructure/rules/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
};

export const useDeleteRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/infrastructure/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
};

export const useActivateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<SingleResponse<Rule>>(
        `/api/v1/infrastructure/rules/${id}/activate`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
};

export const useDeactivateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<SingleResponse<Rule>>(
        `/api/v1/infrastructure/rules/${id}/deactivate`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
};
