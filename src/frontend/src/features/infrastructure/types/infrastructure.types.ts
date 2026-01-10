// Asset Types
export interface AssetType {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentTypeId?: string;
  fixedSchema: Record<string, any>;
  attributeSchema: Record<string, any>;
  telemetrySchema: Record<string, any>;
  computedFields: ComputedField[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComputedField {
  key: string;
  name: string;
  unit?: string;
  formula: string;
  recalculateOn: string[];
}

// Assets
export interface Asset {
  id: string;
  tenantId: string;
  assetTypeId: string;
  code: string;
  name: string;
  description?: string;
  parentAssetId?: string;
  latitude?: number;
  longitude?: number;
  elevationFt?: number;
  status: AssetStatus;
  properties: Record<string, any>;
  attributes: Record<string, any>;
  computedValues: Record<string, any>;
  computedAt?: string;
  currentTelemetry: Record<string, any>;
  telemetryUpdatedAt?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssetStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'FAILED';

// Telemetry
export interface TelemetryPoint {
  time: string;
  assetId: string;
  telemetryKey: string;
  valueNumeric?: number;
  valueText?: string;
  quality: TelemetryQuality;
  source: TelemetrySource;
  sourceId?: string;
  unit?: string;
}

export type TelemetryQuality = 'GOOD' | 'BAD' | 'UNCERTAIN' | 'SIMULATED';
export type TelemetrySource = 'SENSOR' | 'MANUAL' | 'CALCULATED' | 'IMPORTED' | 'EDGE';

export interface TelemetryQuery {
  assetIds: string[];
  telemetryKeys: string[];
  startTime: string;
  endTime: string;
  interval?: string;
  aggregation?: 'avg' | 'min' | 'max' | 'sum' | 'count';
}

// Rules
export interface Rule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  appliesToAssetTypes: string[];
  appliesToAssets?: string[];
  nodes: RuleNode[];
  connections: RuleConnection[];
  isActive: boolean;
  priority: number;
  config: RuleConfig;
  executionCount: number;
  lastExecutedAt?: string;
  lastError?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

export interface RuleConnection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

export interface RuleConfig {
  executeOnStartup: boolean;
  debounceMs: number;
  maxExecutionsPerMinute: number;
  timeout: number;
}

export type NodeType =
  | 'telemetry_change'
  | 'attribute_change'
  | 'status_change'
  | 'schedule'
  | 'event'
  | 'manual'
  | 'if'
  | 'switch'
  | 'and'
  | 'or'
  | 'not'
  | 'math'
  | 'formula'
  | 'aggregate'
  | 'lookup'
  | 'script'
  | 'get_telemetry'
  | 'get_attribute'
  | 'get_asset'
  | 'query'
  | 'set_computed'
  | 'set_attribute'
  | 'set_status'
  | 'create_alarm'
  | 'send_notification'
  | 'call_api'
  | 'publish_kafka'
  | 'log';

export interface RuleExecution {
  id: string;
  ruleId: string;
  assetId: string;
  triggerType: string;
  triggerData?: Record<string, any>;
  success: boolean;
  durationMs: number;
  outputData?: Record<string, any>;
  errorMessage?: string;
  executedAt: string;
}

// API Response types
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
  };
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
}
