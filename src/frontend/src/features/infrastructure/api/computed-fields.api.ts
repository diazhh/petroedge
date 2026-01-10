/**
 * Computed Fields API Hooks
 * React Query hooks for computed fields management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ComputedFieldDefinition } from '../types/data-types';
import { toast } from 'sonner';

// Get computed field definitions for an asset type
export function useComputedFieldDefinitions(assetTypeId: string) {
  return useQuery({
    queryKey: ['computed-field-definitions', assetTypeId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/infrastructure/asset-types/${assetTypeId}/computed-fields/definitions`);
      return response.data;
    },
    enabled: !!assetTypeId,
  });
}

// Get computed field values for an asset
export function useComputedFieldValues(assetId: string) {
  return useQuery({
    queryKey: ['computed-field-values', assetId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/infrastructure/assets/${assetId}/computed-fields`);
      return response.data;
    },
    enabled: !!assetId,
  });
}

// Create computed field definition
export function useCreateComputedField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assetTypeId, 
      definition 
    }: { 
      assetTypeId: string; 
      definition: ComputedFieldDefinition 
    }) => {
      const response = await apiClient.post(
        `/api/v1/infrastructure/asset-types/${assetTypeId}/computed-fields/definitions`,
        definition
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['computed-field-definitions', variables.assetTypeId] });
      toast.success('Campo calculado creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al crear campo calculado');
    },
  });
}

// Update computed field definition
export function useUpdateComputedField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assetTypeId, 
      key, 
      definition 
    }: { 
      assetTypeId: string; 
      key: string; 
      definition: Partial<ComputedFieldDefinition> 
    }) => {
      const response = await apiClient.put(
        `/api/v1/infrastructure/asset-types/${assetTypeId}/computed-fields/definitions/${key}`,
        definition
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['computed-field-definitions', variables.assetTypeId] });
      toast.success('Campo calculado actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al actualizar campo calculado');
    },
  });
}

// Delete computed field definition
export function useDeleteComputedField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetTypeId, key }: { assetTypeId: string; key: string }) => {
      const response = await apiClient.delete(
        `/api/v1/infrastructure/asset-types/${assetTypeId}/computed-fields/definitions/${key}`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['computed-field-definitions', variables.assetTypeId] });
      toast.success('Campo calculado eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al eliminar campo calculado');
    },
  });
}

// Recalculate computed fields for an asset
export function useRecalculateComputedFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const response = await apiClient.post(`/api/v1/infrastructure/assets/${assetId}/computed-fields/recalculate`);
      return response.data;
    },
    onSuccess: (_, assetId) => {
      queryClient.invalidateQueries({ queryKey: ['computed-field-values', assetId] });
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] });
      toast.success('Campos calculados recalculados correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al recalcular campos calculados');
    },
  });
}

// Validate formula
export function useValidateFormula() {
  return useMutation({
    mutationFn: async ({ 
      assetTypeId, 
      formula 
    }: { 
      assetTypeId: string; 
      formula: string 
    }) => {
      const response = await apiClient.post(
        `/api/v1/infrastructure/asset-types/${assetTypeId}/computed-fields/validate-formula`,
        { formula }
      );
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al validar fórmula');
    },
  });
}
