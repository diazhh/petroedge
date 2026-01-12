/**
 * Asset Templates API Client
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  AssetTemplate,
  AssetTemplateWithRelations,
  CreateAssetTemplateDTO,
  UpdateAssetTemplateDTO,
  AssetTemplateFilters,
  AssetTemplateStats,
} from '../types/asset-template.types';

const BASE_URL = '/api/v1/asset-templates';

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export const assetTemplateKeys = {
  all: ['asset-templates'] as const,
  lists: () => [...assetTemplateKeys.all, 'list'] as const,
  list: (filters?: AssetTemplateFilters) => [...assetTemplateKeys.lists(), filters] as const,
  details: () => [...assetTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetTemplateKeys.details(), id] as const,
  stats: () => [...assetTemplateKeys.all, 'stats'] as const,
};

async function fetchAssetTemplates(
  filters?: AssetTemplateFilters
): Promise<PaginatedResponse<AssetTemplateWithRelations>> {
  const params = new URLSearchParams();
  
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.rootAssetTypeId) params.append('rootAssetTypeId', filters.rootAssetTypeId);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.perPage) params.append('perPage', String(filters.perPage));

  const response = await apiClient.get(`${BASE_URL}?${params.toString()}`);
  return response.data;
}

async function fetchAssetTemplate(id: string): Promise<SingleResponse<AssetTemplateWithRelations>> {
  const response = await apiClient.get(`${BASE_URL}/${id}`);
  return response.data;
}

async function createAssetTemplate(
  data: CreateAssetTemplateDTO
): Promise<SingleResponse<AssetTemplate>> {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
}

async function updateAssetTemplate(
  id: string,
  data: UpdateAssetTemplateDTO
): Promise<SingleResponse<AssetTemplate>> {
  const response = await apiClient.put(`${BASE_URL}/${id}`, data);
  return response.data;
}

async function deleteAssetTemplate(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`);
}

async function fetchAssetTemplateStats(): Promise<SingleResponse<AssetTemplateStats>> {
  const response = await apiClient.get(`${BASE_URL}/stats`);
  return response.data;
}

export function useAssetTemplates(filters?: AssetTemplateFilters) {
  return useQuery({
    queryKey: assetTemplateKeys.list(filters),
    queryFn: () => fetchAssetTemplates(filters),
  });
}

export function useAssetTemplate(id: string) {
  return useQuery({
    queryKey: assetTemplateKeys.detail(id),
    queryFn: () => fetchAssetTemplate(id),
    enabled: !!id,
  });
}

export function useAssetTemplateStats() {
  return useQuery({
    queryKey: assetTemplateKeys.stats(),
    queryFn: fetchAssetTemplateStats,
  });
}

export function useCreateAssetTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssetTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetTemplateKeys.stats() });
    },
  });
}

export function useUpdateAssetTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetTemplateDTO }) =>
      updateAssetTemplate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetTemplateKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: assetTemplateKeys.stats() });
    },
  });
}

export function useDeleteAssetTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAssetTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetTemplateKeys.stats() });
    },
  });
}
