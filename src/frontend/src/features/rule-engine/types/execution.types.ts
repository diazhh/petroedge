export interface Execution {
  id: string;
  ruleId: string;
  status: 'success' | 'error' | 'timeout';
  input: Record<string, any>;
  output?: Record<string, any>;
  executedNodes: string[];
  duration: number;
  errors?: ExecutionError[];
  timestamp: string;
}

export interface ExecutionError {
  nodeId: string;
  nodeType: string;
  message: string;
  stack?: string;
}

export interface ExecutionLog {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

export interface TestExecutionRequest {
  input: Record<string, any>;
}

export interface TestExecutionResponse {
  status: 'success' | 'error';
  output: Record<string, any>;
  executedNodes: ExecutedNodeInfo[];
  duration: number;
  errors?: ExecutionError[];
  logs: ExecutionLog[];
}

export interface ExecutedNodeInfo {
  nodeId: string;
  nodeType: string;
  duration: number;
  status: 'success' | 'error' | 'skipped';
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
}

export interface ExecutionFilters {
  status?: 'success' | 'error' | 'timeout';
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

export interface ExecutionStats {
  total: number;
  success: number;
  error: number;
  timeout: number;
  avgDuration: number;
  successRate: number;
}
