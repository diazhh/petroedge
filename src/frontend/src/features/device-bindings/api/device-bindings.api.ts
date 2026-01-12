/**
 * Device Bindings API Client
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  DeviceBinding,
  DeviceBindingWithRelations,
  CreateDeviceBindingDTO,
  UpdateDeviceBindingDTO,
  DeviceBindingFilters,
  DeviceBindingStats,
} from '../types/device-binding.types';

const BASE_URL = '/api/v1/device-bindings';

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

export const deviceBindingKeys = {
  all: ['device-bindings'] as const,
  lists: () => [...deviceBindingKeys.all, 'list'] as const,
  list: (filters?: DeviceBindingFilters) => [...deviceBindingKeys.lists(), filters] as const,
  details: () => [...deviceBindingKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceBindingKeys.details(), id] as const,
  stats: () => [...deviceBindingKeys.all, 'stats'] as const,
};

async function fetchDeviceBindings(
  filters?: DeviceBindingFilters
): Promise<PaginatedResponse<DeviceBindingWithRelations>> {
  const params = new URLSearchParams();
  
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.dataSourceId) params.append('dataSourceId', filters.dataSourceId);
  if (filters?.connectivityProfileId) params.append('connectivityProfileId', filters.connectivityProfileId);
  if (filters?.digitalTwinId) params.append('digitalTwinId', filters.digitalTwinId);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.perPage) params.append('perPage', String(filters.perPage));

  const response = await apiClient.get(`${BASE_URL}?${params.toString()}`);
  return response.data;
}

async function fetchDeviceBinding(id: string): Promise<SingleResponse<DeviceBindingWithRelations>> {
  const response = await apiClient.get(`${BASE_URL}/${id}`);
  return response.data;
}

async function createDeviceBinding(
  data: CreateDeviceBindingDTO
): Promise<SingleResponse<DeviceBinding>> {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
}

async function updateDeviceBinding(
  id: string,
  data: UpdateDeviceBindingDTO
): Promise<SingleResponse<DeviceBinding>> {
  const response = await apiClient.put(`${BASE_URL}/${id}`, data);
  return response.data;
}

async function deleteDeviceBinding(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`);
}

async function fetchDeviceBindingStats(): Promise<SingleResponse<DeviceBindingStats>> {
  const response = await apiClient.get(`${BASE_URL}/stats`);
  return response.data;
}

export function useDeviceBindings(filters?: DeviceBindingFilters) {
  return useQuery({
    queryKey: deviceBindingKeys.list(filters),
    queryFn: () => fetchDeviceBindings(filters),
  });
}

export function useDeviceBinding(id: string) {
  return useQuery({
    queryKey: deviceBindingKeys.detail(id),
    queryFn: () => fetchDeviceBinding(id),
    enabled: !!id,
  });
}

export function useDeviceBindingStats() {
  return useQuery({
    queryKey: deviceBindingKeys.stats(),
    queryFn: fetchDeviceBindingStats,
  });
}

export function useCreateDeviceBinding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeviceBinding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceBindingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceBindingKeys.stats() });
    },
  });
}

export function useUpdateDeviceBinding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeviceBindingDTO }) =>
      updateDeviceBinding(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceBindingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceBindingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: deviceBindingKeys.stats() });
    },
  });
}

export function useDeleteDeviceBinding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeviceBinding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceBindingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceBindingKeys.stats() });
    },
  });
}
