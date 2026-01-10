import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type {
  WellTest,
  TestType,
  IprAnalysis,
  VlpAnalysis,
  NodalAnalysis,
  CreateWellTestInput,
  CalculateIprInput,
  CalculateVlpInput,
  CalculateNodalInput,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Axios instance with auth token
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// Test Types
// ============================================================================

export const useTestTypes = () => {
  return useQuery({
    queryKey: ['testTypes'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: TestType[] }>('/test-types');
      return data.data;
    },
  });
};

// ============================================================================
// Well Tests
// ============================================================================

export const useWellTests = (filters?: {
  wellId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}) => {
  return useQuery({
    queryKey: ['wellTests', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: WellTest[]; meta?: any }>(
        '/well-tests',
        { params: filters }
      );
      return data;
    },
  });
};

export const useWellTest = (id: string) => {
  return useQuery({
    queryKey: ['wellTest', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: WellTest }>(
        `/well-tests/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateWellTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateWellTestInput) => {
      const { data } = await apiClient.post<{ success: boolean; data: WellTest }>(
        '/well-tests',
        input
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wellTests'] });
    },
  });
};

export const useUpdateWellTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreateWellTestInput> }) => {
      const { data } = await apiClient.put<{ success: boolean; data: WellTest }>(
        `/well-tests/${id}`,
        input
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wellTests'] });
      queryClient.invalidateQueries({ queryKey: ['wellTest', variables.id] });
    },
  });
};

export const useDeleteWellTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/well-tests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wellTests'] });
    },
  });
};

export const useApproveWellTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<{ success: boolean; data: WellTest }>(
        `/well-tests/${id}/approve`
      );
      return data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['wellTests'] });
      queryClient.invalidateQueries({ queryKey: ['wellTest', id] });
    },
  });
};

// ============================================================================
// IPR Analysis
// ============================================================================

export const useIprAnalyses = (wellTestId: string) => {
  return useQuery({
    queryKey: ['iprAnalyses', wellTestId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: IprAnalysis[] }>(
        `/well-tests/${wellTestId}/ipr-analyses`
      );
      return data.data;
    },
    enabled: !!wellTestId,
  });
};

export const useCalculateIpr = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ wellTestId, input }: { wellTestId: string; input: CalculateIprInput }) => {
      const { data } = await apiClient.post<{ success: boolean; data: any }>(
        `/well-tests/${wellTestId}/ipr`,
        input
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['iprAnalyses', variables.wellTestId] });
    },
  });
};

// ============================================================================
// VLP Analysis
// ============================================================================

export const useVlpAnalyses = (wellId: string) => {
  return useQuery({
    queryKey: ['vlpAnalyses', wellId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: VlpAnalysis[] }>(
        `/well-testing/wells/${wellId}/vlp-analyses`
      );
      return data.data;
    },
    enabled: !!wellId,
  });
};

export const useCalculateVlp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ wellId, input }: { wellId: string; input: CalculateVlpInput }) => {
      const { data } = await apiClient.post<{ success: boolean; data: any }>(
        `/well-testing/wells/${wellId}/vlp`,
        input
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vlpAnalyses', variables.wellId] });
    },
  });
};

// ============================================================================
// Nodal Analysis
// ============================================================================

export const useNodalAnalyses = (wellId: string) => {
  return useQuery({
    queryKey: ['nodalAnalyses', wellId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: NodalAnalysis[] }>(
        `/well-testing/wells/${wellId}/nodal-analyses`
      );
      return data.data;
    },
    enabled: !!wellId,
  });
};

export const useCalculateNodal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ wellId, input }: { wellId: string; input: CalculateNodalInput }) => {
      const { data } = await apiClient.post<{ success: boolean; data: any }>(
        `/well-testing/wells/${wellId}/nodal`,
        input
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodalAnalyses', variables.wellId] });
    },
  });
};

// ============================================================================
// Well Test Stats
// ============================================================================

export const useWellTestStats = (wellId: string) => {
  return useQuery({
    queryKey: ['wellTestStats', wellId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: any }>(
        `/well-tests/wells/${wellId}/stats`
      );
      return data.data;
    },
    enabled: !!wellId,
  });
};
