import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MagnitudeCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MagnitudeCategoryFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface CreateMagnitudeCategoryDTO {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateMagnitudeCategoryDTO {
  code?: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export const useMagnitudeCategories = (filters?: MagnitudeCategoryFilters) => {
  return useQuery({
    queryKey: ['magnitude-categories', filters],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/magnitude-categories', {
        params: filters,
      });
      return data;
    },
  });
};

export const useMagnitudeCategory = (id: string) => {
  return useQuery({
    queryKey: ['magnitude-categories', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/magnitude-categories/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateMagnitudeCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMagnitudeCategoryDTO) => {
      const response = await api.post('/api/v1/magnitude-categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['magnitude-categories'] });
    },
  });
};

export const useUpdateMagnitudeCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMagnitudeCategoryDTO }) => {
      const response = await api.put(`/api/v1/magnitude-categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['magnitude-categories'] });
    },
  });
};

export const useDeleteMagnitudeCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/magnitude-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['magnitude-categories'] });
    },
  });
};
