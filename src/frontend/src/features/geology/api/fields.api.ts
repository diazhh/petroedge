import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Field,
  CreateFieldDTO,
  UpdateFieldDTO,
  SingleResponse
} from '@/types/geology.types';

// Adaptador para transformar datos de Ditto Thing a Field
function adaptDittoThingToField(thing: any): Field {
  // Extraer nombre de la cuenca desde _embedded si está disponible
  const basinName = thing._embedded?.parentBasin?.attributes?.name || '';
  
  return {
    id: thing.thingId, // Use thingId for routing and API calls
    tenantId: thing.attributes?.tenantId || 'default',
    basinId: thing.attributes?.parentBasinId || '',
    basin: thing.attributes?.parentBasinId ? { 
      id: thing.attributes.parentBasinId, 
      name: basinName,
      tenantId: thing.tenantId,
      basinType: thing._embedded?.parentBasin?.features?.geology?.properties?.basinType,
      country: thing._embedded?.parentBasin?.attributes?.country,
      createdAt: thing._embedded?.parentBasin?._created || '',
      updatedAt: thing._embedded?.parentBasin?._modified || '',
    } as any : undefined,
    name: thing.attributes?.name || thing.attributes?.fieldCode || thing.attributes?.code || '',
    fieldName: thing.attributes?.name || thing.attributes?.fieldCode || thing.attributes?.code || '',
    fieldCode: thing.attributes?.fieldCode || thing.attributes?.code || '',
    operator: thing.features?.operations?.properties?.operator,
    status: thing.features?.operations?.properties?.status || thing.features?.status?.properties?.current,
    fieldType: thing.features?.geology?.properties?.fieldType,
    discoveryDate: thing.features?.operations?.properties?.discoveryDate || thing.features?.metadata?.properties?.discoveryDate,
    firstProductionDate: thing.features?.metadata?.properties?.firstProductionDate,
    areaAcres: thing.features?.location?.properties?.areaAcres,
    centerLatitude: thing.features?.location?.properties?.centerLatitude,
    centerLongitude: thing.features?.location?.properties?.centerLongitude,
    totalWells: thing.features?.statistics?.properties?.totalWells,
    activeWells: thing.features?.statistics?.properties?.activeWells,
    description: thing.attributes?.description,
    createdAt: thing.features?.metadata?.properties?.createdAt || thing._created,
    updatedAt: thing.features?.metadata?.properties?.updatedAt || thing._modified,
  };
}

// API Functions
export const fieldsApi = {
  getAll: async (params?: { page?: number; per_page?: number; basin_id?: string; status?: string }) => {
    const apiParams: any = { assetTypeCode: 'FIELD', ...params };
    if (params?.basin_id) {
      apiParams.parentAssetId = params.basin_id;
      delete apiParams.basin_id;
    }
    const response = await apiClient.get<any>('/api/v1/digital-twins', { params: { ...apiParams, type: 'FIELD' } });
    
    // Adaptar los datos de Ditto Things a formato Field
    const items = response.data.data?.items || [];
    const adaptedData = items.map((thing: any) => adaptDittoThingToField(thing));
    
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
    const adaptedField = adaptDittoThingToField(response.data.data);
    return {
      success: response.data.success,
      data: adaptedField
    };
  },

  create: async (field: CreateFieldDTO) => {
    const { data } = await apiClient.post<SingleResponse<Field>>('/api/v1/digital-twins', field);
    return data;
  },

  update: async (id: string, field: UpdateFieldDTO) => {
    const { data } = await apiClient.patch<SingleResponse<Field>>(`/api/v1/digital-twins/${encodeURIComponent(id)}`, field);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/api/v1/digital-twins/${encodeURIComponent(id)}`);
    return data;
  },

  getStatistics: async (basinId: string) => {
    // TODO: Implementar estadísticas usando assets
    const { data } = await apiClient.get<SingleResponse<any>>(`/api/v1/infrastructure/assets`, { 
      params: { parentAssetId: basinId, assetTypeCode: 'FIELD' } 
    });
    return data;
  }
};

// React Query Hooks
export const useFields = (params?: { page?: number; per_page?: number; basin_id?: string; status?: string }) => {
  return useQuery({
    queryKey: ['fields', params],
    queryFn: () => fieldsApi.getAll(params)
  });
};

export const useField = (id: string) => {
  return useQuery({
    queryKey: ['fields', id],
    queryFn: () => fieldsApi.getById(id),
    enabled: !!id
  });
};

export const useCreateField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fieldsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    }
  });
};

export const useUpdateField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFieldDTO }) =>
      fieldsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    }
  });
};

export const useDeleteField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fieldsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    }
  });
};
