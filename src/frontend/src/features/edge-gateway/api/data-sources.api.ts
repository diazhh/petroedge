/**
 * Data Sources API Client
 * 
 * React Query hooks for Data Sources and Tags management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateDataSourceDTO,
  UpdateDataSourceDTO,
  DataSourceTag,
  CreateDataSourceTagDTO,
  UpdateDataSourceTagDTO,
  DataSourceFilters,
  DataSourceTagFilters,
  DataSourcesResponse,
  DataSourceResponse,
  DataSourceTagsResponse,
  DataSourceStatsResponse,
} from '../types';

const BASE_URL = '/api/v1/data-sources';

// ==================== Data Sources ====================

/**
 * Fetch all data sources with filters
 */
export const useDataSources = (filters?: DataSourceFilters) => {
  return useQuery({
    queryKey: ['data-sources', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.edgeGatewayId) params.append('edgeGatewayId', filters.edgeGatewayId);
      if (filters?.protocol) params.append('protocol', filters.protocol);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.enabled !== undefined) params.append('enabled', String(filters.enabled));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.perPage) params.append('perPage', String(filters.perPage));
      if (filters?.includeTags) params.append('includeTags', String(filters.includeTags));

      const response = await apiClient.get<DataSourcesResponse>(
        `${BASE_URL}?${params.toString()}`
      );
      return response.data;
    },
  });
};

/**
 * Fetch single data source by ID
 */
export const useDataSource = (id: string, includeTags = false) => {
  return useQuery({
    queryKey: ['data-sources', id, includeTags],
    queryFn: async () => {
      const params = includeTags ? '?includeTags=true' : '';
      const response = await apiClient.get<DataSourceResponse>(
        `${BASE_URL}/${id}${params}`
      );
      return response.data.data;
    },
    enabled: !!id,
  });
};

/**
 * Fetch data source statistics
 */
export const useDataSourceStats = () => {
  return useQuery({
    queryKey: ['data-sources', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<DataSourceStatsResponse>(
        `${BASE_URL}/stats`
      );
      return response.data.data;
    },
  });
};

/**
 * Create new data source
 */
export const useCreateDataSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDataSourceDTO) => {
      const response = await apiClient.post<DataSourceResponse>(BASE_URL, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
    },
  });
};

/**
 * Update data source
 */
export const useUpdateDataSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDataSourceDTO }) => {
      const response = await apiClient.put<DataSourceResponse>(
        `${BASE_URL}/${id}`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['data-sources', variables.id] });
    },
  });
};

/**
 * Delete data source
 */
export const useDeleteDataSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${BASE_URL}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
    },
  });
};

/**
 * Test data source connection
 */
export const useTestDataSourceConnection = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `${BASE_URL}/${id}/test`
      );
      return response.data;
    },
  });
};

// ==================== Data Source Tags ====================

/**
 * Fetch tags for a data source
 */
export const useDataSourceTags = (dataSourceId: string, filters?: DataSourceTagFilters) => {
  return useQuery({
    queryKey: ['data-source-tags', dataSourceId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.assetId) params.append('assetId', filters.assetId);
      if (filters?.enabled !== undefined) params.append('enabled', String(filters.enabled));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.perPage) params.append('perPage', String(filters.perPage));

      const response = await apiClient.get<DataSourceTagsResponse>(
        `${BASE_URL}/${dataSourceId}/tags?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!dataSourceId,
  });
};

/**
 * Fetch single tag by ID
 */
export const useDataSourceTag = (dataSourceId: string, tagId: string) => {
  return useQuery({
    queryKey: ['data-source-tags', dataSourceId, tagId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: DataSourceTag }>(
        `${BASE_URL}/${dataSourceId}/tags/${tagId}`
      );
      return response.data.data;
    },
    enabled: !!dataSourceId && !!tagId,
  });
};

/**
 * Create new tag
 */
export const useCreateDataSourceTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDataSourceTagDTO) => {
      const response = await apiClient.post<{ success: boolean; data: DataSourceTag }>(
        `${BASE_URL}/${data.dataSourceId}/tags`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-source-tags', variables.dataSourceId] });
      queryClient.invalidateQueries({ queryKey: ['data-sources', variables.dataSourceId] });
    },
  });
};

/**
 * Update tag
 */
export const useUpdateDataSourceTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dataSourceId,
      tagId,
      data,
    }: {
      dataSourceId: string;
      tagId: string;
      data: UpdateDataSourceTagDTO;
    }) => {
      const response = await apiClient.put<{ success: boolean; data: DataSourceTag }>(
        `${BASE_URL}/${dataSourceId}/tags/${tagId}`,
        data
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-source-tags', variables.dataSourceId] });
      queryClient.invalidateQueries({
        queryKey: ['data-source-tags', variables.dataSourceId, variables.tagId],
      });
    },
  });
};

/**
 * Delete tag
 */
export const useDeleteDataSourceTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dataSourceId, tagId }: { dataSourceId: string; tagId: string }) => {
      await apiClient.delete(`${BASE_URL}/${dataSourceId}/tags/${tagId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-source-tags', variables.dataSourceId] });
    },
  });
};

/**
 * Bulk create tags
 */
export const useBulkCreateDataSourceTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dataSourceId,
      tags,
    }: {
      dataSourceId: string;
      tags: Omit<CreateDataSourceTagDTO, 'dataSourceId'>[];
    }) => {
      const response = await apiClient.post<{ success: boolean; data: DataSourceTag[] }>(
        `${BASE_URL}/${dataSourceId}/tags/bulk`,
        { tags }
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-source-tags', variables.dataSourceId] });
      queryClient.invalidateQueries({ queryKey: ['data-sources', variables.dataSourceId] });
    },
  });
};
