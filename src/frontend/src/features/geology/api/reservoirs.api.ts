import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Reservoir,
  CreateReservoirDTO,
  UpdateReservoirDTO,
  PaginatedResponse,
  SingleResponse
} from '@/types/geology.types';

// Adaptador para transformar datos de Ditto Thing a Reservoir
function adaptDittoThingToReservoir(thing: any): Reservoir {
  // Extraer nombre del campo desde _embedded si está disponible
  const fieldName = thing._embedded?.parentField?.attributes?.name || '';
  const fieldCode = thing._embedded?.parentField?.attributes?.fieldCode || thing._embedded?.parentField?.attributes?.code || '';
  
  return {
    id: thing.thingId, // Use thingId for routing and API calls
    tenantId: thing.attributes?.tenantId || 'default',
    fieldId: thing.attributes?.parentFieldId || '',
    field: thing.attributes?.parentFieldId ? { 
      id: thing.attributes.parentFieldId, 
      fieldName: fieldName,
      fieldCode: fieldCode,
      tenantId: thing.tenantId,
      status: thing._embedded?.parentField?.features?.operations?.properties?.status || '',
      createdAt: thing._embedded?.parentField?._created || '',
      updatedAt: thing._embedded?.parentField?._modified || '',
    } as any : undefined,
    reservoirName: thing.attributes?.name || thing.attributes?.reservoirCode || thing.attributes?.code || '',
    reservoirCode: thing.attributes?.reservoirCode || thing.attributes?.code || '',
    formationName: thing.features?.geology?.properties?.formationName || '',
    formationAge: thing.features?.geology?.properties?.formationAge,
    lithology: thing.features?.geology?.properties?.lithology,
    fluidType: thing.features?.geology?.properties?.fluidType,
    driveMechanism: thing.features?.geology?.properties?.driveMechanism,
    topDepthTvdFt: thing.features?.geology?.properties?.topDepthTvdFt,
    bottomDepthTvdFt: thing.features?.geology?.properties?.bottomDepthTvdFt,
    avgNetPayFt: thing.features?.geology?.properties?.avgNetPayFt,
    avgPorosity: thing.features?.geology?.properties?.avgPorosity,
    avgPermeabilityMd: thing.features?.geology?.properties?.avgPermeabilityMd,
    avgWaterSaturation: thing.features?.geology?.properties?.avgWaterSaturation,
    initialPressurePsi: thing.features?.conditions?.properties?.initialPressurePsi,
    currentPressurePsi: thing.features?.conditions?.properties?.currentPressurePsi,
    reservoirTemperatureF: thing.features?.conditions?.properties?.reservoirTemperatureF,
    areaAcres: thing.features?.location?.properties?.areaAcres,
    ooipMmstb: thing.features?.reserves?.properties?.ooipMmstb,
    recoveryFactor: thing.features?.reserves?.properties?.recoveryFactor,
    description: thing.attributes?.description,
    createdAt: thing.features?.metadata?.properties?.createdAt || thing._created,
    updatedAt: thing.features?.metadata?.properties?.updatedAt || thing._modified,
  };
}

// API Functions
export const reservoirsApi = {
  getAll: async (params?: { page?: number; per_page?: number; field_id?: string; lithology?: string }) => {
    const apiParams: any = { assetTypeCode: 'RESERVOIR', ...params };
    if (params?.field_id) {
      apiParams.parentAssetId = params.field_id;
      delete apiParams.field_id;
    }
    const response = await apiClient.get<any>('/api/v1/digital-twins', { params: { ...apiParams, type: 'RESERVOIR' } });
    
    // Adaptar los datos de Ditto Things a formato Reservoir
    const items = response.data.data?.items || [];
    const adaptedData = items.map((thing: any) => adaptDittoThingToReservoir(thing));
    
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
    const adaptedReservoir = adaptDittoThingToReservoir(response.data.data);
    return {
      success: response.data.success,
      data: adaptedReservoir
    };
  },

  create: async (reservoir: CreateReservoirDTO) => {
    const { data } = await apiClient.post<SingleResponse<Reservoir>>('/api/v1/digital-twins', reservoir);
    return data;
  },

  update: async (id: string, reservoir: UpdateReservoirDTO) => {
    const { data } = await apiClient.patch<SingleResponse<Reservoir>>(`/api/v1/digital-twins/${encodeURIComponent(id)}`, reservoir);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/api/v1/digital-twins/${encodeURIComponent(id)}`);
    return data;
  },

  getStatistics: async (fieldId: string) => {
    // TODO: Implementar estadísticas usando assets
    const { data } = await apiClient.get<SingleResponse<any>>(`/api/v1/infrastructure/assets`, { 
      params: { parentAssetId: fieldId, assetTypeCode: 'RESERVOIR' } 
    });
    return data;
  }
};

// React Query Hooks
export const useReservoirs = (params?: { page?: number; per_page?: number; field_id?: string; lithology?: string }) => {
  return useQuery({
    queryKey: ['reservoirs', params],
    queryFn: () => reservoirsApi.getAll(params)
  });
};

export const useReservoir = (id: string) => {
  return useQuery({
    queryKey: ['reservoirs', id],
    queryFn: () => reservoirsApi.getById(id),
    enabled: !!id
  });
};

export const useCreateReservoir = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reservoirsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservoirs'] });
    }
  });
};

export const useUpdateReservoir = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReservoirDTO }) =>
      reservoirsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservoirs'] });
    }
  });
};

export const useDeleteReservoir = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reservoirsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservoirs'] });
    }
  });
};
