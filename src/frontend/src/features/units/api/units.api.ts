import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Unit {
  id: string;
  magnitudeId: string;
  code: string;
  name: string;
  symbol: string;
  description?: string;
  isSiUnit: boolean;
  conversionFactor?: string;
  conversionOffset?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  magnitude?: {
    id: string;
    name: string;
    code: string;
    symbol?: string;
    category?: {
      name: string;
      icon?: string;
      color?: string;
    };
  };
}

export interface UnitFilters {
  magnitudeId?: string;
  isSiUnit?: boolean;
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface CreateUnitDTO {
  magnitudeId: string;
  code: string;
  name: string;
  symbol: string;
  description?: string;
  isSiUnit?: boolean;
  conversionFactor?: string;
  conversionOffset?: string;
}

export interface UpdateUnitDTO {
  magnitudeId?: string;
  code?: string;
  name?: string;
  symbol?: string;
  description?: string;
  isSiUnit?: boolean;
  conversionFactor?: string;
  conversionOffset?: string;
  isActive?: boolean;
}

export interface ConvertUnitsDTO {
  value: number;
  fromUnitId: string;
  toUnitId: string;
}

export const useUnits = (filters?: UnitFilters) => {
  return useQuery({
    queryKey: ['units', filters],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/units', {
        params: filters,
      });
      return data;
    },
  });
};

export const useUnit = (id: string) => {
  return useQuery({
    queryKey: ['units', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/units/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUnitDTO) => {
      const response = await api.post('/api/v1/units', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
};

export const useUpdateUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUnitDTO }) => {
      const response = await api.put(`/api/v1/units/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
};

export const useDeleteUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/units/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
};

export const useConvertUnits = () => {
  return useMutation({
    mutationFn: async (data: ConvertUnitsDTO) => {
      const response = await api.post('/api/v1/units/convert', data);
      return response.data;
    },
  });
};
