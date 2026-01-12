/**
 * Connectivity Profiles API Client
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ConnectivityProfile,
  ConnectivityProfileWithRelations,
  CreateConnectivityProfileDTO,
  UpdateConnectivityProfileDTO,
  ConnectivityProfileFilters,
  ConnectivityProfileStats,
} from '../types/connectivity-profile.types';

const BASE_URL = '/api/v1/connectivity-profiles';

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

export const connectivityProfileKeys = {
  all: ['connectivity-profiles'] as const,
  lists: () => [...connectivityProfileKeys.all, 'list'] as const,
  list: (filters?: ConnectivityProfileFilters) => [...connectivityProfileKeys.lists(), filters] as const,
  details: () => [...connectivityProfileKeys.all, 'detail'] as const,
  detail: (id: string) => [...connectivityProfileKeys.details(), id] as const,
  stats: () => [...connectivityProfileKeys.all, 'stats'] as const,
};

async function fetchConnectivityProfiles(
  filters?: ConnectivityProfileFilters
): Promise<PaginatedResponse<ConnectivityProfileWithRelations>> {
  const params = new URLSearchParams();
  
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.deviceProfileId) params.append('deviceProfileId', filters.deviceProfileId);
  if (filters?.assetTemplateId) params.append('assetTemplateId', filters.assetTemplateId);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.perPage) params.append('perPage', String(filters.perPage));

  const response = await apiClient.get(`${BASE_URL}?${params.toString()}`);
  return response.data;
}

async function fetchConnectivityProfile(id: string): Promise<SingleResponse<ConnectivityProfileWithRelations>> {
  const response = await apiClient.get(`${BASE_URL}/${id}`);
  return response.data;
}

async function createConnectivityProfile(
  data: CreateConnectivityProfileDTO
): Promise<SingleResponse<ConnectivityProfile>> {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
}

async function updateConnectivityProfile(
  id: string,
  data: UpdateConnectivityProfileDTO
): Promise<SingleResponse<ConnectivityProfile>> {
  const response = await apiClient.put(`${BASE_URL}/${id}`, data);
  return response.data;
}

async function deleteConnectivityProfile(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`);
}

async function fetchConnectivityProfileStats(): Promise<SingleResponse<ConnectivityProfileStats>> {
  const response = await apiClient.get(`${BASE_URL}/stats`);
  return response.data;
}

export function useConnectivityProfiles(filters?: ConnectivityProfileFilters) {
  return useQuery({
    queryKey: connectivityProfileKeys.list(filters),
    queryFn: () => fetchConnectivityProfiles(filters),
  });
}

export function useConnectivityProfile(id: string) {
  return useQuery({
    queryKey: connectivityProfileKeys.detail(id),
    queryFn: () => fetchConnectivityProfile(id),
    enabled: !!id,
  });
}

export function useConnectivityProfileStats() {
  return useQuery({
    queryKey: connectivityProfileKeys.stats(),
    queryFn: fetchConnectivityProfileStats,
  });
}

export function useCreateConnectivityProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConnectivityProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectivityProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: connectivityProfileKeys.stats() });
    },
  });
}

export function useUpdateConnectivityProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConnectivityProfileDTO }) =>
      updateConnectivityProfile(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: connectivityProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: connectivityProfileKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: connectivityProfileKeys.stats() });
    },
  });
}

export function useDeleteConnectivityProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConnectivityProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectivityProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: connectivityProfileKeys.stats() });
    },
  });
}
