/**
 * Device Profiles API Client
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  DeviceProfile,
  DeviceProfileWithRelations,
  CreateDeviceProfileDTO,
  UpdateDeviceProfileDTO,
  DeviceProfileFilters,
  DeviceProfileStats,
} from '../types/device-profile.types';

const BASE_URL = '/api/v1/device-profiles';

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

// ==================== Query Keys ====================

export const deviceProfileKeys = {
  all: ['device-profiles'] as const,
  lists: () => [...deviceProfileKeys.all, 'list'] as const,
  list: (filters?: DeviceProfileFilters) => [...deviceProfileKeys.lists(), filters] as const,
  details: () => [...deviceProfileKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceProfileKeys.details(), id] as const,
  stats: () => [...deviceProfileKeys.all, 'stats'] as const,
};

// ==================== API Functions ====================

async function fetchDeviceProfiles(
  filters?: DeviceProfileFilters
): Promise<PaginatedResponse<DeviceProfileWithRelations>> {
  const params = new URLSearchParams();
  
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.transportType) params.append('transportType', filters.transportType);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.perPage) params.append('perPage', String(filters.perPage));

  const response = await apiClient.get(`${BASE_URL}?${params.toString()}`);
  return response.data;
}

async function fetchDeviceProfile(id: string): Promise<SingleResponse<DeviceProfileWithRelations>> {
  const response = await apiClient.get(`${BASE_URL}/${id}`);
  return response.data;
}

async function createDeviceProfile(
  data: CreateDeviceProfileDTO
): Promise<SingleResponse<DeviceProfile>> {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
}

async function updateDeviceProfile(
  id: string,
  data: UpdateDeviceProfileDTO
): Promise<SingleResponse<DeviceProfile>> {
  const response = await apiClient.put(`${BASE_URL}/${id}`, data);
  return response.data;
}

async function deleteDeviceProfile(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`);
}

async function fetchDeviceProfileStats(): Promise<SingleResponse<DeviceProfileStats>> {
  const response = await apiClient.get(`${BASE_URL}/stats`);
  return response.data;
}

// ==================== React Query Hooks ====================

export function useDeviceProfiles(filters?: DeviceProfileFilters) {
  return useQuery({
    queryKey: deviceProfileKeys.list(filters),
    queryFn: () => fetchDeviceProfiles(filters),
  });
}

export function useDeviceProfile(id: string) {
  return useQuery({
    queryKey: deviceProfileKeys.detail(id),
    queryFn: () => fetchDeviceProfile(id),
    enabled: !!id,
  });
}

export function useDeviceProfileStats() {
  return useQuery({
    queryKey: deviceProfileKeys.stats(),
    queryFn: fetchDeviceProfileStats,
  });
}

export function useCreateDeviceProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeviceProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceProfileKeys.stats() });
    },
  });
}

export function useUpdateDeviceProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeviceProfileDTO }) =>
      updateDeviceProfile(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceProfileKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: deviceProfileKeys.stats() });
    },
  });
}

export function useDeleteDeviceProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeviceProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceProfileKeys.stats() });
    },
  });
}
