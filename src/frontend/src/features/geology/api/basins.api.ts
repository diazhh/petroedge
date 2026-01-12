import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Basin,
  CreateBasinDTO,
  UpdateBasinDTO,
  SingleResponse
} from '@/types/geology.types';

// Adaptador para transformar datos de Ditto Thing a Basin
function adaptDittoThingToBasin(thing: any): Basin {
  return {
    id: thing.thingId, // Use thingId for routing and API calls
    tenantId: thing.attributes?.tenantId || 'default',
    name: thing.attributes?.name || '',
    type: thing.features?.geology?.properties?.basinType || thing.attributes?.type || 'SEDIMENTARY',
    basinType: thing.features?.geology?.properties?.basinType,
    country: thing.attributes?.country,
    region: thing.attributes?.region,
    areaKm2: thing.features?.location?.properties?.areaKm2,
    age: thing.features?.geology?.properties?.age,
    tectonicSetting: thing.features?.geology?.properties?.tectonicSetting,
    minLatitude: thing.features?.location?.properties?.minLatitude,
    maxLatitude: thing.features?.location?.properties?.maxLatitude,
    minLongitude: thing.features?.location?.properties?.minLongitude,
    maxLongitude: thing.features?.location?.properties?.maxLongitude,
    description: thing.attributes?.description,
    createdAt: thing.features?.metadata?.properties?.createdAt || thing._created,
    updatedAt: thing.features?.metadata?.properties?.updatedAt || thing._modified,
  };
}

// API Functions
export const basinsApi = {
  getAll: async (params?: { page?: number; per_page?: number; country?: string }) => {
    const response = await apiClient.get<any>('/api/v1/digital-twins', { 
      params: { ...params, type: 'BASIN' } 
    });
    
    // Adaptar los datos de Ditto Things a formato Basin
    const items = response.data.data?.items || [];
    const adaptedData = items.map((thing: any) => adaptDittoThingToBasin(thing));
    
    return {
      success: response.data.success,
      data: adaptedData,
      meta: response.data.meta || {
        total: adaptedData.length,
        page: 1,
        per_page: adaptedData.length,
        total_pages: 1
      }
    };
  },

  getById: async (id: string) => {
    const response = await apiClient.get<any>(`/api/v1/digital-twins/${encodeURIComponent(id)}`);
    const adaptedBasin = adaptDittoThingToBasin(response.data.data);
    return {
      success: response.data.success,
      data: adaptedBasin
    };
  },

  create: async (basin: CreateBasinDTO) => {
    const { data } = await apiClient.post<SingleResponse<Basin>>('/api/v1/digital-twins', basin);
    return data;
  },

  update: async (id: string, basin: UpdateBasinDTO) => {
    const { data } = await apiClient.patch<SingleResponse<Basin>>(`/api/v1/digital-twins/${encodeURIComponent(id)}`, basin);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/api/v1/digital-twins/${encodeURIComponent(id)}`);
    return data;
  },

  getStatistics: async (_country: string) => {
    // TODO: Implementar estadísticas usando digital-twins
    const { data } = await apiClient.get<SingleResponse<any>>(`/api/v1/digital-twins`, { 
      params: { type: 'BASIN' } 
    });
    return data;
  }
};

// React Query Hooks
export const useBasins = (params?: { page?: number; per_page?: number; country?: string }) => {
  return useQuery({
    queryKey: ['basins', params],
    queryFn: () => basinsApi.getAll(params)
  });
};

export const useBasin = (id: string) => {
  return useQuery({
    queryKey: ['basins', id],
    queryFn: () => basinsApi.getById(id),
    enabled: !!id
  });
};

export const useCreateBasin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: basinsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basins'] });
    }
  });
};

export const useUpdateBasin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBasinDTO }) =>
      basinsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basins'] });
    }
  });
};

export const useDeleteBasin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: basinsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basins'] });
    }
  });
};
