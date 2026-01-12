/**
 * Data Source Mapping Types
 * 
 * Types for mapping Data Sources (PLCs, sensors, RTUs) to Digital Twins (Eclipse Ditto Things)
 * Roadmap: /roadmap/01_arquitectura/15_DATA_SOURCE_DIGITAL_TWIN_MAPPING.md
 */

// ============================================================================
// TELEMETRY DEFINITION
// ============================================================================

export interface TelemetryDefinition {
  type: 'number' | 'string' | 'boolean';
  unit?: string;
  description?: string;
}

export type TelemetrySchema = Record<string, TelemetryDefinition>;

// ============================================================================
// DEVICE PROFILE
// ============================================================================

export interface DeviceProfile {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  transportType: 'MODBUS_TCP' | 'MODBUS_RTU' | 'ETHERNET_IP' | 'S7' | 'OPCUA' | 'FINS' | 'MQTT' | 'HTTP';
  telemetrySchema: TelemetrySchema;
  defaultRuleChainId?: string;
  isActive: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeviceProfileInput {
  code: string;
  name: string;
  description?: string;
  transportType: DeviceProfile['transportType'];
  telemetrySchema: TelemetrySchema;
  defaultRuleChainId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDeviceProfileInput {
  name?: string;
  description?: string;
  telemetrySchema?: TelemetrySchema;
  defaultRuleChainId?: string;
  isActive?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// ASSET TEMPLATE
// ============================================================================

export interface AssetComponent {
  code: string;
  assetTypeCode: string;
  name: string;
  required: boolean;
}

export interface AssetRelationship {
  from: string;
  to: string;
  type: string;
}

export interface AssetTemplate {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  rootAssetTypeId: string;
  components: AssetComponent[];
  relationships: AssetRelationship[];
  defaultProperties: Record<string, any>;
  isActive: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetTemplateInput {
  code: string;
  name: string;
  description?: string;
  rootAssetTypeId: string;
  components: AssetComponent[];
  relationships: AssetRelationship[];
  defaultProperties?: Record<string, any>;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateAssetTemplateInput {
  name?: string;
  description?: string;
  components?: AssetComponent[];
  relationships?: AssetRelationship[];
  defaultProperties?: Record<string, any>;
  isActive?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// CONNECTIVITY PROFILE
// ============================================================================

export interface TelemetryMappingTarget {
  component: string;
  feature: string;
  property: string;
}

export interface TelemetryMapping {
  sourceKey: string;
  target: TelemetryMappingTarget;
  transform?: string;
}

export interface ConnectivityProfile {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  deviceProfileId: string;
  assetTemplateId: string;
  ruleChainId?: string;
  mappings: TelemetryMapping[];
  isActive: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConnectivityProfileInput {
  code: string;
  name: string;
  description?: string;
  deviceProfileId: string;
  assetTemplateId: string;
  ruleChainId?: string;
  mappings: TelemetryMapping[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateConnectivityProfileInput {
  name?: string;
  description?: string;
  ruleChainId?: string;
  mappings?: TelemetryMapping[];
  isActive?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// DIGITAL TWIN INSTANCE
// ============================================================================

export type DigitalTwinStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export interface DigitalTwinInstance {
  id: string;
  tenantId: string;
  assetTemplateId?: string;
  code: string;
  name: string;
  description?: string;
  rootThingId: string;
  componentThingIds: Record<string, string>;
  status: DigitalTwinStatus;
  tags?: string[];
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDigitalTwinInstanceInput {
  assetTemplateId?: string;
  code: string;
  name: string;
  description?: string;
  rootThingId: string;
  componentThingIds?: Record<string, string>;
  status?: DigitalTwinStatus;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDigitalTwinInstanceInput {
  name?: string;
  description?: string;
  componentThingIds?: Record<string, string>;
  status?: DigitalTwinStatus;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// DEVICE BINDING
// ============================================================================

export interface DeviceBinding {
  id: string;
  tenantId: string;
  dataSourceId: string;
  digitalTwinId: string;
  connectivityProfileId: string;
  customRuleChainId?: string;
  customMappings?: TelemetryMapping[];
  isActive: boolean;
  lastDataReceivedAt?: Date;
  lastMappingError?: string;
  lastMappingErrorAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeviceBindingInput {
  dataSourceId: string;
  digitalTwinId: string;
  connectivityProfileId: string;
  customRuleChainId?: string;
  customMappings?: TelemetryMapping[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDeviceBindingInput {
  connectivityProfileId?: string;
  customRuleChainId?: string;
  customMappings?: TelemetryMapping[];
  isActive?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// RULE CHAIN RESOLUTION
// ============================================================================

export interface RuleChainResolution {
  ruleChainId: string;
  source: 'device_binding' | 'connectivity_profile' | 'device_profile';
}

// ============================================================================
// MAPPING RESOLUTION
// ============================================================================

export interface ResolvedMapping {
  sourceKey: string;
  thingId: string;
  feature: string;
  property: string;
  transform?: string;
}

export interface MappingResolutionResult {
  digitalTwinId: string;
  rootThingId: string;
  mappings: ResolvedMapping[];
  ruleChain: RuleChainResolution;
}
