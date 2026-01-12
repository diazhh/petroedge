import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Magnitude {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  symbol?: string;
  siUnitId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    code: string;
    icon?: string;
    color?: string;
  };
  siUnit?: {
    id: string;
    name: string;
    symbol: string;
  };
}

export interface MagnitudeFilters {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface CreateMagnitudeDTO {
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  symbol?: string;
  siUnitId?: string;
}

export interface UpdateMagnitudeDTO {
  categoryId?: string;
  code?: string;
  name?: string;
  description?: string;
  symbol?: string;
  siUnitId?: string;
  isActive?: boolean;
}

export const useMagnitudes = (filters?: MagnitudeFilters) => {
  return useQuery({
    queryKey: ['magnitudes', filters],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/magnitudes', {
        params: filters,
      });
      return data;
    },
  });
};

export const useMagnitude = (id: string) => {
  return useQuery({
    queryKey: ['magnitudes', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/magnitudes/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateMagnitude = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMagnitudeDTO) => {
      const response = await api.post('/api/v1/magnitudes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['magnitudes'] });
    },
  });
};

export const useUpdateMagnitude = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMagnitudeDTO }) => {
      const response = await api.put(`/api/v1/magnitudes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['magnitudes'] });
    },
  });
};

export const useDeleteMagnitude = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/magnitudes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['magnitudes'] });
    },
  });
};
