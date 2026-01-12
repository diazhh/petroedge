import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  Rule, 
  RuleListItem, 
  RuleMetrics, 
  RuleVersion 
} from '../types';
import type { 
  RuleFormData, 
  UpdateRuleFormData, 
  TestRuleFormData 
} from '../schemas';
import type { TestExecutionResponse } from '../types/execution.types';

const RULES_BASE_URL = '/api/v1/rule-engine/rules';

export const ruleKeys = {
  all: ['rules'] as const,
  lists: () => [...ruleKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...ruleKeys.lists(), filters] as const,
  details: () => [...ruleKeys.all, 'detail'] as const,
  detail: (id: string) => [...ruleKeys.details(), id] as const,
  metrics: (id: string) => [...ruleKeys.detail(id), 'metrics'] as const,
  executions: (id: string) => [...ruleKeys.detail(id), 'executions'] as const,
  versions: (id: string) => [...ruleKeys.detail(id), 'versions'] as const,
};

export interface ListRulesParams {
  page?: number;
  perPage?: number;
  status?: 'active' | 'inactive' | 'draft' | 'error';
  category?: string;
  search?: string;
}

export interface ListRulesResponse {
  success: boolean;
  data: RuleListItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
  };
}

export interface GetRuleResponse {
  success: boolean;
  data: Rule;
}

export interface CreateRuleResponse {
  success: boolean;
  data: Rule;
}

export interface UpdateRuleResponse {
  success: boolean;
  data: Rule;
}

export interface DeleteRuleResponse {
  success: boolean;
}

export interface GetMetricsResponse {
  success: boolean;
  data: RuleMetrics;
}

export interface ListVersionsResponse {
  success: boolean;
  data: RuleVersion[];
}

export function useRules(params?: ListRulesParams) {
  return useQuery({
    queryKey: ruleKeys.list(params || {}),
    queryFn: async () => {
      const response = await apiClient.get<ListRulesResponse>(RULES_BASE_URL, {
        params,
      });
      return response.data;
    },
  });
}

export function useRule(id: string) {
  return useQuery({
    queryKey: ruleKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<GetRuleResponse>(`${RULES_BASE_URL}/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useRuleMetrics(id: string) {
  return useQuery({
    queryKey: ruleKeys.metrics(id),
    queryFn: async () => {
      const response = await apiClient.get<GetMetricsResponse>(
        `${RULES_BASE_URL}/${id}/metrics`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useRuleVersions(id: string) {
  return useQuery({
    queryKey: ruleKeys.versions(id),
    queryFn: async () => {
      const response = await apiClient.get<ListVersionsResponse>(
        `${RULES_BASE_URL}/${id}/versions`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RuleFormData) => {
      const response = await apiClient.post<CreateRuleResponse>(RULES_BASE_URL, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
}

export function useUpdateRule(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateRuleFormData) => {
      const response = await apiClient.put<UpdateRuleResponse>(
        `${RULES_BASE_URL}/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<DeleteRuleResponse>(
        `${RULES_BASE_URL}/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
}

export function useActivateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`${RULES_BASE_URL}/${id}/activate`);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
}

export function useDeactivateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`${RULES_BASE_URL}/${id}/deactivate`);
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
}

export function useTestRule(id: string) {
  return useMutation({
    mutationFn: async (data: TestRuleFormData) => {
      const response = await apiClient.post<{ success: boolean; data: TestExecutionResponse }>(
        `${RULES_BASE_URL}/${id}/test`,
        data
      );
      return response.data;
    },
  });
}

export function useDuplicateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<CreateRuleResponse>(
        `${RULES_BASE_URL}/${id}/duplicate`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
}

export function useRestoreVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, versionId }: { ruleId: string; versionId: string }) => {
      const response = await apiClient.post(
        `${RULES_BASE_URL}/${ruleId}/versions/${versionId}/restore`
      );
      return response.data;
    },
    onSuccess: (_data, { ruleId }) => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.detail(ruleId) });
      queryClient.invalidateQueries({ queryKey: ruleKeys.versions(ruleId) });
    },
  });
}
