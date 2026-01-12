/**
 * Tipos de configuración para cada tipo de nodo del Rule Engine
 */

// ============================================================================
// FILTER NODES
// ============================================================================

export interface ScriptFilterConfig {
  script: string;
  language?: 'javascript' | 'typescript';
}

export interface ThresholdFilterConfig {
  field: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: string | number;
  dataType?: 'number' | 'string' | 'boolean';
}

// ============================================================================
// ROUTING NODES
// ============================================================================

export interface MessageTypeSwitchRoute {
  messageType: string;
  outputHandle?: string;
  outputLabel?: string;
}

export interface MessageTypeSwitchConfig {
  routes: MessageTypeSwitchRoute[];
}

// ============================================================================
// ENRICHMENT NODES
// ============================================================================

export interface FetchAssetAttributesConfig {
  thingId: string;
  attributes: string[];
  assetType?: string;
  outputKey?: string;
  scope?: 'SERVER_SCOPE' | 'CLIENT_SCOPE' | 'SHARED_SCOPE';
}

export interface FetchAssetTelemetryConfig {
  thingId: string;
  keys: string[];
  scope?: 'LATEST' | 'TIMESERIES';
  startTs?: number;
  endTs?: number;
  limit?: number;
  aggregation?: 'NONE' | 'AVG' | 'MAX' | 'MIN' | 'SUM' | 'COUNT';
}

// ============================================================================
// TRANSFORM NODES
// ============================================================================

export interface ScriptTransformConfig {
  script: string;
  language?: 'javascript' | 'typescript';
  inputVariables?: string[];
  outputVariables?: string[];
}

export interface MathConfig {
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'modulo' | 'power';
  operand1: string | number;
  operand2: string | number;
  outputKey: string;
}

export interface FormulaConfig {
  formula: string;
  variables?: Record<string, string>;
  outputKey: string;
}

// ============================================================================
// ACTION NODES
// ============================================================================

export interface SaveTimeseriesConfig {
  thingId: string;
  featureId?: string;
  keys: string[];
  ttl?: number;
  useServerTimestamp?: boolean;
}

export interface UpdateDittoFeatureConfig {
  thingId: string;
  featureId: string;
  properties: Record<string, any>;
  merge?: boolean;
}

export interface CreateAlarmConfig {
  alarmType?: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  assetId?: string;
  severity?: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
  metadata?: Record<string, any>;
  propagate?: boolean;
}

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  includeMetadata?: boolean;
}

export interface KafkaPublishConfig {
  topic: string;
  key?: string;
  partition?: number;
  headers?: Record<string, string>;
  format?: 'JSON' | 'STRING' | 'AVRO';
}

// ============================================================================
// FLOW NODES
// ============================================================================

export interface RuleChainConfig {
  ruleChainId: string;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type NodeConfigData =
  | ScriptFilterConfig
  | ThresholdFilterConfig
  | MessageTypeSwitchConfig
  | FetchAssetAttributesConfig
  | FetchAssetTelemetryConfig
  | ScriptTransformConfig
  | MathConfig
  | FormulaConfig
  | SaveTimeseriesConfig
  | UpdateDittoFeatureConfig
  | CreateAlarmConfig
  | LogConfig
  | KafkaPublishConfig
  | RuleChainConfig
  | Record<string, any>; // Fallback para nodos sin configuración específica
