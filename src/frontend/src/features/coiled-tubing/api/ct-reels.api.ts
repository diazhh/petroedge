import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CtReel,
  CtReelsListResponse,
  CtReelResponse,
  CtReelFormData,
  CtReelsFilters,
  CtReelSection,
} from '../types';
import { CT_API_ENDPOINTS } from '../constants';

// Query Keys
export const ctReelsKeys = {
  all: ['ct-reels'] as const,
  lists: () => [...ctReelsKeys.all, 'list'] as const,
  list: (filters: CtReelsFilters) => [...ctReelsKeys.lists(), filters] as const,
  details: () => [...ctReelsKeys.all, 'detail'] as const,
  detail: (id: string) => [...ctReelsKeys.details(), id] as const,
  sections: (reelId: string) => [...ctReelsKeys.detail(reelId), 'sections'] as const,
};

// API Functions
export const ctReelsApi = {
  getAll: async (filters?: CtReelsFilters, page = 1, perPage = 10): Promise<CtReelsListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.manufacturer && { manufacturer: filters.manufacturer }),
      ...(filters?.unit_id && { unit_id: filters.unit_id }),
      ...(filters?.min_fatigue !== undefined && { min_fatigue: filters.min_fatigue.toString() }),
      ...(filters?.max_fatigue !== undefined && { max_fatigue: filters.max_fatigue.toString() }),
      ...(filters?.search && { search: filters.search }),
    });

    const response = await apiClient.get<CtReelsListResponse>(
      `${CT_API_ENDPOINTS.REELS}?${params}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<CtReel> => {
    const response = await apiClient.get<CtReelResponse>(
      `${CT_API_ENDPOINTS.REELS}/${id}`
    );
    return response.data.data;
  },

  create: async (data: CtReelFormData): Promise<CtReel> => {
    const response = await apiClient.post<CtReelResponse>(
      CT_API_ENDPOINTS.REELS,
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: Partial<CtReelFormData>): Promise<CtReel> => {
    const response = await apiClient.patch<CtReelResponse>(
      `${CT_API_ENDPOINTS.REELS}/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${CT_API_ENDPOINTS.REELS}/${id}`);
  },

  getSections: async (reelId: string): Promise<CtReelSection[]> => {
    const response = await apiClient.get<{ success: boolean; data: CtReelSection[] }>(
      `${CT_API_ENDPOINTS.REELS}/${reelId}/sections`
    );
    return response.data.data;
  },

  recordCut: async (reelId: string, data: { section_number: number; cut_reason: string }): Promise<void> => {
    await apiClient.post(
      `${CT_API_ENDPOINTS.REELS}/${reelId}/cuts`,
      data
    );
  },
};

// Hooks
export const useCtReels = (filters?: CtReelsFilters, page = 1, perPage = 10) => {
  return useQuery({
    queryKey: ctReelsKeys.list({ ...filters, page, perPage } as any),
    queryFn: () => ctReelsApi.getAll(filters, page, perPage),
  });
};

export const useCtReel = (id: string) => {
  return useQuery({
    queryKey: ctReelsKeys.detail(id),
    queryFn: () => ctReelsApi.getById(id),
    enabled: !!id,
  });
};

export const useCtReelSections = (reelId: string) => {
  return useQuery({
    queryKey: ctReelsKeys.sections(reelId),
    queryFn: () => ctReelsApi.getSections(reelId),
    enabled: !!reelId,
  });
};

export const useCreateCtReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ctReelsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ctReelsKeys.lists() });
    },
  });
};

export const useUpdateCtReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CtReelFormData> }) =>
      ctReelsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ctReelsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ctReelsKeys.detail(variables.id) });
    },
  });
};

export const useDeleteCtReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ctReelsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ctReelsKeys.lists() });
    },
  });
};

export const useRecordReelCut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reelId, data }: { reelId: string; data: { section_number: number; cut_reason: string } }) =>
      ctReelsApi.recordCut(reelId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ctReelsKeys.detail(variables.reelId) });
      queryClient.invalidateQueries({ queryKey: ctReelsKeys.sections(variables.reelId) });
    },
  });
};
