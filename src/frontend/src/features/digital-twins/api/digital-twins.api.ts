/**
 * Digital Twins API - React Query Hooks
 * Frontend → Backend API → Ditto (NO acceso directo a Ditto)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { DittoThing, DittoThingsList, ThingFilters, CreateThingInput, UpdateThingInput } from '../types/digital-twins.types';

// Backend API endpoints (proxy to Ditto with auth & RBAC)
const API_BASE = '/api/v1/digital-twins';

/**
 * List all Things with optional filters
 */
export const useThings = (filters?: ThingFilters) => {
  return useQuery({
    queryKey: ['things', filters],
    queryFn: async (): Promise<DittoThingsList> => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.namespace) params.append('namespace', filters.namespace);
      if (filters?.search) params.append('search', filters.search);
      
      const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
      const response = await apiClient.get(url);
      return response.data.data;
    },
  });
};

/**
 * Get a single Thing by ID
 */
export const useThing = (thingId: string | undefined) => {
  return useQuery({
    queryKey: ['thing', thingId],
    queryFn: async (): Promise<DittoThing> => {
      if (!thingId) throw new Error('Thing ID is required');
      const response = await apiClient.get(`${API_BASE}/${encodeURIComponent(thingId)}`);
      return response.data.data;
    },
    enabled: !!thingId,
  });
};

/**
 * Create a new Thing
 */
export const useCreateThing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateThingInput): Promise<DittoThing> => {
      const response = await apiClient.post(API_BASE, input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['things'] });
    },
  });
};

/**
 * Update a Thing
 */
export const useUpdateThing = (thingId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateThingInput): Promise<DittoThing> => {
      const response = await apiClient.patch(`${API_BASE}/${encodeURIComponent(thingId)}`, input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thing', thingId] });
      queryClient.invalidateQueries({ queryKey: ['things'] });
    },
  });
};

/**
 * Delete a Thing
 */
export const useDeleteThing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (thingId: string): Promise<void> => {
      return apiClient.delete(`${API_BASE}/${encodeURIComponent(thingId)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['things'] });
    },
  });
};

/**
 * Update Thing attributes
 */
export const useUpdateThingAttributes = (thingId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attributes: Record<string, any>): Promise<void> => {
      return apiClient.patch(`${API_BASE}/${encodeURIComponent(thingId)}/attributes`, attributes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thing', thingId] });
    },
  });
};

/**
 * Update Thing feature properties
 */
export const useUpdateFeatureProperties = (thingId: string, featureId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (properties: Record<string, any>): Promise<void> => {
      return apiClient.patch(
        `${API_BASE}/${encodeURIComponent(thingId)}/features/${featureId}/properties`,
        properties
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thing', thingId] });
    },
  });
};
