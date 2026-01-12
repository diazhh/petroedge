import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CtJob,
  CtJobsListResponse,
  CtJobResponse,
  CtJobFormData,
  CtJobsFilters,
  BhaComponent,
  JobFluid,
  JobOperation,
  JobCalculation,
} from '../types';
import { CT_API_ENDPOINTS } from '../constants';

// Query Keys
export const ctJobsKeys = {
  all: ['ct-jobs'] as const,
  lists: () => [...ctJobsKeys.all, 'list'] as const,
  list: (filters: CtJobsFilters) => [...ctJobsKeys.lists(), filters] as const,
  details: () => [...ctJobsKeys.all, 'detail'] as const,
  detail: (id: string) => [...ctJobsKeys.details(), id] as const,
  bha: (jobId: string) => [...ctJobsKeys.detail(jobId), 'bha'] as const,
  fluids: (jobId: string) => [...ctJobsKeys.detail(jobId), 'fluids'] as const,
  operations: (jobId: string) => [...ctJobsKeys.detail(jobId), 'operations'] as const,
  calculations: (jobId: string) => [...ctJobsKeys.detail(jobId), 'calculations'] as const,
};

// API Functions
export const ctJobsApi = {
  getAll: async (filters?: CtJobsFilters, page = 1, perPage = 10): Promise<CtJobsListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.job_type && { job_type: filters.job_type }),
      ...(filters?.unit_id && { unit_id: filters.unit_id }),
      ...(filters?.reel_id && { reel_id: filters.reel_id }),
      ...(filters?.well_id && { well_id: filters.well_id }),
      ...(filters?.field_id && { field_id: filters.field_id }),
      ...(filters?.start_date && { start_date: filters.start_date }),
      ...(filters?.end_date && { end_date: filters.end_date }),
      ...(filters?.search && { search: filters.search }),
    });

    const response = await apiClient.get<CtJobsListResponse>(
      `${CT_API_ENDPOINTS.JOBS}?${params}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<CtJob> => {
    const response = await apiClient.get<CtJobResponse>(
      `${CT_API_ENDPOINTS.JOBS}/${id}`
    );
    return response.data.data;
  },

  create: async (data: CtJobFormData): Promise<CtJob> => {
    const response = await apiClient.post<CtJobResponse>(
      CT_API_ENDPOINTS.JOBS,
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: Partial<CtJobFormData>): Promise<CtJob> => {
    const response = await apiClient.patch<CtJobResponse>(
      `${CT_API_ENDPOINTS.JOBS}/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${CT_API_ENDPOINTS.JOBS}/${id}`);
  },

  // BHA Components
  getBhaComponents: async (jobId: string): Promise<BhaComponent[]> => {
    const response = await apiClient.get<{ success: boolean; data: BhaComponent[] }>(
      `${CT_API_ENDPOINTS.JOBS}/${jobId}/bha-components`
    );
    return response.data.data;
  },

  createBhaComponent: async (jobId: string, data: Omit<BhaComponent, 'id' | 'job_id' | 'created_at' | 'updated_at'>): Promise<BhaComponent> => {
    const response = await apiClient.post<{ success: boolean; data: BhaComponent }>(
      `${CT_API_ENDPOINTS.JOBS}/${jobId}/bha-components`,
      data
    );
    return response.data.data;
  },

  deleteBhaComponent: async (jobId: string, componentId: string): Promise<void> => {
    await apiClient.delete(`${CT_API_ENDPOINTS.JOBS}/${jobId}/bha-components/${componentId}`);
  },

  // Job Fluids
  getFluids: async (jobId: string): Promise<JobFluid[]> => {
    const response = await apiClient.get<{ success: boolean; data: JobFluid[] }>(
      `${CT_API_ENDPOINTS.JOBS}/${jobId}/fluids`
    );
    return response.data.data;
  },

  createFluid: async (jobId: string, data: Omit<JobFluid, 'id' | 'job_id' | 'created_at' | 'updated_at'>): Promise<JobFluid> => {
    const response = await apiClient.post<{ success: boolean; data: JobFluid }>(
      `${CT_API_ENDPOINTS.JOBS}/${jobId}/fluids`,
      data
    );
    return response.data.data;
  },

  deleteFluid: async (jobId: string, fluidId: string): Promise<void> => {
    await apiClient.delete(`${CT_API_ENDPOINTS.JOBS}/${jobId}/fluids/${fluidId}`);
  },

  // Job Operations
  getOperations: async (jobId: string): Promise<JobOperation[]> => {
    const response = await apiClient.get<{ success: boolean; data: JobOperation[] }>(
      `${CT_API_ENDPOINTS.JOBS}/${jobId}/operations`
    );
    return response.data.data;
  },

  createOperation: async (jobId: string, data: Omit<JobOperation, 'id' | 'job_id' | 'created_at' | 'updated_at'>): Promise<JobOperation> => {
    const response = await apiClient.post<{ success: boolean; data: JobOperation }>(
      `${CT_API_ENDPOINTS.JOBS}/${jobId}/operations`,
      data
    );
    return response.data.data;
  },

  // Job Calculations
  getCalculations: async (jobId: string): Promise<JobCalculation[]> => {
    const response = await apiClient.get<{ success: boolean; data: JobCalculation[] }>(
      `${CT_API_ENDPOINTS.JOBS}/${jobId}/calculations`
    );
    return response.data.data;
  },

  runCalculation: async (jobId: string, data: { calculation_type: string; input_parameters: Record<string, any> }): Promise<JobCalculation> => {
    const response = await apiClient.post<{ success: boolean; data: JobCalculation }>(
      `${CT_API_ENDPOINTS.JOBS}/${jobId}/calculations`,
      data
    );
    return response.data.data;
  },
};

// Hooks
export const useCtJobs = (filters?: CtJobsFilters, page = 1, perPage = 10) => {
  return useQuery({
    queryKey: ctJobsKeys.list({ ...filters, page, perPage } as any),
    queryFn: () => ctJobsApi.getAll(filters, page, perPage),
  });
};

export const useCtJob = (id: string) => {
  return useQuery({
    queryKey: ctJobsKeys.detail(id),
    queryFn: () => ctJobsApi.getById(id),
    enabled: !!id,
  });
};

export const useCtJobBhaComponents = (jobId: string) => {
  return useQuery({
    queryKey: ctJobsKeys.bha(jobId),
    queryFn: () => ctJobsApi.getBhaComponents(jobId),
    enabled: !!jobId,
  });
};

export const useCtJobFluids = (jobId: string) => {
  return useQuery({
    queryKey: ctJobsKeys.fluids(jobId),
    queryFn: () => ctJobsApi.getFluids(jobId),
    enabled: !!jobId,
  });
};

export const useCtJobOperations = (jobId: string) => {
  return useQuery({
    queryKey: ctJobsKeys.operations(jobId),
    queryFn: () => ctJobsApi.getOperations(jobId),
    enabled: !!jobId,
  });
};

export const useCtJobCalculations = (jobId: string) => {
  return useQuery({
    queryKey: ctJobsKeys.calculations(jobId),
    queryFn: () => ctJobsApi.getCalculations(jobId),
    enabled: !!jobId,
  });
};

export const useCreateCtJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ctJobsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ctJobsKeys.lists() });
    },
  });
};

export const useUpdateCtJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CtJobFormData> }) =>
      ctJobsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ctJobsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ctJobsKeys.detail(variables.id) });
    },
  });
};

export const useDeleteCtJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ctJobsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ctJobsKeys.lists() });
    },
  });
};

export const useCreateBhaComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: Omit<BhaComponent, 'id' | 'job_id' | 'created_at' | 'updated_at'> }) =>
      ctJobsApi.createBhaComponent(jobId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ctJobsKeys.bha(variables.jobId) });
    },
  });
};

export const useDeleteBhaComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, componentId }: { jobId: string; componentId: string }) =>
      ctJobsApi.deleteBhaComponent(jobId, componentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ctJobsKeys.bha(variables.jobId) });
    },
  });
};

export const useCreateJobFluid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: Omit<JobFluid, 'id' | 'job_id' | 'created_at' | 'updated_at'> }) =>
      ctJobsApi.createFluid(jobId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ctJobsKeys.fluids(variables.jobId) });
    },
  });
};

export const useDeleteJobFluid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, fluidId }: { jobId: string; fluidId: string }) =>
      ctJobsApi.deleteFluid(jobId, fluidId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ctJobsKeys.fluids(variables.jobId) });
    },
  });
};

export const useCreateJobOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: Omit<JobOperation, 'id' | 'job_id' | 'created_at' | 'updated_at'> }) =>
      ctJobsApi.createOperation(jobId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ctJobsKeys.operations(variables.jobId) });
    },
  });
};

export const useRunJobCalculation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: { calculation_type: string; input_parameters: Record<string, any> } }) =>
      ctJobsApi.runCalculation(jobId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ctJobsKeys.calculations(variables.jobId) });
    },
  });
};
