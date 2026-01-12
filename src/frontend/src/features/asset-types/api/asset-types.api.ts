import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  AssetType,
  AssetTypeWithRelations,
  CreateAssetTypeInput,
  UpdateAssetTypeInput,
  AssetTypeFilters,
} from '@shared/types/asset-type.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

const ASSET_TYPES_KEY = 'asset-types';

export function useAssetTypes(filters?: AssetTypeFilters) {
  return useQuery({
    queryKey: [ASSET_TYPES_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters?.parentTypeId) params.append('parentTypeId', filters.parentTypeId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.perPage) params.append('perPage', String(filters.perPage));

      const response = await apiClient.get<ApiResponse<AssetType[]>>(
        `/api/v1/asset-types?${params.toString()}`
      );
      return response.data;
    },
  });
}

export function useAssetType(id: string) {
  return useQuery({
    queryKey: [ASSET_TYPES_KEY, id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AssetTypeWithRelations>>(
        `/api/v1/asset-types/${id}`
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useAssetTypeStats() {
  return useQuery({
    queryKey: [ASSET_TYPES_KEY, 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{
        total: number;
        active: number;
        inactive: number;
      }>>('/api/v1/asset-types/stats');
      return response.data.data;
    },
  });
}

export function useCreateAssetType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetTypeInput) => {
      const response = await apiClient.post<ApiResponse<AssetType>>('/api/v1/asset-types', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSET_TYPES_KEY] });
    },
  });
}

export function useUpdateAssetType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAssetTypeInput }) => {
      const response = await apiClient.put<ApiResponse<AssetType>>(`/api/v1/asset-types/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ASSET_TYPES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ASSET_TYPES_KEY, variables.id] });
    },
  });
}

export function useDeleteAssetType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/asset-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSET_TYPES_KEY] });
    },
  });
}
