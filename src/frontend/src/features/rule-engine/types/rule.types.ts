export interface Rule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  status: 'active' | 'inactive' | 'draft' | 'error';
  nodes: RuleNode[];
  edges: RuleEdge[];
  config: RuleConfig;
  metadata: RuleMetadata;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

export interface RuleNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config: Record<string, any>;
  };
}

export interface RuleEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  label?: string;
}

export interface RuleConfig {
  trigger: {
    type: 'telemetry' | 'attribute' | 'schedule' | 'manual' | 'kafka';
    config: Record<string, any>;
  };
  timeout?: number;
  maxRetries?: number;
  dlqEnabled?: boolean;
  dlqTopic?: string;
}

export interface RuleMetadata {
  executionCount: number;
  lastExecutionAt?: string;
  successRate: number;
  avgDuration: number;
  errorCount: number;
}

export interface RuleVersion {
  id: string;
  ruleId: string;
  version: number;
  nodes: RuleNode[];
  edges: RuleEdge[];
  config: RuleConfig;
  createdBy: string;
  createdAt: string;
  comment?: string;
}

export interface RuleListItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: 'active' | 'inactive' | 'draft' | 'error';
  metadata: RuleMetadata;
  updatedAt: string;
}

export interface RuleMetrics {
  executionsToday: number;
  successRate: number;
  avgDuration: number;
  errorCount: number;
  executionsByHour: TimeSeriesDataPoint[];
  successRateByHour: TimeSeriesDataPoint[];
  durationByNode: NodeMetric[];
  errorsByType: ErrorMetric[];
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

export interface NodeMetric {
  nodeId: string;
  nodeType: string;
  avgDuration: number;
  executionCount: number;
}

export interface ErrorMetric {
  type: string;
  count: number;
  percentage: number;
}

export type RuleStatus = 'active' | 'inactive' | 'draft' | 'error';
