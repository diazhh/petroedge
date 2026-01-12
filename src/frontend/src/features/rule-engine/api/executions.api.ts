import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Execution, ExecutionFilters, ExecutionStats } from '../types';

const EXECUTIONS_BASE_URL = '/api/v1/rule-engine/rules';

export const executionKeys = {
  all: ['rule-executions'] as const,
  lists: () => [...executionKeys.all, 'list'] as const,
  list: (ruleId: string, filters: ExecutionFilters) => 
    [...executionKeys.lists(), ruleId, filters] as const,
  stats: (ruleId: string) => [...executionKeys.all, 'stats', ruleId] as const,
};

export interface ListExecutionsResponse {
  success: boolean;
  data: Execution[];
  meta: {
    total: number;
    page: number;
    perPage: number;
  };
}

export interface GetExecutionStatsResponse {
  success: boolean;
  data: ExecutionStats;
}

export function useExecutions(ruleId: string, filters?: ExecutionFilters) {
  return useQuery({
    queryKey: executionKeys.list(ruleId, filters || {}),
    queryFn: async () => {
      const response = await apiClient.get<ListExecutionsResponse>(
        `${EXECUTIONS_BASE_URL}/${ruleId}/executions`,
        { params: filters }
      );
      return response.data;
    },
    enabled: !!ruleId,
  });
}

export function useExecutionStats(ruleId: string) {
  return useQuery({
    queryKey: executionKeys.stats(ruleId),
    queryFn: async () => {
      const response = await apiClient.get<GetExecutionStatsResponse>(
        `${EXECUTIONS_BASE_URL}/${ruleId}/executions/stats`
      );
      return response.data;
    },
    enabled: !!ruleId,
  });
}
