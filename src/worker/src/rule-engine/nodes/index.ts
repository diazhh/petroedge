import { nodeRegistry } from '../node-registry.js';
import { KafkaInputNode } from './kafka-input.node.js';
import { LogNode } from './log.node.js';
import { ScriptFilterNode } from './script-filter.node.js';
import { ThresholdFilterNode } from './threshold-filter.node.js';
import { MessageTypeSwitchNode } from './message-type-switch.node.js';
import { ScriptTransformNode } from './script-transform.node.js';
import { MathNode } from './math.node.js';
import { FormulaNode } from './formula.node.js';
import { CreateAlarmNode } from './create-alarm.node.js';
import { KafkaPublishNode } from './kafka-publish.node.js';
import { FetchAssetAttributesNode } from './fetch-asset-attributes.node.js';
import { FetchAssetTelemetryNode } from './fetch-asset-telemetry.node.js';
import { SaveTimeseriesNode } from './save-timeseries.node.js';
import { UpdateDittoFeatureNode } from './update-ditto-feature.node.js';
import { RuleChainNode } from './rule-chain.node.js';

export function registerDefaultNodes() {
  // Input nodes
  nodeRegistry.register('kafka_input', KafkaInputNode as any);
  
  // Filter nodes
  nodeRegistry.register('script_filter', ScriptFilterNode as any);
  nodeRegistry.register('threshold_filter', ThresholdFilterNode as any);
  nodeRegistry.register('message_type_switch', MessageTypeSwitchNode as any);
  
  // Transform nodes
  nodeRegistry.register('script_transform', ScriptTransformNode as any);
  nodeRegistry.register('math', MathNode as any);
  nodeRegistry.register('formula', FormulaNode as any);
  
  // Enrichment nodes
  nodeRegistry.register('fetch_asset_attributes', FetchAssetAttributesNode as any);
  nodeRegistry.register('fetch_asset_telemetry', FetchAssetTelemetryNode as any);
  
  // Action nodes
  nodeRegistry.register('log', LogNode as any);
  nodeRegistry.register('create_alarm', CreateAlarmNode as any);
  nodeRegistry.register('kafka_publish', KafkaPublishNode as any);
  nodeRegistry.register('save_timeseries', SaveTimeseriesNode as any);
  nodeRegistry.register('update_ditto_feature', UpdateDittoFeatureNode as any);
  
  // Flow nodes
  nodeRegistry.register('rule_chain', RuleChainNode as any);
}

export * from './kafka-input.node.js';
export * from './log.node.js';
export * from './script-filter.node.js';
export * from './threshold-filter.node.js';
export * from './message-type-switch.node.js';
export * from './script-transform.node.js';
export * from './math.node.js';
export * from './formula.node.js';
export * from './create-alarm.node.js';
export * from './kafka-publish.node.js';
export * from './fetch-asset-attributes.node.js';
export * from './fetch-asset-telemetry.node.js';
export * from './save-timeseries.node.js';
export * from './update-ditto-feature.node.js';
export * from './rule-chain.node.js';
