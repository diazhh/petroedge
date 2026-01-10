/**
 * Assets API Hooks
 * React Query hooks for asset management
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Update asset info
export function useUpdateAssetInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: {
        name?: string;
        code?: string;
        description?: string;
        location?: any;
        status?: string;
        tags?: string[];
      }
    }) => {
      const response = await apiClient.patch(`/api/v1/infrastructure/assets/${id}/info`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Información del asset actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al actualizar información del asset');
    },
  });
}

// Export all hooks
export * from './telemetry.api';
export * from './computed-fields.api';
