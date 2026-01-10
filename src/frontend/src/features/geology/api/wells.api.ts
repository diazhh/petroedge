import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Well,
  WellWithRelations,
  CreateWellDTO,
  UpdateWellDTO,
  PaginatedResponse,
  SingleResponse
} from '@/types/geology.types';

// Adaptador para transformar datos de Ditto Thing a Well
function adaptDittoThingToWell(thing: any): Well {
  return {
    id: thing.thingId, // Use thingId for routing and API calls
    tenantId: thing.attributes?.tenantId || 'default',
    fieldId: thing.attributes?.parentFieldId || '',
    primaryReservoirId: thing.attributes?.parentReservoirId || '',
    wellName: thing.attributes?.name || thing.attributes?.wellCode || '',
    wellCode: thing.attributes?.wellCode || thing.attributes?.code || '',
    apiNumber: thing.attributes?.apiNumber,
    wellType: thing.features?.completion?.properties?.wellType || 'PRODUCER',
    status: thing.features?.status?.properties?.current,
    liftMethod: thing.features?.completion?.properties?.liftMethod,
    surfaceLatitude: thing.features?.location?.properties?.surfaceLatitude,
    surfaceLongitude: thing.features?.location?.properties?.surfaceLongitude,
    surfaceElevationFt: thing.features?.location?.properties?.surfaceElevationFt,
    totalDepthMdFt: thing.features?.drilling?.properties?.totalDepthMdFt,
    totalDepthTvdFt: thing.features?.drilling?.properties?.totalDepthTvdFt,
    spudDate: thing.features?.metadata?.properties?.spudDate,
    completionDate: thing.features?.metadata?.properties?.completionDate,
    firstProductionDate: thing.features?.metadata?.properties?.firstProductionDate,
    abandonmentDate: thing.features?.metadata?.properties?.abandonmentDate,
    tubingSize: thing.features?.completion?.properties?.tubingSize,
    casingSize: thing.features?.completion?.properties?.casingSize,
    currentOilRateBopd: thing.features?.production?.properties?.currentOilRateBopd,
    currentGasRateMscfd: thing.features?.production?.properties?.currentGasRateMscfd,
    currentWaterRateBwpd: thing.features?.production?.properties?.currentWaterRateBwpd,
    cumulativeOilMbbl: thing.features?.production?.properties?.cumulativeOilMbbl,
    cumulativeGasMmscf: thing.features?.production?.properties?.cumulativeGasMmscf,
    cumulativeWaterMbbl: thing.features?.production?.properties?.cumulativeWaterMbbl,
    metadata: thing.features?.metadata?.properties,
    createdAt: thing.features?.metadata?.properties?.createdAt || thing._created,
    updatedAt: thing.features?.metadata?.properties?.updatedAt || thing._modified,
  };
}

function adaptDittoThingToWellWithRelations(thing: any): WellWithRelations {
  const well = adaptDittoThingToWell(thing);
  
  // Extraer nombres desde _embedded si están disponibles
  const fieldName = thing._embedded?.parentField?.attributes?.name || '';
  const fieldCode = thing._embedded?.parentField?.attributes?.fieldCode || thing._embedded?.parentField?.attributes?.code || '';
  const reservoirName = thing._embedded?.parentReservoir?.attributes?.name || '';
  const reservoirCode = thing._embedded?.parentReservoir?.attributes?.reservoirCode || thing._embedded?.parentReservoir?.attributes?.code || '';
  
  return {
    well,
    field: thing.attributes?.parentFieldId ? {
      id: thing.attributes.parentFieldId,
      fieldName: fieldName,
      fieldCode: fieldCode,
    } as any : undefined,
    reservoir: thing.attributes?.parentReservoirId ? {
      id: thing.attributes.parentReservoirId,
      reservoirName: reservoirName,
      reservoirCode: reservoirCode,
    } as any : undefined,
  };
}

// API Functions
export const wellsApi = {
  getAll: async (params?: { page?: number; per_page?: number; reservoir_id?: string; type?: string; status?: string }) => {
    const apiParams: any = { assetTypeCode: 'WELL', ...params };
    if (params?.reservoir_id) {
      apiParams.parentAssetId = params.reservoir_id;
      delete apiParams.reservoir_id;
    }
    const response = await apiClient.get<any>('/api/v1/digital-twins', { params: { ...apiParams, type: 'WELL' } });
    
    // Adaptar los datos de Ditto Things a formato Well
    const items = response.data.data?.items || [];
    const adaptedData = items.map((thing: any) => adaptDittoThingToWellWithRelations(thing));
    
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
    
    // Adaptar el Ditto Thing a formato Well
    const adaptedWell = adaptDittoThingToWell(response.data.data);
    
    return {
      success: response.data.success,
      data: adaptedWell
    };
  },

  create: async (well: CreateWellDTO) => {
    const { data } = await apiClient.post<SingleResponse<Well>>('/api/v1/digital-twins', well);
    return data;
  },

  update: async (id: string, well: UpdateWellDTO) => {
    const { data } = await apiClient.patch<SingleResponse<Well>>(`/api/v1/digital-twins/${encodeURIComponent(id)}`, well);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/api/v1/digital-twins/${encodeURIComponent(id)}`);
    return data;
  },

  getStatistics: async (fieldId: string) => {
    // TODO: Implementar estadísticas usando assets
    const { data } = await apiClient.get<SingleResponse<any>>(`/api/v1/infrastructure/assets`, { 
      params: { parentAssetId: fieldId, assetTypeCode: 'WELL' } 
    });
    return data;
  }
};

// React Query Hooks
export const useWells = (params?: { page?: number; per_page?: number; reservoir_id?: string; type?: string; status?: string }) => {
  return useQuery({
    queryKey: ['wells', params],
    queryFn: () => wellsApi.getAll(params)
  });
};

export const useWell = (id: string) => {
  return useQuery({
    queryKey: ['wells', id],
    queryFn: () => wellsApi.getById(id),
    enabled: !!id
  });
};

export const useCreateWell = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: wellsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wells'] });
    }
  });
};

export const useUpdateWell = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWellDTO }) =>
      wellsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wells'] });
    }
  });
};

export const useDeleteWell = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: wellsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wells'] });
    }
  });
};
