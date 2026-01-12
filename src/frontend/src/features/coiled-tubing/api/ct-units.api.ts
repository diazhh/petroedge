import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CtUnit,
  CtUnitsListResponse,
  CtUnitResponse,
  CtUnitFormData,
  CtUnitsFilters,
} from '../types';
import { CT_API_ENDPOINTS } from '../constants';

// Query Keys
export const ctUnitsKeys = {
  all: ['ct-units'] as const,
  lists: () => [...ctUnitsKeys.all, 'list'] as const,
  list: (filters: CtUnitsFilters) => [...ctUnitsKeys.lists(), filters] as const,
  details: () => [...ctUnitsKeys.all, 'detail'] as const,
  detail: (id: string) => [...ctUnitsKeys.details(), id] as const,
};

// API Functions
export const ctUnitsApi = {
  getAll: async (filters?: CtUnitsFilters, page = 1, perPage = 10): Promise<CtUnitsListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.manufacturer && { manufacturer: filters.manufacturer }),
      ...(filters?.search && { search: filters.search }),
    });

    const response = await apiClient.get<CtUnitsListResponse>(
      `${CT_API_ENDPOINTS.UNITS}?${params}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<CtUnit> => {
    const response = await apiClient.get<CtUnitResponse>(
      `${CT_API_ENDPOINTS.UNITS}/${id}`
    );
    return response.data.data;
  },

  create: async (data: CtUnitFormData): Promise<CtUnit> => {
    const response = await apiClient.post<CtUnitResponse>(
      CT_API_ENDPOINTS.UNITS,
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: Partial<CtUnitFormData>): Promise<CtUnit> => {
    const response = await apiClient.patch<CtUnitResponse>(
      `${CT_API_ENDPOINTS.UNITS}/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${CT_API_ENDPOINTS.UNITS}/${id}`);
  },
};

// Hooks
export const useCtUnits = (filters?: CtUnitsFilters, page = 1, perPage = 10) => {
  return useQuery({
    queryKey: ctUnitsKeys.list({ ...filters, page, perPage } as any),
    queryFn: () => ctUnitsApi.getAll(filters, page, perPage),
  });
};

export const useCtUnit = (id: string) => {
  return useQuery({
    queryKey: ctUnitsKeys.detail(id),
    queryFn: () => ctUnitsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCtUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ctUnitsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ctUnitsKeys.lists() });
    },
  });
};

export const useUpdateCtUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CtUnitFormData> }) =>
      ctUnitsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ctUnitsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ctUnitsKeys.detail(variables.id) });
    },
  });
};

export const useDeleteCtUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ctUnitsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ctUnitsKeys.lists() });
    },
  });
};
