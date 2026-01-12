export type NodeCategory = 
  | 'input' 
  | 'filter' 
  | 'enrichment' 
  | 'transform' 
  | 'action' 
  | 'external' 
  | 'flow';

export interface NodeDefinition {
  type: string;
  category: NodeCategory;
  name: string;
  description: string;
  icon: string;
  configSchema: Record<string, any>;
  inputs: number;
  outputs: number;
  documentation?: string;
  examples?: any[];
}

export interface NodeConfig {
  [key: string]: any;
}

export interface ValidationError {
  type: string;
  message: string;
  nodeIds?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export const NODE_CATEGORIES: Record<NodeCategory, { label: string; description: string }> = {
  input: {
    label: 'Input',
    description: 'Nodos de entrada de datos'
  },
  filter: {
    label: 'Filter',
    description: 'Nodos de filtrado y condiciones'
  },
  enrichment: {
    label: 'Enrichment',
    description: 'Nodos de enriquecimiento de datos'
  },
  transform: {
    label: 'Transform',
    description: 'Nodos de transformación de datos'
  },
  action: {
    label: 'Action',
    description: 'Nodos de acciones y efectos'
  },
  external: {
    label: 'External',
    description: 'Nodos de integración externa'
  },
  flow: {
    label: 'Flow',
    description: 'Nodos de control de flujo'
  }
};

export const NODE_TYPES = {
  INPUT: {
    KAFKA_INPUT: 'kafka_input',
  },
  FILTER: {
    SCRIPT_FILTER: 'script_filter',
    THRESHOLD_FILTER: 'threshold_filter',
    MESSAGE_TYPE_SWITCH: 'message_type_switch',
    CHECK_RELATION: 'check_relation',
    GEOFENCING: 'geofencing',
    GPS_FILTER: 'gps_filter',
    ORIGINATOR_FILTER: 'originator_filter',
    MESSAGE_TYPE_FILTER: 'message_type_filter',
    DUPLICATE_FILTER: 'duplicate_filter',
    RATE_LIMIT: 'rate_limit',
    DEBOUNCE: 'debounce',
    DELAY: 'delay',
  },
  ENRICHMENT: {
    FETCH_ASSET_ATTRIBUTES: 'fetch_asset_attributes',
    FETCH_ASSET_TELEMETRY: 'fetch_asset_telemetry',
    TENANT_ATTRIBUTES: 'tenant_attributes',
    DEVICE_ATTRIBUTES: 'device_attributes',
    CUSTOMER_ATTRIBUTES: 'customer_attributes',
    RELATED_ATTRIBUTES: 'related_attributes',
    FETCH_ASSET_METADATA: 'fetch_asset_metadata',
    FETCH_RELATED_ASSETS: 'fetch_related_assets',
    ORIGINATOR_ATTRIBUTES: 'originator_attributes',
    ORIGINATOR_FIELDS: 'originator_fields',
    ORIGINATOR_TELEMETRY: 'originator_telemetry',
    TENANT_DETAILS: 'tenant_details',
  },
  TRANSFORM: {
    SCRIPT_TRANSFORM: 'script_transform',
    MATH: 'math',
    FORMULA: 'formula',
    UNIT_CONVERSION: 'unit_conversion',
    CHANGE_ORIGINATOR: 'change_originator',
    ASSIGN_TO_CUSTOMER: 'assign_to_customer',
  },
  ACTION: {
    LOG: 'log',
    CREATE_ALARM: 'create_alarm',
    CLEAR_ALARM: 'clear_alarm',
    ACKNOWLEDGE_ALARM: 'acknowledge_alarm',
    SEND_EMAIL: 'send_email',
    SAVE_TIMESERIES: 'save_timeseries',
    SAVE_ATTRIBUTES: 'save_attributes',
    UPDATE_DITTO_FEATURE: 'update_ditto_feature',
    UPDATE_ASSET_ATTRIBUTES: 'update_asset_attributes',
    DELETE_ATTRIBUTES: 'delete_attributes',
    RPC_CALL: 'rpc_call',
    GENERATOR: 'generator',
    MESSAGE_COUNT: 'message_count',
    AGGREGATE: 'aggregate',
    CALCULATE_DELTA: 'calculate_delta',
    TIMEFRAME_FILTER: 'timeframe_filter',
    SAVE_TO_CUSTOM_TABLE: 'save_to_custom_table',
    UNASSIGN_FROM_CUSTOMER: 'unassign_from_customer',
    PUSH_TO_EDGE: 'push_to_edge',
    ASSIGN_TO_TENANT: 'assign_to_tenant',
    UNASSIGN_FROM_TENANT: 'unassign_from_tenant',
  },
  EXTERNAL: {
    MQTT_PUBLISH: 'mqtt_publish',
    KAFKA_PUBLISH: 'kafka_publish',
    SLACK: 'slack',
    REST_API_CALL: 'rest_api_call',
    AWS_SNS: 'aws_sns',
    AWS_SQS: 'aws_sqs',
    AZURE_IOT_HUB: 'azure_iot_hub',
    RABBITMQ: 'rabbitmq',
    TWILIO_SMS: 'twilio_sms',
    SENDGRID: 'sendgrid',
    WEBHOOK: 'webhook',
    MODBUS_WRITE: 'modbus_write',
    OPCUA_WRITE: 'opcua_write',
    S7_WRITE: 's7_write',
    BACNET_WRITE: 'bacnet_write',
    ETHERNETIP_WRITE: 'ethernetip_write',
  },
  FLOW: {
    RULE_CHAIN: 'rule_chain',
    MERGE: 'merge',
    SPLIT: 'split',
    CHECKPOINT: 'checkpoint',
    SYNCHRONIZATION: 'synchronization',
    BATCH: 'batch',
    LOOP: 'loop',
  }
} as const;
