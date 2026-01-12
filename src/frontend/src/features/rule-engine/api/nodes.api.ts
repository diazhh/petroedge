import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { NodeDefinition } from '../types';

const NODES_BASE_URL = '/api/v1/rule-engine/nodes';

export const nodeKeys = {
  all: ['rule-engine-nodes'] as const,
  lists: () => [...nodeKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...nodeKeys.lists(), filters] as const,
};

export interface ListNodesResponse {
  success: boolean;
  data: NodeDefinition[];
}

export function useNodes(category?: string) {
  return useQuery({
    queryKey: nodeKeys.list({ category }),
    queryFn: async () => {
      const response = await apiClient.get<ListNodesResponse>(NODES_BASE_URL, {
        params: category ? { category } : undefined,
      });
      return response.data;
    },
  });
}

export function useNodesByCategory() {
  const { data, ...rest } = useNodes();

  const nodesByCategory = data?.data.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeDefinition[]>);

  return {
    data: nodesByCategory,
    ...rest,
  };
}
